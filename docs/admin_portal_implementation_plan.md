# Admin Portal - Implementation Plan

## Overview
Build a separate admin portal for managing Mira's Expert Brain, with complete role separation from the advisor portal.

---

## Architecture

### Route Structure
```
/login                           → Role detection, redirect
/admin/*                         → Admin Portal (Agent Builder)
  /admin/workflows               → Workflow list
  /admin/workflows/:id           → Workflow editor
  /admin/tools                   → Tool registry
  /admin/intents                 → Intent manager
  /admin/executions              → Execution logs
  /admin/advisors                → User management
/advisor/*                       → Advisor Portal (existing features)
  /advisor/home                  → Dashboard
  /advisor/customers             → Customer management
  /advisor/new-business          → Quotes & proposals
  ... (all existing routes)
```

### Database Changes

#### Migration: Add Role Column
```sql
-- File: supabase/migrations/20251120_add_user_roles.sql
ALTER TABLE advisors 
ADD COLUMN role TEXT DEFAULT 'advisor' 
CHECK (role IN ('admin', 'advisor'));

-- Set first user as admin for testing
UPDATE advisors SET role = 'admin' WHERE id = (SELECT id FROM advisors LIMIT 1);
```

---

## Phase 1: Foundation (Start Here)

### 1.1 Database Migration
- [NEW] `supabase/migrations/20251120_add_user_roles.sql`

### 1.2 Auth Logic Update
- [MODIFY] `src/admin/pages/Login.jsx`
  - After login, check `user.role`
  - Redirect admin → `/admin/workflows`
  - Redirect advisor → `/advisor/home`

### 1.3 Route Restructure
- [MODIFY] `src/App.jsx`
  - Add `/admin/*` routes
  - Move existing routes to `/advisor/*`
  - Add role guards

### 1.4 Layout Components
- [NEW] `src/admin/layout/AdminPortalLayout.jsx` (for Agent Builder)
- [RENAME] `src/admin/layout/AdminLayout.jsx` → `AdvisorPortalLayout.jsx`

### 1.5 Navigation
- [NEW] `src/admin/components/admin/AdminSidebar.jsx`
  - Links: Workflows, Tools, Intents, Executions, Advisors

---

## Phase 2: Workflow Builder (Core Feature)

### 2.1 API Endpoints
- [NEW] `supabase/functions/admin-workflows/index.ts`
  ```ts
  GET    /admin-workflows          → List all workflows
  GET    /admin-workflows/:id      → Get workflow with nodes/edges
  POST   /admin-workflows          → Create workflow
  PUT    /admin-workflows/:id      → Update workflow
  DELETE /admin-workflows/:id      → Delete workflow
  POST   /admin-workflows/:id/test → Test workflow execution
  ```

### 2.2 Workflow List Page
- [NEW] `src/admin/pages/admin/WorkflowList.jsx`
  - Table with: Name, Trigger Intent, Status, Version, Actions
  - Search & filter by module, status
  - Create New button → opens editor

### 2.3 Workflow Editor (Visual Canvas)
- [NEW] `src/admin/pages/admin/WorkflowEditor.jsx`
- Install dependency: `npm install @xyflow/react`
- Features:
  - Drag-and-drop nodes (Start, LLM, Tool, Conditional)
  - Node configuration panel
  - Edge drawing
  - Save/Test buttons

### 2.4 Node Components
- [NEW] `src/admin/components/admin/workflow/StartNode.jsx`
- [NEW] `src/admin/components/admin/workflow/LLMNode.jsx`
- [NEW] `src/admin/components/admin/workflow/ToolNode.jsx`
- [NEW] `src/admin/components/admin/workflow/ConditionalNode.jsx`

---

## Phase 3: Tool & Intent Management

### 3.1 Tool Registry
- [NEW] `src/admin/pages/admin/ToolRegistry.jsx`
  - List all registered tools
  - Show schema (parameters, types)
  - Test playground (input form → execute → view result)

### 3.2 Intent Manager
- [NEW] `src/admin/pages/admin/IntentManager.jsx`
  - List intents with module, trigger workflow
  - Add/Edit intent
  - Map intent to workflow

---

## Phase 4: User Management

### 4.1 Advisor Management
- [NEW] `src/admin/pages/admin/AdvisorManagement.jsx`
  - List all advisors
  - Create/Edit advisor accounts
  - Assign roles (admin/advisor)
  - Activate/Deactivate accounts

---

## Phase 5: Debugging & Monitoring

### 5.1 Execution Logs
- [NEW] `src/admin/pages/admin/ExecutionLogs.jsx`
  - List recent workflow executions
  - Filter by status, workflow, date
  - Click to view detailed trace

### 5.2 Execution Trace Viewer
- [NEW] `src/admin/components/admin/ExecutionTrace.jsx`
  - Node-by-node execution flow
  - LLM calls, tool results, errors
  - Replay with different inputs

---

## Implementation Order

### Week 1: Foundation
1. Create role migration
2. Update login logic
3. Restructure routes (`/admin/*`, `/advisor/*`)
4. Create AdminPortalLayout
5. Build admin sidebar navigation

### Week 2: Workflow Builder
6. Create Workflows API
7. Build Workflow List page
8. Integrate React Flow
9. Build node palette
10. Add node configuration panels

### Week 3: Tools & Debugging
11. Build Tool Registry page
12. Build Intent Manager
13. Create Execution Logs viewer
14. Add execution trace visualization

### Week 4: User Management & Polish
15. Build Advisor Management page
16. Add role guards & RLS policies
17. Testing & bug fixes
18. Documentation

---

## Next Steps
1. Start with Phase 1: Foundation
2. Create role migration
3. Update login logic
4. Restructure routes
