# Adaptive AI Assistant Architecture — v1.3
**Date:** 2025-11-06

---

## 🧭 Version Summary

This version introduces the **AI Integration Abstraction Layer (AIAL)** — a unified adapter system that allows the assistant framework to integrate seamlessly with **OpenAI, Anthropic, or any custom REST-based model**.  
The core logic and UI remain model-agnostic, reducing coupling and simplifying future model experimentation.

---

# 🧠 Core Concept — Adaptive AI Assistant Framework (v1.3)

### Overview

The **Adaptive AI Assistant** (codename *Mira*) is a **context-aware orchestration layer** that integrates conversational intelligence, contextual awareness, and front-end control into one adaptive interface.  
It is designed to **augment advisor productivity** by translating natural-language or multimodal inputs into structured, executable actions across the AdvisorHub/360-EchoPOS ecosystem.

Unlike static chatbots, Mira functions as an **intelligent UX layer** — capable of dynamically shifting its layout, behavior, and interaction mode (chat, command, guide) based on user intent and current page context.

---

### Key Principles

| Pillar | Description |
|---------|-------------|
| **Interface Adaptivity** | Mira automatically transitions between fullscreen chat, split-screen guidance, or docked sidebar modes based on the detected task flow. |
| **Structured Intelligence** | The AI outputs standardized, machine-readable intents (e.g., JSON events) which the front-end interprets into navigation, autofill, or action triggers. |
| **Safe Autonomy** | The AI layer never directly mutates back-end data. All outputs must pass through a controlled **front-end validation and execution layer**. |
| **Model Independence** | The framework supports **pluggable AI backends** — such as OpenAI Agent Builder, Anthropic’s SDK, or a custom self-hosted LLM microservice. |
| **Context Synchronization** | Continuous state sync between the assistant and system pages ensures contextual guidance and reduced user friction. |

---

# 🏗️ System Architecture

### Conceptual Overview

```
┌────────────────────────────────────────────────────────────┐
│                  Adaptive Assistant Framework              │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   AI Intelligence Layer             │   │
│  │                                                     │   │
│  │  - Model Orchestrator (OpenAI / Anthropic / Custom) │   │
│  │  - Intent Extraction & Reasoning Engine             │   │
│  │  - Context Session Memory (optional)                │   │
│  │  - Structured Output in JSON / Schema Events        │   │
│  └─────────────────────────────────────────────────────┘   │
│               ↓                          ↓                 │
│  ┌─────────────────────┐    ┌──────────────────────────┐   │
│  │ Front-End Intent     │    │  Adaptive Layout Manager │   │
│  │ Interpreter          │    │  - Fullscreen / Split /  │   │
│  │  - Validates schema  │    │    Sidebar / Collapsed   │   │
│  │  - Executes action   │    │  - UI transitions        │   │
│  └─────────────────────┘    └──────────────────────────┘   │
│               ↓                          ↓                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           System Orchestrator (Front-End)            │   │
│  │  - Manages API calls (Supabase / REST)               │   │
│  │  - Handles data binding & security tokens            │   │
│  │  - Syncs state across modules and UI                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

# 🔌 AI Integration Abstraction Layer (AIAL)

### Overview

The **AI Integration Abstraction Layer (AIAL)** decouples the front-end and core logic from any specific AI vendor or SDK.  
It provides a **unified interface** for model communication, making it possible to switch between OpenAI, Anthropic, or custom REST inference endpoints **without modifying the core assistant logic**.

---

### Unified Interface

```typescript
export interface AIModelAdapter {
  name: string;
  sendMessage: (payload: AIRequestPayload) => Promise<AIResponseIntent>;
  streamMessage?: (payload: AIRequestPayload, onDelta: (chunk: string) => void) => Promise<void>;
}

export interface AIRequestPayload {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  tools?: Record<string, any>;
  temperature?: number;
}

export interface AIResponseIntent {
  intent_type: string;
  action: string;
  parameters: Record<string, any>;
  metadata?: {
    source: string;
    model: string;
    confidence?: number;
    latency_ms?: number;
  };
}
```

---

### Adapter Implementations

#### 🧠 OpenAI Adapter

```typescript
import OpenAI from 'openai';

export const openAIAdapter = {
  name: 'openai',
  async sendMessage(payload) {
    const start = performance.now();
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: payload.messages,
      response_format: { type: 'json_object' }
    });
    const content = resp.choices[0].message?.content ?? '{}';
    return {
      ...JSON.parse(content),
      metadata: { source: 'openai', model: 'gpt-4o-mini', latency_ms: performance.now() - start }
    };
  }
};
```

#### 🌤️ Anthropic Adapter

```typescript
import Anthropic from '@anthropic-ai/sdk';

export const anthropicAdapter = {
  name: 'anthropic',
  async sendMessage(payload) {
    const start = performance.now();
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-202410',
      messages: payload.messages,
      format: 'json'
    });
    const content = JSON.parse(response.content[0]?.text || '{}');
    return {
      ...content,
      metadata: { source: 'anthropic', model: 'claude-3-5-sonnet', latency_ms: performance.now() - start }
    };
  }
};
```

#### 🧩 Custom REST Adapter

```typescript
export const customRestAdapter = {
  name: 'custom-rest',
  async sendMessage(payload) {
    const start = performance.now();
    const resp = await fetch(`${import.meta.env.VITE_LLM_GATEWAY_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    return {
      ...data,
      metadata: { source: 'custom', model: data.model || 'self-hosted', latency_ms: performance.now() - start }
    };
  }
};
```

---

### Model Router Example

```typescript
const adapters = {
  openai: openAIAdapter,
  anthropic: anthropicAdapter,
  custom: customRestAdapter
};

export function getAdapter(provider) {
  return adapters[provider];
}
```

Usage:
```typescript
const response = await getAdapter('anthropic').sendMessage({ messages });
handleAIIntent(response);
```

---

### Benefits

| Benefit | Description |
|----------|--------------|
| **Model-Agnostic** | Swap models without changing assistant logic or UI flow. |
| **Low Integration Overhead** | One adapter interface handles any vendor API. |
| **Failover Ready** | Auto-fallback to alternative provider if latency or API limits occur. |
| **Future Proof** | Supports upcoming connectors like Gemini or Mistral with zero refactor. |
| **Observability** | Unified telemetry across adapters for latency and accuracy tracking. |

---

## ✅ Changelog

| Version | Date | Changes |
|----------|------|----------|
| 1.0 | 2025-11-06 | Initial specification by Claude Code |
| 1.2 | 2025-11-06 | Refactored AI layer to be model-agnostic |
| 1.3 | 2025-11-06 | Added AI Integration Abstraction Layer and routing mechanism |

---
