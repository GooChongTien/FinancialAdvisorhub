import { z } from "https://esm.sh/zod@3.25.76";

const REQUEST_MODES = ["stream", "batch", "aial", "health", "suggest", "insights"] as const;

const agentMessageSchema = z.object({
  role: z.enum(["user", "assistant", "tool", "system"]),
  content: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentChatBodySchema = z
  .object({
    mode: z.enum(REQUEST_MODES).optional(),
    messages: z.array(agentMessageSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
    context: z.unknown().optional(),
    advisorId: z.string().optional(),
  })
  .transform((value) => ({
    ...value,
    mode: value.mode ?? "stream",
    messages: value.messages ?? [],
  }))
  .superRefine((value, ctx) => {
    const requiresMessages = !["suggest", "insights", "health"].includes(value.mode);
    if (requiresMessages && value.messages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "messages must contain at least one entry for this mode",
        path: ["messages"],
      });
    }
    const userMessages = value.messages.filter((msg) => msg.role === "user");
    if (requiresMessages && userMessages.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one user message is required before invoking the agent",
        path: ["messages"],
      });
    }
  });

export type AgentChatBody = z.infer<typeof agentChatBodySchema>;

export function parseAgentChatBody(input: unknown) {
  return agentChatBodySchema.safeParse(input ?? {});
}

export function formatAgentChatIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => ({
    path: issue.path.length ? issue.path.join(".") : "(root)",
    code: issue.code,
    message: issue.message,
  }));
}
