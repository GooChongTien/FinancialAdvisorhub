# Mira Phase 5: Visual Implementation Roadmap

**Making Mira Smart & Beautiful** 🚀✨

---

## 🎯 Vision: Transform Mira from Functional to Exceptional

```
Current State (Functional):          Target State (Exceptional):
┌─────────────────────┐             ┌─────────────────────┐
│ Basic Chat          │             │ Proactive Co-pilot  │
│ + Text only         │    ───>     │ + Voice + Files     │
│ + Redirects to page │             │ + Split View        │
│ + Plain UI          │             │ + Beautiful UI      │
│ + Reactive          │             │ + Predictive        │
└─────────────────────┘             └─────────────────────┘
```

---

## 📊 Current Implementation Status

### ✅ What's Built (Solid Foundation)

```
Architecture Layer          Status   Notes
═══════════════════════════════════════════════════════════
Backend (Supabase)          ████████ 90%  - Edge functions working
                                          - Tool registry complete
                                          - Intent classification solid

Frontend Core               ███████░ 80%  - Context tracking working
                                          - Behavioral analytics ready
                                          - Action executor functional

UI Components               █████░░░ 60%  - Basic chat UI exists
                                          - Modes implemented (C/C/I)
                                          - Missing visual polish

Intelligence Layer          ████░░░░ 50%  - Pattern detection basic
                                          - No proactive triggers
                                          - Learning system stubbed
```

### ⚠️ What's Missing (The "Halfway" Problem)

| Feature | Status | Impact |
|---------|--------|--------|
| **Split View** | ❌ Not built | Users must leave page to chat |
| **Proactive Suggestions** | ❌ Not active | Mira feels dumb, doesn't anticipate |
| **Voice Input** | ❌ No UI | Less accessible, slower input |
| **File Upload** | ❌ No handler | Can't analyze documents |
| **Rich Responses** | ❌ Plain text | Boring, hard to scan |
| **Animations** | ❌ None | Feels static, not alive |
| **Chat History** | ❌ No UI | Can't resume conversations |
| **Module Awareness** | ⚠️ Partial | Generic responses, not contextual |

---

## 🗺️ 2-Week Implementation Plan

### Week 1: Make Mira SMART 🧠

**Goal:** Proactive intelligence that anticipates user needs

#### Day 1-2: Split View Foundation
```
┌─────────────────────────────────────────┐
│ Mira Chat (30%)  │ Module Page (70%)    │
├──────────────────┼──────────────────────┤
│ 💬 Chat history  │  📊 Dashboard         │
│ 🎤 Voice input   │  📈 Analytics         │
│ 📎 File upload   │  👥 Customer detail   │
│ ✨ Suggestions   │  ⚡ Live updates       │
└─────────────────────────────────────────┘
```

**Tasks:**
- [ ] Create `SplitViewContainer.jsx` component
- [ ] Implement resizable pane (30/70 split, min 20%, max 50%)
- [ ] Build sidebar auto-collapse logic
- [ ] Add keyboard shortcut (Cmd+K / Ctrl+K to toggle)
- [ ] Sync navigation: chat actions → update right pane
- [ ] Persist split view preference in localStorage

**Components to Build:**
```jsx
<SplitViewContainer>
  <ChatPanel />
  <ModulePanel>
    {children} // Current page content
  </ModulePanel>
</SplitViewContainer>
```

#### Day 3-4: Proactive Intelligence Engine
```
User Behavior               Mira's Response
═══════════════════════════════════════════════════════════
🖱️  Hovers on customer     💡 "Would you like to see their
   for 3+ seconds             policy history?"

📝 Fills form slowly       💡 "I can help fill this based on
                              recent customer data"

🔙 Navigates back 2x       💡 "Looking for something? Try asking
                              me instead of clicking around"

⏱️  Idle for 30 sec on     💡 "Did you know you have 3 hot leads
   dashboard                  that need follow-up?"
```

