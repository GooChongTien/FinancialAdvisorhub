# OpenAI Agent Integration Guide

This document describes how to set up, run, and troubleshoot the OpenAI Agent integration in AdvisorHub.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## Overview

The OpenAI Agent integration allows AdvisorHub to provide AI-powered chat assistance through "Mira", an AI insurance assistant. The integration uses:

- **Backend**: Deno Edge Functions (Supabase Functions) to proxy requests to OpenAI Agent API
- **Frontend**: React components with SSE (Server-Sent Events) streaming for real-time responses
- **Agent**: OpenAI Agent Builder workflow (`wf_690aec0f63688190807fb6752d1365e30c861a5689612a1f`)

### Key Features

✅ **Streaming responses** - Real-time token-by-token streaming
✅ **Tool call support** - Agent can invoke tools and receive results
✅ **Error handling** - Graceful degradation with retry logic
✅ **Type-safe** - TypeScript backend with JSDoc-annotated frontend
✅ **Secure** - API keys never exposed to frontend

---

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (ChatMira)    │
└────────┬────────┘
         │ POST /api/agent/chat
         │ (SSE streaming)
         ▼
┌─────────────────┐
│  Deno Edge Fn   │
│  (agent-chat)   │
└────────┬────────┘
         │ OpenAI Agent SDK
         │ (with streaming)
         ▼
┌─────────────────┐
│  OpenAI Agent   │
│   (workflow)    │
└─────────────────┘
```

### File Structure

```
backend/
├── api/
│   └── agent-chat.ts          # Edge Function endpoint
└── services/agent/
    ├── config.ts              # Environment validation
    ├── types.ts               # TypeScript types
    ├── client.ts              # OpenAI Agent SDK wrapper
    └── stream-adapter.ts      # SSE stream adapter

src/admin/
├── api/
│   └── agentClient.js         # Fetch client (SSE)
├── hooks/
│   └── useAgentChat.js        # React hook
├── components/ui/
│   ├── chat-message.jsx       # Message bubble
│   └── chat-header.jsx        # Chat header
└── pages/
    └── ChatMira.jsx           # Main chat page
```

---

## Setup

### Prerequisites

- Node.js 18+ (for frontend)
- Deno 1.40+ (for Edge Functions)
- Supabase CLI (for deploying Edge Functions)
- OpenAI API key with Agent Builder access
- OpenAI Agent workflow ID

### 1. Clone and Install

```bash
cd AdvisorHub
npm install
```

### 2. Set Environment Variables

#### Backend (Supabase Edge Functions)

Set these secrets using Supabase CLI:

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx

# Set Agent workflow ID
supabase secrets set AGENT_WORKFLOW_ID=wf_690aec0f63688190807fb6752d1365e30c861a5689612a1f

# Optional: Custom OpenAI base URL (defaults to https://api.openai.com/v1)
supabase secrets set AGENT_BASE_URL=https://api.openai.com/v1

# Optional: Timeout in milliseconds (defaults to 30000)
supabase secrets set AGENT_TIMEOUT=30000

# Optional: Max retries (defaults to 3)
supabase secrets set AGENT_MAX_RETRIES=3
```

#### Frontend (Optional)

Create `.env.local` (NOT committed to git):

```bash
# Optional: Override Agent API URL
VITE_AGENT_API_URL=http://localhost:54321/functions/v1/agent-chat
```

---

## Environment Variables

### Backend Variables (Required)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-xxxxx` | ✅ Yes |
| `AGENT_WORKFLOW_ID` | Agent Builder workflow ID | `wf_690aec0f...` | ✅ Yes |
| `AGENT_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` | ❌ No (defaults) |
| `AGENT_TIMEOUT` | Request timeout (ms) | `30000` | ❌ No (defaults) |
| `AGENT_MAX_RETRIES` | Max retry attempts | `3` | ❌ No (defaults) |

### Frontend Variables (Optional)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_AGENT_API_URL` | Agent API endpoint | `/api` | ❌ No (defaults to `/api`) |

---

## Local Development

### Run Frontend Dev Server

```bash
npm run dev
```

Frontend will be available at http://localhost:3000

### Run Backend Edge Functions Locally

```bash
# Start Supabase local stack
supabase start

# Deploy Edge Functions to local Supabase
supabase functions deploy agent-chat

# Test Edge Function
curl -X POST http://localhost:54321/functions/v1/agent-chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "mode": "stream"
  }'
```

### Test Mira Chat

1. Start both frontend and backend
2. Navigate to http://localhost:3000
3. Log in (or register)
4. Click "Mira Chat" in sidebar
5. Send a test message: "Hello, Mira!"

---

## Deployment

### Deploy to Supabase Production

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Set production secrets
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx --project-ref <your-project-ref>
supabase secrets set AGENT_WORKFLOW_ID=wf_690aec0f... --project-ref <your-project-ref>

# Deploy Edge Function
supabase functions deploy agent-chat --project-ref <your-project-ref>
```

### Deploy Frontend

```bash
# Build production bundle
npm run build

# Deploy to your hosting provider (Vercel, Netlify, etc.)
# Example for Vercel:
vercel deploy
```

---

## API Reference

### POST /api/agent/chat

Send chat messages to OpenAI Agent.

#### Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "mode": "stream",
  "metadata": {},
  "temperature": 0.7,
  "max_tokens": 4096
}
```

