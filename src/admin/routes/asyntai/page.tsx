import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { useState, useEffect } from "react"

const AsyntaiPage = () => {


  const [settings, setSettings] = useState({
    site_id: "",
    script_url: "https://asyntai.com/static/js/chat-widget.js",
    account_email: ""
  })
  const [loading, setLoading] = useState(true)
  const [currentState, setCurrentState] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {

    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/admin/asyntai", {
        credentials: "include"
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateState = () => {
    return "medusa_" + Math.random().toString(36).substr(2, 9)
  }

  const openPopup = () => {
    const state = generateState()
    setCurrentState(state)

    const url = `https://asyntai.com/wp-auth?platform=medusa&state=${encodeURIComponent(state)}`

    const w = 800
    const h = 720
    const y = window.top.outerHeight / 2 + window.top.screenY - h / 2
    const x = window.top.outerWidth / 2 + window.top.screenX - w / 2
    const popup = window.open(
      url,
      "asyntai_connect",
      `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${w},height=${h},top=${y},left=${x}`
    )

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      console.error('[Asyntai] Popup blocked')
      toast.error("Popup blocked", {
        description: "Please allow popups and try again"
      })
    } else {

      pollForConnection(state)
    }
  }

  const pollForConnection = (state: string) => {
    let attempts = 0
    const maxAttempts = 60
    let isConnected = false



    const checkConnection = () => {
      if (isConnected) {
 
        return
      }

      attempts++


      if (attempts > maxAttempts) {
        console.error('[Asyntai] Connection timeout after', maxAttempts, 'attempts')
        toast.error("Connection timeout", {
          description: "Please try again or use the manual link below"
        })
        return
      }

      const script = document.createElement("script")
      const callbackName = `asyntaiCallback_${Date.now()}`


      ;(window as any)[callbackName] = async (data: any) => {

        delete (window as any)[callbackName]
        document.head.removeChild(script)

        if (data && data.site_id) {
     
          toast.success("Asyntai connected. Saving…")
          const success = await saveConnection(data)
          if (success) {
          
            isConnected = true
          } else {
            console.warn('[Asyntai] Save failed, will retry')
            setTimeout(checkConnection, 1000)
          }
        } else {
      
          setTimeout(checkConnection, 1000)
        }
      }

      const scriptUrl = `https://asyntai.com/connect-status.js?state=${encodeURIComponent(state)}&cb=${callbackName}`
    
      script.src = scriptUrl
      document.head.appendChild(script)

      setTimeout(() => {
        if ((window as any)[callbackName]) {
        
          delete (window as any)[callbackName]
          if (script.parentNode) {
            document.head.removeChild(script)
          }
          setTimeout(checkConnection, 1000)
        }
      }, 5000)
    }

    checkConnection()
  }

  const saveConnection = async (data: any): Promise<boolean> => {
  
    try {
      const payload = {
        site_id: data.site_id,
        script_url: data.script_url || "https://asyntai.com/static/js/chat-widget.js",
        account_email: data.account_email || ""
      }


      const response = await fetch("/admin/asyntai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      })



      if (!response.ok) {
        throw new Error("HTTP " + response.status)
      }

      const json = await response.json()
      

      if (!json || !json.success) {
        throw new Error(json?.error || "Save failed")
      }


      setSettings(json.saved)
      toast.success("Asyntai connected successfully!")

      return true
    } catch (error: any) {
      console.error('[Asyntai] Save error:', error)
      toast.error("Connection failed", {
        description: error?.message || String(error)
      })
      return false
    }
  }

  const resetConnection = async () => {
    if (!confirm("Are you sure you want to disconnect Asyntai?")) {
      return
    }

    try {
      const response = await fetch("/admin/asyntai/reset", {
        method: "POST",
        credentials: "include"
      })
      if (!response.ok) {
        throw new Error("HTTP " + response.status)
      }
      const json = await response.json()
      if (!json || !json.success) {
        throw new Error(json?.error || "Reset failed")
      }
      setSettings({
        site_id: "",
        script_url: "https://asyntai.com/static/js/chat-widget.js",
        account_email: ""
      })
      toast.success("Settings reset successfully")
    } catch (error: any) {
      toast.error("Reset failed", {
        description: error?.message || String(error)
      })
    }
  }

  const connected = settings.site_id?.trim() !== ""

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Asyntai AI Chatbot</Heading>
        </div>
        <div className="px-6 py-4">
          <Text>Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Asyntai AI Chatbot</Heading>
        </div>
        <div className="px-6 py-4">
          <div className="mb-4">
            <Text>
              Status:{" "}
              <span style={{ color: connected ? "#008a20" : "#a00" }}>
                {connected ? "Connected" : "Not connected"}
              </span>
              {connected && settings.account_email && ` as ${settings.account_email}`}
            </Text>
            {connected && (
              <Button
                variant="secondary"
                size="small"
                onClick={resetConnection}
                className="mt-2"
              >
                Reset
              </Button>
            )}
          </div>

          {connected ? (
            <div className="max-w-2xl mx-auto p-6 border rounded-lg bg-white">
              <Heading level="h3" className="mb-3 text-center">
                Add this JavaScript snippet to all pages where you want to enable the chatbot
              </Heading>

              <div className="mb-4 relative">
                <pre className="bg-gray-50 border rounded p-4 text-sm overflow-x-auto">
                  <code>{`<script src="${settings.script_url}" data-asyntai-id="${settings.site_id}" async></script>`}</code>
                </pre>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    const snippet = `<script src="${settings.script_url}" data-asyntai-id="${settings.site_id}" async></script>`
                    navigator.clipboard.writeText(snippet)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                    toast.success("Code copied to clipboard")
                  }}
                  className="mt-2"
                >
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
              </div>

              <div className="text-center">
                <Text className="mb-4">
                  Set up your AI chatbot, review chat logs and more:
                </Text>
                <Button
                  variant="primary"
                  onClick={() => window.open("https://asyntai.com/dashboard", "_blank")}
                >
                  Open Asyntai Panel
                </Button>
                <Text className="mt-4 text-sm text-ui-fg-subtle">
                  <strong>Tip:</strong> If you want to change how the AI answers, please{" "}
                  <a
                    href="https://asyntai.com/dashboard#setup"
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 underline"
                  >
                    go here
                  </a>
                  .
                </Text>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-6 border rounded-lg bg-white text-center">
              <Text className="mb-4">
                Create a free Asyntai account or sign in to enable the chatbot
              </Text>
              <Button variant="primary" onClick={openPopup}>
                Get started
              </Button>
              <Text className="mt-3 text-sm text-ui-fg-subtle">
                If it doesn't work,{" "}
                <a
                  href={`https://asyntai.com/wp-auth?platform=medusa&state=${currentState || generateState()}`}
                  target="_blank"
                  rel="noopener"
                  className="text-blue-600 underline"
                  onClick={(e) => {
                    const state = generateState()
                    setCurrentState(state)
                    ;(e.target as HTMLAnchorElement).href = `https://asyntai.com/wp-auth?platform=medusa&state=${state}`
                    setTimeout(() => pollForConnection(state), 1000)
                  }}
                >
                  open the connect window
                </a>
                .
              </Text>
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Asyntai AI Chatbot",
  icon: ChatBubbleLeftRight,
})

export default AsyntaiPage
