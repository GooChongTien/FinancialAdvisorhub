/**
 * SSE stream adapter for OpenAI Agent events
 * Converts Agent events to Server-Sent Events (SSE) format for browser EventSource
 */

import type { AgentEvent } from "./types.ts";

/**
 * Format SSE event for transmission
 */
export function formatSSE(event: AgentEvent): string {
  const lines: string[] = [];

  // Event type
  lines.push(`event: ${event.type}`);

  // Event data (JSON stringified)
  const dataStr = JSON.stringify(event.data);
  lines.push(`data: ${dataStr}`);

  // End with double newline
  lines.push("");
  lines.push("");

  return lines.join("\n");
}

/**
 * Create SSE stream from Agent events
 * Returns a ReadableStream for Response body
 */
export function createSSEStream(
  eventGenerator: AsyncGenerator<AgentEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        const connectMsg = formatSSE({
          type: "message.delta",
          data: { delta: "", message_id: "connect" },
        });
        controller.enqueue(encoder.encode(connectMsg));

        // Stream Agent events
        for await (const event of eventGenerator) {
          const sseData = formatSSE(event);
          controller.enqueue(encoder.encode(sseData));

          // Close stream on done or error
          if (event.type === "done" || event.type === "error") {
            break;
          }
        }
      } catch (error) {
        // Send error event
        const errorEvent: AgentEvent = {
          type: "error",
          data: {
            error: {
              message: error instanceof Error ? error.message : "Stream error",
              code: "stream_error",
            },
          },
        };
        controller.enqueue(encoder.encode(formatSSE(errorEvent)));
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Client disconnected
      console.log("[SSE Stream] Client disconnected");
    },
  });
}

/**
 * Create SSE Response headers
 */
export function createSSEHeaders(origin?: string): Headers {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Add CORS headers if origin provided
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
}

/**
 * Create error SSE event
 */
export function createErrorSSE(message: string, code = "unknown"): string {
  const event: AgentEvent = {
    type: "error",
    data: {
      error: { message, code },
    },
  };
  return formatSSE(event);
}

/**
 * Create done SSE event
 */
export function createDoneSSE(): string {
  const event: AgentEvent = {
    type: "done",
    data: {},
  };
  return formatSSE(event);
}
