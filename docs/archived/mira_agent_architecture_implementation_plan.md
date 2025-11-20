# Mira Agent System – Implementation Plan (with Scalability, Examples, and Front-End Action Protocol)

## 0. Scope & Goals

**Goal:**
Build a backend that powers Mira as a **multi-agent AI assistant** for the ePOS system:

- Support **"Master Brain + Skill Agents"** pattern.
- Model conversations as **topics → sub topics → sub-sub topics**.
- Route each user message to the most suitable **skill agent** with a **confidence score**.
- Agents correspond to your main modules:

1. Customer
2. New Business
3. Visualizer
4. Product
5. Analytics
6. To-Do
7. Broadcast

### 0.1 Implementation Mapping

This architecture will be implemented using **Supabase Edge Functions** (agent-chat), **Deno runtime**, and **React front-end** (AdvisorHub). Key mappings:

- **Intent Router** → `supabase/functions/_shared/services/router/intent-router.ts`
- **Skill Agents** → `supabase/functions/_shared/services/agents/*.ts`
- **UI Action Executor** → `src/lib/mira/action-executor.ts`
- **Context Provider** → `src/admin/state/MiraContextProvider.tsx`
- **Topic Taxonomy** → `docs/mira_topics.json` + `mira_topics` / `mira_intents` tables

This mapping ensures clear ownership of components and enables distributed development across backend and frontend teams.

---

## Phase 1 – Agent Architecture (Master Brain + Runtime)

### 1.1 Define Topic Taxonomy

Mira's brain is organized into **topics, subtopics, and intents**, which together form her "knowledge map."

**Example:**
```json
{
  "analytics": {
    "subtopics": {
      "personal_performance": {
        "intents": [
          "view_ytd_progress",
          "view_monthly_trend",
          "compare_to_team_average"
        ]
      },
      "conversion_funnel": {
        "intents": [
          "view_stage_counts",
          "identify_drop_off_stage"
        ]
      }
    }
  },
  "product": {
    "subtopics": {
      "search_product": {
        "intents": [
          "list_by_category",
          "list_by_keyword",
          "show_product_details"
        ]
      }
    }
  }
}
```

**Example in Use:**
- User: "分析我的销售数据" → topic=`analytics`, subtopic=`personal_performance`, intent=`view_ytd_progress`
- User: "列出所有人寿保险产品" → topic=`product`, subtopic=`search_product`, intent=`list_by_category`

**Deliverable:** `mira_topics.json` – Mira's canonical brain map.

---

### 1.2 Data Model & Storage

Mira's configuration is **data-driven**, not hard-coded. Each agent, workflow, and conversation lives in the database.

**Deliverables:**
- DB migration scripts
- ORM models for Agent, Workflow, WorkflowNode, Conversation

---

### 1.3 Core Runtime Components

| Component | Function | Example |
|------------|-----------|----------|
| **LLMClient** | Unified interface for GPT/Claude models | Handles `prompt + schema` calls |
| **RAGService** | Retrieves contextual documents | Pulls product info or claim history |
| **ToolRegistry** | Maps API tools | `analytics.summary()`, `proposals.list()` |
| **AgentRuntime** | Executes agent logic | Runs `AnalyticsAgent` prompt, merges RAG & tools |
| **WorkflowRunner** | Runs workflow graph | Executes nodes like `Agent → Tool → End` |

---

### 1.4 Intent Router (Master Brain)

The Master Brain interprets **what** the user means and **which agent** should respond.

**Confidence Scoring:**
The router assigns a **confidence score** (0.0 – 1.0) to each intent candidate, based on:
- Semantic similarity to user input
- Context boosting (higher score if intent matches current module/page)
- Historical success rate

**Routing Thresholds:**
- **≥ 0.7** → Route to selected agent immediately
- **0.4 – 0.7** → Ask clarifying question before routing
- **< 0.4** → Re-ask or suggest alternative intents

