# Leveraging Agent Builder for Voice Transcription

**Date:** 2025-11-25
**Status:** Architecture Review & Enhancement Plan

---

## Executive Summary

You're absolutely correct - we should use the **Agent Builder** (visual workflow editor) instead of hardcoding system prompts in agent files. Here's what you've already built and how to leverage it for voice transcription.

---

## What You Already Have ✅

### 1. **Visual Workflow Editor** (`/admin/workflows`)

**Location:** `src/admin/pages/admin/WorkflowEditor.jsx`

**Features:**
- ✅ Drag-and-drop node builder (React Flow)
- ✅ 10 node types (Agent, Tool, Decision, While, Transform, Classify, etc.)
- ✅ Visual connections with conditional routing
- ✅ Node configuration panel (right sidebar)
- ✅ Save/Load from database
- ✅ Test execution with live results
- ✅ Categorized palette (Core, Tools, Logic, Data)
- ✅ Search functionality
- ✅ MiniMap for large graphs

### 2. **Graph Execution Engine** (LangGraph)

**Location:** `supabase/functions/_shared/services/engine/graph-executor.ts`

**Capabilities:**
- ✅ Reads workflow definition from DB
- ✅ Builds LangGraph dynamically
- ✅ Executes nodes in sequence
- ✅ Handles branches (Decision nodes)
- ✅ Loops (While nodes)
- ✅ State management (State nodes)
- ✅ Tool execution (Tool nodes)
- ✅ LLM calls (Agent nodes) with **system prompts from config**

**Key Code (line 84-134):**
```typescript
if (node.type === 'agent' || node.type === 'llm') {
  const systemPrompt = node.config.system_prompt || "Default...";  // ⭐ FROM DB
  const prompt = node.config.prompt_template || "...";

  const messages = [
    { role: "system", content: systemPrompt },  // ⭐ USER-CONFIGURED
    ...state.messages,
    { role: "user", content: prompt }
  ];

  // Calls OpenAI with user's custom prompt
}
```

### 3. **Database Schema**

**Tables:**
```sql
-- Workflows (container)
mira_workflows (
  id, agent_id, name, trigger_intent, description, is_active
)

-- Nodes (individual steps)
mira_workflow_nodes (
  id, workflow_id, type, name,
  config JSONB,  -- ⭐ Stores ALL configuration including system prompts!
  position_x, position_y
)

-- Edges (connections)
mira_workflow_edges (
  id, workflow_id, source_node_id, target_node_id, condition_label
)
```

**Node Config Example (already in DB):**
```json
{
  "label": "Intent Classifier",
  "system_prompt": "You are an intent classification expert...",  // ⭐ HERE
  "prompt_template": "Classify: {{user_message}}",
  "model": "gpt-4o-mini",
  "temperature": 0.2,
  "max_tokens": 256
}
```

### 4. **Backend APIs**

**Location:** `supabase/functions/admin-workflows/index.ts`

**Endpoints:**
- ✅ CRUD for workflows
- ✅ Save nodes/edges
- ✅ Execute workflow by ID
- ✅ Execute workflow by trigger_intent

---

## Current vs. Desired Architecture

### **Current (Hardcoded):**

```
Voice Transcript
    ↓
smart-plan-intent Edge Function
    ↓
Hardcoded Prompt (line 47):
"Summarize the following advisor notes..."  ← Can't change without code deploy
    ↓
OpenAI API
    ↓
Summary + Intent
```

### **Desired (Agent Builder):**

```
Voice Transcript
    ↓
Trigger: "smart_plan.voice_note_received"
    ↓
Workflow Lookup (mira_workflows WHERE trigger_intent = "smart_plan.voice_note_received")
    ↓
Graph Executor loads nodes from DB
    ↓
┌─────────────────────────────────────┐
│ Node 1: "Intent Classifier"        │  ← USER CONFIGURES IN UI
│ System Prompt: [from config]       │  ← EDITABLE IN BROWSER
│ Knowledge Files: [intents.json]    │  ← TAGGED IN UI
│ Output: { intent, confidence }     │  ← SCHEMA IN UI
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Node 2: Decision (if-else)         │  ← USER CONFIGURES
│ if state.intent == "proposal"      │  ← VISUAL LOGIC
│   → Extract Proposal Data          │
│ else                                │
│   → Save as Note                    │
└─────────────────────────────────────┘
    ↓
Response
```

**Benefits:**
- ✅ No code deploys to change prompts
- ✅ Visual logic building (if-else, while loops)
- ✅ Each user can customize their own workflows
- ✅ A/B test different prompts
- ✅ Tag knowledge files per agent
- ✅ Version control in DB

---

## What Needs Enhancement

### Enhancement 1: System Prompt UI

**Current State:**
- Agent node has `instructions` field only (line 466-488)

**What to Add in WorkflowEditor.jsx:**

