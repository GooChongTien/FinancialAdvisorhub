# Mira Co-Pilot Implementation Plan
**Vision:** Transform Mira from a chat assistant into an intelligent co-pilot that works alongside advisors
**Status:** Planning → Execution
**Last Updated:** 2025-11-11

---

## 🎯 Vision & Gap Analysis

### Current State (Problems)
❌ **Chat-centric architecture** - Mira is primarily a chat window, not integrated into the workflow
❌ **Skill-based instead of intent-based** - Uses namespaced skills (kb__, fna__, ops__) instead of confidence-scored intents
❌ **No UI action protocol** - Missing standardized navigate → prefill → execute flows
❌ **Disconnected from modules** - Not aligned with ePOS modules (Customer, New Business, Product, Analytics, To-Do, Broadcast)
❌ **Limited co-pilot functionality** - Can't proactively suggest actions based on context
❌ **Missing adaptive modes** - Has split-screen but not full Command/Co-pilot/Insight modes

### Target State (Co-Pilot Vision)
✅ **Context-aware assistant** - Knows what page/module advisor is on, what data they're viewing
✅ **Intent-driven** - Master Brain routes to module-specific agents with confidence scoring
✅ **Action execution** - Can navigate, prefill forms, and execute backend operations with confirmation
✅ **Module alignment** - Seven skill agents aligned to modules: Customer, New Business, Visualizer, Product, Analytics, To-Do, Broadcast
✅ **Proactive suggestions** - Co-pilot mode shows next-best-actions based on context
✅ **Three interaction modes** - Command (chat), Co-pilot (inline suggestions), Insight (ambient feed)

### What We Can Reuse
✅ Supabase Edge Function infrastructure (`agent-chat`)
✅ Frontend chat components (`useAgentChat`, `ChatInput`, `ChatMessage`)
✅ State machine patterns (`miraCommandMachine.js`)
✅ Knowledge tables (`knowledge_atoms`, `knowledge_sources`)
✅ Telemetry tables (`mira_events`, `mira_kpi_flags`)

### What Must Be Rebuilt
🔄 **Router logic** - From skill-based to intent-based with confidence scoring
🔄 **Agent architecture** - From generic agents to module-specific skill agents
🔄 **UI integration** - From chat-only to embedded co-pilot with action protocol
🔄 **Context system** - Add page/module awareness and data context extraction

---

## 📐 System Architecture (Target)