#### Request Schema

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `messages` | `Array<Message>` | Conversation history | ✅ Yes |
| `mode` | `"stream" \| "batch"` | Response mode | ❌ No (default: `stream`) |
| `metadata` | `object` | Custom metadata | ❌ No |
| `temperature` | `number` | Sampling temperature (0-2) | ❌ No (default: 0.7) |
| `max_tokens` | `number` | Max response tokens | ❌ No (default: 4096) |

#### Message Schema

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `role` | `"user" \| "assistant" \| "tool" \| "system"` | Message role | ✅ Yes |
| `content` | `string \| object` | Message content | ✅ Yes |
| `name` | `string` | Function/tool name | ❌ No |
| `tool_call_id` | `string` | Tool call ID (for tool results) | ❌ No |

#### Response (Streaming)

SSE stream with events:

```
event: message.delta
data: {"delta":"Hello","message_id":"msg_123"}

event: message.completed
data: {"message":{"role":"assistant","content":"Hello! How can I help?"},"message_id":"msg_123","finish_reason":"stop"}

event: done
data: {}
```

#### Response (Batch)

```json
{
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help you today?"
  }
}
```

#### Error Response

```json
{
  "error": {
    "message": "Missing required env: OPENAI_API_KEY",
    "code": "config_error"
  }
}
```

### Event Types

| Event | Description | Data Fields |
|-------|-------------|-------------|
| `message.delta` | Token chunk | `delta`, `message_id` |
| `message.completed` | Message finished | `message`, `message_id`, `finish_reason` |
| `tool_call.created` | Tool call requested | `tool_call` |
| `tool_call.delta` | Tool call streaming | `tool_call_id`, `delta` |
| `tool_call.completed` | Tool call finished | `tool_call` |
| `error` | Error occurred | `error` (with `message`, `code`, `type`) |
| `done` | Stream ended | (empty) |

---

## Troubleshooting

### "Missing required env: OPENAI_API_KEY"

**Cause**: `OPENAI_API_KEY` not set in Edge Function environment.

**Solution**:
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx
```

### "Invalid AGENT_WORKFLOW_ID format"

**Cause**: Workflow ID doesn't start with `wf_`.

**Solution**: Verify your Agent Builder workflow ID starts with `wf_`. Check in [OpenAI Platform](https://platform.openai.com/playground/assistants).

### "Request timeout"

**Cause**: Agent took longer than `AGENT_TIMEOUT` to respond.

**Solution**:
- Increase timeout: `supabase secrets set AGENT_TIMEOUT=60000`
- Simplify Agent instructions
- Reduce token limit in request

### "No response body"

**Cause**: Network issue or Agent API error.

**Solution**:
- Check OpenAI API status: https://status.openai.com
- Verify API key has Agent Builder access
- Check Edge Function logs: `supabase functions logs agent-chat`

### Frontend Not Connecting

**Cause**: Incorrect `VITE_AGENT_API_URL` or CORS issue.

**Solution**:
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors
- Ensure Edge Function has CORS headers (already configured)

### Tool Calls Not Working

**Cause**: Tool execution logic not implemented.

**Solution**: Implement `handleToolCall` in `ChatMira.jsx`:

```javascript
const handleToolCall = async (toolCall) => {
  // Execute tool based on function name
  let result;
  switch (toolCall.function.name) {
    case "get_customer_info":
      result = await fetchCustomerInfo(toolCall.function.arguments);
      break;
    // ... other tools
  }

  await sendToolResult(toolCall.id, JSON.stringify(result));
};
```

---

## Security Considerations

### ✅ Best Practices

1. **Never expose API keys**: `OPENAI_API_KEY` must ONLY exist in backend/Edge Functions
2. **Validate input**: Request validation happens in Edge Function (size limits, sanitization)
3. **Rate limiting**: Consider adding rate limits per user/session
4. **Audit logs**: Log Agent requests for compliance (PII-sensitive)
5. **Content filtering**: OpenAI has built-in content filtering; monitor for policy violations

### 🔒 What's Protected

- API keys stored as Supabase secrets (encrypted at rest)
- Request validation (size limits, MIME types)
- CORS headers configured
- Timeout/retry logic prevents hanging requests

### ⚠️ What to Add

- **User authentication**: Verify JWT/session before proxying to Agent
- **Rate limiting**: Per-user request limits (e.g., 10 req/min)
- **PII detection**: Scan messages for sensitive data before sending to OpenAI
- **Audit logging**: Log all Agent interactions with user/timestamp

---

## Testing

### Manual Testing

1. **Basic chat**:
   - Send "Hello!"
   - Verify streaming response

2. **Long conversation**:
   - Send 10+ back-and-forth messages
   - Verify context maintained

3. **Tool calls**:
   - Trigger tool call (depends on Agent instructions)
   - Execute tool
   - Verify Agent continues with result

4. **Error handling**:
   - Remove `OPENAI_API_KEY` temporarily
   - Verify error message displayed in UI

### Automated Tests

Run unit tests:
```bash
# Backend (Deno)
cd backend/services/agent/__tests__
deno test

# Frontend (Jest/Vitest - to be added)
npm test
```

---

## Additional Resources

- [OpenAI Agent Builder Docs](https://platform.openai.com/docs/guides/agent-builder)
- [OpenAI ChatKit Advanced Samples](https://github.com/openai/openai-chatkit-advanced-samples)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Server-Sent Events (SSE) Spec](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Edge Function logs: `supabase functions logs agent-chat`
3. Check browser console for frontend errors
4. Open GitHub issue with reproduction steps

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
**Maintainer**: AdvisorHub Team
