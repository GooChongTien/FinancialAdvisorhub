# Mira Phase 5: Quick Start Guide

**For developers starting Mira Phase 5 implementation**

---

## 🎯 Goal

Transform Mira from a basic chatbot into a **smart, beautiful AI co-pilot** that:
1. **Anticipates** user needs (proactive suggestions)
2. **Assists** without interrupting (split view)
3. **Delights** users (beautiful UI, smooth animations)

---

## 📋 Prerequisites

**Read these documents first:**
1. ✅ `MIRA_STATUS_REPORT_2025-11-25.md` (this file) - Current state
2. ✅ `MIRA_PHASE5_VISUAL_ROADMAP.md` - 2-week implementation plan
3. ⚠️ `advisorhub-v2-master-checklist.md` - Phase 5 checklist (lines 429-532)
4. ⚠️ `MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md` - Full architecture

**Environment Setup:**
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser
# http://localhost:3000/advisor/home
```

---

## 🗂️ Key Files to Know

### Frontend (What You'll Modify)

```
src/admin/
├── pages/
│   ├── Home.jsx                     ⭐ Homepage - needs inline chat
│   ├── ChatMira.jsx                 ⭐ Main chat page - needs redesign
│   └── ChatHistory.jsx              ❌ CREATE THIS (Week 2, Day 10)
│
├── components/mira/
│   ├── MiraCommandPanel.jsx         ✅ Chat input (exists)
│   ├── MiraInteractionModes.jsx     ✅ Mode switcher (exists)
│   ├── SplitViewContainer.jsx       ❌ CREATE THIS (Week 1, Day 1-2)
│   ├── VoiceInputButton.tsx         ❌ CREATE THIS (Week 2, Day 8)
│   ├── FileUploadButton.tsx         ❌ CREATE THIS (Week 2, Day 8)
│   ├── ProactiveSuggestionToast.tsx ✅ EXISTS but unused - ACTIVATE
│   └── ContextualFirstPrompt.tsx    ❌ CREATE THIS (Week 1, Day 5)
│
├── lib/mira/
│   ├── behavioral-tracker.ts        ✅ Tracks user actions (working)
│   ├── pattern-detectors.ts         ✅ Detects patterns (basic)
│   ├── proactive-engine.ts          ❌ CREATE THIS (Week 1, Day 3-4)
│   └── voice-input-service.ts       ❌ CREATE THIS (Week 2, Day 8)
│
└── state/providers/
    ├── MiraContextProvider.jsx      ✅ Context tracking (working)
    └── AgentChatProvider.jsx        ✅ Chat state management (working)
```

### Backend (Minimal Changes)

```
supabase/functions/
├── agent-chat/
│   └── index.ts                     ⚠️ Minor updates for rich responses
├── workflows/
│   └── index.ts                     ✅ Already working
└── _shared/
    ├── services/
    │   ├── intent-router.ts         ✅ Already working
    │   └── tools/                   ✅ Already working
    └── types/
        └── mira.ts                  ⚠️ Add types for new features
```

---

## 🚀 Week 1: Make Mira SMART

### Day 1-2: Build Split View

**Goal:** Chat on left (30%), content on right (70%)

**Step 1: Create Component**

Create `src/admin/components/mira/SplitViewContainer.jsx`:

```jsx
import { useState, useRef } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export function SplitViewContainer({ chatPanel, contentPanel }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(30); // 30%
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 50) {
      setChatWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  if (!isOpen) return contentPanel;

  return (
    <div
      className="flex h-screen"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Chat Panel */}
      <div
        style={{ width: `${chatWidth}%` }}
        className="border-r border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="font-semibold">Mira</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {chatPanel}
      </div>

      {/* Resizer */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />

      {/* Content Panel */}
      <div style={{ width: `${100 - chatWidth}%` }}>
        {contentPanel}
      </div>
    </div>
  );
}
```

**Step 2: Integrate into Layout**

Modify `src/admin/layout/AdminLayout.jsx`:

```jsx
import { SplitViewContainer } from '@/admin/components/mira/SplitViewContainer';
import { useMiraMode } from '@/admin/state/useMiraMode';