```
┌─────────────────────────────────────────────────────────────┐
│                      AdvisorHub Frontend                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Mira Co-Pilot Container                   │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   Command    │  │   Co-pilot   │  │   Insight    │ │ │
│  │  │     Mode     │  │     Mode     │  │     Mode     │ │ │
│  │  │ (Fullscreen  │  │   (Inline    │  │  (Sidebar    │ │ │
│  │  │    Chat)     │  │ Suggestions) │  │    Feed)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                                          │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │           UI Action Executor                      │ │ │
│  │  │  - navigate(page, params)                         │ │ │
│  │  │  - prefillForm(payload)                           │ │ │
│  │  │  - executeBackend(api_call)                       │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │           Context Provider                        │ │ │
│  │  │  - currentModule (customer|new_business|...)      │ │ │
│  │  │  - currentPage (/customer/detail)                 │ │ │
│  │  │  - pageData (customer ID, proposal ID, etc.)      │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                Module Pages                            │ │
│  │  Customer | New Business | Product | Analytics |...   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕ SSE/JSON
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function (agent-chat)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Intent Router                        │ │
│  │                   (Master Brain)                       │ │
│  │  - Parse user input + context                          │ │
│  │  - Score intents across all modules                    │ │
│  │  - Select best skill agent (confidence > 0.7)          │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Skill Agent Registry                      │ │
│  │  ┌──────────────┬──────────────┬──────────────┐       │ │
│  │  │  Customer    │ NewBusiness  │   Product    │       │ │
│  │  │    Agent     │    Agent     │    Agent     │       │ │
│  │  └──────────────┴──────────────┴──────────────┘       │ │
│  │  ┌──────────────┬──────────────┬──────────────┐       │ │
│  │  │  Analytics   │    ToDo      │  Broadcast   │       │ │
│  │  │    Agent     │    Agent     │    Agent     │       │ │
│  │  └──────────────┴──────────────┴──────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                AI Provider Adapters                    │ │
│  │  OpenAI → Anthropic → Custom REST (with fallback)     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  - mira_topics (topic taxonomy)                             │
│  - mira_intents (intent definitions)                        │
│  - mira_conversations (chat history with context)           │
│  - knowledge_atoms, knowledge_sources                       │
│  - mira_events (telemetry)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Topic Taxonomy & Intent System

### Topic → Subtopic → Intent Hierarchy

```json
{
  "customer": {
    "subtopics": {
      "lead_management": {
        "intents": [
          "list_leads",
          "search_lead",
          "create_lead",
          "enrich_lead",
          "update_lead_status",
          "view_lead_detail"
        ]
      },
      "customer_profile": {
        "intents": [
          "view_customer_detail",
          "update_customer_info",
          "view_customer_policies"
        ]
      }
    }
  },
  "new_business": {
    "subtopics": {
      "proposal_creation": {
        "intents": [
          "start_new_proposal",
          "generate_quote",
          "compare_products",
          "save_proposal"
        ]
      },
      "underwriting": {
        "intents": [
          "list_pending_uw",
          "check_uw_status",
          "submit_for_uw"
        ]
      }
    }
  },
  "product": {
    "subtopics": {
      "search": {
        "intents": [
          "list_by_category",
          "search_by_keyword",
          "view_product_detail",
          "compare_products"
        ]
      }
    }
  },
  "analytics": {
    "subtopics": {
      "personal_performance": {
        "intents": [
          "view_ytd_progress",
          "view_monthly_trend",
          "compare_to_team"
        ]
      },
      "conversion_funnel": {
        "intents": [
          "view_stage_counts",
          "identify_drop_off"
        ]
      }
    }
  },
  "todo": {
    "subtopics": {
      "task_management": {
        "intents": [
          "list_tasks",
          "create_task",
          "mark_complete",
          "view_calendar"
        ]
      }
    }
  },
  "broadcast": {
    "subtopics": {
      "message_campaigns": {
        "intents": [
          "list_campaigns",
          "create_broadcast",
          "view_campaign_stats"
        ]
      }
    }
  }
}
```

---

## 🔄 UI Action Protocol

### Standard Response Format

Every Mira response follows this structure:

```typescript
interface MiraResponse {
  assistant_reply: string;           // What Mira says to the user
  ui_actions: UIAction[];            // Array of actions to execute
  metadata: {
    topic: string;                   // e.g., "customer"
    subtopic: string;                // e.g., "lead_management"
    intent: string;                  // e.g., "create_lead"
    confidence: number;              // 0.0 - 1.0
    agent: string;                   // e.g., "CustomerAgent"
  };
}

interface UIAction {
  action: 'navigate' | 'frontend_prefill' | 'execute';
  module?: string;                   // Target module
  page?: string;                     // Target page/route
  popup?: string;                    // Popup/modal to open
  payload?: Record<string, any>;     // Data to prefill or submit
  api_call?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    payload?: Record<string, any>;
  };
  confirm_required?: boolean;        // Does user need to confirm?
}
```

### Example Flows

#### Example 1: Create New Lead
**User:** "帮我新增客户, name Kim, phone number 12345678"

**Mira Response:**
```json
{
  "assistant_reply": "Sure, I'll help you create a new lead for Kim. Please confirm the details below.",
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
        "contact_number": "12345678"
      },
      "confirm_required": true
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

**Mira Response:**
```json
{
  "assistant_reply": "Creating the lead record for Kim now...",
  "ui_actions": [
    {
      "action": "execute",
      "api_call": {
        "method": "POST",
        "endpoint": "/api/leads",
        "payload": {
          "name": "Kim",
          "contact_number": "12345678",
          "lead_source": "Direct Entry"
        }
      }
    }
  ]
}
```

#### Example 2: View Analytics
**User:** "Show me my sales performance this month"

**Mira Response:**
```json
{
  "assistant_reply": "Let me pull up your monthly sales dashboard.",
  "ui_actions": [
    {
      "action": "navigate",
      "module": "analytics",
      "page": "/analytics",
      "payload": {
        "view": "monthly_performance",
        "period": "current_month"
      }
    }
  ],
  "metadata": {
    "topic": "analytics",
    "subtopic": "personal_performance",
    "intent": "view_monthly_trend",
    "confidence": 0.92,
    "agent": "AnalyticsAgent"
  }
}
```

---

## 📋 Implementation Phases

### Phase 0: Foundation & Data Model (Week 1)
**Goal:** Establish topic taxonomy, intent system, and database schema

#### Tasks
- [x] Read current implementation docs
- [x] Analyze gap between current and target architecture
- [ ] **Define complete topic taxonomy** (`docs/mira_topics.json`)
  - [ ] Customer module: all subtopics and intents
  - [ ] New Business module: all subtopics and intents
  - [ ] Product module: all subtopics and intents
  - [ ] Analytics module: all subtopics and intents
  - [ ] To-Do module: all subtopics and intents
  - [ ] Broadcast module: all subtopics and intents
  - [ ] Visualizer module: all subtopics and intents