```jsx
{selectedNode.type === "agent" && (
  <div className="space-y-4">
    {/* Section: Prompt Configuration */}
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-3">Prompt Configuration</h4>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
          System Prompt
          <span className="text-slate-500 font-normal ml-1">(Defines agent personality & role)</span>
        </label>
        <textarea
          value={selectedNode.data.system_prompt || ""}
          onChange={(e) => updateNodeData('system_prompt', e.target.value)}
          placeholder="You are Mira, an AI assistant for insurance advisors..."
          className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-y"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
          Prompt Template
          <span className="text-slate-500 font-normal ml-1">(Use {{variable}} for dynamic values)</span>
        </label>
        <textarea
          value={selectedNode.data.prompt_template || ""}
          onChange={(e) => updateNodeData('prompt_template', e.target.value)}
          placeholder="Analyze this transcript: {{transcript}}"
          className="w-full min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-y"
        />
        <p className="text-xs text-slate-500 mt-1">
          Available variables: {{transcript}}, {{state.analysis_result}}, {{context.module}}
        </p>
      </div>
    </div>

    {/* Section: Model Parameters */}
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-3">Model Parameters</h4>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Model</label>
        <select
          value={selectedNode.data.model || "gpt-4o-mini"}
          onChange={(e) => updateNodeData('model', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="gpt-4o-mini">GPT-4o Mini (Fast, Cheap)</option>
          <option value="gpt-4o">GPT-4o (Balanced)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo (Best Quality)</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
          Temperature: <span className="font-mono">{selectedNode.data.temperature || 0.7}</span>
          <span className="text-slate-500 font-normal ml-1">(0 = deterministic, 2 = creative)</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={selectedNode.data.temperature || 0.7}
          onChange={(e) => updateNodeData('temperature', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Max Tokens</label>
        <input
          type="number"
          min="1"
          max="4096"
          step="1"
          value={selectedNode.data.max_tokens || 512}
          onChange={(e) => updateNodeData('max_tokens', parseInt(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>

    {/* Section: Knowledge Files */}
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-3">Knowledge Files</h4>

      <div className="space-y-2">
        {(selectedNode.data.knowledge_file_ids || []).map((fileId, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm flex-1 font-mono">{fileId}</span>
            <button
              onClick={() => {
                const files = [...(selectedNode.data.knowledge_file_ids || [])];
                files.splice(idx, 1);
                updateNodeData('knowledge_file_ids', files);
              }}
              className="text-slate-400 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        ))}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            // Open knowledge file picker dialog
            setKnowledgePickerOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Knowledge File
        </Button>

        <p className="text-xs text-slate-500">
          Knowledge files are injected into context before LLM call
        </p>
      </div>
    </div>

    {/* Section: Output Configuration */}
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-3">Output Configuration</h4>

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">Output Format</label>
        <select
          value={selectedNode.data.output_format || "text"}
          onChange={(e) => updateNodeData('output_format', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="text">Plain Text</option>
          <option value="json">JSON Object</option>
          <option value="structured">Structured (with schema)</option>
        </select>
      </div>

      {selectedNode.data.output_format === "structured" && (
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Output Schema (JSON Schema)
          </label>
          <textarea
            value={selectedNode.data.output_schema || ""}
            onChange={(e) => updateNodeData('output_schema', e.target.value)}
            placeholder={JSON.stringify({
              type: "object",
              properties: {
                intent: { type: "string" },
                confidence: { type: "number" }
              }
            }, null, 2)}
            className="w-full min-h-[150px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono resize-y"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
          Save Output To Variable
        </label>
        <Input
          value={selectedNode.data.output_variable || "result"}
          onChange={(e) => updateNodeData('output_variable', e.target.value)}
          placeholder="result"
          className="text-sm font-mono"
        />
        <p className="text-xs text-slate-500 mt-1">
          Access in next nodes as: <code className="bg-slate-100 px-1 rounded">state.{selectedNode.data.output_variable || "result"}</code>
        </p>
      </div>
    </div>

    {/* Section: Tools */}
    <div className="border-t pt-4">
      <h4 className="text-sm font-semibold mb-3">Available Tools</h4>

      <div className="space-y-2">
        {(selectedNode.data.tools || []).map((tool, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
            <Wrench className="w-4 h-4 text-green-600" />
            <span className="text-sm flex-1 font-mono">{tool}</span>
            <button
              onClick={() => {
                const tools = [...(selectedNode.data.tools || [])];
                tools.splice(idx, 1);
                updateNodeData('tools', tools);
              }}
              className="text-slate-400 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        ))}

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setToolPickerOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## How System Prompts Are Stored NOW

### Location: `mira_workflow_nodes.config` (JSONB column)

```json
{
  "id": "node-abc123",
  "workflow_id": "workflow-xyz",
  "type": "agent",
  "name": "Intent Classifier",
  "config": {
    "label": "Intent Classifier",
    "system_prompt": "You are Mira's intent classifier...",  // ⭐ EDITABLE IN UI
    "prompt_template": "Classify: {{transcript}}",
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "max_tokens": 256,
    "knowledge_file_ids": ["file-123", "file-456"],         // ⭐ TO BE ADDED
    "tools": ["search_customer", "create_lead"],            // ⭐ TO BE ADDED
    "output_format": "structured",                          // ⭐ TO BE ADDED
    "output_schema": { "type": "object", ... },             // ⭐ TO BE ADDED
    "output_variable": "classification_result"              // ⭐ TO BE ADDED
  },
  "position_x": 250,
  "position_y": 100
}
```

**Execution Flow:**
1. User edits in WorkflowEditor UI
2. Clicks "Save" → PATCH /admin-workflows/:id
3. Saved to `mira_workflow_nodes.config`
4. On execution:
   - GraphExecutor reads from DB
   - Loads `node.config.system_prompt`
   - Calls OpenAI with that prompt
   - **No code deploy needed!**

---

## How to Leverage for Voice Transcription

### Option 1: Replace Hardcoded smart-plan-intent

**Current:**
```typescript
// smart-plan-intent/index.ts (hardcoded)
const prompt = `Summarize the following advisor task/appointment notes...`;
```

**New Approach:**
1. Create workflow in UI: "Voice Note Analyzer"
2. Set trigger intent: `smart_plan.voice_note_received`
3. Add Agent node:
   - System prompt: (editable in UI)
   - Prompt template: "Analyze: {{notes}}\n{{transcript}}"
   - Knowledge files: Tag relevant files
   - Output schema: Define expected JSON
4. Save workflow
5. Update TaskDetailDrawer to call workflow:

```typescript
// In TaskDetailDrawer.jsx - handleGenerateSummaryAI
const { data, error } = await supabase.functions.invoke("admin-workflows/execute-by-intent", {
  body: {
    intent: "smart_plan.voice_note_received",
    input: {
      message: `${notes}\n${transcript}`,
      context: {
        module: "smart_plan",
        page: "task_detail",
        lead_id: task?.linked_lead_id
      }
    }
  }
});

