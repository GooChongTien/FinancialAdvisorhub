# OpenAI Agent Integration - Setup Instructions

## Quick Setup (Recommended)

### Option 1: Automated Setup Script

Simply run the setup script:

```bash
setup-agent-integration.bat
```

This will:
- ✅ Check if Supabase CLI is installed
- ✅ Link to your Supabase project (or start local)
- ✅ Set environment secrets (OPENAI_API_KEY, AGENT_WORKFLOW_ID)
- ✅ Deploy the agent-chat Edge Function
- ✅ Verify deployment

---

## Manual Setup

If you prefer to do it manually or the script fails, follow these steps:

### Step 1: Install Supabase CLI

**Option A: Using npm (Recommended)**
```bash
npm install -g supabase
```

**Option B: Using Scoop**
```bash
scoop install supabase
```

**Option C: Download Binary**
Download from: https://github.com/supabase/cli/releases

Verify installation:
```bash
supabase --version
```

---

### Step 2: Choose Development or Production

#### **For Local Development**

Start local Supabase:
```bash
supabase start
```

This will:
- Start PostgreSQL database
- Start Edge Functions runtime
- Start Storage, Auth, etc.
- Display local URLs (usually http://localhost:54321)

#### **For Production Deployment**

Link to your Supabase project:
```bash
supabase link --project-ref <your-project-ref>
```

Get your project ref from: https://app.supabase.com/project/_/settings/general

---

### Step 3: Set Environment Secrets

Your API key is already in `.env.example`:
```
OPENAI_API_KEY=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
AGENT_WORKFLOW_ID=wf_690aec0f63688190807fb6752d1365e30c861a5689612a1f
```

#### **For Local Development**

```bash
supabase secrets set OPENAI_API_KEY=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 --local

supabase secrets set AGENT_WORKFLOW_ID=wf_690aec0f63688190807fb6752d1365e30c861a5689612a1f --local

supabase secrets set AGENT_BASE_URL=https://api.openai.com/v1 --local

supabase secrets set AGENT_TIMEOUT=30000 --local

supabase secrets set AGENT_MAX_RETRIES=3 --local
```

#### **For Production**

```bash
supabase secrets set OPENAI_API_KEY=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

supabase secrets set AGENT_WORKFLOW_ID=wf_690aec0f63688190807fb6752d1365e30c861a5689612a1f

supabase secrets set AGENT_BASE_URL=https://api.openai.com/v1

supabase secrets set AGENT_TIMEOUT=30000

supabase secrets set AGENT_MAX_RETRIES=3
```

Verify secrets were set:
```bash
supabase secrets list
```

---

### Step 4: Deploy Edge Function

First, create the Edge Function directory structure if it doesn't exist:

```bash
mkdir -p supabase/functions/agent-chat
```

Copy the Edge Function code:
```bash
copy backend\api\agent-chat.ts supabase\functions\agent-chat\index.ts
```

Copy supporting files:
```bash
mkdir supabase\functions\_shared
xcopy /E /I backend\services supabase\functions\_shared\services
xcopy /E /I backend\utils supabase\functions\_shared\utils
```

#### **For Local Development**

```bash
supabase functions deploy agent-chat
```

#### **For Production**

```bash
supabase functions deploy agent-chat --no-verify-jwt
```

---

### Step 5: Verify Deployment

List deployed functions:
```bash
supabase functions list
```

Expected output:
```
┌──────────────┬───────────────────┬─────────┬────────────┐
│ NAME         │ VERSION           │ STATUS  │ UPDATED    │
├──────────────┼───────────────────┼─────────┼────────────┤
│ agent-chat   │ 1                 │ ACTIVE  │ just now   │
└──────────────┴───────────────────┴─────────┴────────────┘
```

Check function logs:
```bash
supabase functions logs agent-chat --tail 10
```

---

### Step 6: Test the Integration

#### **Test via curl**

For local:
```bash
curl -X POST http://localhost:54321/functions/v1/agent-chat ^
  -H "Content-Type: application/json" ^
  -H "Accept: text/event-stream" ^
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}], \"mode\": \"stream\"}"
```

For production:
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/agent-chat ^
  -H "Content-Type: application/json" ^
  -H "Accept: text/event-stream" ^
  -H "Authorization: Bearer <your-anon-key>" ^
  -d "{\"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}], \"mode\": \"stream\"}"
```

#### **Test via Web UI**

1. Navigate to http://localhost:5177
2. Log in (or register)
3. Click **"Mira Chat"** in the sidebar
4. Send message: **"Hello, Mira!"**
5. Verify streaming response appears

---

## Troubleshooting

### "supabase: command not found"

**Solution**: Install Supabase CLI (see Step 1)

### "No linked project found"

**Solution**: Run `supabase link` or `supabase start`

### "Failed to deploy function"

**Possible causes**:
1. Supabase not running: `supabase status`
2. Invalid syntax in TypeScript: Check `backend/api/agent-chat.ts`
3. Missing dependencies: Check `supabase/functions/agent-chat/index.ts`

**Solution**: Check function logs:
```bash
supabase functions logs agent-chat
```

### "Missing required env: OPENAI_API_KEY"

**Solution**: Set secrets (see Step 3)

### "Invalid AGENT_WORKFLOW_ID format"

**Solution**: Verify workflow ID starts with `wf_`

---

## Update Frontend API URL (if needed)

If you're running Supabase locally, update `.env.local`:

```bash
VITE_AGENT_API_URL=http://localhost:54321/functions/v1
```

Then restart the frontend:
```bash
npm run dev
```

---

## Production Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Linked to production project: `supabase link`
- [ ] Secrets set: `supabase secrets list` shows all keys
- [ ] Edge Function deployed: `supabase functions list` shows `agent-chat`
- [ ] Function logs clean: `supabase functions logs agent-chat` (no errors)
- [ ] Test via curl (see Step 6)
- [ ] Test via web UI (see Step 6)
- [ ] Frontend deployed with production API URL

---

## Need Help?

1. Check `docs/agent-integration.md` for detailed documentation
2. Run `supabase status` to check local environment
3. Run `supabase functions logs agent-chat` for error logs
4. Check browser console for frontend errors

---

**Last Updated**: 2025-11-05
