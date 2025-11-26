# Agent Node Configuration Reference

## Overview

The WorkflowEditor provides a comprehensive configuration panel for Agent/LLM nodes in the Mira workflow system. This allows administrators to configure AI behavior, model parameters, and output formatting through the visual Agent Builder interface.

## Supported Node Types

The configuration panel appears for:
- `agent` nodes
- `llm` nodes

Both types are treated as AI agents and share the same configuration interface.

## Configuration Fields

All configuration is stored in the `mira_workflow_nodes.config` JSONB column and is automatically loaded by the graph execution engine.

### System Prompt
**Field**: `system_prompt` (string)
**UI**: Multi-line textarea
**Purpose**: Defines the AI agent's role, personality, and core capabilities

**Example**:
```
You are an expert on Singapore insurance regulations (MAS, LIA, PDPA).
Answer strictly based on official guidelines.
```

### Prompt Template
**Field**: `prompt_template` (string)
**UI**: Multi-line textarea with {{variable}} syntax support
**Purpose**: Template for the user message sent to the LLM, with variable interpolation

**Example**:
```
User Question: {{user_message}}
Provide a concise, compliant answer citing relevant acts or guidelines if possible.
```

**Variable Syntax**: Use `{{variable_name}}` to reference workflow state variables

### Model
**Field**: `model` (string)
**UI**: Dropdown select
**Options**:
- `gpt-4o-mini` - GPT-4o Mini (Fast)
- `gpt-4o` - GPT-4o (Balanced)
- `gpt-4-turbo` - GPT-4 Turbo (Advanced)

**Default**: `gpt-4o-mini`

### Temperature
**Field**: `temperature` (number)
**UI**: Number input (0-2, step 0.1)
**Purpose**: Controls randomness in model outputs
**Range**: 0.0 (deterministic) to 2.0 (creative)
**Default**: 0.7

### Max Tokens
**Field**: `max_tokens` (number)
**UI**: Number input (1-4096)
**Purpose**: Maximum length of model response
**Default**: 512

### Output Variable
**Field**: `output_variable` (string)
**UI**: Text input
**Purpose**: Name of the workflow state variable to store the agent's response
**Default**: `result`

**Example**: If set to `regulatory_answer`, the response will be available as `{{regulatory_answer}}` in downstream nodes

### Output Format
**Field**: `output_format` (string)
**UI**: Dropdown select
**Options**:
- `text` - Plain Text (default)
- `json` - JSON Object
- `json_schema` - JSON with Schema (shows additional schema field)

### Output JSON Schema (Conditional)
**Field**: `output_json_schema` (string)
**UI**: Multi-line textarea (only shown when Output Format is "JSON with Schema")
**Purpose**: JSON schema to validate and structure the model's JSON output

**Example**:
```json
{
  "type": "object",
  "properties": {
    "answer": {"type": "string"},
    "confidence": {"type": "number"},
    "references": {
      "type": "array",
      "items": {"type": "string"}
    }
  },
  "required": ["answer", "confidence"]
}
```

## Implementation Details

### File Location
`src/admin/pages/admin/WorkflowEditor.jsx` (lines 466-697)

### Data Flow

1. **Load**: Node configuration is loaded from `mira_workflow_nodes.config` JSONB column
2. **Edit**: Changes update React Flow node state immediately via `setNodes()`
3. **Save**: Save button calls `handleSaveWorkflow()` which persists config back to database

### Database Storage

All fields are stored in the `config` JSONB column:
```sql
UPDATE mira_workflow_nodes
SET config = jsonb_set(config, '{system_prompt}', '"new value"')
WHERE id = 'node-uuid';
```

### Graph Execution

The graph executor (`supabase/functions/_shared/graph-executor.ts`) reads these fields:
- `node.config.system_prompt` - Used as system message
- `node.config.prompt_template` - Interpolated with workflow state
- `node.config.model` - Passed to OpenAI API
- `node.config.temperature` - Controls sampling
- `node.config.max_tokens` - Limits response length
- `node.config.output_variable` - Determines where to store result
- `node.config.output_format` - Controls response parsing
- `node.config.output_json_schema` - Used for structured output validation

## Bug Fixes Applied

### Issue: Nodes Not Rendering
**Problem**: Workflow data loaded successfully but nodes didn't appear on canvas

**Root Causes**:
1. React Query v5 deprecated `onSuccess` callback
2. Field name mismatches: API returns `position_x`/`position_y`, code expected `position`
3. Field name mismatches: API returns `source_node_id`/`target_node_id`, code used `source_id`/`target_id`

**Fix** (WorkflowEditor.jsx:235-268):
- Replaced `onSuccess` with `useEffect` hook
- Fixed position mapping: `position: { x: n.position_x || 0, y: n.position_y || 0 }`
- Added node label: `data: { label: n.name, ...n.config }`
- Fixed edge field names: `source: e.source_node_id, target: e.target_node_id`

### Issue: Config Panel Not Showing for LLM Nodes
**Problem**: Configuration panel only showed for "agent" type, but database uses "llm" type

**Fix** (WorkflowEditor.jsx:466):
```javascript
// Before
{selectedNode.type === "agent" && (

// After
{(selectedNode.type === "agent" || selectedNode.type === "llm") && (
```

## Usage Example

1. Navigate to Agent Builder → Workflows
2. Open an existing workflow (e.g., "ka_reg_01_regulatory_qa")
3. Click on an agent/llm node on the canvas
4. Configuration panel appears on the right
5. Edit any fields (System Prompt, Model, Temperature, etc.)
6. Click "Save" to persist changes to database
7. Graph executor will use new configuration on next execution