// data.output contains result from workflow execution
const summary = data.output.messages[data.output.messages.length - 1].content;
```

### Option 2: Voice → Multi-Step Workflow

**Create Workflow: "Voice Transcript Processing"**

**Trigger:** `voice.transcript_received`

**Visual Flow:**

```
[Start]
  ↓
[Agent: "Language Detector"]
  System Prompt: "Detect language from transcript..."
  Output: { language, confidence }
  Save to: detected_language
  ↓
[Decision: "Is English?"]
  Condition: state.detected_language.language === "en"
  True → Node 3
  False → Node 4
  ↓ True                    ↓ False
[Agent: "Extract Entities"] [Agent: "Translate to English"]
  System Prompt: "Extract    System Prompt: "Translate from
  customer name, phone..."   {{state.detected_language.language}}..."
  Knowledge: customers.json  Output: { translated_text }
  Tools: [validate_phone]    Save to: english_transcript
  Output: { entities }         ↓
  Save to: entities          [Agent: "Extract Entities"]
  ↓                             ↓
[Decision: "Has Proposal Intent?"]
  Condition: state.entities.intent === "proposal"
  True → Node 6
  False → End
  ↓ True
[Tool: "Create Proposal"]
  Tool: create_proposal
  Input: {
    customer: "{{state.entities.customer}}",
    product: "{{state.entities.product}}"
  }
  ↓
[Agent: "Generate Follow-up Tasks"]
  System Prompt: "Create follow-up tasks..."
  Output: { tasks }
  ↓
[Tool: "Create Tasks"]
  Tool: bulk_create_tasks
  Input: "{{state.tasks}}"
  ↓
[End]
```

**All configured in UI, no code!**

---

## Knowledge File Integration

### Database Schema Needed

**Create table for knowledge files:**

```sql
-- Knowledge Base Files
CREATE TABLE public.mira_knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('json', 'markdown', 'pdf', 'csv')),
  content text,                    -- For text-based files
  content_url text,                 -- For large files (storage URL)
  embedding_vector vector(1536),   -- Optional: for semantic search
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link knowledge files to workflow nodes
CREATE TABLE public.mira_workflow_node_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES mira_workflow_nodes(id) ON DELETE CASCADE,
  knowledge_file_id uuid REFERENCES mira_knowledge_files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(node_id, knowledge_file_id)
);
```

### UI Enhancement in WorkflowEditor.jsx

**Add Knowledge File Picker:**

```jsx
const [knowledgePickerOpen, setKnowledgePickerOpen] = useState(false);

// Fetch available knowledge files
const { data: knowledgeFiles } = useQuery({
  queryKey: ["knowledge-files"],
  queryFn: async () => {
    const { data } = await supabase
      .from("mira_knowledge_files")
      .select("*")
      .order("title");
    return data;
  }
});

// In node config panel
<div className="border-t pt-4">
  <h4 className="text-sm font-semibold mb-3">Knowledge Files</h4>

  {/* Tagged files list */}
  <div className="space-y-2">
    {(selectedNode.data.knowledge_file_ids || []).map((fileId) => {
      const file = knowledgeFiles?.find(f => f.id === fileId);
      return (
        <div key={fileId} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
          <FileText className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <div className="text-sm font-medium">{file?.title || fileId}</div>
            <div className="text-xs text-slate-500">{file?.type}</div>
          </div>
          <button onClick={() => removeKnowledgeFile(fileId)}>×</button>
        </div>
      );
    })}

    <Button size="sm" variant="outline" className="w-full" onClick={() => setKnowledgePickerOpen(true)}>
      <Plus className="w-4 h-4 mr-2" />
      Add Knowledge File
    </Button>
  </div>
</div>

