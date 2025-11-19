# ADR-002: Zod Validation for Agent Chat Requests

- **Status:** Accepted – 2025-11-15
- **Context:** Mira Co-Pilot Phase 1 (API Hardening)

## Context

The `/functions/v1/agent-chat` endpoint previously trusted arbitrary JSON from the frontend. Malformed payloads caused cryptic 500s inside the streaming adapter and made it impossible to provide actionable error feedback. We also need to block oversized payloads and enforce rate limits before touching any model provider.

## Decision

We introduced a shared Zod schema in `supabase/functions/_shared/services/security/agent-request-schema.ts` that:

- Validates `mode`, `messages`, `metadata`, and `context` shapes up front.
- Guarantees at least one user message for conversational modes.
- Normalizes defaults (stream mode, empty message array) so downstream handlers can assume consistent structures.
- Formats validation issues into `{ path, code, message }` tuples for the caller.

`supabase/functions/agent-chat/index.ts` now:

1. Parses the body with `parseAgentChatBody`.
2. Returns `400` with the formatted issue list when validation fails.
3. Pipes the sanitized payload through `validateUserMessage`, `validateContext`, and rate limiting before invoking the router.

Vitest coverage lives in `tests/backend/agent-chat.validation.test.ts`, ensuring bad payloads (missing messages, invalid roles, oversized content) are rejected with explicit codes.

## Consequences

- **Actionable errors:** Frontend surfaces precise validation issues (e.g., “messages must contain at least one entry”) instead of generic 500s.
- **Security:** Early rejection prevents XSS payloads and guards the SSE loop from untrusted data.
- **Consistency:** Shared schema eliminates duplicate validation logic scattered across frontend hooks and backend handlers.
- **Overhead:** Slight increase in request latency (<1 ms) due to schema parsing is acceptable for the added safety.

## References

- Schema + formatter: `supabase/functions/_shared/services/security/agent-request-schema.ts`
- Edge function usage: `supabase/functions/agent-chat/index.ts`
- Tests: `tests/backend/agent-chat.validation.test.ts`
