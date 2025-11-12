# AI Integration Implementation Plan for AdvisorHub
**Based on:** Adaptive AI Assistant Core Architecture v1.3
**Date:** 2025-11-06
**Status:** Planning Phase

---

## Overview

This plan delivers the Adaptive AI Assistant (Mira) in six implementation phases across ten weeks. Each phase includes objectives, deliverables, owners, and acceptance criteria. Execution assumes a cross functional squad consisting of 3 frontend engineers, 2 backend engineers, 1 product manager, 1 designer, and 1 QA lead.

---

## Timeline Snapshot

Week | Phase | Focus
---- | ----- | -----
0    | Phase 0 | Environment, access, and baseline metrics
1-2  | Phase 1 | AI Integration Abstraction Layer (AIAL)
3-4  | Phase 2 | Provider adapters (OpenAI, Anthropic, Custom REST)
5-6  | Phase 3 | Intent system (schema, interpreter, executor)
7-8  | Phase 4 | Adaptive UI (command, co-pilot, insights modes)
9    | Phase 5 | Backend routing, orchestration, QA automation
10   | Phase 6 | Production readiness, runbooks, rollout

---

## Phase Breakdown

### Phase 0 - Launchpad (Week 0)
- **Goals:** Confirm architecture alignment, provision accounts, baseline telemetry
- **Key Tasks:**
  - Validate `adaptive_ai_assistant_core_architecture_v1.3.md`
  - Create `.env` templates, secrets rotation checklist
  - Instrument existing ChatMira flows for latency and success metrics
- **Deliverables:** Access matrix, security review sign off, Jira epic with linked stories
- **Entry Criteria:** Stakeholder approval of executive summary
- **Exit Criteria:** Engineers can run local Quickstart; PM sign off on metrics plan

### Phase 1 - AIAL Core (Weeks 1-2)
- **Goals:** Stand up the AI Integration Abstraction Layer (AIAL) with mock provider
- **Key Tasks:**
  - Create shared `src/lib/aial` modules (interfaces, context builders)
  - Introduce feature flag `MIRA_AIAL_ENABLED`
  - Provide reference implementation with mock responses and caching
- **Deliverables:** TypeScript contracts, unit tests, Storybook playground
- **Entry Criteria:** Phase 0 completed
- **Exit Criteria:** Quickstart test page returns mock responses through AIAL

### Phase 2 - Provider Adapters (Weeks 3-4)
- **Goals:** Implement OpenAI, Anthropic, and REST adapters with fallback routing
- **Key Tasks:**
  - Build provider adapters conforming to `BaseProviderAdapter`
  - Implement health checks and rate limit guards
  - Configure Supabase Edge Functions for secure key usage
- **Deliverables:** Adapter modules, integration tests, monitoring dashboards
- **Entry Criteria:** Phase 1 flag enabled in dev
- **Exit Criteria:** Adapter selection matrix executed successfully against staging

### Phase 3 - Intent System (Weeks 5-6)
- **Goals:** Ship intent schema, interpreter, and executor with analytics hooks
- **Key Tasks:**
  - Define JSON schema for intent payloads
  - Implement interpreter that maps provider output to intents
  - Create executor pipeline that triggers UI updates and back end workflows
- **Deliverables:** Schema definitions, TypeScript types, QA regression suite updates
- **Entry Criteria:** Provider adapters passing contract tests
- **Exit Criteria:** 5 critical intents automated end-to-end in staging

### Phase 4 - Adaptive UI (Weeks 7-8)
- **Goals:** Deliver three interaction modes (Command, Co-pilot, Insight)
- **Key Tasks:**
  - Implement React components with state machine controller
  - Add accessibility and responsive behavior standards
  - Instrument UX metrics (CTR, satisfaction pulses)
- **Deliverables:** `MiraCommandPanel`, `MiraCopilotPanel`, `MiraInsightPanel`
- **Entry Criteria:** Intent executor API stabilized
- **Exit Criteria:** Beta user session metrics meet success thresholds

### Phase 5 - Orchestration and QA (Week 9)
- **Goals:** Harden orchestration, routing, and automation testing
- **Key Tasks:**
  - Deploy backend orchestrator with queueing and retries
  - Add contract tests across backend-to-frontend payloads
  - Finalize logging, tracing, and alerting pipelines
- **Deliverables:** Supabase Edge Function updates, Playwright coverage for key flows
- **Entry Criteria:** UI modes merged into develop
- **Exit Criteria:** QA sign off with green regression report

### Phase 6 - Launch Readiness (Week 10)
- **Goals:** Finalize runbooks, SLAs, and rollout strategy
- **Key Tasks:**
  - Create production runbook with on-call rotation
  - Execute load testing and chaos drills
  - Prepare stakeholder enablement kit and training sessions
- **Deliverables:** Runbook, SLA doc, release checklist, stakeholder demo recording
- **Entry Criteria:** All previous phases signed off
- **Exit Criteria:** Go-live decision approved by steering committee

---

## Reference Code

