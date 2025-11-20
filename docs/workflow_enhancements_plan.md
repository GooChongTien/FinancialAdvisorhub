# Workflow Builder Enhancements Plan

Inspired by OpenAI's Agent Builder interface. This plan outlines enhancements to bring our workflow editor to feature parity with industry-leading agent builders.

---

## Phase 6.1: Enhanced Node Configuration

**Goal**: Rich configuration panel with model parameters and advanced options.

### Features to Add

1. **Model Parameters**
   - Temperature slider (0.0 - 2.0)
   - Max Tokens input (1 - 4096+)
   - Top P slider (0.0 - 1.0)
   
2. **Chat UI Controls**
   - Display response in chat toggle
   - Show in-progress messages toggle
   - Show search sources toggle

3. **Advanced Settings**
   - Continue on error toggle
   - Write to conversation history toggle
   - Output format selector (JSON, text, structured)

4. **UX Improvements**
   - Collapsible sections ("Less" / "More")
   - Better visual hierarchy
   - Tooltip explanations for parameters

**Files to Modify**:
- `src/admin/pages/admin/WorkflowEditor.jsx` - Update node configuration panel

---

## Phase 6.2: New Node Types

**Goal**: Add specialized node types for common workflow patterns.

### Node Types to Implement

1. **User Approval Node**
   - Pauses workflow for human approval
   - Configurable approval message
   - Timeout settings
   - Approval actions (approve/reject routing)

2. **Transform Node**
   - JavaScript/JSONata expressions
   - Data mapping and transformation
   - Input/output schema validation

3. **While/Loop Node**
   - Condition-based looping
   - Max iterations limit
   - Loop variable management

4. **State Node**
   - Set/Get workflow state
   - Persistent state across executions
   - State scope (workflow/global)

5. **Classify Node**
   - Enhanced intent classification
   - Multi-class output
   - Confidence threshold
   - Fallback routing

**Files to Create/Modify**:
- `src/admin/components/workflow/nodes/` - Add new node components
- Update node type registry in `WorkflowEditor.jsx`

---

## Phase 6.3: Palette Organization

**Goal**: Better node discovery and organization.

### Features

1. **Categorized Palette**
   - **Core**: Agent, Start, End, Note
   - **Tools**: Tool Call, File Search, MCP
   - **Logic**: Decision, User Approval, While, Classify
   - **Data**: Transform, State

2. **Search & Filter**
   - Real-time search bar
   - Filter by category
   - Recently used nodes

3. **Visual Improvements**
   - Icon for each node type
   - Drag preview
   - Color coding by category

**Files to Modify**:
- `src/admin/pages/admin/WorkflowEditor.jsx` - Rebuild node palette

---

## Phase 6.4: Visual Polish

**Goal**: Modern, clean aesthetic matching OpenAI's design.

### Improvements

1. **Node Styling**
   - Rounded corners (border-radius: 12px)
   - Subtle shadows
   - Clear typography
   - Status indicators (running, error, success)

2. **Canvas Features**
   - Minimap (React Flow built-in)
   - Zoom controls
   - Grid background
   - Pan/zoom limits

3. **Connection Enhancements**
   - Animated flow indicators
   - Connection labels
   - Better edge routing (bezier curves)

4. **Toolbar**
   - Undo/Redo buttons
   - Zoom to fit
   - Auto-layout
   - Export as image

**Files to Modify**:
- `src/admin/pages/admin/WorkflowEditor.jsx` - Add React Flow features
- Create custom node components with new styling

---

## Implementation Priority

### Sprint 1: Foundation (Priority 1)
- [x] Enhanced node configuration panel
- [x] Model parameters (temperature, max tokens, top P)
- [x] Collapsible sections

### Sprint 2: Node Types (Priority 2)
- [ ] User Approval node
- [ ] Transform node
- [ ] Classify node

### Sprint 3: Organization (Priority 3)
- [ ] Categorized palette
- [ ] Search & filter
- [ ] Node icons

### Sprint 4: Polish (Priority 4)
- [ ] Visual styling updates
- [ ] Minimap
- [ ] Toolbar enhancements

---

## Technical Implementation Notes

### Model Parameters Storage
Store in node `data.config`:
```json
{
  "temperature": 1.0,
  "maxTokens": 2048,
  "topP": 1.0,
  "continueOnError": false,
  "writeToHistory": true
}
```

### New Node Type Structure
```javascript
{
  id: "node-123",
  type: "userApproval",
  data: {
    label: "User Approval",
    config: {
      approvalMessage: "Please approve this action",
      timeout: 3600,
      approveRoute: "continue",
      rejectRoute: "end"
    }
  }
}
```

### Palette Categories
```javascript
const nodeCategories = {
  core: ["agent", "start", "end", "note"],
  tools: ["toolCall", "fileSearch", "mcp"],
  logic: ["decision", "userApproval", "while", "classify"],
  data: ["transform", "state"]
};
```

---

## Success Metrics

- ✅ Configuration panel matches OpenAI feature set
- ✅ All 5 new node types functional
- ✅ Palette search under 200ms
- ✅ Visual design passes user review
- ✅ Minimap works for 50+ node workflows