- [ ] **Database migrations**
  - [ ] Create `mira_topics` table (topic, subtopic, description)
  - [ ] Create `mira_intents` table (intent_id, topic, subtopic, intent_name, required_fields, example_phrases)
  - [ ] Create `mira_agent_configs` table (agent_id, module, system_prompt, tools)
  - [ ] Update `mira_conversations` table (add context_module, context_page, context_data)
  - [ ] Create `mira_intent_logs` table (intent_id, confidence, selected_agent, success)
- [ ] **TypeScript types**
  - [ ] `src/lib/mira/types.ts` - MiraResponse, UIAction, IntentMetadata
  - [ ] `src/lib/mira/intent-catalog.ts` - Intent definitions with schemas
- [ ] **Documentation**
  - [ ] Complete this implementation plan
  - [ ] Create `MIRA_COPILOT_USER_GUIDE.md`

**Deliverables:**
- ✅ Topic taxonomy JSON with all 7 modules
- ✅ Database schema with migrations
- ✅ TypeScript type definitions
- ✅ Updated documentation

**Success Criteria:**
- All module intents documented with example phrases
- Database schema supports intent routing and logging
- Team alignment on approach

---

### Phase 1: Backend - Intent Router (Master Brain) (Week 2)
**Goal:** Build intent classification system that routes to skill agents

#### Tasks
- [ ] **Intent Router implementation**
  - [ ] Create `supabase/functions/_shared/services/router/intent-router.ts`
    - [ ] `classifyIntent(userMessage, context)` → returns scored intents
    - [ ] Use LLM with structured output (JSON mode) for classification
    - [ ] Include current module/page as context for disambiguation
  - [ ] Create `supabase/functions/_shared/services/router/confidence-scorer.ts`
    - [ ] Score each intent candidate (0.0 - 1.0)
    - [ ] Apply context boosting (higher score if matches current module)
    - [ ] Implement minimum threshold (default 0.7)
- [ ] **Topic switching logic**
  - [ ] Detect when user switches topics mid-conversation
  - [ ] Track conversation topic history in session
  - [ ] Generate natural topic transition messages
- [ ] **Update agent-chat endpoint**
  - [ ] Accept `context` parameter: `{ module, page, pageData }`
  - [ ] Route through IntentRouter before agent selection
  - [ ] Return intent metadata in response
- [ ] **Testing**
  - [ ] Unit tests: intent classification accuracy (>=90% for top intents)
  - [ ] Integration tests: router selects correct agent given context
  - [ ] Smoke tests: end-to-end intent → agent → response

**Deliverables:**
- ✅ Intent router with confidence scoring
- ✅ Context-aware classification
- ✅ Updated agent-chat endpoint
- ✅ Test coverage >= 80%

**Success Criteria:**
- Intent classification accuracy >= 90% for top 20 intents
- Confidence scoring properly disambiguates ambiguous queries
- Topic switching works smoothly in conversation

---

### Phase 2: Backend - Skill Agents (Module-Specific) (Week 3-4)
**Goal:** Implement 7 skill agents aligned to ePOS modules

#### Tasks
- [ ] **Agent architecture**
  - [ ] Create base `SkillAgent` class
    - [ ] `constructor(agentId, module, systemPrompt, tools)`
    - [ ] `execute(intent, context)` → returns MiraResponse
    - [ ] `getTools()` → returns available tools for this agent
  - [ ] Create agent registry `supabase/functions/_shared/services/agents/registry.ts`
    - [ ] `getAgentByModule(module)` → returns SkillAgent instance
    - [ ] `getAllAgents()` → returns all 7 agents