**Example:**
```json
{
  "topic": "new_business",
  "subtopic": "underwriting_status",
  "intent": "list_uw_in_progress",
  "candidate_agents": [
    {"agent_id": "NewBusinessAgent", "score": 0.88},
    {"agent_id": "AnalyticsAgent", "score": 0.14}
  ],
  "should_switch_topic": true
}
```

In this example, `NewBusinessAgent` has a high confidence score (0.88), so the router immediately selects it. If the top score were 0.65, Mira would first confirm: "Did you want to check underwriting status or view analytics?"

---

### 1.5 Conversation State & Topic Switching

Mira keeps memory of conversation context and can switch dynamically.

**Example:**
```
Advisor: 分析我的销售数据。
Mira: 你目前达成了年度目标的45%。要我显示详细转化率吗？
Advisor: 好的，也帮我列出与这些客户相关的任务。
→ Mira switches topic from analytics → to-do
```

---

## Phase 2 – Skill Agent Implementation

Each **Skill Agent** aligns to an ePOS module. Example: `CustomerAgent`, `NewBusinessAgent`, `AnalyticsAgent`, etc.

**Example Usage:**
> "列出所有人寿保险产品。"
```
Mira: 以下是系统中所有人寿保险产品。
UI Directive → { module: 'product', filter: 'life_insurance' }
```

---

## Phase 3 – Evaluation & Tuning

- Log each router decision, tool call, and agent output.
- Add `/why` command → shows which agent handled the last message.
- Track misclassification → update taxonomy or agent prompt.

---

## Phase 4 – Visual Agent Builder (Future)

Later, create a drag-and-drop workflow editor for internal users.
- Node types: Agent, If/Else, Tool, End.
- Editable system prompts.
- Test messages inline.

---

## Phase 5 – Scalability & Extensibility

### Adding New Module Example: "Servicing"

If the company introduces a **Servicing** module to handle claims:
```json
"servicing": {
  "subtopics": {
    "claim_submission": { "intents": ["start_claim", "upload_documents"] },
    "claim_tracking": { "intents": ["check_claim_status"] }
  }
}
```
1. Create `ServicingAgent` in `agents` table.
2. Add tools: `claims.submit()`, `claims.track()`.
3. Router auto-detects new topic.

**Example Conversation:**
> "帮客户提交理赔申请。"
→ Mira: "请提供客户姓名及保单号，我将为您启动理赔流程。"
→ UI Directive → { module: 'servicing', view: 'claim_form' }

---

### Modifying Subtopics (e.g. Mandatory CKA)

**Scenario:** Fact Finding now requires Customer Knowledge Assessment.
```json
"cka_questionnaire": { "mandatory": true }
```
Workflow:
```json
{
  "type": "if_else",
  "condition": "has_completed_cka == true",
  "on_true": "node_proceed_to_planning",
  "on_false": "node_launch_CKAHelper"
}
```
**Example:**
> "开始新财务规划。" → Mira: "在进行财务规划前，请先完成客户知识测验。"

---

## Phase 6 – Front-End Integration & Unified Action Protocol

### 🎯 Objective
To create a **standard communication contract** between Mira Agents and the ePOS Front-End, enabling real-time, multi-step UI and backend actions.

### 6.1 Message Structure with Metadata

Each Mira response includes **metadata** for logging, telemetry, and front-end insight tracking:

```json
{
  "assistant_reply": "Sure, please confirm to save the following details.",
  "ui_actions": [
    {
      "action": "navigate",
      "module": "customer",
      "page": "/customer",
      "popup": "new_lead_form"
    },
    {
      "action": "frontend_prefill",
      "payload": {
        "name": "Kim",
        "phone_number": "12345678"
      }
    }
  ],
  "metadata": {
    "topic": "customer",
    "subtopic": "lead_management",
    "intent": "create_lead",
    "confidence": 0.95,
    "agent": "CustomerAgent"
  }
}
```

