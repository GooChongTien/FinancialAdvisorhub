# Mira Architecture: Current vs Target

## 🎯 Executive Summary

**Current Implementation:** Chat-focused assistant with skill-based routing
**Target Vision:** Embedded co-pilot with intent-based routing and adaptive UI

---

## 📊 Key Differences

### 1. Architecture Pattern

| Aspect | Current (vNext) | Target (Co-Pilot) |
|--------|-----------------|-------------------|
| **Routing** | Skill-based with namespaced skills (`kb__`, `fna__`, `ops__`) | Intent-based with confidence scoring (0.0-1.0) |
| **Agents** | Generic agents (knowledge, FNA, ops) | Module-specific skill agents (Customer, NewBusiness, Product, Analytics, ToDo, Broadcast, Visualizer) |
| **Organization** | Flat skill list | Topic → Subtopic → Intent hierarchy |
| **Selection** | Hard-coded routing hints | Confidence scoring with context boosting |

### 2. User Interface

| Aspect | Current (vNext) | Target (Co-Pilot) |
|--------|-----------------|-------------------|
| **Primary Mode** | Chat window (fullscreen or split) | Three distinct modes: Command, Co-pilot, Insight |
| **Integration** | Separate chat page | Embedded in every module page |
| **Interaction** | User-initiated chat | Proactive suggestions + reactive chat |
| **Context Awareness** | Limited (requires manual specification) | Automatic (knows current page, module, data) |

### 3. Action Execution

| Aspect | Current (vNext) | Target (Co-Pilot) |
|--------|-----------------|-------------------|
| **Action Protocol** | No standardized protocol | Standardized UI Action Protocol: navigate, frontend_prefill, execute |
| **Confirmation** | Inline confirmation for single actions | Multi-step flows with confirmation dialogs |
| **Frontend Integration** | Manual tool handlers | Automated action executor |
| **Flow Support** | Single-step actions | Multi-step workflows (navigate → prefill → confirm → execute) |

### 4. Module Alignment

| Aspect | Current (vNext) | Target (Co-Pilot) |
|--------|-----------------|-------------------|
| **Structure** | Generic domains (knowledge, FNA, ops) | 7 ePOS modules (Customer, NewBusiness, Product, Analytics, ToDo, Broadcast, Visualizer) |
| **Tools** | Wrapped A2C skills | Module-specific Supabase tools |
| **Intents** | Implicit in skills | Explicit intent catalog with examples |
| **Extensibility** | Add new skills | Add new modules with complete taxonomy |

---

## 🔄 Migration Path

### What We Keep (Reusable)
✅ Supabase Edge Function infrastructure (`agent-chat`)
✅ Frontend chat components (`useAgentChat`, `ChatInput`, `ChatMessage`)
✅ State machine patterns (`miraCommandMachine.js`)
✅ Knowledge tables (`knowledge_atoms`, `knowledge_sources`)
✅ Telemetry infrastructure (`mira_events`)
✅ OpenAI/Anthropic adapter patterns

### What We Rebuild
🔄 **Router** - Replace skill-based routing with intent classifier
🔄 **Agents** - Replace 3 generic agents with 7 module-specific agents
🔄 **UI Integration** - Add context provider and action executor
🔄 **Frontend Modes** - Build Command, Co-pilot, and Insight modes
🔄 **Topic System** - Create complete topic taxonomy
🔄 **Tools** - Connect to real Supabase tables

### What We Add (New)
➕ **Context Provider** - Track current module, page, and data
➕ **Intent Catalog** - Comprehensive intent definitions with examples
➕ **Action Protocol** - Standardized UI action format
➕ **Co-pilot Mode** - Inline suggestions panel
➕ **Insight Mode** - Ambient insights sidebar
➕ **Confidence Scoring** - Intent classification with scores
➕ **Multi-step Flows** - Navigate → prefill → confirm → execute

---

## 📋 Implementation Phases Summary

### Phase 0: Foundation (Week 1)
**Goal:** Define topic taxonomy and database schema
- Complete topic taxonomy for 7 modules
- Database migrations for intents, topics, agents
- TypeScript type definitions

### Phase 1: Intent Router (Week 2)
**Goal:** Build intent classification with confidence scoring
- Intent classifier with LLM
- Confidence scoring with context boosting
- Topic switching logic

