# Mira UX Gap Analysis - Figma vs Implementation

**Date:** November 25, 2025
**Figma Prototype:** https://linked-tile-36115322.figma.site/
**Status:** Critical UX differences identified

---

## 🎯 Executive Summary

After thorough review of the Figma prototype, there are **significant UX gaps** between the intended design and current implementation. The most critical missing feature is **Auto Nav** - Mira's ability to automatically navigate the app based on conversation context.

**Severity:** 🔴 High - Current UX breaks user context and doesn't match design intent

---

## 🔍 Key Findings from Figma Prototype

### The Intended Mira Experience:

1. **Default Behavior: Split View First**
   - Mira ALWAYS opens in split view (30% left, 70% right)
   - Left: Chat panel
   - Right: Contextual page content
   - **Never** navigates away from current page

2. **Auto Nav Toggle (CRITICAL FEATURE)**
   - Toggle at top of chat panel: "Auto Nav ON/OFF"
   - When ON: Mira automatically navigates right panel to relevant pages
   - Example: Ask "Show hot leads" → Right panel goes to Customers filtered by Hot
   - When OFF: Right panel stays on current page

3. **Sidebar Integration**
   - "Ask Mira" button in sidebar (replaces floating button)
   - "Recent Chats" section below navigation
   - Shows last 3-5 conversations
   - Click to resume conversation

4. **Context-Aware First Prompts**
   - Chat empty state shows prompts based on RIGHT panel's current page
   - On Customer page: "Show hot leads", "Who needs follow-up?"
   - On Analytics: "How am I performing?", "Show conversion funnel"
   - On Home: "What's my day look like?", "Top priorities"

5. **Visual Design Details**
   - Chat bubbles with avatars (Mira = M icon, User = initials)
   - Typing indicator (3 dots pulsing)
   - Action cards (blue background, white text, icons)
   - Timestamp on hover (relative time)
   - Markdown rendering (bold, lists, tables)

---

## ❌ What's Missing in Current Implementation

### Critical Gaps (Must Fix):

| Feature | Figma Design | Current Implementation | Gap Severity |
|---------|--------------|------------------------|--------------|
| **Auto Nav Toggle** | Prominent toggle at top of chat | ❌ Doesn't exist | 🔴 Critical |
| **Default Behavior** | Opens split view, stays on page | ❌ Routes to /chat-mira (breaks context) | 🔴 Critical |
| **Sidebar Integration** | "Ask Mira" + Recent Chats in sidebar | ❌ Floating button only | 🔴 Critical |
| **Auto Navigation** | Mira navigates right panel automatically | ❌ No automatic navigation | 🔴 Critical |
| **Context Prompts** | Different per page | ⚠️ Implemented but not visible (routes away) | 🟡 Medium |

### Design Gaps (Should Fix):

| Feature | Figma Design | Current Implementation | Gap Severity |
|---------|--------------|------------------------|--------------|
| **Chat Bubbles** | Avatar + shadow + rounded | ✅ Basic bubbles, no avatars | 🟡 Medium |
| **Typing Indicator** | 3-dot pulse animation | ❌ Just "Loading..." skeleton | 🟡 Medium |
| **Action Cards** | Blue cards with icons | ❌ Plain text with action buttons | 🟡 Medium |
| **Timestamps** | Hover to show relative time | ❌ Always visible or missing | 🟢 Low |
| **Markdown** | Bold, lists, tables rendered | ⚠️ Partial (depends on component) | 🟢 Low |

### Nice-to-Have (Future):

| Feature | Figma Design | Current Implementation |
|---------|--------------|------------------------|
| Voice Input | Microphone icon visible | ❌ Not built |
| File Upload | Paperclip icon visible | ❌ Not built |
| Recent Chats Sidebar | Last 5 conversations | ❌ Not in sidebar |
| Full-width toggle | Maximize button | ✅ Implemented! |

---

## ✅ What We Got Right

### Architecture Strengths:

1. **Split View Container** ✅
   - Resizable (20-50%)
   - Keyboard shortcut (Cmd+K)
   - Persistent width
   - Full-width toggle

2. **State Management** ✅
   - MiraMode state machine with "split" mode
   - Context provider tracking module/page
   - Behavioral tracker for patterns

3. **Contextual Prompts** ✅
   - Module-specific prompts defined
   - 8 modules with unique prompts
   - Customer-specific prompts on detail pages

4. **Proactive Suggestions** ✅
   - Pattern detection (5 patterns)
   - Beautiful toast UI
   - Engagement tracking

**The foundation is solid!** We just need to change behaviors and add missing UI elements.

---

## 🔧 Required Fixes (Priority Order)

### Priority 1: Fix Default Behavior (CRITICAL)

**Problem:** Clicking suggestions routes to /chat-mira, breaking user context

**Fix:**
```jsx
// In Home.jsx, MiraChatWidget.jsx, etc.
// BEFORE (wrong):
navigate(`/advisor/chat-mira?prompt=${prompt}`);

// AFTER (correct):
const { openSplit } = useMiraMode();
openSplit(); // Opens split view
sendMessage(prompt); // Sends message to chat
```