{/* Knowledge Picker Dialog */}
<Dialog open={knowledgePickerOpen} onOpenChange={setKnowledgePickerOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Select Knowledge Files</DialogTitle>
      <DialogDescription>
        Tag files that this agent should have access to
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-2 max-h-96 overflow-y-auto">
      {knowledgeFiles?.map(file => (
        <button
          key={file.id}
          onClick={() => {
            updateNodeData('knowledge_file_ids', [
              ...(selectedNode.data.knowledge_file_ids || []),
              file.id
            ]);
            setKnowledgePickerOpen(false);
          }}
          className="w-full text-left p-3 border rounded hover:bg-slate-50 transition"
        >
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">{file.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {file.type} • {file.content?.length || 0} characters
              </div>
              {file.metadata?.description && (
                <div className="text-xs text-slate-600 mt-1">
                  {file.metadata.description}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setKnowledgePickerOpen(false)}>
        Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Graph Executor Enhancement

**Update graph-executor.ts to inject knowledge:**

```typescript
// In graph-executor.ts, Agent node execution (around line 84)
if (node.type === 'agent' || node.type === 'llm') {
  const systemPrompt = node.config.system_prompt || "You are Mira...";
  const promptTemplate = node.config.prompt_template || "";

  // ⭐ NEW: Load knowledge files
  let knowledgeContext = "";
  if (node.config.knowledge_file_ids && node.config.knowledge_file_ids.length > 0) {
    const { data: files } = await this.supabase
      .from("mira_knowledge_files")
      .select("title, content")
      .in("id", node.config.knowledge_file_ids);

    if (files && files.length > 0) {
      knowledgeContext = "\n\n# Knowledge Base\n\n" + files.map(f =>
        `## ${f.title}\n\n${f.content}`
      ).join("\n\n");
    }
  }

  // ⭐ NEW: Inject knowledge into system prompt
  const enhancedSystemPrompt = systemPrompt + knowledgeContext;

  // ⭐ NEW: Template variable substitution
  const renderedPrompt = promptTemplate
    .replace(/\{\{transcript\}\}/g, state.transcript || "")
    .replace(/\{\{notes\}\}/g, state.notes || "")
    .replace(/\{\{state\.(\w+)\}\}/g, (match, varName) => {
      return JSON.stringify(state[varName] || "");
    });

  const messages = [
    { role: "system", content: enhancedSystemPrompt },
    ...state.messages,
    { role: "user", content: renderedPrompt }
  ];

  // Call OpenAI...
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      model: node.config.model || "gpt-4o-mini",
      messages,
      temperature: node.config.temperature || 0.7,
      max_tokens: node.config.max_tokens || 512,
      response_format: node.config.output_format === "json"
        ? { type: "json_object" }
        : undefined,
      // ⭐ NEW: Structured output (OpenAI beta feature)
      ...(node.config.output_format === "structured" && node.config.output_schema ? {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "output",
            schema: JSON.parse(node.config.output_schema),
            strict: true
          }
        }
      } : {})
    })
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  // ⭐ NEW: Save to configured output variable
  const outputVar = node.config.output_variable || "result";
  const outputData = node.config.output_format !== "text"
    ? JSON.parse(content)
    : content;

  return {
    messages: [{ role: 'assistant', content }],
    [outputVar]: outputData,  // ⭐ Dynamic variable name
    metadata: { ...state.metadata, last_node: node.id }
  };
}
```

---

## Real-World Example: Voice Note Workflow

### Workflow Configuration (via UI)

**Workflow Name:** "Smart Plan Voice Processor"
**Trigger Intent:** `smart_plan.voice_note_received`

### Node 1: "Detect Intent & Extract Entities"

**Type:** Agent
**Configuration (in UI):**

```yaml
Name: Detect Intent & Extract Entities

System Prompt: |
  You are Mira, an AI assistant for insurance advisors in Singapore.

  Your role is to analyze voice transcripts from advisor meetings and:
  1. Detect customer intent (proposal, service request, general inquiry)
  2. Extract key entities (customer name, phone, NRIC, policy details)
  3. Identify follow-up actions needed

  Domain Knowledge:
  - FNA: Financial Needs Analysis (fact-finding session)
  - BI: Benefit Illustration (proposal document)
  - CI: Critical Illness coverage
  - ILP: Investment-Linked Policy
  - Shield Plan: MediShield Life supplement (hospitalization)

  Singapore Conventions:
  - Phone: 8-digit (8XXXXXXX or 9XXXXXXX)
  - NRIC: S/T/F/G + 7 digits + checksum (e.g., S1234567A)

  Be precise in entity extraction. If unsure about phone/NRIC format, flag it.

Prompt Template: |
  Analyze this voice transcript from an advisor's meeting notes:

  {{transcript}}

  Extract and return structured data.

Knowledge Files:
  - ✅ product_catalog.json (tagged)
  - ✅ insurance_glossary.json (tagged)
  - ✅ singapore_regulations.md (tagged)

Tools:
  - validate_phone_number
  - validate_nric

Model: gpt-4o-mini
Temperature: 0.2
Max Tokens: 512

