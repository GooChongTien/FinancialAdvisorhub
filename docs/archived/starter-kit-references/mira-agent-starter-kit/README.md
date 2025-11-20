# Mira Agent Starter Kit (Config‑as‑Code, Supabase‑Native)

This repo scaffolds **Mira**, your SmartPOS agent with:
- Config‑as‑code **intents, workflows, policies, prompts, flags**
- Supabase **RLS** schemas for KB (pgvector), nav map, guardrails, feature flags
- TypeScript orchestrator (Router → Planner → Executor) with **Guardrails**
- Minimal **skills** (navigator, scheduler, CRM, knowledge)
- A single **response envelope** the FE can render (chat‑only or actions/confirm)

## Quick start

```bash
# 1) Install deps
pnpm i || npm i

# 2) Copy env and fill in keys
cp .env.example .env

# 3) Create DB schema (run in Supabase SQL editor or psql)
psql < infra/supabase/migrations/001_init.sql

# 4) Dev
pnpm dev || npm run dev
```

## Layout
```
config/           # YAML/JSON prompts, routing, workflows, policies, flags, evals
src/              # TS orchestrator, skills, tools, kb ingestion
infra/            # Supabase SQL
```

## Envelope (FE contract)
```json
{
  "message": "…chat reply…",
  "actions": [],
  "confirm": null,
  "telemetry": { "intent": "x", "confidence": 0.93 }
}
```
