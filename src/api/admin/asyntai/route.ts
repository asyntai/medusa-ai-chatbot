import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const AUTHENTICATE = false

const STORE_KEY = "asyntai_settings"

// GET /admin/asyntai - Get current settings
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const query = req.scope.resolve("query")

    // Try to get from store module
    const { data } = await query.graph({
      entity: "store",
      fields: ["metadata"]
    })

    const store = data?.[0]
    const settings = store?.metadata?.[STORE_KEY] || {}

    res.json({
      site_id: settings.site_id || "",
      script_url: settings.script_url || "https://asyntai.com/static/js/chat-widget.js",
      account_email: settings.account_email || ""
    })
  } catch (error: any) {
    console.error("[Asyntai] Error retrieving settings:", error)
    res.status(500).json({
      success: false,
      error: error?.message || "Failed to retrieve settings"
    })
  }
}

// POST /admin/asyntai - Save settings
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { site_id, script_url, account_email } = (req.body as any) || {}

    if (!site_id || typeof site_id !== "string" || site_id.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "missing site_id"
      })
    }

    const data = {
      site_id: site_id.trim(),
      script_url: script_url?.trim() || "https://asyntai.com/static/js/chat-widget.js",
      account_email: account_email?.trim() || ""
    }

    const query = req.scope.resolve("query")
    const storeModuleService = req.scope.resolve("storeModuleService") as any

    // Get the store
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "metadata"]
    })

    const store = stores?.[0]
    if (!store) {
      throw new Error("Store not found")
    }

    // Update store metadata
    await storeModuleService.updateStores(store.id, {
      metadata: {
        ...store.metadata,
        [STORE_KEY]: data
      }
    })

    res.json({
      success: true,
      saved: data
    })
  } catch (error: any) {
    console.error("[Asyntai] Error saving settings:", error)
    res.status(500).json({
      success: false,
      error: error?.message || "failed to save settings"
    })
  }
}