export function AdminLayout({ children }) {
  const { mode } = useMiraMode();
  const showSplitView = mode === 'split';

  if (showSplitView) {
    return (
      <SplitViewContainer
        chatPanel={<InlineChatPanel />}
        contentPanel={children}
      />
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

**Step 3: Add Keyboard Shortcut**

```jsx
// In AdminLayout.jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleSplitView();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Testing:**
- [ ] Press Cmd+K (Mac) or Ctrl+K (Windows) → Split view opens
- [ ] Drag divider → Chat width changes (20-50%)
- [ ] Click X → Split view closes
- [ ] Navigate to different pages → Content updates in right pane

---

### Day 3-4: Build Proactive Engine

**Goal:** Mira suggests actions based on user behavior

**Step 1: Create Engine**

Create `src/lib/mira/proactive-engine.ts`:

```typescript
import { behavioralTracker } from './behavioral-tracker';

interface Suggestion {
  id: string;
  message: string;
  promptText: string;
  triggerReason: string;
  relevanceScore: number;
}

export class ProactiveEngine {
  private lastSuggestionTime: number = 0;
  private dismissedSuggestions: Set<string> = new Set();

  shouldShowSuggestion(): boolean {
    // Don't show more than 1 suggestion per 2 minutes
    if (Date.now() - this.lastSuggestionTime < 120000) return false;

    // Don't interrupt if user is typing
    if (this.isUserTyping()) return false;

    return true;
  }

  detectPatterns(): Suggestion | null {
    const context = behavioralTracker.getBehavioralContext();

    // Pattern 1: User on customer detail page for >10 seconds
    if (this.detectCustomerDetailIdle(context)) {
      return {
        id: 'customer-detail-idle',
        message: "Looking at this customer? I can help with:",
        promptText: "Show me their policy history and upcoming renewals",
        triggerReason: 'Customer detail page idle',
        relevanceScore: 0.85
      };
    }

    // Pattern 2: User navigated back 2+ times
    if (this.detectNavigationLoop(context)) {
      return {
        id: 'navigation-loop',
        message: "Seems like you're searching for something. Ask me instead!",
        promptText: "Help me find...",
        triggerReason: 'Navigation loop detected',
        relevanceScore: 0.75
      };
    }

    // Pattern 3: User filling form slowly
    if (this.detectFormStruggle(context)) {
      return {
        id: 'form-struggle',
        message: "Need help filling this form? I can assist.",
        promptText: "Pre-fill this form with customer data",
        triggerReason: 'Form completion struggle',
        relevanceScore: 0.80
      };
    }

    return null;
  }

  private detectCustomerDetailIdle(context: any): boolean {
    // Check if on customer detail page and idle for >10s
    return (
      context.currentPage?.includes('/customers/') &&
      context.timeOnPage > 10000 &&
      context.recentActions?.length < 3
    );
  }

  private detectNavigationLoop(context: any): boolean {
    // Check if user visited same 2 pages multiple times
    const history = context.navigationHistory || [];
    if (history.length < 4) return false;

    const recent = history.slice(-4);
    const uniquePages = new Set(recent.map((h: any) => h.toPage));
    return uniquePages.size <= 2; // Only 2 unique pages in last 4 navigations
  }

  private detectFormStruggle(context: any): boolean {
    // Check if user has >10 form interactions in last 2 minutes
    const formActions = (context.recentActions || [])
      .filter((a: any) => a.actionType === 'form_input')
      .filter((a: any) => Date.now() - a.timestamp < 120000);

    return formActions.length > 10;
  }

  private isUserTyping(): boolean {
    const context = behavioralTracker.getBehavioralContext();
    const lastAction = context.recentActions?.[0];

    if (!lastAction) return false;

    // User typed within last 2 seconds
    return (
      lastAction.actionType === 'form_input' &&
      Date.now() - lastAction.timestamp < 2000
    );
  }
}

export const proactiveEngine = new ProactiveEngine();
```

**Step 2: Activate Toast Component**

Modify `src/admin/components/mira/ProactiveSuggestionToast.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { proactiveEngine } from '@/lib/mira/proactive-engine';

export function ProactiveSuggestionToast({ onAccept }: { onAccept: (prompt: string) => void }) {
  const [suggestion, setSuggestion] = useState<any>(null);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (!proactiveEngine.shouldShowSuggestion()) return;

      const detected = proactiveEngine.detectPatterns();
      if (detected) {
        setSuggestion(detected);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, []);

  if (!suggestion) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-white rounded-lg shadow-xl border border-blue-200 p-4 animate-slide-up z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{suggestion.message}</p>
          <button
            onClick={() => {
              onAccept(suggestion.promptText);
              setSuggestion(null);
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {suggestion.promptText}
          </button>
        </div>
        <button
          onClick={() => setSuggestion(null)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Add to App**

In `src/App.jsx`:

```jsx
import { ProactiveSuggestionToast } from '@/admin/components/mira/ProactiveSuggestionToast';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const handleSuggestionAccept = (prompt: string) => {
    navigate(`/advisor/chat-mira?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <>
      <Routes>
        {/* ... your routes */}
      </Routes>
      <ProactiveSuggestionToast onAccept={handleSuggestionAccept} />
    </>
  );
}
```

**Testing:**
- [ ] Stay on customer detail page for 10s → Suggestion appears
- [ ] Navigate back and forth → "Searching?" suggestion appears
- [ ] Fill form slowly → "Need help?" suggestion appears
- [ ] Click suggestion → Opens chat with pre-filled prompt
- [ ] Click X → Dismisses suggestion

---

## 🎨 Week 2: Make Mira BEAUTIFUL

### Day 6-7: Redesign Chat Interface

**Goal:** Transform plain text chat into beautiful, engaging UI

**Step 1: Redesign Message Bubbles**

Modify `src/admin/components/ui/chat-message.jsx`:

```jsx
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function ChatMessage({ message, streaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 px-4 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className={`
          max-w-2xl rounded-2xl px-4 py-3 shadow-sm
          ${isUser
            ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 rounded-tl-sm'
          }
          ${streaming ? 'animate-pulse' : 'animate-slide-up'}
        `}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none">
            {message.content}
          </ReactMarkdown>
        )}

        <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-700" />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add Typing Indicator**

Create `src/admin/components/ui/typing-indicator.jsx`:

```jsx
export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add to Chat**

In `ChatMira.jsx`:

```jsx
import { TypingIndicator } from '@/admin/components/ui/typing-indicator';

// Inside render:
{isStreaming && <TypingIndicator />}
{messages.map(m => <ChatMessage key={m.id} message={m} />)}
```

**Step 4: Add CSS Animations**

In `src/index.css`:

```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 300ms ease-out;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
```

---

## 🎤 Voice Input (Day 8)

**Quick Implementation:**

```jsx
// src/admin/components/mira/VoiceInputButton.tsx
import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

export function VoiceInputButton({ onTranscript }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser');
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsRecording(false);
    };

    recog.start();
    setRecognition(recog);
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognition?.stop();
    setIsRecording(false);
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-2 rounded-lg transition-colors ${
        isRecording
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}
```

**Usage in ChatInput:**

```jsx
<div className="flex gap-2">
  <VoiceInputButton onTranscript={(text) => setInputValue(text)} />
  <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
  <button onClick={handleSend}>Send</button>
</div>
```

---

## ✅ Daily Checklist

Copy this checklist and update as you work:

### Week 1: SMART
- [ ] **Day 1:** Create SplitViewContainer component
- [ ] **Day 1:** Integrate into AdminLayout
- [ ] **Day 1:** Test resize, keyboard shortcut
- [ ] **Day 2:** Add navigation sync (chat → page updates)
- [ ] **Day 2:** Polish animations, save preferences
- [ ] **Day 3:** Create ProactiveEngine class
- [ ] **Day 3:** Implement 3 pattern detectors
- [ ] **Day 4:** Activate ProactiveSuggestionToast
- [ ] **Day 4:** Test all patterns, tune triggers
- [ ] **Day 5:** Create ContextualFirstPrompt component
- [ ] **Day 5:** Define prompts for 8 modules

### Week 2: BEAUTIFUL
- [ ] **Day 6:** Redesign ChatMessage bubbles
- [ ] **Day 6:** Add TypingIndicator component
- [ ] **Day 7:** Implement markdown rendering
- [ ] **Day 7:** Add message timestamps, reactions
- [ ] **Day 8:** Build VoiceInputButton
- [ ] **Day 8:** Build FileUploadButton
- [ ] **Day 9:** Enhance homepage (inline chat)
- [ ] **Day 9:** Add personalized greeting + stats
- [ ] **Day 10:** Create ChatHistory page
- [ ] **Day 10:** Final polish, testing, bug fixes

---

## 🆘 Common Issues & Solutions

**Issue:** Split view not rendering
- **Solution:** Check MiraMode context is providing `mode: 'split'`
- **Solution:** Ensure `useMiraMode()` hook is wrapped in provider

**Issue:** Proactive suggestions not appearing
- **Solution:** Check `shouldShowSuggestion()` logic (timing, typing detection)
- **Solution:** Add console.log in `detectPatterns()` to debug

**Issue:** Voice input not working
- **Solution:** Only works in Chrome, Edge, Safari (not Firefox)
- **Solution:** Must be HTTPS or localhost
- **Solution:** Check browser permissions for microphone

**Issue:** Animations janky
- **Solution:** Use `will-change: transform` CSS property
- **Solution:** Avoid animating width/height (use transform instead)
- **Solution:** Check Chrome DevTools Performance tab

---

## 📞 Need Help?

**Stuck?** Don't waste time - ask for help!

1. **Check existing code:** Search codebase for similar patterns
2. **Read docs:** Refer to roadmap and status report
3. **Ask team:** Post in #mira-dev Slack channel
4. **Pair program:** Schedule 30 min with another dev

**Remember:** The goal is progress, not perfection. Ship fast, iterate based on feedback.

---

**Ready to start? Begin with Day 1: Split View Foundation!** 🚀