- [ ] **Implement 7 skill agents**
  - [ ] **CustomerAgent** (`customer-agent.ts`)
    - [ ] System prompt: customer/lead management specialist
    - [ ] Tools: `leads.list()`, `leads.create()`, `leads.update()`, `customers.get()`
    - [ ] Handles: lead creation, enrichment, status updates, customer lookup
  - [ ] **NewBusinessAgent** (`new-business-agent.ts`)
    - [ ] System prompt: proposal and underwriting specialist
    - [ ] Tools: `proposals.create()`, `quotes.generate()`, `underwriting.submit()`
    - [ ] Handles: new proposals, quote generation, product comparison, UW status
  - [ ] **ProductAgent** (`product-agent.ts`)
    - [ ] System prompt: product catalog expert
    - [ ] Tools: `products.search()`, `products.getDetails()`, `products.compare()`
    - [ ] Handles: product search, filtering, detail lookup, comparison
  - [ ] **AnalyticsAgent** (`analytics-agent.ts`)
    - [ ] System prompt: performance analytics advisor
    - [ ] Tools: `analytics.getPerformance()`, `analytics.getFunnel()`, `analytics.getTeamStats()`
    - [ ] Handles: YTD progress, monthly trends, conversion funnel, team comparison
  - [ ] **ToDoAgent** (`todo-agent.ts`)
    - [ ] System prompt: task and calendar manager
    - [ ] Tools: `tasks.list()`, `tasks.create()`, `tasks.update()`, `calendar.getEvents()`
    - [ ] Handles: task lists, task creation, marking complete, calendar views
  - [ ] **BroadcastAgent** (`broadcast-agent.ts`)
    - [ ] System prompt: campaign and messaging specialist
    - [ ] Tools: `broadcasts.list()`, `broadcasts.create()`, `broadcasts.getStats()`
    - [ ] Handles: campaign creation, broadcast lists, campaign analytics
  - [ ] **VisualizerAgent** (`visualizer-agent.ts`)
    - [ ] System prompt: financial planning and visualization expert
    - [ ] Tools: `visualizer.generatePlan()`, `visualizer.getScenarios()`
    - [ ] Handles: financial planning, scenario modeling, visualization generation
- [ ] **UI Action synthesis**
  - [ ] Each agent must return standardized `MiraResponse` with `ui_actions`
  - [ ] Implement action templates for common flows (create, update, navigate)
  - [ ] Add confirmation logic for destructive actions
- [ ] **Testing**
  - [ ] Unit tests: each agent handles its intents correctly
  - [ ] Integration tests: agents call correct tools with right params
  - [ ] Contract tests: all agents return valid MiraResponse structure

**Deliverables:**
- ✅ 7 fully implemented skill agents
- ✅ Agent registry with dynamic loading
- ✅ Standardized UI action responses
- ✅ Test coverage >= 85%

**Success Criteria:**
- Each agent handles all intents in its module
- UI actions are properly formatted and executable
- Tools are mocked but have correct signatures for future implementation

---

### Phase 3: Frontend - Context Provider & Action Executor (Week 5)
**Goal:** Build frontend infrastructure to track context and execute UI actions

#### Tasks
- [ ] **Context Provider**
  - [ ] Create `src/admin/state/MiraContextProvider.tsx`
    - [ ] Track current module (customer|new_business|product|analytics|todo|broadcast)
    - [ ] Track current page (/customer/detail, /analytics, etc.)
    - [ ] Track page data (customer ID, lead ID, proposal ID, etc.)
    - [ ] Expose `useMiraContext()` hook
  - [ ] Integrate with router
    - [ ] Update route changes to set context.module and context.page
    - [ ] Extract page data from URL params and component state
  - [ ] Integrate with page components
    - [ ] Each page component reports its module and data context
- [ ] **UI Action Executor**
  - [ ] Create `src/lib/mira/action-executor.ts`
    - [ ] `executeActions(actions: UIAction[])` → executes array of actions in sequence
    - [ ] `navigate(action)` → uses router to navigate + opens popups
    - [ ] `prefillForm(action)` → populates form fields with payload
    - [ ] `executeBackend(action)` → calls API with confirmation dialog
  - [ ] Create confirmation dialogs
    - [ ] `<MiraConfirmationDialog>` for execute actions
    - [ ] Show action details, payload, and confirm/cancel buttons
  - [ ] Add action logging
    - [ ] Log each executed action to `mira_events` table
    - [ ] Track success/failure and user confirmations
- [ ] **Testing**
  - [ ] Unit tests: context provider tracks state correctly
  - [ ] Integration tests: action executor navigates and prefills correctly
  - [ ] E2E tests: full flow from intent → actions → execution

**Deliverables:**
- ✅ MiraContextProvider with hooks
- ✅ UIActionExecutor with all action types
- ✅ Confirmation dialogs
- ✅ Test coverage >= 80%

**Success Criteria:**
- Context automatically updates when navigating between pages
- All three action types (navigate, prefill, execute) work correctly
- User confirmation required for backend mutations

---

### Phase 4: Frontend - Adaptive UI Modes (Week 6-7)
**Goal:** Implement Command, Co-pilot, and Insight modes

#### Tasks
- [ ] **Mode state management**
  - [ ] Create `src/admin/state/miraModeMachine.ts` (XState)
    - [ ] States: `command`, `copilot`, `insight`, `hidden`
    - [ ] Transitions: user toggle, auto-switch on intent detection
    - [ ] Persist mode preference in localStorage
  - [ ] Create `useMiraMode()` hook