**Tasks:**
- [ ] Build `ProactiveEngine.ts` with trigger rules
- [ ] Create `ProactiveSuggestionToast.tsx` UI component
- [ ] Implement smart timing (don't interrupt active work)
- [ ] Add dismissal tracking (don't repeat ignored suggestions)
- [ ] Test with 5 common user journeys

**Triggers to Implement:**
1. **Form Struggle:** User edits same field 3+ times → Offer help
2. **Navigation Loop:** User visits same 2 pages 3x → Suggest shortcut
3. **Idle State:** No activity for 30s → Show contextual tip
4. **Success Pattern:** User completes task → Suggest related action
5. **Error Recovery:** User encounters error → Offer alternative path

#### Day 5: Module-Specific Context

**Current:** Generic responses regardless of page
**Target:** Contextual first prompts and suggestions

```javascript
// Example: On Customer Detail Page
module: "customers"
page: "/customers/123"
pageData: { customerId: 123, name: "John Tan" }

Mira's First Prompts:
✨ "Show me John's policy portfolio"
✨ "When was John's last appointment?"
✨ "Create a new proposal for John"
✨ "Find similar customers to John"
```

**Tasks:**
- [ ] Create `ContextualFirstPrompt.tsx` component
- [ ] Define prompt templates for each module (8 modules)
- [ ] Show module-specific prompts in chat empty state
- [ ] Update `/agent-chat` to provide module-aware responses

**Module Templates:**
| Module | Example Prompts |
|--------|----------------|
| Customers | "Show top customers by premium", "Who needs follow-up?" |
| Products | "Compare SecureLife plans", "What's best for age 35?" |
| Analytics | "How's my performance this quarter?", "Show conversion funnel" |
| Smart Plan | "What's urgent today?", "Schedule meeting with..." |

---

### Week 2: Make Mira BEAUTIFUL ✨

**Goal:** Delightful UI that feels alive and engaging

#### Day 6-7: Chat Interface Redesign

**Before:**
```
┌─────────────────────────┐
│ Plain white background  │
│ Simple text bubbles     │
│ No animations           │
│ Basic input box         │
└─────────────────────────┘
```

**After:**
```
┌──────────────────────────┐
│ 🎨 Gradient background   │
│ 💭 Styled bubbles + avatar│
│ ✨ Smooth animations      │
│ 🎤📎 Rich input bar       │
│ 📊 Embedded charts        │
└──────────────────────────┘
```

**Tasks:**
- [ ] Redesign message bubbles with shadows, avatars, timestamps
- [ ] Add typing indicator (3-dot pulse animation)
- [ ] Implement smooth scroll + auto-scroll to new messages
- [ ] Support markdown rendering in responses
- [ ] Add action button cards (not just text links)
- [ ] Show embedded charts/tables in responses
- [ ] Add message reactions (👍 👎 for feedback)

**Design Specs:**
```css
/* User Message */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border-radius: 18px 18px 4px 18px;
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);

/* Mira Message */
background: white;
border: 1px solid #e2e8f0;
border-radius: 18px 18px 18px 4px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
```

**Animations:**
- Message entrance: Slide up 20px + fade (150ms ease-out)
- Typing indicator: 3 dots pulse sequentially (500ms loop)
- Action buttons: Hover scale 1.05 + shadow increase

#### Day 8: Voice & File Input

**Voice Input Flow:**
```
┌─────────────────────────────────────┐
│  [🎤] ← Click to start recording    │
└─────────────────────────────────────┘
          ↓ (Click)
┌─────────────────────────────────────┐
│  [🔴●●●] Recording... (00:05)       │
│  [🛑] Stop                           │
└─────────────────────────────────────┘
          ↓ (Stop)
┌─────────────────────────────────────┐
│  "Show me my top customers..."      │
│  [📤 Send] [🔄 Re-record]           │
└─────────────────────────────────────┘
```

**Tasks:**
- [ ] Build `VoiceInputButton.tsx` with recording state
- [ ] Integrate Web Speech API (Chrome, Edge, Safari)
- [ ] Add waveform animation during recording
- [ ] Show transcribed text before sending
- [ ] Handle multi-language (EN, ZH, MS, TA)
- [ ] Graceful fallback if unsupported browser

**File Upload Flow:**
```
┌─────────────────────────────────────┐
│  [📎] ← Click or drag files here    │
└─────────────────────────────────────┘
          ↓ (Select file)
┌─────────────────────────────────────┐
│  📄 customer_list.xlsx (156 KB)     │
│  ▓▓▓▓▓▓░░░░ Uploading... 60%        │
└─────────────────────────────────────┘
          ↓ (Complete)
┌─────────────────────────────────────┐
│  ✅ File uploaded successfully       │
│  "I found 47 customers in this file"│
└─────────────────────────────────────┘
```

**Tasks:**
- [ ] Build `FileUploadButton.tsx` with drag-drop
- [ ] Implement upload progress bar
- [ ] Parse Excel/CSV files (detect headers, rows)
- [ ] Show file preview before processing
- [ ] Handle errors (file too large, wrong format)

#### Day 9: Homepage Enhancement

**Current Homepage Issues:**
- Redirects to ChatMira (context loss)
- No personalization (same for everyone)
- Static cards (no hover effects)

**Enhanced Homepage:**
```
┌───────────────────────────────────────────────┐
│  ✨ Good evening, Alex! You have:             │
│  🔥 3 hot leads  📅 2 appointments today      │
├───────────────────────────────────────────────┤
│  💬 Chat with Mira (inline, no redirect)     │
│  ┌─────────────────────────────────────────┐ │
│  │ Type your question or pick a quick      │ │
│  │ action below...                         │ │
│  │                                         │ │
│  │ [🎤] [📎]             [Send →]          │ │
│  └─────────────────────────────────────────┘ │
├───────────────────────────────────────────────┤
│  Quick Actions (animated cards):              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 👥 View │ │ 📊 Sales│ │ ✅ Tasks│        │
│  │ Customers│ │ Stats  │ │ Today   │        │
│  └─────────┘ └─────────┘ └─────────┘        │
└───────────────────────────────────────────────┘
```

**Tasks:**
- [ ] Add personalized greeting with user's name + time of day
- [ ] Show quick stats (hot leads, appointments, tasks)
- [ ] Implement inline chat (no redirect to ChatMira)
- [ ] Add stagger animation for cards (50ms delay each)
- [ ] Implement hover effects (lift + glow)
- [ ] Add "Expand to full chat" button if needed

**Animations:**
```javascript
// Card entrance (stagger)
cards.forEach((card, i) => {
  card.animate({
    opacity: [0, 1],
    transform: ['translateY(20px)', 'translateY(0)']
  }, {
    delay: i * 50,
    duration: 300,
    easing: 'ease-out'
  });
});

// Hover effect
card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

#### Day 10: Polish & Finishing Touches

**1. Chat History Page**
```
┌─────────────────────────────────────┐
│  Chat History                       │
│  ┌───────────────────────────────┐  │
│  │ 🔍 Search conversations...    │  │
│  └───────────────────────────────┘  │
│                                     │
│  Today                              │
│  ┌─────────────────────────────┐   │
│  │ 💬 "Show my top customers"  │   │
│  │ 📅 2:34 PM • 12 messages    │   │
│  │ [Resume] [Delete]           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Yesterday                          │
│  ┌─────────────────────────────┐   │
│  │ 💬 "Create proposal for..."│   │
│  │ 📅 11:20 AM • 8 messages    │   │
│  │ [Resume] [Delete]           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Tasks:**
- [ ] Create `/ChatHistory` page
- [ ] Build `ConversationList.tsx` component
- [ ] Implement search (by content, date)
- [ ] Add "Resume" button to load conversation
- [ ] Add "Delete" with confirmation
- [ ] Show message preview (first 100 chars)

**2. Micro-interactions**
- [ ] Add haptic feedback on mobile (if supported)
- [ ] Implement loading skeletons (not spinners)
- [ ] Add success animations (checkmark pulse)
- [ ] Show "Mira is typing..." with avatar pulse
- [ ] Add sound effects (optional, toggleable)

**3. Accessibility**
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader labels (aria-label, aria-live)
- [ ] Focus indicators (visible outlines)
- [ ] Color contrast (WCAG AA minimum)
- [ ] Voice input fallback for screen readers

---

## 📐 Design System

### Colors

```css
/* Primary Gradients */
--mira-gradient-blue: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--mira-gradient-purple: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--mira-gradient-green: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Message Bubbles */
--user-bubble-bg: var(--mira-gradient-blue);
--mira-bubble-bg: #ffffff;
--mira-bubble-border: #e2e8f0;

/* Status Colors */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### Typography

```css
/* Chat Messages */
--message-font: 'Inter', system-ui, sans-serif;
--message-size: 15px;
--message-line-height: 1.5;

/* Timestamps */
--timestamp-size: 11px;
--timestamp-color: #64748b;

/* Code Blocks */
--code-font: 'Fira Code', 'Monaco', monospace;
--code-bg: #f8fafc;
```

### Spacing

```css
/* Message Bubbles */
--bubble-padding: 12px 16px;
--bubble-margin: 8px 0;
--bubble-border-radius: 18px;

/* Avatar */
--avatar-size: 32px;
--avatar-spacing: 8px;
```

### Animations

```css
/* Entrance */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Typing Indicator */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Hover Lift */
.card:hover {
  transform: translateY(-4px);
  transition: transform 200ms ease-out;
}
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Split view resizes correctly (20-50% range)
- [ ] Keyboard shortcuts work (Cmd+K, Esc)
- [ ] Proactive suggestions appear at right time
- [ ] Voice input works in Chrome, Edge, Safari
- [ ] File upload handles Excel, CSV, PDF
- [ ] Chat history loads and resumes correctly
- [ ] Module-specific prompts appear on each page

### Visual Tests
- [ ] Animations run at 60fps
- [ ] No layout shift during load
- [ ] Responsive on mobile (320px width)
- [ ] Dark mode support (if enabled)
- [ ] No horizontal scroll
- [ ] Shadows render correctly

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces messages
- [ ] Focus indicators visible
- [ ] Color contrast passes WCAG AA
- [ ] Voice input accessible to screen reader users

### Performance Tests
- [ ] Chat loads in < 1 second
- [ ] Split view renders in < 500ms
- [ ] Voice transcription < 2 seconds
- [ ] File upload progress updates smoothly

---

## 📊 Success Metrics

### Quantitative
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Task Completion Time | ~5 min | ~3 min | 40% faster |
| Proactive Accept Rate | 0% | 60% | Suggestions accepted |
| User Satisfaction (NPS) | Unknown | >50 | Post-feature survey |
| Split View Adoption | 0% | 70% | % users who try it |
| Voice Input Usage | 0% | 30% | % messages via voice |

### Qualitative
- **Delight:** Users say "Wow!" when they first use it
- **Confidence:** Users trust Mira's suggestions
- **Efficiency:** Users prefer Mira over manual navigation
- **Habituation:** Users open Mira daily (retention)

---

## 🚀 Deployment Plan

### Staging (Day 11)
- [ ] Deploy to staging environment
- [ ] Internal team testing (5 people)
- [ ] Collect feedback, fix critical bugs
- [ ] Performance profiling

### Soft Launch (Day 12-14)
- [ ] Enable for 10% of users (feature flag)
- [ ] Monitor metrics (usage, errors, performance)
- [ ] Iterate based on feedback
- [ ] Fix any issues

### Full Rollout (Week 3)
- [ ] 25% rollout (Day 15)
- [ ] 50% rollout (Day 16)
- [ ] 100% rollout (Day 17)
- [ ] Announce to all users
- [ ] Celebrate! 🎉

---

## 🎓 Next Steps (Immediate)

1. **Review this roadmap** with stakeholders (30 min meeting)
2. **Approve design direction** (get buy-in on "beautiful")
3. **Allocate developer** (1 full-time, 2 weeks)
4. **Create Figma mockups** (Day 0, 2-3 hours)
5. **Start Week 1, Day 1** (Split View Foundation)

---

## 📞 Contact & Questions

**Document Owner:** CT / Claude Code
**Last Updated:** 2025-11-25
**Questions?** Discuss in #mira-dev Slack channel

---

**Remember:** The goal is not just to *finish* Mira, but to make it so good that advisors *prefer* using it over manual navigation. Smart + Beautiful = Delightful AI Co-pilot. 🚀✨