**Benefits of Metadata:**
- **Logging:** Track which agent and intent handled each request
- **Telemetry:** Measure intent classification accuracy and confidence distribution
- **Front-End Insights:** Display confidence indicator when score < 0.8
- **Debugging:** Enable `/why` command to show routing decisions
- **Analytics:** Aggregate agent usage and intent popularity

### 6.2 Supported Action Types
| Action | Purpose | Example |
|---------|----------|----------|
| **navigate** | Switch route or open component | Open `/customer` page with popup form |
| **frontend_prefill** | Prefill or update UI fields | Autofill name and phone number |
| **execute** | Run backend API call after confirmation | Submit customer data to API |

### 6.3 Full Example – "Add Customer" Flow

**User:** "帮我新增客户, name Kim, phone number 12345678"

```json
{
  "assistant_reply": "Sure, please confirm to save the following details.",
  "ui_actions": [
    {
      "action": "navigate",
      "module": "customer",
      "page": "/customer",
      "popup": "new_lead_form"
    },
    {
      "action": "frontend_prefill",
      "payload": { "name": "Kim", "phone_number": "12345678" }
    }
  ],
  "metadata": {
    "topic": "customer",
    "subtopic": "lead_management",
    "intent": "create_lead",
    "confidence": 0.95,
    "agent": "CustomerAgent"
  }
}
```

**User:** "Confirm"
```json
{
  "assistant_reply": "Got it, creating the new customer record now.",
  "ui_actions": [
    {
      "action": "execute",
      "api_call": {
        "method": "POST",
        "endpoint": "/customers/create",
        "payload": { "name": "Kim", "phone_number": "12345678" }
      }
    }
  ],
  "metadata": {
    "topic": "customer",
    "subtopic": "lead_management",
    "intent": "create_lead",
    "confidence": 0.95,
    "agent": "CustomerAgent"
  }
}
```

### 6.4 Combined JSON Schema
```json
{
  "assistant_reply": "string",
  "ui_actions": [
    {
      "action": "navigate" | "frontend_prefill" | "execute",
      "module": "string?",
      "page": "string?",
      "popup": "string?",
      "payload": "object?",
      "api_call": {
        "method": "GET" | "POST" | "PUT" | "DELETE",
        "endpoint": "string",
        "payload": "object?"
      }
    }
  ],
  "metadata": {
    "topic": "string",
    "subtopic": "string",
    "intent": "string",
    "confidence": 0.0,
    "agent": "string"
  }
}
```

### 6.5 FE Behavior Example
```typescript
response.ui_actions.forEach(action => {
  switch (action.action) {
    case "navigate":
      router.navigate(action.page);
      if (action.popup) openModal(action.popup);
      break;
    case "frontend_prefill":
      prefillForm(action.payload);
      break;
    case "execute":
      axios({ method: action.api_call.method, url: action.api_call.endpoint, data: action.api_call.payload })
        .then(() => showToast("Action completed successfully"));
      break;
  }
});

// Log metadata for telemetry
logMiraEvent({
  agent: response.metadata.agent,
  intent: response.metadata.intent,
  confidence: response.metadata.confidence,
  actionsExecuted: response.ui_actions.length
});
```

### 6.6 Advantages
| Benefit | Description |
|----------|-------------|
| **Composability** | One response can trigger multi-step UI flows. |
| **Transparency** | FE executes only safe declared actions. |
| **Reusability** | Works across Chat, Web, Mobile. |
| **Auditability** | Logs each executed UI action. |

---

## Phase 7 – UI Modes & Container

### 🎯 Objective
Provide **three distinct interaction modes** that use the same API and `ui_actions` schema, but differ in presentation and user experience.

### 7.1 The Three Modes

#### **Command Mode** – Full Chat Interface
- **Description:** Fullscreen or split-screen chat window (ChatMira page)
- **Use Case:** When advisors need to have a conversation or execute complex multi-step tasks
- **Features:**
  - Full message history
  - Typing indicators and streaming responses
  - Inline confirmations for `execute` actions
  - Access to all modules via natural language