Output Format: Structured
Output Schema:
{
  "type": "object",
  "properties": {
    "intent": {
      "type": "string",
      "enum": ["proposal", "service_request", "question", "meeting_note"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "entities": {
      "type": "object",
      "properties": {
        "customer_name": { "type": "string" },
        "phone": { "type": "string" },
        "nric": { "type": "string" },
        "policy_type": { "type": "string" },
        "coverage_amount": { "type": "number" },
        "premium_budget": { "type": "number" }
      }
    },
    "next_actions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "summary": { "type": "string" }
  },
  "required": ["intent", "confidence", "entities", "summary"]
}

Save Output To: analysis
```

### Node 2: "Decision - Is Proposal?"

**Type:** Decision
**Configuration:**

```yaml
Name: Is Proposal Intent?

Condition: |
  state.analysis.intent === "proposal" && state.analysis.confidence > 0.6

True Branch: → Node 3 (Extract Proposal Details)
False Branch: → Node 5 (Save as General Note)
```

### Node 3: "Extract Proposal Details"

**Type:** Agent
**Configuration:**

```yaml
Name: Extract Proposal Details

System Prompt: |
  You are a proposal data extraction specialist.

  Extract all relevant information needed to create an insurance proposal:
  - Customer details (name, phone, email, NRIC)
  - Coverage requirements (type, amount, riders)
  - Budget constraints
  - Timeline preferences
  - Existing policies (if mentioned)

  Validate:
  - Phone numbers must be 8 digits
  - Coverage amounts should be realistic (e.g., life insurance typically $100k - $10M)
  - Policy types must match our product catalog

Prompt Template: |
  Previous analysis detected a proposal intent:
  {{state.analysis}}

  Original transcript:
  {{transcript}}

  Extract complete proposal data.

Knowledge Files:
  - ✅ product_catalog.json
  - ✅ coverage_guidelines.json

Output Format: Structured
Output Schema:
{
  "type": "object",
  "properties": {
    "customer": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "phone": { "type": "string", "pattern": "^[89]\\d{7}$" },
        "email": { "type": "string", "format": "email" },
        "nric": { "type": "string" }
      },
      "required": ["name", "phone"]
    },
    "proposal": {
      "type": "object",
      "properties": {
        "policy_type": {
          "type": "string",
          "enum": ["Life", "Critical Illness", "ILP", "Shield", "Savings", "Investment"]
        },
        "coverage_amount": { "type": "number" },
        "premium_budget": { "type": "number" },
        "riders": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["policy_type"]
    }
  }
}

Save Output To: proposal_data
```

### Node 4: "Create Proposal (Tool Call)"

**Type:** Tool
**Configuration:**

```yaml
Name: Create Proposal

Tool Name: create_proposal

Inputs (mapped from state):
  customer_name: "{{state.proposal_data.customer.name}}"
  phone: "{{state.proposal_data.customer.phone}}"
  email: "{{state.proposal_data.customer.email}}"
  policy_type: "{{state.proposal_data.proposal.policy_type}}"
  coverage_amount: "{{state.proposal_data.proposal.coverage_amount}}"
  lead_id: "{{context.lead_id}}"

Save Output To: created_proposal
```

### Node 5: "Save as General Note" (else branch)

**Type:** Tool
**Configuration:**

```yaml
Name: Save Note

Tool Name: save_task_note

Inputs:
  task_id: "{{context.task_id}}"
  notes: "{{transcript}}"
  ai_summary: "{{state.analysis.summary}}"

Save Output To: saved_note
```

---

## Integration with Voice Recording

### Update TaskDetailDrawer.jsx

**Instead of calling smart-plan-intent directly:**

```typescript
// BEFORE (hardcoded):
const { data, error } = await supabase.functions.invoke("smart-plan-intent", {
  body: { notes, transcript, meeting_link, lead_id }
});

// AFTER (workflow-powered):
const { data, error } = await supabase.functions.invoke("admin-workflows/execute-by-intent", {
  body: {
    intent: "smart_plan.voice_note_received",
    input: {
      message: transcript,
      context: {
        module: "smart_plan",
        page: "task_detail",
        task_id: task.id,
        lead_id: task.linked_lead_id
      },
      // Pass variables that workflow can access
      variables: {
        transcript: transcript,
        notes: notes,
        meeting_link: meetingLink
      }
    }
  }
});

// Extract results from workflow execution
const workflowOutput = data.output;
const summary = workflowOutput.analysis?.summary || deriveSummary(task);
const proposalCreated = workflowOutput.created_proposal || null;

setLocalSummary(summary);
onSave?.({
  ai_summary: summary,
  key_points: workflowOutput.analysis?.next_actions || [],
  intent: workflowOutput.analysis?.intent || null
});

// If proposal was created by workflow, navigate to it
if (proposalCreated) {
  navigate(`/proposals/detail?id=${proposalCreated.id}`);
}
```

---

## While Loop Example: Retry Logic

### Use Case: Retry transcription if confidence is low

```
[Start]
  ↓
[State: Set retry_count = 0]
  ↓
[While: retry_count < 3]
  ↓
  [Agent: "Transcribe with Context"]
    System Prompt: "Attempt {{state.retry_count + 1}}/3..."
    Output: { text, confidence }
    Save to: transcription
  ↓
  [Decision: confidence > 0.8?]
    True → [Break] → Node 6
    False → [State: retry_count++] → [While] (loop back)
  ↓
[Agent: "Generate Summary"]
  ↓
[End]
```

**Configured entirely in UI with visual loops!**

---

## How to Implement Knowledge File Tagging

### Step 1: Create Migration

```sql
-- Create in supabase/migrations/YYYYMMDD_knowledge_files.sql

-- Knowledge files table
CREATE TABLE IF NOT EXISTS public.mira_knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('json', 'markdown', 'text', 'pdf', 'csv')),
  content text,
  content_url text,
  file_size integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link table (many-to-many: nodes ↔ knowledge files)