### Phase 2: Skill Agents (Week 3-4)
**Goal:** Implement 7 module-specific agents
- CustomerAgent, NewBusinessAgent, ProductAgent
- AnalyticsAgent, ToDoAgent, BroadcastAgent, VisualizerAgent
- Each returns standardized MiraResponse with ui_actions

### Phase 3: Context & Actions (Week 5)
**Goal:** Frontend context tracking and action execution
- MiraContextProvider (module, page, data)
- UIActionExecutor (navigate, prefill, execute)
- Confirmation dialogs

### Phase 4: Adaptive UI (Week 6-7)
**Goal:** Three interaction modes
- Command Mode (fullscreen chat)
- Co-pilot Mode (inline suggestions)
- Insight Mode (ambient feed)

### Phase 5: Tools (Week 8)
**Goal:** Connect agents to real data
- Implement all module tools
- CRUD operations on Supabase tables
- Error handling and logging

### Phase 6: Integration (Week 9)
**Goal:** End-to-end flows and polish
- 5 core user flows working
- Performance optimization
- Accessibility compliance

### Phase 7: Production (Week 10)
**Goal:** Launch readiness
- Monitoring and alerts
- Runbooks and training
- Staged rollout

---

## 🎯 Example: How It Works

### Current Implementation (vNext)
```
User: "Create new lead Kim, phone 12345678"
  ↓
Router: Checks metadata hints → selects ops__agent_passthrough or fna__capture_update_data
  ↓
Agent: Returns text response
  ↓
Frontend: Shows chat message (no automatic action)
```

### Target Implementation (Co-Pilot)
```
User: "Create new lead Kim, phone 12345678"
  ↓
Context: { module: "customer", page: "/customer" }
  ↓
Intent Router: Classifies intent
  - Topic: "customer"
  - Subtopic: "lead_management"
  - Intent: "create_lead"
  - Confidence: 0.95
  - Selected Agent: CustomerAgent
  ↓
CustomerAgent: Generates MiraResponse
{
  "assistant_reply": "I'll create a new lead for Kim. Please confirm.",
  "ui_actions": [
    { "action": "navigate", "module": "customer", "page": "/customer", "popup": "new_lead_form" },
    { "action": "frontend_prefill", "payload": { "name": "Kim", "contact_number": "12345678" } }
  ],
  "metadata": { "topic": "customer", "intent": "create_lead", "confidence": 0.95 }
}
  ↓
Frontend Action Executor:
  1. Navigate to /customer page
  2. Open new lead form popup
  3. Prefill name and phone fields
  4. Show confirmation dialog
  ↓
User: Clicks "Confirm"
  ↓
Execute backend: POST /api/leads { name: "Kim", contact_number: "12345678" }
  ↓
Success: Lead created, form closes, list refreshes, toast shown
```

---

## 🚀 Why This Matters

### For Advisors
- **Less clicking** - Mira can navigate and prefill forms automatically
- **Proactive help** - Co-pilot suggests next actions based on context
- **Ambient awareness** - Insight feed shows overdue tasks and hot leads
- **Natural interaction** - Speak naturally, Mira understands intent

### For Developers
- **Extensible** - Add new modules by extending topic taxonomy
- **Testable** - Intent classification accuracy can be measured
- **Maintainable** - Clear separation: Router → Agent → Tools
- **Type-safe** - Full TypeScript support with Zod schemas

### For Business
- **Higher adoption** - 60% weekly usage target (vs current <20%)
- **Faster workflows** - 30% reduction in task completion time
- **Better UX** - NPS target of 40+
- **Competitive advantage** - AI co-pilot differentiator in market

---

## 📈 Success Criteria

| Metric | Target |
|--------|--------|
| Intent Classification Accuracy | ≥ 90% |
| Action Execution Success Rate | ≥ 95% |
| User Satisfaction (NPS) | ≥ 40 |
| Weekly Adoption Rate | ≥ 60% |
| Task Completion Time Reduction | -30% |
| Median Response Latency | ≤ 1.5s |
| p95 Response Latency | ≤ 2.5s |

---

## 🎬 Next Steps

1. **Review** `MIRA_COPILOT_IMPLEMENTATION_PLAN.md` in detail
2. **Discuss** with team: timeline, resources, concerns
3. **Get approval** from stakeholders
4. **Start Phase 0** - Define complete topic taxonomy
5. **Set up tracking** - Create Jira epic with stories
6. **Begin execution** - Week 1 starts!

---

**Questions?** Review the full implementation plan for detailed task checklists and technical specifications.
