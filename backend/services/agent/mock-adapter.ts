import type {
  AdapterRequestContext,
  AgentAdapter,
  AgentChatRequest,
  AgentChatResult,
  AgentEvent,
  ChatMessage,
} from "./types.ts";

const MOCK_SYSTEM_PROMPT =
  "You are Mira's mock agent. Respond succinctly with actionable next steps based solely on the latest user message.";

function buildMockResponse(request: AgentChatRequest): AgentChatResult {
  const lastUserMessage = [...request.messages].reverse().find((msg) => msg.role === "user");
  const content =
    typeof lastUserMessage?.content === "string"
      ? lastUserMessage?.content
      : JSON.stringify(lastUserMessage?.content ?? {});

  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: `[mock-response] ${content?.slice(0, 400)}`,
  };

  return {
    message: assistantMessage,
    toolCalls: [],
    raw: {
      meta: {
        mode: request.mode,
        metadata: request.metadata ?? {},
        systemPrompt: MOCK_SYSTEM_PROMPT,
      },
    },
  };
}

async function* mockStream(
  request: AgentChatRequest,
  _context?: AdapterRequestContext
): AsyncGenerator<AgentEvent> {
  const result = buildMockResponse(request);
  const content = String(result.message.content);
  const chunks = content.match(/.{1,32}/g) ?? [content];

  let messageId: string | undefined;

  for (const chunk of chunks) {
    yield {
      type: "message.delta",
      data: {
        delta: chunk,
        message_id: messageId,
      },
    };
  }

  messageId = crypto.randomUUID();
  yield {
    type: "message.completed",
    data: {
      message: {
        ...result.message,
        content,
      },
      message_id: messageId,
      finish_reason: "stop",
    },
  };

  yield {
    type: "done",
    data: {
      message_id: messageId,
    },
  };
}

export function createMockAgentAdapter(): AgentAdapter {
  return {
    id: "mock",
    name: "mock-adapter",
    async chat(request: AgentChatRequest): Promise<AgentChatResult> {
      return buildMockResponse(request);
    },
    streamChat: mockStream,
    async getClientSecret(): Promise<string> {
      return "mock-client-secret";
    },
    async health(): Promise<boolean> {
      return true;
    },
  };
}