- [ ] **Command Mode (Fullscreen Chat)**
  - [ ] Update `src/admin/pages/ChatMira.jsx`
    - [ ] Full viewport chat interface
    - [ ] Send context with every message
    - [ ] Execute UI actions from responses
    - [ ] Show intent metadata (topic, confidence, agent)
  - [ ] Keyboard shortcut: `Ctrl/Cmd + K` to open
  - [ ] ESC to close or switch to copilot mode
- [ ] **Co-pilot Mode (Inline Suggestions)**
  - [ ] Create `src/admin/components/MiraCopilot/InlineSuggestionPanel.tsx`
    - [ ] Docked to right side or bottom of screen (configurable)
    - [ ] Shows context-aware suggestions based on current page
    - [ ] Example: On customer detail page → "Update contact info", "Schedule follow-up"
    - [ ] Click suggestion → sends as command → executes actions
  - [ ] Create `src/admin/components/MiraCopilot/ActionCard.tsx`
    - [ ] Display suggested action with icon, title, description
    - [ ] One-click execution
  - [ ] Auto-suggestions API
    - [ ] Endpoint: `POST /agent-chat` with mode=`suggest`, context=current page
    - [ ] Returns top 3-5 relevant intents for current context
    - [ ] Refresh on page navigation
- [ ] **Insight Mode (Ambient Feed)**
  - [ ] Create `src/admin/components/MiraInsight/InsightSidebar.tsx`
    - [ ] Collapsible sidebar (280-320px)
    - [ ] Shows ambient insights: overdue tasks, top leads, performance alerts
    - [ ] Auto-refresh every 5 minutes
  - [ ] Create `src/admin/components/MiraInsight/InsightCard.tsx`
    - [ ] Card showing insight type, summary, CTA
    - [ ] Click to navigate to relevant page or execute action
  - [ ] Insights API
    - [ ] Endpoint: `POST /agent-chat` with mode=`insights`
    - [ ] Returns array of proactive insights based on advisor data
    - [ ] Examples: "3 overdue tasks", "New hot lead: Kim", "YTD at 45%"
- [ ] **Mode transitions**
  - [ ] Smooth animations (300ms) between modes
  - [ ] Preserve chat history across modes
  - [ ] Auto-switch: command → copilot when action executed
- [ ] **Responsive design**
  - [ ] Desktop (>=1280px): All three modes available
  - [ ] Tablet (768-1279px): Command + Copilot (stacked)
  - [ ] Mobile (<768px): Command only (fullscreen)
- [ ] **Testing**
  - [ ] Visual regression tests: mode transitions
  - [ ] Integration tests: suggestions update on context change
  - [ ] E2E tests: complete user flows in each mode

**Deliverables:**
- ✅ Three fully functional modes
- ✅ Smooth mode transitions
- ✅ Auto-suggestions in co-pilot mode
- ✅ Proactive insights in insight mode
- ✅ Responsive layouts

**Success Criteria:**
- Advisors can switch between modes seamlessly
- Co-pilot suggestions are contextually relevant (>70% click-through)
- Insight feed updates automatically and is actionable
- All modes work on desktop, tablet, and mobile

---

### Phase 5: Backend - Tool Implementation (Week 8)
**Goal:** Connect skill agents to real Supabase data and APIs

#### Tasks
- [ ] **Tool registry**
  - [ ] Create `supabase/functions/_shared/services/tools/registry.ts`
    - [ ] `registerTool(name, handler)` → adds tool to registry
    - [ ] `executeTool(name, params)` → executes tool handler
    - [ ] Type-safe tool schemas with Zod
- [ ] **Customer tools**
  - [ ] `leads.list(filters)` → queries `leads` table
  - [ ] `leads.create(data)` → inserts into `leads`
  - [ ] `leads.update(id, data)` → updates `leads`
  - [ ] `customers.get(id)` → fetches customer details
- [ ] **New Business tools**
  - [ ] `proposals.create(data)` → inserts into `proposals`
  - [ ] `proposals.list(filters)` → queries `proposals`
  - [ ] `quotes.generate(productId, customerId)` → calls quote engine
  - [ ] `underwriting.submit(proposalId)` → updates status
- [ ] **Product tools**
  - [ ] `products.search(keyword, category)` → queries `products`
  - [ ] `products.getDetails(id)` → fetches product with benefits/riders
  - [ ] `products.compare(ids)` → returns comparison matrix
- [ ] **Analytics tools**
  - [ ] `analytics.getPerformance(advisorId, period)` → aggregates from `policies`, `proposals`
  - [ ] `analytics.getFunnel(period)` → calculates conversion rates
  - [ ] `analytics.getTeamStats()` → team-level aggregation
