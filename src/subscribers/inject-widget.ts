import type { SubscriberConfig } from "@medusajs/framework"

// This subscriber handles widget injection on HTTP responses
// It intercepts storefront HTML responses and injects the Asyntai widget script
export default async function injectWidgetSubscriber({ container }) {
  // This is a placeholder for future event-based injection
  // Currently, Medusa doesn't have built-in HTTP response events
  // The actual injection is handled by the middleware in src/api/middlewares.ts

  console.log("Asyntai AI Chatbot plugin initialized")
}

export const config: SubscriberConfig = {
  event: "application.started"
}