**Impact:** Users stay on current page, can see Mira + content simultaneously

**Files to Change:**
- `src/admin/pages/Home.jsx` (handleCommandRun function)
- `src/admin/components/MiraChatWidget.jsx` (openChat function)
- Any component with "Ask Mira" buttons

---

### Priority 2: Add Auto Nav Toggle (CRITICAL)

**What It Does:**
- Toggle at top of chat panel: "Auto Nav [ON/OFF]"
- When ON: Mira automatically navigates right panel based on responses
- When OFF: Right panel stays on current page

**Implementation Plan:**

**Step 1: Add to MiraMode state**
```typescript
// In miraModeMachine.ts context
interface MiraModeContext {
  currentMode: MiraMode;
  previousMode: MiraMode | null;
  conversationId: string | null;
  autoNavEnabled: boolean; // NEW
}
```

**Step 2: Create toggle UI**
```jsx
// In SplitViewContainer.jsx header
<div className="flex items-center gap-2">
  <span className="text-xs text-slate-600">Auto Nav</span>
  <Switch checked={autoNavEnabled} onChange={toggleAutoNav} />
</div>
```

**Step 3: Wire up navigation logic**
```jsx
// In AgentChatProvider or similar
useEffect(() => {
  if (!autoNavEnabled) return;

  // When Mira responds with ui_actions containing navigate
  if (lastMessage.ui_actions?.some(a => a.action === 'navigate')) {
    const navAction = lastMessage.ui_actions.find(a => a.action === 'navigate');
    navigate(navAction.params.url);
  }
}, [lastMessage, autoNavEnabled]);
```

**Impact:** Users can choose if Mira controls navigation (huge UX improvement!)

---

### Priority 3: Sidebar Integration (CRITICAL)

**What to Add:**

1. **"Ask Mira" button** (replace/complement floating button)
2. **Recent Chats section** (below navigation items)

**Implementation:**

```jsx
// In AdvisorPortalLayout.jsx sidebar
<nav>
  {/* Existing navigation items */}
  <NavItem icon={Home} text="Home" ... />
  <NavItem icon={Users} text="Customers" ... />
  ...

  {/* NEW: Ask Mira button */}
  <button
    onClick={() => openSplit()}
    className="mira-sidebar-button"
  >
    <Sparkles className="w-5 h-5" />
    <span>Ask Mira</span>
  </button>

  {/* NEW: Recent Chats */}
  <div className="recent-chats">
    <h4>Recent Chats</h4>
    {recentChats.slice(0, 5).map(chat => (
      <button key={chat.id} onClick={() => resumeChat(chat.id)}>
        {chat.title}
      </button>
    ))}
  </div>
</nav>
```

**Impact:** Mira feels integrated into the app (not an afterthought)

---

### Priority 4: Context-Aware Prompts (Easy Fix)

**Problem:** Context prompts are built but not visible (routes away from page)

**Fix:** Once Priority 1 is fixed (split view default), this will work automatically!

**Verify:**
- Go to Customers page → Open split view → See customer prompts
- Go to Analytics → Open split view → See analytics prompts
- View customer detail → See that customer's name in prompts

**Impact:** Mira feels smart and aware of what user is doing

---

## 📋 Implementation Checklist

### Week 1.5: Critical Fixes (2-3 days)

- [ ] **Change default behavior to split view**
  - [ ] Update Home.jsx starter prompts → openSplit instead of navigate
  - [ ] Update MiraChatWidget → "Split View" as primary option
  - [ ] Update all "Ask Mira" buttons across app
  - [ ] Remove or minimize routes to /chat-mira

- [ ] **Add Auto Nav Toggle**
  - [ ] Add `autoNavEnabled` to MiraMode state
  - [ ] Create Switch component in SplitViewContainer header
  - [ ] Wire up navigation logic in AgentChatProvider
  - [ ] Test: Ask "Show hot leads" → Right panel navigates to Customers

- [ ] **Sidebar Integration**
  - [ ] Add "Ask Mira" button to sidebar (primary action)
  - [ ] Add "Recent Chats" section below navigation
  - [ ] Load last 5 conversations from mira_conversations table
  - [ ] Implement resume chat functionality

- [ ] **Visual Polish**
  - [ ] Add avatars to chat bubbles (M for Mira, user initials)
  - [ ] Improve typing indicator (3-dot pulse)
  - [ ] Style action cards (blue background, icons)
  - [ ] Add hover timestamps

### Week 2: Nice-to-Have

- [ ] Voice input button (as designed in Figma)
- [ ] File upload button (as designed in Figma)
- [ ] Advanced markdown rendering (tables, etc.)
- [ ] Chat history page (beyond sidebar recent chats)

---

## 🎨 Visual Design Alignment

### Color Palette (from Figma):

