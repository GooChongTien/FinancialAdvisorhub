# AI Integration Quickstart
**Goal:** Stand up the Phase 1 AIAL core with a working test page in 30 minutes.

---

## Prerequisites

- Node.js 20+
- pnpm or npm (examples use `npm`)
- Access to OpenAI and Anthropic API keys (sandbox keys acceptable)
- Supabase CLI configured (for invoking local edge function)

---

## Step 1 - Install Dependencies (5 minutes)

```bash
npm install
```

Verify: `npm run lint` finishes without errors.

---

## Step 2 - Configure Environment (5 minutes)

Create `.env.local` in the project root:

```
OPENAI_API_KEY=sk-...replace...
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=anth-...replace...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
CUSTOM_AI_URL=https://sandbox.vendor.ai
CUSTOM_AI_KEY=vendor-token
MIRA_AIAL_ENABLED=true
MIRA_TELEMETRY_WRITE_KEY=dev-telemetry-key
```

Double check secrets are not committed by running `git status`.

---

## Step 3 - Add AIAL Core Modules (10 minutes)

Create `src/lib/aial/index.ts`:

```ts
export interface AIALEvent {
  id: string;
  payload: Record<string, unknown>;
  metadata: {
    requestId: string;
    source: 'web' | 'mobile' | 'backend';
    timestamp: number;
  };
}

export interface ProviderResponse {
  content: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface BaseProviderAdapter {
  id: string;
  health(): Promise<boolean>;
  execute(event: AIALEvent): Promise<ProviderResponse>;
}

export class AIALRouter {
  constructor(private adapters: BaseProviderAdapter[]) {}

  async execute(event: AIALEvent): Promise<ProviderResponse> {
    for (const adapter of this.adapters) {
      if (!(await adapter.health())) continue;
      try {
        return await adapter.execute(event);
      } catch (error) {
        console.warn(`[AIAL] Adapter ${adapter.id} failed`, error);
      }
    }
    throw new Error('No healthy provider available');
  }
}
```

Create `src/lib/aial/adapters/openaiAdapter.ts`:

```ts
import OpenAI from 'openai';
import type { AIALEvent, BaseProviderAdapter, ProviderResponse } from '../index';

export class OpenAIAdapter implements BaseProviderAdapter {
  id = 'openai';
  private client: OpenAI;

  constructor(private model: string, apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async health() {
    try {
      await this.client.models.retrieve(this.model);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async execute(event: AIALEvent): Promise<ProviderResponse> {
    const completion = await this.client.responses.create({
      model: this.model,
      input: event.payload,
    });

    return {
      content: completion.output_text,
      tokensUsed: completion.usage?.total_tokens ?? 0,
      latencyMs: completion.response_ms ?? 0,
    };
  }
}
```

Create `src/lib/aial/createRouter.ts`:

```ts
import { AIALRouter } from './index';
import { OpenAIAdapter } from './adapters/openaiAdapter';

export const createRouter = () =>
  new AIALRouter([
    new OpenAIAdapter(
      process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      process.env.OPENAI_API_KEY ?? '',
    ),
  ]);
```

---

## Step 4 - Build the Test Page (5 minutes)

Create `src/pages/mira-quickstart.tsx`:

```tsx
import { useState } from 'react';
import { createRouter } from '../lib/aial/createRouter';

const router = createRouter();

export default function MiraQuickstart() {
  const [input, setInput] = useState('Summarize my lead pipeline risks');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem' }}>
      <h1>Mira Quickstart</h1>
      <textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        rows={4}
        style={{ width: '100%' }}
      />
      <button
        onClick={async () => {
          setLoading(true);
          try {
            const response = await router.execute({
              id: crypto.randomUUID(),
              payload: { prompt: input },
              metadata: {
                requestId: crypto.randomUUID(),
                source: 'web',
                timestamp: Date.now(),
              },
            });
            setOutput(response.content);
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Through AIAL'}
      </button>
      <pre style={{ marginTop: '1rem', background: '#f5f5f5', padding: '1rem' }}>{output}</pre>
    </main>
  );
}
```

Add route to `src/main.tsx` or router configuration:

```ts
import MiraQuickstart from './pages/mira-quickstart';

<Route path="/mira-quickstart" element={<MiraQuickstart />} />
```

---

## Step 5 - Launch and Validate (5 minutes)

1. Start dev server: `npm run dev`
2. Open http://localhost:5173/mira-quickstart
3. Trigger a prompt; confirm output appears and latency logged in console
4. Toggle `MIRA_AIAL_ENABLED` to `false` and reload to watch feature flag effect

---

## Troubleshooting

Issue | Resolution
----- | ----------
`OpenAI key missing` error | Verify `.env.local` exists and run `npm run dev -- --host` to load env vars
Adapter health always false | Ensure provider models exist and API keys have correct access
Network 503 from edge function | Supabase CLI not running; start with `supabase functions serve --env-file .env.local`
Console CORS errors | Proxy requests through Supabase Edge Function rather than direct browser call
High latency | Enable streaming response in adapter or reduce prompt size in test page

---

## Next Steps

- Continue with Phase 2 by adding Anthropic and REST adapters under `src/lib/aial/adapters`
- Sync with backend engineer to deploy edge function and secure provider keys
- Review `AI_INTEGRATION_IMPLEMENTATION_PLAN.md` for remaining milestones