- **Trigger:** User clicks floating Mira button, presses `Ctrl/Cmd + K`, or navigates to `/chat`

**Example:**
```
Advisor: "Show me my top 5 leads this month"
Mira: [Displays lead list with navigate action to /customer]
```

#### **Co-Pilot Mode** – Inline Suggestion Panel
- **Description:** Docked panel (right or bottom) showing context-aware suggestions
- **Use Case:** Proactive assistance while advisors work on specific module pages
- **Features:**
  - Auto-generated suggestions based on current page/module
  - One-click action execution
  - Minimal screen real estate (280-320px sidebar)
  - Updates when page context changes
- **Trigger:** Automatically appears when on module pages; can be toggled on/off

**Example:**
```
[Advisor is on Customer Detail page for "Kim"]
Co-Pilot Suggestions:
→ "Schedule follow-up meeting"
→ "Update contact information"
→ "Create new proposal for Kim"
```

#### **Insight Mode** – Ambient Insight Feed
- **Description:** Collapsible sidebar showing proactive insights and alerts
- **Use Case:** Ambient awareness of important events, tasks, and opportunities
- **Features:**
  - Auto-refresh every 5 minutes
  - Proactive insights: overdue tasks, hot leads, performance alerts
  - Click to navigate or execute related actions
  - Dismissible cards with priority indicators
- **Trigger:** Always available; expands/collapses via toggle button

**Example:**
```
Insight Feed:
[!] 3 overdue tasks – Click to view
[★] New hot lead: "John Tan" – Click to contact
[↑] YTD performance at 45% – View details
```

### 7.2 Mode Switching & State Management

All three modes:
- **Share the same backend API** (`POST /agent-chat` with context)
- **Use the same `ui_actions` schema** for action execution
- **Maintain conversation history** across mode switches
- **Respect user preferences** (saved in localStorage or user profile)

**Mode State Machine:**
```
Hidden → Command (user opens) → Co-pilot (auto-minimize after action) → Insight (toggle)
```

**Front-End Implementation:**
- `src/admin/state/miraModeMachine.ts` – XState machine for mode transitions
- `src/admin/pages/ChatMira.jsx` – Command mode component
- `src/admin/components/MiraCopilot/InlineSuggestionPanel.tsx` – Co-pilot mode
- `src/admin/components/MiraInsight/InsightSidebar.tsx` – Insight mode

### 7.3 Mode-Specific API Calls

Each mode calls the same endpoint with a different `mode` parameter:

**Command Mode:**
```typescript
POST /agent-chat
{
  "messages": [...],
  "mode": "stream", // or "batch"
  "context": { module: "customer", page: "/customer/detail", pageData: { customerId: "123" } }
}
```

**Co-pilot Mode:**
```typescript
POST /agent-chat
{
  "mode": "suggest",
  "context": { module: "customer", page: "/customer/detail", pageData: { customerId: "123" } }
}
// Returns array of suggested intents with ui_actions
```

**Insight Mode:**
```typescript
POST /agent-chat
{
  "mode": "insights",
  "context": { advisorId: "456" }
}
// Returns array of proactive insights (overdue tasks, hot leads, alerts)
```

### 7.4 Advantages

| Benefit | Description |
|---------|-------------|
| **Unified Backend** | One API serves all three modes, reducing code duplication |
| **Consistent UX** | Same action protocol ensures predictable behavior |
| **User Choice** | Advisors can choose their preferred interaction style |
| **Context Continuity** | Switching modes preserves conversation and context |
| **Scalability** | Easy to add new modes (e.g., "Voice Mode") in the future |

---

**In summary:** Mira's unified action protocol makes AI output fully operational and safe for real-time integration with your ePOS UI, bridging intelligent conversation with system execution. The three UI modes (Command, Co-pilot, Insight) provide flexibility in how advisors interact with Mira while maintaining a consistent backend contract.