CREATE TABLE IF NOT EXISTS public.mira_workflow_node_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.mira_workflow_nodes(id) ON DELETE CASCADE,
  knowledge_file_id uuid NOT NULL REFERENCES public.mira_knowledge_files(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(node_id, knowledge_file_id)
);

CREATE INDEX idx_node_knowledge_node ON mira_workflow_node_knowledge(node_id);
CREATE INDEX idx_node_knowledge_file ON mira_workflow_node_knowledge(knowledge_file_id);

-- RLS policies
ALTER TABLE mira_knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE mira_workflow_node_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON mira_knowledge_files
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Auth users view knowledge" ON mira_knowledge_files
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Step 2: Update Graph Executor

```typescript
// In graph-executor.ts:84
if (node.type === 'agent' || node.type === 'llm') {
  // ... existing code ...

  // Load tagged knowledge files
  const knowledgeFileIds = node.config.knowledge_file_ids || [];
  let knowledgeContext = "";

  if (knowledgeFileIds.length > 0) {
    const { data: taggedFiles } = await this.supabase
      .from("mira_workflow_node_knowledge")
      .select(`
        knowledge_file_id,
        mira_knowledge_files (id, title, content, type)
      `)
      .eq("node_id", node.id);

    if (taggedFiles && taggedFiles.length > 0) {
      knowledgeContext = "\n\n---\n# Knowledge Base (Context)\n\n";
      taggedFiles.forEach(({ mira_knowledge_files: file }) => {
        knowledgeContext += `## ${file.title}\n\n${file.content}\n\n`;
      });
    }
  }

  // Inject into system prompt
  const finalSystemPrompt = node.config.system_prompt + knowledgeContext;

  // ... rest of execution
}
```

### Step 3: Add Knowledge Management UI

**Create:** `src/admin/pages/admin/KnowledgeManager.jsx`

```jsx
export default function KnowledgeManager() {
  const [files, setFiles] = useState([]);

  const { data: knowledgeFiles } = useQuery({
    queryKey: ["knowledge-files"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mira_knowledge_files")
        .select("*")
        .order("title");
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ title, content, type }) => {
      const { data, error } = await supabase
        .from("mira_knowledge_files")
        .insert([{ title, content, type }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="p-6">
      <h1>Knowledge Files</h1>

      <Button onClick={() => setUploadDialogOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Upload Knowledge File
      </Button>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {knowledgeFiles?.map(file => (
          <div key={file.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">{file.title}</h3>
            </div>
            <div className="text-xs text-slate-500 mb-2">{file.type}</div>
            <div className="text-sm text-slate-600 line-clamp-3">
              {file.description || file.content?.slice(0, 100) + "..."}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline">Edit</Button>
              <Button size="sm" variant="outline">Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Roadmap

### Phase 1: Enhance Node Configuration UI ⭐ **START HERE**

**Files to Modify:**
1. `src/admin/pages/admin/WorkflowEditor.jsx`

**Changes:**
- Add system_prompt textarea
- Add prompt_template textarea with {{variable}} support
- Add model selector (gpt-4o-mini, gpt-4o, etc.)
- Add temperature slider (0-2)
- Add max_tokens input
- Add output_format selector
- Add output_schema textarea (for structured output)
- Add output_variable input

**Estimated:** 2-3 hours

### Phase 2: Knowledge File System

**Files to Create:**
1. Migration: `supabase/migrations/YYYYMMDD_knowledge_files.sql`
2. Page: `src/admin/pages/admin/KnowledgeManager.jsx`
3. Route: Add to `src/admin/utils/index.js`

**Changes:**
- Create knowledge_files table
- Create node_knowledge link table
- Build knowledge manager UI
- Add knowledge picker to WorkflowEditor

**Estimated:** 4-5 hours

### Phase 3: Graph Executor Enhancements

**Files to Modify:**
1. `supabase/functions/_shared/services/engine/graph-executor.ts`

**Changes:**
- Load knowledge files from DB
- Inject into system prompt
- Template variable substitution ({{variable}})
- Structured output support (OpenAI JSON Schema)
- Save to dynamic output variables

**Estimated:** 3-4 hours

### Phase 4: Connect Voice to Workflows

**Files to Modify:**
1. `src/admin/modules/smart-plan/TaskDetailDrawer.jsx`
2. `src/admin/components/ui/chat-input.jsx`

**Changes:**
- Replace smart-plan-intent calls with workflow execution
- Pass transcript as workflow variable
- Handle workflow output (summary, entities, actions)
- Show loading state during workflow execution

**Estimated:** 2 hours

---

## Benefits of Using Agent Builder

### For Voice Transcription

**Without Agent Builder (current):**
- ❌ System prompts hardcoded in `smart-plan-intent/index.ts`
- ❌ Must redeploy Edge Function to change prompts
- ❌ No visual logic building
- ❌ Can't A/B test different approaches
- ❌ Each user gets same behavior

**With Agent Builder:**
- ✅ System prompts editable in browser UI
- ✅ No code deploys needed
- ✅ Visual if-else, while loops
- ✅ Easy A/B testing (duplicate workflow, modify, compare)
- ✅ Per-user or per-team customization
- ✅ Knowledge files tagged per agent node
- ✅ Structured output with schemas
- ✅ Version history in DB

### General Benefits

1. **Business Users Can Configure Agents:**
   - Non-developers can adjust prompts
   - Try different models (gpt-4o vs gpt-4o-mini)
   - Tune temperature for creativity vs. accuracy

2. **Rapid Iteration:**
   - Change system prompt → Save → Test
   - No git commit, no CI/CD, instant

3. **Compliance & Auditing:**
   - All prompts versioned in DB
   - Audit trail: who changed what when
   - Rollback to previous versions

4. **Knowledge Management:**
   - Central repository of knowledge files
   - Tag files to specific agents
   - Update knowledge without touching code

5. **Complex Logic Without Code:**
   - If-else branches
   - While loops (retry logic)
   - State management
   - Multi-step reasoning

---

## Example: Multi-Language Voice Processing

### Workflow: "Multi-Language Voice Handler"

```
[Start]
  ↓
[Agent: "Detect Language"]
  System Prompt: "Detect language from text..."
  Input: {{transcript}}
  Output: { language, confidence }
  Save to: lang_detection
  ↓
[Decision: Is English?]
  Condition: state.lang_detection.language === "en"
  ↓ No                           ↓ Yes
[Agent: "Translate to English"]  [Skip]
  System Prompt: "Translate..."  ↓
  Input: {{transcript}}          ↓
  Output: { english_text }       ↓
  Save to: translation          ↓
  ↓                               ↓
[State: Merge]                    ↓
  Set working_transcript =        ↓
    state.translation?.english_text || transcript
  ↓──────────────────────────────┘
[Agent: "Extract Entities"]
  System Prompt: "Extract from English text..."
  Input: {{state.working_transcript}}
  Output: { entities }
  ↓
[End]
```

**All configured visually, no code!**

---

## Code Changes Required

### 1. Enhance WorkflowEditor.jsx Node Config Panel

**Add these fields for Agent nodes:**

```jsx
// Around line 465, replace simple "instructions" with full config:

{selectedNode.type === "agent" && (
  <div className="space-y-4">
    {/* System Prompt */}
    <div>
      <Label>System Prompt</Label>
      <Textarea
        value={selectedNode.data.system_prompt || ""}
        onChange={(e) => updateNodeData('system_prompt', e.target.value)}
        placeholder="You are Mira, an AI assistant..."
        className="min-h-[120px] font-mono text-sm"
      />
    </div>

    {/* Prompt Template */}
    <div>
      <Label>Prompt Template</Label>
      <Textarea
        value={selectedNode.data.prompt_template || ""}
        onChange={(e) => updateNodeData('prompt_template', e.target.value)}
        placeholder="Analyze: {{transcript}}"
        className="min-h-[80px] font-mono text-sm"
      />
    </div>

    {/* Model Parameters (collapsible) */}
    <Collapsible>
      <CollapsibleTrigger>
        <div className="flex items-center gap-2">
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm font-medium">Model Parameters</span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-3">
        {/* Model, Temperature, Max Tokens */}
      </CollapsibleContent>
    </Collapsible>

    {/* Knowledge Files */}
    <Collapsible>
      <CollapsibleTrigger>Knowledge Files</CollapsibleTrigger>
      <CollapsibleContent>
        {/* File picker */}
      </CollapsibleContent>
    </Collapsible>

    {/* Output Configuration */}
    <Collapsible>
      <CollapsibleTrigger>Output Configuration</CollapsibleTrigger>
      <CollapsibleContent>
        {/* Format, Schema, Variable name */}
      </CollapsibleContent>
    </Collapsible>
  </div>
)}
```

### 2. Update Graph Executor

**File:** `supabase/functions/_shared/services/engine/graph-executor.ts`

**Add around line 84:**

```typescript
if (node.type === 'agent' || node.type === 'llm') {
  let systemPrompt = node.config.system_prompt || "You are Mira...";

  // ⭐ LOAD KNOWLEDGE FILES
  if (node.config.knowledge_file_ids?.length > 0) {
    const { data: files } = await this.supabase
      .from("mira_knowledge_files")
      .select("title, content")
      .in("id", node.config.knowledge_file_ids);

    if (files?.length > 0) {
      systemPrompt += "\n\n# Knowledge Base\n\n";
      files.forEach(f => {
        systemPrompt += `## ${f.title}\n\n${f.content}\n\n`;
      });
    }
  }

  // ⭐ TEMPLATE SUBSTITUTION
  const renderTemplate = (template: string, state: any) => {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = state;
      for (const key of keys) {
        value = value?.[key];
      }
      return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
    });
  };

  const promptTemplate = node.config.prompt_template || "";
  const renderedPrompt = renderTemplate(promptTemplate, state);

  const messages = [
    { role: "system", content: systemPrompt },
    ...state.messages.slice(-10),  // Keep last 10 for context
    { role: "user", content: renderedPrompt }
  ];

  // ⭐ STRUCTURED OUTPUT
  const requestBody: any = {
    model: node.config.model || "gpt-4o-mini",
    messages,
    temperature: node.config.temperature ?? 0.7,
    max_tokens: node.config.max_tokens || 512,
  };

  if (node.config.output_format === "json") {
    requestBody.response_format = { type: "json_object" };
  } else if (node.config.output_format === "structured" && node.config.output_schema) {
    try {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: "output",
          schema: JSON.parse(node.config.output_schema),
          strict: true
        }
      };
    } catch (e) {
      console.error("Invalid output schema", e);
    }
  }

  // ⭐ TOOLS if configured
  if (node.config.tools?.length > 0) {
    const tools = node.config.tools.map(toolName => {
      const tool = toolRegistry.getTool(toolName);
      return {
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema
        }
      };
    });
    requestBody.tools = tools;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";

  // ⭐ SAVE TO CONFIGURED OUTPUT VARIABLE
  const outputVar = node.config.output_variable || "result";
  let outputData: any;

  if (node.config.output_format === "text") {
    outputData = content;
  } else {
    try {
      outputData = JSON.parse(content);
    } catch {
      outputData = { text: content };
    }
  }

  return {
    messages: [{ role: 'assistant', content }],
    [outputVar]: outputData,  // state.analysis, state.proposal_data, etc.
    metadata: {
      ...state.metadata,
      last_node: node.id,
      model_used: node.config.model
    }
  };
}
```

---

## Migration Path

### Phase A: Keep Current + Add Workflow Option (Hybrid)

```typescript
// In TaskDetailDrawer.jsx
const handleGenerateSummaryAI = async () => {
  setSummaryLoading(true);

  try {
    // Try workflow first
    const { data: workflowResult, error: wfError } = await supabase.functions.invoke(
      "admin-workflows/execute-by-intent",
      {
        body: {
          intent: "smart_plan.voice_note_received",
          input: { transcript, notes, meeting_link }
        }
      }
    );

    if (!wfError && workflowResult?.output) {
      // Use workflow result
      const summary = workflowResult.output.analysis?.summary;
      setLocalSummary(summary);
      onSave?.({ ai_summary: summary });
      return;
    }

    // Fallback to hardcoded function
    const { data, error } = await supabase.functions.invoke("smart-plan-intent", {
      body: { notes, transcript, meeting_link, lead_id }
    });

    if (error) throw error;
    setLocalSummary(data.summary);
    onSave?.({ ai_summary: data.summary });

  } catch (e) {
    setSummaryError(e.message);
  } finally {
    setSummaryLoading(false);
  }
};
```

### Phase B: Full Migration (Replace Hardcoded)

1. Create default workflows in DB for all intents
2. Update all callers to use workflow execution
3. Deprecate hardcoded Edge Functions
4. Document migration for users

---

## Quick Win: Add System Prompt Config NOW

### Minimal Enhancement (30 minutes)

**In WorkflowEditor.jsx, line 465, replace:**

```jsx
{selectedNode.type === "agent" && (
  <div>
    <label>Instructions</label>
    <textarea
      value={selectedNode.data.instructions || ""}
      ...
    />
  </div>
)}
```

**With:**

```jsx
{selectedNode.type === "agent" && (
  <>
    <div>
      <label className="text-xs font-medium text-slate-700 mb-1.5 block">
        System Prompt
      </label>
      <textarea
        value={selectedNode.data.system_prompt || ""}
        onChange={(e) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === selectedNode.id
                ? { ...n, data: { ...n.data, system_prompt: e.target.value } }
                : n
            )
          );
        }}
        placeholder="You are an expert AI assistant..."
        className="w-full min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-y"
      />
    </div>

    <div>
      <label className="text-xs font-medium text-slate-700 mb-1.5 block">
        Prompt Template
      </label>
      <textarea
        value={selectedNode.data.prompt_template || ""}
        onChange={(e) => {
          setNodes((nds) =>
            nds.map((n) =>
              n.id === selectedNode.id
                ? { ...n, data: { ...n.data, prompt_template: e.target.value } }
                : n
            )
          );
        }}
        placeholder="Analyze: {{transcript}}"
        className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-y"
      />
    </div>
  </>
)}
```

**Test:**
1. Go to `/admin/workflows`
2. Open any workflow
3. Click an Agent node
4. See new "System Prompt" and "Prompt Template" fields
5. Edit and save
6. Run workflow → uses your custom prompt!

---

## Summary

**You've already built a complete Agent Builder** similar to OpenAI's! Here's how to leverage it for voice:

### Architecture You Have:
✅ Visual workflow editor with drag-and-drop
✅ Graph execution engine (LangGraph)
✅ Database schema for workflows/nodes/edges
✅ System prompts stored in `node.config.system_prompt`
✅ Backend APIs for CRUD + execution
✅ 10 node types including loops, branches, state

### What to Add:
1. ⭐ **Enhanced UI** for system_prompt, prompt_template, model params (30 min)
2. Knowledge file tagging system (4-5 hours)
3. Graph executor enhancements (knowledge injection, templates) (3-4 hours)
4. Connect voice transcription to workflow execution (2 hours)

### Recommended Next Steps:
1. Start with Quick Win: Add system prompt UI fields
2. Create one example workflow in UI for voice transcription
3. Test workflow execution with voice input
4. Then build out knowledge file system
5. Migrate hardcoded functions to workflows

**Total effort:** ~10-12 hours for complete migration

---

## Would You Like Me To:

1. ✅ **Start with Quick Win:** Add system_prompt + prompt_template fields to WorkflowEditor.jsx right now?
2. Create knowledge files migration + UI?
3. Enhance graph executor with knowledge injection?
4. Build example voice transcription workflow?
5. All of the above?

Let me know and I'll implement! 🚀