- [ ] **To-Do tools**
  - [ ] `tasks.list(filters)` → queries `tasks` table
  - [ ] `tasks.create(data)` → inserts into `tasks`
  - [ ] `tasks.update(id, data)` → updates task status
  - [ ] `calendar.getEvents(startDate, endDate)` → filters tasks by date
- [ ] **Broadcast tools**
  - [ ] `broadcasts.list(filters)` → queries `broadcasts` table
  - [ ] `broadcasts.create(data)` → inserts into `broadcasts`
  - [ ] `broadcasts.getStats(id)` → fetches campaign analytics
- [ ] **Error handling**
  - [ ] All tools return standardized `ToolResult { success, data?, error? }`
  - [ ] Graceful degradation when tables/columns missing
  - [ ] Log tool errors to `mira_events`
- [ ] **Testing**
  - [ ] Unit tests: each tool with mocked Supabase client
  - [ ] Integration tests: tools against local Supabase instance
  - [ ] Contract tests: tool schemas match agent expectations

**Deliverables:**
- ✅ Complete tool registry
- ✅ All 7 modules have working tools
- ✅ Error handling and logging
- ✅ Test coverage >= 85%

**Success Criteria:**
- Tools can read and write to Supabase tables
- All CRUD operations work correctly
- Errors are handled gracefully and logged

---

### Phase 6: Integration & Refinement (Week 9)
**Goal:** End-to-end integration, polish, and optimization

#### Tasks
- [ ] **End-to-end flows**
  - [ ] **Flow 1: Create new lead (Customer)**
    - [ ] Command mode: "Add new lead Kim, phone 12345678"
    - [ ] Router classifies → CustomerAgent
    - [ ] Agent returns navigate + prefill actions
    - [ ] Frontend executes: navigates to /customer, opens form, prefills data
    - [ ] User confirms → executes backend POST /api/leads
    - [ ] Success toast + lead appears in list
  - [ ] **Flow 2: View analytics (Analytics)**
    - [ ] Copilot mode: On homepage, suggests "View monthly performance"
    - [ ] User clicks → navigate to /analytics with params
    - [ ] Insight mode: Shows "YTD at 45%" card
  - [ ] **Flow 3: Create task (To-Do)**
    - [ ] Command mode: "Remind me to follow up with Kim tomorrow"
    - [ ] Router classifies → ToDoAgent
    - [ ] Agent creates task with due_date = tomorrow
    - [ ] Shows confirmation → executes → task appears in list
  - [ ] **Flow 4: Product search (Product)**
    - [ ] Copilot mode: On new proposal page, suggests "Compare life insurance products"
    - [ ] User clicks → navigate to /product with filters
    - [ ] Shows comparison table
  - [ ] **Flow 5: Broadcast campaign (Broadcast)**
    - [ ] Command mode: "Create broadcast to all hot leads"
    - [ ] Router classifies → BroadcastAgent
    - [ ] Navigate to /broadcast, prefill audience filter
    - [ ] User confirms → creates campaign
- [ ] **Performance optimization**
  - [ ] Implement response streaming for long LLM responses
  - [ ] Cache intent classifications for repeated queries
  - [ ] Lazy load mode components
  - [ ] Optimize context serialization size
- [ ] **UX polish**
  - [ ] Loading states for all actions
  - [ ] Error messages with retry options
  - [ ] Success animations and toasts
  - [ ] Confidence indicator (show when confidence < 0.8)
  - [ ] Intent debugging panel (dev mode only)
- [ ] **Accessibility**
  - [ ] Keyboard navigation for all modes
  - [ ] ARIA labels and roles
  - [ ] Screen reader compatibility
  - [ ] Focus management
  - [ ] High contrast mode support
- [ ] **Telemetry**
  - [ ] Log all intents with confidence scores
  - [ ] Track action execution success/failure
  - [ ] Monitor mode usage (command vs copilot vs insight)
  - [ ] User satisfaction quick survey (thumbs up/down)
- [ ] **Testing**
  - [ ] Playwright E2E tests for all 5 core flows
  - [ ] Performance tests: response latency < 1.5s p95
  - [ ] Load tests: 50 concurrent advisors
  - [ ] Accessibility audit with axe-core

**Deliverables:**
- ✅ 5 core flows working end-to-end
- ✅ Performance optimizations
- ✅ UX polish and error handling
- ✅ Full accessibility compliance
- ✅ Telemetry and monitoring
- ✅ E2E test suite

**Success Criteria:**
- All core flows execute successfully
- Response latency p95 < 2s
- Accessibility score >= 95 (Lighthouse)
- No critical bugs in E2E tests

---

