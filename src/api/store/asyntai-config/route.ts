import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const STORE_KEY = "asyntai_settings"

// GET /store/asyntai-config - Public endpoint for widget configuration
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const query = req.scope.resolve("query")

    const { data } = await query.graph({
      entity: "store",
      fields: ["metadata"]
    })

    const store = data?.[0]
    const settings = store?.metadata?.[STORE_KEY] || {}

    res.json({
      site_id: settings.site_id || "",
      script_url: settings.script_url || "https://asyntai.com/static/js/chat-widget.js"
    })
  } catch (error: any) {
    console.error("[Asyntai] Error retrieving widget config:", error)
    res.status(500).json({
      error: "Failed to load widget configuration"
    })
  }
}
