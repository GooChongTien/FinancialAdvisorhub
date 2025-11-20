# Deployment Guide: Mira Agent Engine & Behavioral Tracking

## Overview
This guide details the steps to deploy the new **Agent Engine** (Supabase-based workflows) and **Behavioral Tracking** (User interaction logging) schemas.

## Status
- **New Migrations Created:**
  1. `supabase/migrations/20251119030128_create_agent_engine_schema.sql` (Core Engine)
  2. `supabase/migrations/20251119133300_create_behavioral_schema.sql` (Behavioral Tracking)
- **Blocker:** A conflict exists between the local migration history and the remote database state, causing `db push` to fail with `duplicate key value violates unique constraint`.

---

## Option 1: Fix Supabase CLI (Recommended)

Use this method if you want to keep your local development environment in sync with the production database.

### 1. Repair Migration History
The remote database believes it is missing several older migrations. We need to mark them as "applied" so the CLI skips them.

Run the following command in your terminal:

```powershell
& "C:\Users\Goo Chong Tien\supabase-cli\supabase.exe" migration repair --status applied 20241110 20251110 20251111 20251112 20251113 20251117
```

### 2. Deploy New Migrations
Once the repair is successful, push the new files:

```powershell
& "C:\Users\Goo Chong Tien\supabase-cli\supabase.exe" db push
```

---

## Option 2: Manual SQL Execution (Fallback)

If the CLI continues to fail (e.g., due to connection timeouts), you can deploy the changes by running the SQL directly in the Supabase Dashboard.

### Step 1: Agent Engine Schema
Copy the content below and run it in the Supabase SQL Editor:

```sql
-- 20251119030128_create_agent_engine_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Workflow Definitions
CREATE TABLE IF NOT EXISTS mira_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mira_workflow_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES mira_workflows(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'llm', 'tool', 'router', 'start', 'end'
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb, -- Prompt templates, tool names, etc.
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS mira_workflow_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES mira_workflows(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES mira_workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES mira_workflow_nodes(id) ON DELETE CASCADE,
  condition_label TEXT -- For router logic
);

-- 2. Execution State (Memory)
CREATE TABLE IF NOT EXISTS mira_workflow_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES mira_workflows(id),
  user_id UUID REFERENCES auth.users(id),
  thread_id UUID, -- Conversation ID
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  current_node_id UUID,
  state_data JSONB DEFAULT '{}'::jsonb, -- The LangGraph state object
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tool Registry (Dynamic Tools)
CREATE TABLE IF NOT EXISTS mira_tool_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  schema JSONB NOT NULL, -- JSON Schema for args
  function_path TEXT NOT NULL, -- Path to Deno function or internal handler
  is_enabled BOOLEAN DEFAULT true
);

-- RLS Policies
ALTER TABLE mira_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_workflow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_tool_definitions ENABLE ROW LEVEL SECURITY;

-- Allow read access to workflows for authenticated users (or service role)
CREATE POLICY "Allow read access to workflows" ON mira_workflows FOR SELECT USING (true);
CREATE POLICY "Allow read access to nodes" ON mira_workflow_nodes FOR SELECT USING (true);
CREATE POLICY "Allow read access to edges" ON mira_workflow_edges FOR SELECT USING (true);
CREATE POLICY "Allow read access to tools" ON mira_tool_definitions FOR SELECT USING (true);

-- Users can only see their own state
CREATE POLICY "Users can see own state" ON mira_workflow_state 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own state" ON mira_workflow_state 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own state" ON mira_workflow_state 
  FOR UPDATE USING (auth.uid() = user_id);
```

### Step 2: Behavioral Tracking Schema
Copy the content below and run it in the Supabase SQL Editor:

```sql
-- 20251119133300_create_behavioral_schema.sql

-- Create table for raw behavioral events (clicks, navigation, etc.)
CREATE TABLE IF NOT EXISTS mira_behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL, -- 'navigation', 'click', 'input', 'form_submit'
  module TEXT NOT NULL,
  page TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for learned patterns (e.g., "User struggles with Lead Form")
CREATE TABLE IF NOT EXISTS mira_learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'struggle', 'preference', 'workflow_habit'
  user_id UUID REFERENCES auth.users(id),
  module TEXT,
  confidence FLOAT DEFAULT 0.0,
  frequency INT DEFAULT 1,
  last_detected_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mira_events_session ON mira_behavioral_events(session_id);
CREATE INDEX IF NOT EXISTS idx_mira_events_user ON mira_behavioral_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mira_events_created ON mira_behavioral_events(created_at);
CREATE INDEX IF NOT EXISTS idx_mira_patterns_user ON mira_learned_patterns(user_id);

-- Enable RLS
ALTER TABLE mira_behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_learned_patterns ENABLE ROW LEVEL SECURITY;

-- Policies for Behavioral Events
CREATE POLICY "Users can insert their own events"
  ON mira_behavioral_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
  ON mira_behavioral_events FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for Learned Patterns
CREATE POLICY "Users can view their own patterns"
  ON mira_learned_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access"
  ON mira_learned_patterns FOR ALL
  USING (auth.role() = 'service_role');
```