### Phase 7: Production Readiness (Week 10)
**Goal:** Runbooks, SLAs, rollout strategy, and launch

#### Tasks
- [ ] **Documentation**
  - [ ] Update `MIRA_AGENT_RUNBOOK.md` with new architecture
  - [ ] Create `MIRA_COPILOT_USER_GUIDE.md` for advisors
  - [ ] Document intent catalog with examples
  - [ ] Create video tutorials for each mode
- [ ] **Monitoring & alerts**
  - [ ] Grafana dashboard: intent classification accuracy
  - [ ] Grafana dashboard: action execution success rate
  - [ ] Grafana dashboard: mode usage distribution
  - [ ] Alerts: confidence score < 0.5 spike
  - [ ] Alerts: action execution failure > 5%
  - [ ] Alerts: API latency > 3s
- [ ] **Runbook**
  - [ ] On-call rotation and escalation
  - [ ] Common issues and resolutions
  - [ ] Rollback procedures
  - [ ] Feature flag management
- [ ] **Load testing**
  - [ ] k6 script: 100 concurrent advisors
  - [ ] Target: p95 latency < 2s, error rate < 1%
  - [ ] Run for 30 minutes, capture results
- [ ] **Chaos testing**
  - [ ] Simulate OpenAI outage → verify fallback to Anthropic
  - [ ] Simulate Supabase slow queries → verify timeout handling
  - [ ] Simulate network failures → verify retry logic
- [ ] **Feature flags**
  - [ ] `MIRA_COPILOT_ENABLED` - global on/off
  - [ ] `MIRA_MODE_COMMAND_ENABLED` - command mode toggle
  - [ ] `MIRA_MODE_COPILOT_ENABLED` - copilot mode toggle
  - [ ] `MIRA_MODE_INSIGHT_ENABLED` - insight mode toggle
  - [ ] Per-module flags (e.g., `MIRA_CUSTOMER_AGENT_ENABLED`)
- [ ] **Rollout plan**
  - [ ] **Week 10 Day 1-2:** Internal beta (team only)
  - [ ] **Week 10 Day 3-4:** Limited release (10% of advisors)
  - [ ] **Week 10 Day 5:** Expand to 25% with monitoring
  - [ ] **Week 11 Day 1:** 50% rollout
  - [ ] **Week 11 Day 2-3:** 100% rollout if green
- [ ] **Training**
  - [ ] Record demo videos for each mode
  - [ ] Create interactive tutorial (first-time user onboarding)
  - [ ] Host live training session for advisors
  - [ ] Prepare FAQ document
- [ ] **Launch checklist**
  - [ ] All E2E tests passing
  - [ ] Performance benchmarks met
  - [ ] Dashboards and alerts configured
  - [ ] Runbook reviewed and approved
  - [ ] Training materials published
  - [ ] Feature flags configured
  - [ ] Stakeholder sign-off
  - [ ] Go/No-Go meeting

**Deliverables:**
- ✅ Complete runbook and documentation
- ✅ Monitoring dashboards and alerts
- ✅ Load and chaos test results
- ✅ Rollout plan executed
- ✅ Training materials and sessions
- ✅ Production launch

**Success Criteria:**
- All launch checklist items complete
- Load tests pass with target SLAs
- Stakeholder approval obtained
- Successful rollout without incidents

---

## 📊 Success Metrics

### Primary KPIs
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Intent Classification Accuracy** | N/A | ≥ 90% | % of intents correctly classified (top-1) |
| **Action Execution Success Rate** | N/A | ≥ 95% | % of UI actions that execute without errors |
| **User Satisfaction (NPS)** | N/A | ≥ 40 | Post-interaction survey |
| **Adoption Rate** | N/A | ≥ 60% | % of advisors using Mira weekly within 4 weeks |
| **Task Completion Time** | N/A | -30% | Time to complete common tasks (with vs without Mira) |

### Technical SLAs
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Median Response Latency** | ≤ 1.5s | ≤ 3s |
| **p95 Response Latency** | ≤ 2.5s | ≤ 5s |
| **Availability** | ≥ 99.5% | ≥ 99.0% |
| **Error Rate** | ≤ 1% | ≤ 5% |
| **Intent Confidence (avg)** | ≥ 0.85 | ≥ 0.70 |

### Feature Usage
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Command Mode Usage** | ≥ 40% | % of Mira sessions in command mode |
| **Co-pilot Mode Usage** | ≥ 35% | % of Mira sessions using co-pilot suggestions |
| **Insight Mode Engagement** | ≥ 25% | % of advisors who interact with insight cards weekly |
| **Multi-step Flow Completion** | ≥ 70% | % of multi-action flows completed (not abandoned) |