```css
/* Mira Brand Colors */
--mira-primary: #4F46E5; /* Indigo */
--mira-secondary: #7C3AED; /* Purple */
--mira-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);

/* Chat Bubbles */
--user-bubble: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); /* Blue */
--mira-bubble: #F8FAFC; /* Light gray */
--mira-bubble-border: #E2E8F0;

/* Action Cards */
--action-card-bg: #3B82F6; /* Blue */
--action-card-text: #FFFFFF;
--action-card-hover: #2563EB;

/* Sidebar */
--sidebar-bg: #1E293B; /* Dark slate */
--sidebar-text: #F1F5F9;
--sidebar-mira-button: var(--mira-gradient);
```

### Typography:

```css
/* From Figma */
--font-family: 'Inter', system-ui, sans-serif;
--message-size: 14px;
--message-line-height: 1.5;
--heading-size: 16px;
--small-text: 12px;
```

### Spacing:

```css
/* Chat Bubbles */
--bubble-padding: 12px 16px;
--bubble-gap: 12px;
--bubble-border-radius: 16px;

/* Split View */
--chat-width: 30%;
--content-width: 70%;
--divider-width: 4px;
```

---

## 🚀 Migration Strategy

### Phase 1: Quick Fixes (This Week)

**Goal:** Make Mira work like Figma design (split view default, Auto Nav)

**Tasks:**
1. Change all routes to use `openSplit()` instead of `navigate('/chat-mira')`
2. Add Auto Nav toggle UI (even if logic is basic at first)
3. Move "Ask Mira" to sidebar
4. Test critical flows

**Success Criteria:**
- ✅ Clicking suggestion opens split view (not full-screen)
- ✅ Auto Nav toggle visible and functional
- ✅ "Ask Mira" in sidebar works
- ✅ Context prompts visible in split view

### Phase 2: Visual Polish (Next Week)

**Goal:** Make Mira look like Figma design

**Tasks:**
1. Redesign chat bubbles (avatars, colors, shadows)
2. Improve typing indicator
3. Style action cards
4. Add voice/file input buttons (UI only, logic later)

### Phase 3: Advanced Features (Week 3)

**Goal:** Full feature parity with Figma

**Tasks:**
1. Implement voice input (Web Speech API)
2. Implement file upload (drag-drop)
3. Advanced Auto Nav (smart filtering, deep linking)
4. Full chat history UI

---

## 📊 Success Metrics

### User Experience Metrics:

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| **Context Retention** | 0% (routes away) | 100% | User stays on page when using Mira |
| **Split View Usage** | 0% (not default) | 70% | % users who use split view |
| **Auto Nav Adoption** | N/A | 50% | % users who enable Auto Nav |
| **Sidebar Engagement** | N/A | 60% | % users who click "Ask Mira" in sidebar |

### Technical Metrics:

- ✅ All suggestions open split view (not full-screen)
- ✅ Auto Nav toggle functional
- ✅ Recent Chats load from database
- ✅ Context prompts match current page

---

## 🎯 Immediate Action Items (Today)

1. **Fix Homepage Behavior**
   ```jsx
   // In Home.jsx line ~216
   // CHANGE FROM:
   navigate(`${createPageUrl("ChatMira")}?${q.toString()}`);

   // TO:
   openSplit(conversationId);
   sendMessage(trimmed);
   ```

2. **Fix Chat Widget**
   ```jsx
   // In MiraChatWidget.jsx
   // Make "Split View" the PRIMARY action (bigger, more prominent)
   // Make "Full Screen" the SECONDARY action (smaller, less prominent)
   ```

3. **Add Auto Nav Toggle Placeholder**
   ```jsx
   // In SplitViewContainer.jsx header
   // Add toggle UI (even if logic comes later)
   <Toggle label="Auto Nav" checked={false} onChange={() => {}} />
   ```

---

## 📞 Questions for Stakeholders

1. **Auto Nav Default:** Should Auto Nav be ON or OFF by default?
   - **Recommendation:** OFF (users control navigation)

2. **Floating Button:** Keep it or remove when sidebar integration is done?
   - **Recommendation:** Keep both (sidebar for desktop, floating for mobile)

3. **Full-Screen Chat:** Still needed or remove completely?
   - **Recommendation:** Keep as "Expand" option in split view header

4. **Voice Input Priority:** Week 2 or Week 3?
   - **Recommendation:** Week 2 (high user value)

---

## 🎉 Conclusion

**The good news:** Our architecture is solid! We have all the building blocks.

**The work needed:** Mostly behavior changes and UI integration, not major rewrites.

**Estimated effort:** 2-3 days for critical fixes, 1 week for full Figma parity.

**Biggest win:** Fixing default behavior to split view (will immediately feel 10x better!)

---

**Next Steps:**
1. Review this analysis with team
2. Prioritize fixes (I recommend all Priority 1 items)
3. Start with homepage behavior fix (30 minutes)
4. Then Auto Nav toggle (2-3 hours)
5. Then sidebar integration (4-6 hours)

**Let's make Mira match the beautiful Figma design!** 🚀

---

**Document Author:** Claude Code
**Last Updated:** 2025-11-25
**Status:** 🔴 Critical gaps identified - Action required
