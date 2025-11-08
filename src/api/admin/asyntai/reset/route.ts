import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// POST /admin/asyntai/reset - Reset settings to defaults
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const settingModuleService = req.scope.resolve("settingModuleService") as any

    const defaultData = {
      site_id: "",
      script_url: "https://asyntai.com/static/js/chat-widget.js",
      account_email: ""
    }

    // Try to update or delete
    try {
      const setting = await settingModuleService.retrieve("asyntai_settings")
      await settingModuleService.update("asyntai_settings", {
        metadata: defaultData
      })
    } catch {
      // Setting doesn't exist, nothing to reset
    }

    res.json({
      success: true
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error?.message || "Reset failed"
    })
  }
}