---

## 🔧 Technology Stack

### Frontend
- **React 18** - UI components
- **XState** - Mode state machine
- **React Router v6** - Navigation
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible primitives
- **Framer Motion** - Animations

### Backend
- **Supabase Edge Functions** - Serverless runtime
- **Deno** - TypeScript runtime
- **Zod** - Schema validation
- **OpenAI SDK** - LLM provider
- **Anthropic SDK** - LLM fallback provider

### Data
- **Supabase Postgres** - Database
- **pgvector** - Vector embeddings (future RAG)

### DevOps
- **GitHub Actions** - CI/CD
- **Playwright** - E2E testing
- **Vitest** - Unit/integration testing
- **k6** - Load testing
- **Grafana** - Monitoring

---

## 🚨 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Intent misclassification** | High | Medium | Comprehensive testing, confidence thresholds, user feedback loop |
| **LLM provider outage** | High | Low | Multi-provider fallback (OpenAI → Anthropic → Custom) |
| **Action execution failures** | High | Medium | Retry logic, error handling, user confirmation for mutations |
| **Performance degradation** | Medium | Medium | Response streaming, caching, lazy loading, load testing |
| **User confusion with modes** | Medium | Medium | Clear UI indicators, onboarding tutorial, contextual help |
| **Scope creep** | Medium | High | Strict phase boundaries, change control board, weekly triage |
| **Data privacy concerns** | High | Low | PII scrubbing, audit logging, no training on user data |

---

## 📁 File Structure

```
src/
  admin/
    components/
      MiraCopilot/
        InlineSuggestionPanel.tsx
        ActionCard.tsx
      MiraInsight/
        InsightSidebar.tsx
        InsightCard.tsx
      MiraConfirmationDialog.tsx
    pages/
      ChatMira.jsx                    # Command mode (updated)
    state/
      MiraContextProvider.tsx         # Context tracking
      miraModeMachine.ts              # Mode state machine (XState)
  lib/
    mira/
      types.ts                        # MiraResponse, UIAction, etc.
      intent-catalog.ts               # Intent definitions
      action-executor.ts              # UI action execution
      context-extractor.ts            # Extract context from pages

supabase/
  functions/
    _shared/
      services/
        router/
          intent-router.ts            # Intent classification
          confidence-scorer.ts        # Confidence scoring
        agents/
          base-agent.ts               # SkillAgent base class
          registry.ts                 # Agent registry
          customer-agent.ts           # Customer module agent
          new-business-agent.ts       # New Business module agent
          product-agent.ts            # Product module agent
          analytics-agent.ts          # Analytics module agent
          todo-agent.ts               # To-Do module agent
          broadcast-agent.ts          # Broadcast module agent
          visualizer-agent.ts         # Visualizer module agent
        tools/
          registry.ts                 # Tool registry
          customer-tools.ts           # Customer tools
          new-business-tools.ts       # New Business tools
          product-tools.ts            # Product tools
          analytics-tools.ts          # Analytics tools
          todo-tools.ts               # To-Do tools
          broadcast-tools.ts          # Broadcast tools
    agent-chat/
      index.ts                        # Updated with intent routing
  migrations/
    20251111_create_mira_topics.sql
    20251111_create_mira_intents.sql
    20251111_create_mira_agent_configs.sql
    20251111_update_mira_conversations.sql
    20251111_create_mira_intent_logs.sql

docs/
  mira_topics.json                    # Complete topic taxonomy
  MIRA_COPILOT_IMPLEMENTATION_PLAN.md # This file
  MIRA_COPILOT_USER_GUIDE.md
  MIRA_AGENT_RUNBOOK.md               # Updated runbook

tests/
  backend/
    intent-router.test.ts
    skill-agents.test.ts
    tools.test.ts
  frontend/
    mira-context.test.tsx
    action-executor.test.tsx
    modes.test.tsx
  e2e/
    create-lead-flow.spec.ts
    view-analytics-flow.spec.ts
    create-task-flow.spec.ts
    product-search-flow.spec.ts
    broadcast-campaign-flow.spec.ts
```

---

## 🎯 Next Steps

1. **Review this plan** with the team
2. **Get stakeholder approval** on approach and timeline
3. **Start Phase 0** - Define complete topic taxonomy
4. **Set up project tracking** - Create Jira epic and stories
5. **Assign owners** for each phase
6. **Begin implementation** Week 1

---

**Document Owner:** AI Squad Lead
**Last Updated:** 2025-11-11
**Status:** Draft - Pending Review

**Approvals Required:**
- [ ] Product Manager
- [ ] Engineering Lead
- [ ] UX Designer
- [ ] QA Lead