### 1. AIAL Core (`src/lib/aial/index.ts`)
```ts
export interface AIALEvent {
  id: string;
  intent: string;
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
  intentCandidates?: Array<{ id: string; score: number }>;
}

export interface BaseProviderAdapter {
  readonly id: string;
  readonly model: string;
  health(): Promise<boolean>;
  execute(event: AIALEvent): Promise<ProviderResponse>;
}

export class AIALRouter {
  constructor(private adapters: BaseProviderAdapter[]) {}

  async execute(event: AIALEvent): Promise<ProviderResponse> {
    for (const adapter of this.adapters) {
      const healthy = await adapter.health();
      if (!healthy) continue;
      try {
        return await adapter.execute(event);
      } catch (error) {
        console.warn(`[AIAL] Adapter ${adapter.id} failed`, error);
      }
    }
    throw new Error('No healthy AI provider available');
  }
}
```

### 2. Provider Adapters (`src/lib/aial/adapters`)

**OpenAI Adapter (`openaiAdapter.ts`)**
```ts
import OpenAI from 'openai';
import { AIALEvent, BaseProviderAdapter, ProviderResponse } from '../index';

export class OpenAIAdapter implements BaseProviderAdapter {
  readonly id = 'openai';
  readonly model: string;
  private client: OpenAI;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  async health(): Promise<boolean> {
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
      metadata: event.metadata,
    });

    return {
      content: completion.output_text,
      tokensUsed: completion.usage?.total_tokens ?? 0,
      latencyMs: completion.response_ms ?? 0,
      intentCandidates: completion.output[0]?.content?.map((item: any) => ({
        id: item.intent_id,
        score: item.score,
      })),
    };
  }
}
```

**Anthropic Adapter (`anthropicAdapter.ts`)**
```ts
import Anthropic from '@anthropic-ai/sdk';
import { AIALEvent, BaseProviderAdapter, ProviderResponse } from '../index';

export class AnthropicAdapter implements BaseProviderAdapter {
  readonly id = 'anthropic';
  readonly model: string;
  private client: Anthropic;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async health(): Promise<boolean> {
    try {
      await this.client.models.retrieve(this.model);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async execute(event: AIALEvent): Promise<ProviderResponse> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: 'AdvisorHub adaptive assistant',
      messages: [
        {
          role: 'user',
          content: JSON.stringify(event.payload),
        },
      ],
    });

    const content = message.content?.[0]?.text ?? '';
    return {
      content,
      tokensUsed: message.usage?.output_tokens ?? 0,
      latencyMs: message.latency ?? 0,
    };
  }
}
```

**Custom REST Adapter (`restAdapter.ts`)**
```ts
import fetch from 'node-fetch';
import { AIALEvent, BaseProviderAdapter, ProviderResponse } from '../index';

export class RestAdapter implements BaseProviderAdapter {
  readonly id = 'custom-rest';
  readonly model = 'vendor-rest';

  constructor(private endpoint: string, private apiKey: string) {}

  async health(): Promise<boolean> {
    const response = await fetch(`${this.endpoint}/health`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    return response.ok;
  }

  async execute(event: AIALEvent): Promise<ProviderResponse> {
    const response = await fetch(`${this.endpoint}/ai/intent`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`REST provider error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content,
      tokensUsed: data.tokens ?? 0,
      latencyMs: data.latency_ms ?? 0,
    };
  }
}
```

### 3. Intent System (`src/lib/aial/intent`)
```ts
export interface MiraIntent {
  id: string;
  confidence: number;
  context: Record<string, unknown>;
}

export type IntentName =
  | 'lead.enrichment'
  | 'insurance.policy.lookup'
  | 'advisor.action.summary'
  | 'compliance.alert'
  | 'meeting.prep';

export interface IntentSchema {
  name: IntentName;
  requiredFields: string[];
  optionalFields?: string[];
}

export const intentCatalog: IntentSchema[] = [
  { name: 'lead.enrichment', requiredFields: ['leadId'] },
  { name: 'insurance.policy.lookup', requiredFields: ['policyNumber'] },
  { name: 'advisor.action.summary', requiredFields: ['advisorId'] },
  { name: 'compliance.alert', requiredFields: ['alertId'] },
  { name: 'meeting.prep', requiredFields: ['clientId', 'meetingId'] },
];

export const interpretProviderResponse = (
  response: ProviderResponse,
  schema: IntentSchema,
): MiraIntent | null => {
  const candidate = response.intentCandidates?.find(
    (item) => item.id === schema.name,
  );
  if (!candidate) return null;

  return {
    id: candidate.id,
    confidence: candidate.score,
    context: schema.requiredFields.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (response as any)[key] ?? null;
      return acc;
    }, {}),
  };
};
```

### 4. Adaptive UI (`src/components/mira`)

**Intent Mode Switcher (`MiraInteractionModes.tsx`)**
```tsx
import { useState } from 'react';

type Mode = 'command' | 'copilot' | 'insight';

const modeLabels: Record<Mode, string> = {
  command: 'Command Center',
  copilot: 'Co-pilot',
  insight: 'Insights Feed',
};

