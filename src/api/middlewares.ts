import { defineMiddlewares } from "@medusajs/framework/http"
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

// Middleware to inject the Asyntai widget script into storefront HTML responses
const injectAsyntaiWidget = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // Skip admin routes immediately
  if (req.path?.startsWith("/admin")) {
    return next()
  }

  // Load settings once at the beginning
  let settings = null
  try {
    const settingModuleService = req.scope.resolve("settingModuleService") as any
    settings = await settingModuleService.retrieve("asyntai_settings", {
      select: ["metadata"]
    }).catch(() => null)
  } catch (error) {
    // Settings not available, continue without injection
  }

  const data = settings?.metadata || {}
  const siteId = data.site_id?.trim()

  // If no site ID, just continue without injection
  if (!siteId) {
    return next()
  }

  const scriptUrl = data.script_url?.trim() || "https://asyntai.com/static/js/chat-widget.js"

  // Create the injection script
  const scriptTag = `<script type="text/javascript">(function(){var s=document.createElement("script");s.async=true;s.defer=true;s.src=${JSON.stringify(scriptUrl)};s.setAttribute("data-asyntai-id",${JSON.stringify(siteId)});s.charset="UTF-8";var f=document.getElementsByTagName("script")[0];if(f&&f.parentNode){f.parentNode.insertBefore(s,f);}else{(document.head||document.documentElement).appendChild(s);}})();</script>`

  // Store the original send method
  const originalSend = res.send.bind(res)

  // Override the send method to intercept HTML responses
  res.send = function (body: any): any {
    // Only inject for HTML responses
    const contentType = res.getHeader("Content-Type")
    const isHtml = contentType && typeof contentType === "string" && contentType.includes("text/html")

    if (!isHtml || !body) {
      return originalSend(body)
    }

    try {
      // Inject before closing body tag or append at the end
      let modifiedBody = String(body)
      if (modifiedBody.includes("</body>")) {
        modifiedBody = modifiedBody.replace("</body>", scriptTag + "</body>")
      } else {
        modifiedBody += scriptTag
      }

      return originalSend(modifiedBody)
    } catch (error) {
      console.error("Asyntai: Failed to inject widget:", error)
      return originalSend(body)
    }
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      middlewares: [injectAsyntaiWidget]
    }
  ]
})
