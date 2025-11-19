import type {
  AgentTool,
  MiraContext,
  MiraResponse,
  SuggestedIntent,
  ToolCall,
  ToolExecutionContext,
  UIAction,
} from "../types.ts";

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  raw?: unknown;
}

export abstract class SkillAgent {
  constructor(
    public readonly id: string,
    public readonly module: MiraContext["module"],
    public readonly systemPrompt: string,
    private readonly tools: AgentTool[] = [],
  ) {}

  abstract execute(intent: string, context: MiraContext, userMessage: string): Promise<MiraResponse>;

  getTools(): AgentTool[] {
    return this.tools;
  }

  protected async invokeTool<TResult = unknown>(
    name: string,
    input: unknown,
    context: ToolExecutionContext,
  ): Promise<TResult> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) throw new Error(`Tool ${name} not registered for ${this.id}`);
    return tool.handler(input, context) as Promise<TResult>;
  }

  protected buildSystemPrompt(context: MiraContext): string {
    const base = this.systemPrompt.trim();
    const contextSnippet = [
      `Context Module: ${context.module}`,
      `Page: ${context.page}`,
      context.pageData ? `Page Data: ${JSON.stringify(context.pageData)}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    return `${base}\n\n${contextSnippet}`;
  }

  protected async callLLM(prompt: string, tools: AgentTool[] = this.tools): Promise<LLMResponse> {
    const denoEnv = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
    const apiKey = typeof denoEnv?.get === "function" ? denoEnv.get("OPENAI_API_KEY") ?? "" : "";
    const model = typeof denoEnv?.get === "function" ? denoEnv.get("OPENAI_MODEL") ?? "gpt-4o-mini" : "gpt-4o-mini";
    if (!apiKey || typeof fetch === "undefined") {
      return {
        content: `Stub response for ${this.id}: ${prompt.slice(0, 400)}`,
        toolCalls: [],
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt },
        ],
        tools: tools.length
          ? tools.map((tool) => ({
              type: "function",
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.schema ? tool.schema : undefined,
              },
            }))
          : undefined,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`LLM request failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      toolCalls: this.parseToolCalls(choice?.message?.tool_calls ?? []),
      raw: data,
    };
  }

  protected parseToolCalls(raw: Array<{ id?: string; function?: { name?: string; arguments?: string } }> = []): ToolCall[] {
    return raw
      .map((toolCall) => {
        if (!toolCall?.id || !toolCall.function?.name) return null;
        return {
          id: toolCall.id,
          type: "function",
          function: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments ?? "{}",
          },
        } satisfies ToolCall;
      })
      .filter((entry): entry is ToolCall => Boolean(entry));
  }

  protected synthesizeUIActions(_intent: string, _data: unknown): UIAction[] {
    return [];
  }

  /**
   * Generate context-aware suggestions for co-pilot mode.
   * Override this method in specific agents to provide module-specific suggestions.
   */
  async generateSuggestions(context: MiraContext): Promise<SuggestedIntent[]> {
    // Default implementation returns empty suggestions
    // Module agents should override this to provide context-aware suggestions
    return [];
  }

  /**
   * Generate proactive insights for insight mode.
   * Override this method in specific agents to provide module-specific insights.
   */
  async generateInsights(advisorId: string, context?: MiraContext): Promise<ProactiveInsight[]> {
    // Default implementation returns empty insights
    // Module agents should override this to provide proactive alerts and recommendations
    return [];
  }

  protected buildSuggestion(init: Omit<SuggestedIntent, "module"> & { module?: SuggestedIntent["module"] }): SuggestedIntent {
    return {
      module: init.module ?? this.module,
      ...init,
    };
  }
}

export interface SuggestedIntent {
  id: string;
  title: string;
  subtitle?: string;
  promptText: string; // The text to send when suggestion is clicked
  icon?: string;
  module: MiraContext["module"];
  priority?: "high" | "medium" | "low";
}

export interface ProactiveInsight {
  id: string;
  type: "alert" | "metric" | "idea";
  priority: "critical" | "important" | "info";
  title: string;
  summary: string;
  ui_actions?: UIAction[];
  tag?: string;
  dismissible?: boolean;
}
