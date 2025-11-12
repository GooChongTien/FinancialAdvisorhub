export type SimulatedAgentEventType =
  | "message.delta"
  | "tool_call.created"
  | "tool_call.delta"
  | "tool_call.completed"
  | "error"
  | "done";

export interface SimulatedAgentEvent {
  type: SimulatedAgentEventType;
  data?: Record<string, unknown>;
  delayMs?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function formatSSEChunk(event: SimulatedAgentEvent): string {
  const data = JSON.stringify(event.data ?? {});
  return `event: ${event.type}\ndata: ${data}\n\n`;
}

export async function* simulateAgentEvents(script: SimulatedAgentEvent[]) {
  for (const event of script) {
    if (event.delayMs) {
      await delay(event.delayMs);
    }
    yield event;
    if (event.type === "done" || event.type === "error") {
      break;
    }
  }
}

export function createSimulatedSSEStream(script: SimulatedAgentEvent[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of simulateAgentEvents(script)) {
          controller.enqueue(encoder.encode(formatSSEChunk(event)));
        }
      } finally {
        controller.close();
      }
    },
  });
}