export function MiraInteractionModes({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('command');

  return (
    <section data-testid="mira-mode-switcher">
      <header>
        {Object.entries(modeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key as Mode)}
            aria-pressed={mode === key}
          >
            {label}
          </button>
        ))}
      </header>
      <div>{children}</div>
    </section>
  );
}
```

**Command Mode Panel (`MiraCommandPanel.tsx`)**
```tsx
export function MiraCommandPanel({ onSubmit }: { onSubmit: (text: string) => void }) {
  return (
    <form
      aria-label="Mira command panel"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const value = String(formData.get('command') ?? '');
        onSubmit(value.trim());
        form.reset();
      }}
    >
      <label htmlFor="mira-command-input">Ask anything about your book of business</label>
      <input id="mira-command-input" name="command" placeholder="Summarize recent lead activity" />
      <button type="submit">Send</button>
    </form>
  );
}
```

**Co-pilot Mode Panel (`MiraCopilotPanel.tsx`)**
```tsx
import type { MiraIntent } from '../../lib/aial/intent';

interface Props {
  intent: MiraIntent | null;
  onAction: (intent: MiraIntent) => void;
}

export function MiraCopilotPanel({ intent, onAction }: Props) {
  if (!intent) {
    return <p>Select a recommended action to begin.</p>;
  }

  return (
    <article>
      <h2>Suggested Action</h2>
      <pre>{JSON.stringify(intent.context, null, 2)}</pre>
      <button onClick={() => onAction(intent)}>Run Action</button>
    </article>
  );
}
```

### 5. Backend Orchestration (`supabasefunctionsagent-chat/index.ts`)
```ts
import { serve } from 'http.server';
import { AIALRouter } from '../../src/lib/aial';
import { OpenAIAdapter } from '../../src/lib/aial/adapters/openaiAdapter';
import { AnthropicAdapter } from '../../src/lib/aial/adapters/anthropicAdapter';
import { RestAdapter } from '../../src/lib/aial/adapters/restAdapter';

const router = new AIALRouter([
  new OpenAIAdapter(process.env.OPENAI_MODEL!, process.env.OPENAI_API_KEY!),
  new AnthropicAdapter(process.env.ANTHROPIC_MODEL!, process.env.ANTHROPIC_API_KEY!),
  new RestAdapter(process.env.CUSTOM_AI_URL!, process.env.CUSTOM_AI_KEY!),
]);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const event = await req.json();
  try {
    const response = await router.execute(event);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[AIAL] Router error', error);
    return new Response('Provider failure', { status: 503 });
  }
});
```

---

## File Structure Impact
```
src/
  lib/
    aial/
      index.ts
      adapters/
        openaiAdapter.ts
        anthropicAdapter.ts
        restAdapter.ts
      intent/
        catalog.ts
        interpreter.ts
        executor.ts
  components/
    mira/
      MiraInteractionModes.tsx
      MiraCommandPanel.tsx
      MiraCopilotPanel.tsx
      MiraInsightPanel.tsx
supabasefunctionsagent-chat/
  index.ts
  package.json
```

---

## Dependencies

- `openai` ^4.0.0
- `@anthropic-ai/sdk` ^0.22.0
- `node-fetch` ^3.3.2
- `zod` ^3.23.0 for schema validation
- `xstate` ^5.1.0 for UI state machines
- `@tanstack/react-query` ^5.0.0 for orchestration caching

---

## Environment Variables (`.env.local`)

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `CUSTOM_AI_URL`
- `CUSTOM_AI_KEY`
- `MIRA_AIAL_ENABLED`
- `MIRA_TELEMETRY_WRITE_KEY`

Ensure secrets are stored in the secrets manager. Local development uses `.env.local`; production uses platform secrets.

---

## Risk Mitigation

Risk | Description | Mitigation | Owner
---- | ----------- | ---------- | -----
Provider downtime | Upstream LLM unavailable | Automated adapter failover, cached responses | Backend lead
Latency spikes | Responses exceed 2 seconds | Parallel adapter calls, streaming UI fallback | Frontend lead
Data leakage | Sensitive data sent to LLM | PII scrubbing middleware, audit logging | Security engineer
Scope creep | Additional intents mid cycle | Change control board, weekly triage | Product manager
Testing gaps | Cross team handoffs miss regression | Playwright coverage, contract tests | QA lead

---

## Success Metrics

- **Assistant CSAT:** >= 4.5 / 5 during beta
- **Median Response Latency:** <= 1.5 seconds at 95th percentile < 3 seconds
- **Intent Accuracy:** >= 90 percent for top 5 intents
- **Adoption:** 60 percent of advisors launch Mira weekly within 4 weeks of release
- **Operational:** Pager rotation established, MTTR < 30 minutes for P1 incidents

---

## Sign-off Checklist

- [ ] Architecture diagram reviewed and approved
- [ ] Feature flags configured per environment
- [ ] QA regression suite passing
- [ ] Runbook published and stored in on-call repo
- [ ] Stakeholder enablement session complete
