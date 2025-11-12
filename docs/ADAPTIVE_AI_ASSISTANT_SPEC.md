# Technical Specification: Adaptive AI Assistant Interface

> Legacy note (vNext): Some sections reference OpenAI ChatKit and client-side tools. The current implementation uses a native server-side agent with skills and no ChatKit dependency. Treat ChatKit snippets as historical/appendix examples only.

**Project:** AdvisorHub - Intelligent Context-Aware Assistant
**Version:** 1.0
**Date:** 2025-11-06
**Status:** Planning Phase

---

## 📋 Executive Summary

This specification outlines the technical implementation of an intelligent, context-aware AI assistant interface that dynamically adapts its layout based on user intent and task requirements. The system will provide seamless transitions between fullscreen chat, split-screen workspace, and docked sidebar modes.

**Key Benefits:**
- Enhanced user engagement through immersive chat experience
- Reduced context switching with split-screen guidance
- Maintained productivity with persistent sidebar access
- Intelligent task detection and contextual page loading

---

## 🎯 Product Requirements

### Functional Requirements

#### FR-1: Fullscreen Chat Mode (Default State)
- **Description**: When user opens the assistant, it occupies 100% of viewport
- **Entry Points**:
  - Homepage Mira floating button
  - Navigation menu item (optional)
  - Keyboard shortcut (Ctrl/Cmd + K)
- **Exit Conditions**:
  - User explicitly closes assistant
  - Assistant detects task requiring system page
- **UI Elements**:
  - Full-height chat history
  - Message input at bottom
  - Close button (top-right)
  - Minimize to sidebar button
  - Settings/preferences menu

#### FR-2: Context-Aware Split-Screen Mode
- **Description**: Assistant transitions to sidebar when system page access is needed
- **Layout**:
  - Left Sidebar: 30% width (min: 280px, max: 400px)
  - Right Content: 70% width (system page iframe/component)
  - Resizable divider between panels
- **Triggers**:
  - Agent workflow detects navigation intent (e.g., "show me the analytics dashboard")
  - Client tool call from Agent Builder workflow
  - User clicks suggested action (e.g., "View Customer Details")
- **Behavior**:
  - Smooth animated transition (300ms ease-in-out)
  - Chat history preserved
  - System page loads in right panel
  - Assistant provides contextual guidance

#### FR-3: Docked Sidebar Mode
- **Description**: Minimized assistant remains accessible while user works
- **States**:
  - Collapsed: Icon-only bar (48px width)
  - Expanded: Full sidebar (280-400px width)
  - Hidden: Completely dismissed (restored via floating button)
- **Interactions**:
  - Click/hover to expand
  - Auto-collapse after inactivity (optional)
  - Badge notifications for pending suggestions
  - Quick actions menu

#### FR-4: Intelligent Navigation System
- **Page Detection**: Agent workflow uses tools to determine required pages
- **Multi-Page Support**: Tab navigation for multiple concurrent tasks
- **Breadcrumb Trail**: Visual indicator of navigation history
- **Deep Linking**: Support URL parameters for specific records/views

#### FR-5: Real-Time State Synchronization
- **System State Monitoring**: Track user actions in loaded pages
- **Contextual Suggestions**: Offer next steps based on current page/data
- **Data Refresh**: Update assistant knowledge when data changes
- **Error Handling**: Detect and help resolve system errors

### Non-Functional Requirements

#### NFR-1: Performance
- Layout transitions: < 300ms
- Page load in split-screen: < 2s (with loading indicator)
- Chat message latency: < 500ms (first token)
- Memory footprint: < 50MB additional overhead

#### NFR-2: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support (Tab, Esc, Arrow keys)
- Screen reader compatibility (ARIA labels)
- High contrast mode support
- Focus management during transitions

#### NFR-3: Responsiveness
- Desktop: Full feature set (≥1280px width)
- Tablet: Stacked layout, swipe gestures (768-1279px)
- Mobile: Fullscreen only, no split-screen (< 768px)

#### NFR-4: Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AdvisorHub Frontend                   │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Adaptive Assistant Container              │  │
│  │                                                     │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐   │  │
│  │  │  Layout Manager │  │  State Machine       │   │  │
│  │  │  - Fullscreen   │  │  - Default           │   │  │
│  │  │  - Split        │  │  - Split-Screen      │   │  │
│  │  │  - Sidebar      │  │  - Sidebar           │   │  │
│  │  │  - Transitions  │  │  - Collapsed         │   │  │
│  │  └─────────────────┘  └──────────────────────┘   │  │
│  │                                                     │  │
│  │  ┌───────────────────────────────────────────┐   │  │
│  │  │         ChatKit Integration               │   │  │
│  │  │  - Message handling                        │   │  │
│  │  │  - Client tool callbacks                   │   │  │
│  │  │  - Navigation commands                     │   │  │
│  │  └───────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ Page Router  │  │  System Page Container   │  │  │
│  │  │ - Analytics  │  │  - iframe / React Portal │  │  │
│  │  │ - Customers  │  │  - State sync            │  │  │
│  │  │ - Quotes     │  │  - Event communication   │  │  │
│  │  └──────────────┘  └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │       OpenAI Agent Builder Workflow               │  │
│  │  - SmartPOS Agent                                  │  │
│  │  - Intent recognition                              │  │
│  │  - Tool calls for navigation                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```jsx
<AdaptiveAssistantProvider>
  <AssistantContainer
    mode={mode} // "fullscreen" | "split" | "sidebar" | "collapsed"
    currentPage={currentPage}
  >
    {/* Left Panel - Assistant Chat */}
    <AssistantPanel
      collapsed={mode === "collapsed"}
      width={mode === "split" ? "30%" : "100%"}
    >
      <ChatHeader />
      <ChatKit control={control} />
      <ChatFooter />
    </AssistantPanel>

    {/* Right Panel - System Page (split mode only) */}
    {mode === "split" && (
      <SystemPagePanel width="70%">
        <PageBreadcrumb path={currentPage} />
        <PageContainer>
          {/* Dynamically loaded page component */}
          {renderPage(currentPage)}
        </PageContainer>
      </SystemPagePanel>
    )}

    {/* Resize Handle */}
    {mode === "split" && (
      <ResizeHandle onDrag={handleResize} />
    )}
  </AssistantContainer>
</AdaptiveAssistantProvider>
```

---

## 🔧 Technical Implementation

### 1. State Management

**Using React Context + Zustand for global state:**

```typescript
// src/admin/state/adaptiveAssistantStore.ts
import { create } from 'zustand';

export type AssistantMode = 'fullscreen' | 'split' | 'sidebar' | 'collapsed' | 'hidden';

export interface AssistantState {
  mode: AssistantMode;
  currentPage: string | null;
  pageHistory: string[];
  sidebarWidth: number;
  pageWidth: number;
  isTransitioning: boolean;

  // Actions
  setMode: (mode: AssistantMode) => void;
  navigateToPage: (page: string) => void;
  goBack: () => void;
  toggleSidebar: () => void;
  setWidths: (sidebarWidth: number, pageWidth: number) => void;
  reset: () => void;
}

export const useAssistantStore = create<AssistantState>((set, get) => ({
  mode: 'fullscreen',
  currentPage: null,
  pageHistory: [],
  sidebarWidth: 30, // percentage
  pageWidth: 70,
  isTransitioning: false,

  setMode: (mode) => {
    set({ mode, isTransitioning: true });
    setTimeout(() => set({ isTransitioning: false }), 300);
  },

  navigateToPage: (page) => {
    const { currentPage, pageHistory, mode } = get();
    const newHistory = currentPage
      ? [...pageHistory, currentPage]
      : pageHistory;

    set({
      currentPage: page,
      pageHistory: newHistory,
      mode: mode === 'fullscreen' ? 'split' : mode
    });
  },

  goBack: () => {
    const { pageHistory } = get();
    if (pageHistory.length === 0) {
      set({ currentPage: null, mode: 'fullscreen' });
    } else {
      const newHistory = [...pageHistory];
      const previousPage = newHistory.pop();
      set({ currentPage: previousPage, pageHistory: newHistory });
    }
  },

  toggleSidebar: () => {
    const { mode } = get();
    if (mode === 'collapsed') {
      set({ mode: 'sidebar' });
    } else if (mode === 'sidebar' || mode === 'split') {
      set({ mode: 'collapsed' });
    }
  },

  setWidths: (sidebarWidth, pageWidth) => {
    set({ sidebarWidth, pageWidth });
  },

  reset: () => {
    set({
      mode: 'fullscreen',
      currentPage: null,
      pageHistory: [],
      sidebarWidth: 30,
      pageWidth: 70,
    });
  },
}));
```

### 2. Layout Components

#### AssistantContainer

```tsx
// src/admin/components/AdaptiveAssistant/AssistantContainer.tsx
import React, { useEffect } from 'react';
import { useAssistantStore } from '@/admin/state/adaptiveAssistantStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AssistantPanel } from './AssistantPanel';
import { SystemPagePanel } from './SystemPagePanel';
import { ResizeHandle } from './ResizeHandle';

export function AssistantContainer() {
  const { mode, currentPage, sidebarWidth, pageWidth } = useAssistantStore();

  useEffect(() => {
    // Add keyboard shortcuts
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useAssistantStore.getState().setMode('fullscreen');
      }
      if (e.key === 'Escape' && mode === 'fullscreen') {
        useAssistantStore.getState().setMode('hidden');
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [mode]);

  if (mode === 'hidden') {
    return null;
  }

  const layoutVariants = {
    fullscreen: {
      width: '100vw',
      height: '100vh',
      x: 0,
    },
    split: {
      width: '100vw',
      height: '100vh',
      x: 0,
    },
    sidebar: {
      width: '400px',
      height: '100vh',
      x: 0,
    },
    collapsed: {
      width: '48px',
      height: '100vh',
      x: 0,
    },
  };

  return (
    <motion.div
      className="fixed top-0 left-0 z-50 bg-white shadow-2xl"
      variants={layoutVariants}
      animate={mode}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="flex h-full">
        {/* Assistant Chat Panel */}
        <AssistantPanel
          width={mode === 'split' ? `${sidebarWidth}%` : '100%'}
          collapsed={mode === 'collapsed'}
        />

        {/* Resize Handle */}
        {mode === 'split' && (
          <ResizeHandle />
        )}

        {/* System Page Panel */}
        <AnimatePresence>
          {mode === 'split' && currentPage && (
            <SystemPagePanel
              width={`${pageWidth}%`}
              page={currentPage}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

#### AssistantPanel

```tsx
// src/admin/components/AdaptiveAssistant/AssistantPanel.tsx
import React from 'react';
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { X, Minimize2, Maximize2, ChevronLeft } from 'lucide-react';
import { useAssistantStore } from '@/admin/state/adaptiveAssistantStore';
import supabase from '@/admin/api/supabaseClient';

interface AssistantPanelProps {
  width: string;
  collapsed: boolean;
}

export function AssistantPanel({ width, collapsed }: AssistantPanelProps) {
  const { mode, setMode, goBack, currentPage } = useAssistantStore();

  const getClientSecret = async () => {
    const baseUrl = import.meta.env.VITE_AGENT_API_URL || '/api';
    const url = `${baseUrl}/agent-chat`;

    const headers = { 'Content-Type': 'application/json' };
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (anonKey) headers['apikey'] = anonKey;

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || anonKey;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode: 'get_client_secret' }),
    });

    if (!resp.ok) {
      throw new Error(`get_client_secret failed: ${resp.status}`);
    }

    const json = await resp.json();
    return json.client_secret;
  };

  const { control } = useChatKit({
    api: { getClientSecret },
    // Register client tools for navigation
    onClientTool: async (toolCall) => {
      if (toolCall.name === 'navigate_to_page') {
        const { page } = toolCall.params;
        useAssistantStore.getState().navigateToPage(page as string);
        return { success: true, page };
      }
      return { error: 'Unknown tool' };
    },
  });

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-gradient-to-b from-primary-500 to-blue-600 flex flex-col items-center py-4">
        <button
          onClick={() => setMode('sidebar')}
          className="text-white hover:bg-white/20 p-2 rounded transition-colors"
          aria-label="Expand assistant"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-slate-200"
      style={{ width }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {mode === 'split' && currentPage && (
            <button
              onClick={goBack}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="font-semibold text-sm">Mira</h3>
            <p className="text-xs text-blue-100">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'fullscreen' && (
            <button
              onClick={() => setMode('sidebar')}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Minimize to sidebar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setMode('hidden')}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ChatKit */}
      <div className="flex-1 overflow-hidden">
        <ChatKit
          control={control}
          onError={(e) => console.error('[ChatKit] error', e)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500 text-center">
        Mira can make mistakes. Verify important information.
      </div>
    </div>
  );
}
```

#### SystemPagePanel

```tsx
// src/admin/components/AdaptiveAssistant/SystemPagePanel.tsx
import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SystemPagePanelProps {
  width: string;
  page: string;
}

const pageComponents = {
  analytics: lazy(() => import('@/admin/pages/Analytics')),
  customers: lazy(() => import('@/admin/pages/Customer')),
  'customer-detail': lazy(() => import('@/admin/pages/CustomerDetail')),
  'new-business': lazy(() => import('@/admin/pages/NewBusiness')),
  'quick-quote': lazy(() => import('@/admin/pages/QuickQuote')),
  todo: lazy(() => import('@/admin/pages/ToDo')),
  broadcast: lazy(() => import('@/admin/pages/Broadcast')),
};

export function SystemPagePanel({ width, page }: SystemPagePanelProps) {
  const PageComponent = pageComponents[page as keyof typeof pageComponents];

  if (!PageComponent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Page not found: {page}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 overflow-auto bg-slate-50"
      style={{ width }}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        }
      >
        <PageComponent />
      </Suspense>
    </motion.div>
  );
}
```

### 3. Agent Builder Integration

#### Client Tool Configuration

**In OpenAI Agent Builder, register these client tools:**

```typescript
// Client Tool: navigate_to_page
{
  name: "navigate_to_page",
  description: "Navigate to a specific page in the AdvisorHub system",
  parameters: {
    type: "object",
    properties: {
      page: {
        type: "string",
        enum: [
          "analytics",
          "customers",
          "customer-detail",
          "new-business",
          "quick-quote",
          "todo",
          "broadcast"
        ],
        description: "The page to navigate to"
      },
      params: {
        type: "object",
        description: "Optional parameters (e.g., customer ID for detail pages)"
      }
    },
    required: ["page"]
  }
}

// Client Tool: highlight_element
{
  name: "highlight_element",
  description: "Highlight a specific element on the current page",
  parameters: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector for the element to highlight"
      },
      message: {
        type: "string",
        description: "Tooltip message to show"
      }
    },
    required: ["selector"]
  }
}
```

#### Agent Workflow Instructions

```
You are Mira, an intelligent AI assistant for AdvisorHub, an insurance agent management system.

When users ask to view or interact with specific parts of the system:
1. Determine which page they need
2. Use the navigate_to_page client tool to load that page
3. Provide contextual guidance about what they're viewing

Examples:
- "Show me my analytics" → navigate_to_page(page: "analytics")
- "I need to add a new customer" → navigate_to_page(page: "customers")
- "Create a quote for John Smith" → navigate_to_page(page: "quick-quote")

After navigation:
- Explain what the page shows
- Offer guidance on next steps
- Use highlight_element to draw attention to specific features

Always maintain conversation context and remember user preferences.
```

---

## 🧪 Testing Strategy

### Unit Tests
- **Component Tests**: Each layout component (AssistantPanel, SystemPagePanel, etc.)
- **State Tests**: Zustand store actions and state transitions
- **Hook Tests**: Custom hooks for keyboard shortcuts, resize handling

### Integration Tests
- **Mode Transitions**: Fullscreen → Split → Sidebar → Collapsed
- **Page Navigation**: Verify correct pages load with proper params
- **Client Tool Handling**: Test tool calls trigger correct actions
- **Resize Behavior**: Test panel width adjustments

### End-to-End Tests
- **User Flows**: Complete task scenarios (e.g., "View customer analytics")
- **Keyboard Navigation**: Test all shortcuts and focus management
- **Accessibility**: Screen reader compatibility, ARIA labels
- **Performance**: Measure transition times, memory usage

### Example Test Cases

```typescript
// test/adaptiveAssistant.test.tsx
describe('Adaptive Assistant', () => {
  it('should start in fullscreen mode', () => {
    render(<AdaptiveAssistantProvider><App /></AdaptiveAssistantProvider>);
    expect(screen.getByRole('dialog')).toHaveClass('fullscreen');
  });

  it('should transition to split mode when page navigation occurs', async () => {
    const { result } = renderHook(() => useAssistantStore());

    act(() => {
      result.current.navigateToPage('analytics');
    });

    await waitFor(() => {
      expect(result.current.mode).toBe('split');
      expect(result.current.currentPage).toBe('analytics');
    });
  });

  it('should handle client tool calls', async () => {
    const onClientTool = jest.fn();
    render(<AssistantPanel onClientTool={onClientTool} />);

    // Simulate tool call from ChatKit
    await act(async () => {
      await onClientTool({
        name: 'navigate_to_page',
        params: { page: 'customers' }
      });
    });

    expect(useAssistantStore.getState().currentPage).toBe('customers');
  });
});
```

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Code Splitting**: Lazy load page components in split-screen mode
2. **Memoization**: Use React.memo for layout components to prevent unnecessary re-renders
3. **Virtual Scrolling**: For long chat histories (react-window or react-virtuoso)
4. **Debounced Resize**: Throttle resize handler to 60fps
5. **Animation GPU Acceleration**: Use transform/opacity for transitions

### Performance Metrics

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Layout Transition | < 300ms | < 500ms |
| Page Load (Split) | < 2s | < 4s |
| Message Send | < 500ms | < 1s |
| Memory Usage | < 50MB | < 100MB |
| FPS (Transitions) | 60fps | 30fps |

### Monitoring

```typescript
// Performance tracking
import { useEffect } from 'react';

export function usePerformanceMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`[Performance] ${entry.name}: ${entry.duration}ms`);

            // Send to analytics
            if (entry.duration > 500) {
              trackEvent('performance_warning', {
                metric: entry.name,
                duration: entry.duration,
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      return () => observer.disconnect();
    }
  }, []);
}

// Usage in transitions
const handleTransition = () => {
  performance.mark('transition-start');
  setMode('split');

  setTimeout(() => {
    performance.mark('transition-end');
    performance.measure(
      'layout-transition',
      'transition-start',
      'transition-end'
    );
  }, 0);
};
```

---

## ♿ Accessibility Implementation

### ARIA Attributes

```tsx
<div
  role="complementary"
  aria-label="AI Assistant"
  aria-expanded={mode !== 'collapsed'}
  aria-hidden={mode === 'hidden'}
>
  <div role="region" aria-label="Chat messages">
    {/* Chat history */}
  </div>

  <div role="form" aria-label="Message input">
    {/* Input field */}
  </div>
</div>

{mode === 'split' && (
  <div
    role="main"
    aria-label={`${currentPage} page content`}
  >
    {/* System page */}
  </div>
)}
```

### Keyboard Navigation

| Key Combination | Action |
|----------------|--------|
| `Ctrl/Cmd + K` | Open assistant (fullscreen) |
| `Escape` | Close assistant / Exit fullscreen |
| `Ctrl/Cmd + [` | Go back (in split mode) |
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Tab` | Navigate interactive elements |
| `Shift + Tab` | Navigate backwards |
| `Alt + Left/Right` | Resize panels (in split mode) |

### Focus Management

```typescript
// src/admin/hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}
```

---

## 📅 Implementation Timeline

### Phase 1: Foundation (Week 1-2)
**Goal**: Build core layout system and state management

**Tasks**:
- [ ] Set up Zustand store for assistant state
- [ ] Create `AssistantContainer` component with mode transitions
- [ ] Implement `AssistantPanel` with ChatKit integration
- [ ] Build basic `SystemPagePanel` with lazy loading
- [ ] Add keyboard shortcuts (Ctrl+K, Escape)
- [ ] Implement smooth animations with Framer Motion
- [ ] Unit tests for state management
- [ ] Integration tests for mode transitions

**Deliverables**:
- Working fullscreen ↔ split-screen transitions
- Collapsible sidebar functionality
- Basic page navigation system

---

### Phase 2: Intelligence (Week 3-4)
**Goal**: Add context-aware features and Agent Builder integration

**Tasks**:
- [ ] Configure client tools in Agent Builder workflow
- [ ] Implement `onClientTool` handler for navigation
- [ ] Add page parameter support (e.g., customer IDs)
- [ ] Build breadcrumb navigation component
- [ ] Create tab system for multiple concurrent pages
- [ ] Add page state synchronization
- [ ] Implement contextual suggestions
- [ ] Integration tests for tool handling
- [ ] E2E tests for complete user flows

**Deliverables**:
- Agent can trigger page navigation via chat
- Support for detail pages with parameters
- Multi-page tab navigation
- Real-time state sync

---

### Phase 3: Polish & Optimization (Week 5-6)
**Goal**: Refine UX, add edge case handling, optimize performance

**Tasks**:
- [ ] Responsive design for tablet/mobile
- [ ] Accessibility audit and fixes
- [ ] Performance optimization (code splitting, memoization)
- [ ] Add loading states and error boundaries
- [ ] Implement user preferences (default mode, sidebar width)
- [ ] Add analytics tracking for feature usage
- [ ] Comprehensive accessibility testing
- [ ] Performance benchmarking
- [ ] User acceptance testing

**Deliverables**:
- WCAG 2.1 AA compliant
- < 300ms transition times
- Full responsive support
- Production-ready implementation

---

## 🚀 Deployment Strategy

### Rollout Plan

**Phase 1: Internal Beta (Week 7)**
- Deploy to staging environment
- Enable for internal team members only
- Gather feedback on UX and performance
- Monitor error logs and performance metrics

**Phase 2: Limited Release (Week 8)**
- Enable for 10% of users (feature flag)
- A/B test: Traditional UI vs. Adaptive Assistant
- Collect usage analytics and user feedback
- Iterate based on findings

**Phase 3: General Availability (Week 9+)**
- Gradual rollout to 100% of users
- Maintain traditional UI as fallback option
- Continuous monitoring and optimization

### Feature Flags

```typescript
// src/admin/utils/featureFlags.ts
export const FEATURE_FLAGS = {
  ADAPTIVE_ASSISTANT: 'adaptive_assistant_enabled',
  SPLIT_SCREEN_MODE: 'split_screen_mode_enabled',
  MULTI_PAGE_TABS: 'multi_page_tabs_enabled',
};

export function isFeatureEnabled(flag: string): boolean {
  // Check user's feature flags from backend
  const userFlags = getCurrentUserFeatureFlags();
  return userFlags[flag] === true;
}
```

### Rollback Plan

If critical issues arise:
1. Disable feature flag immediately
2. Users fall back to floating chat widget
3. Investigate and fix issues in staging
4. Re-enable gradually after verification

---

## 📈 Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| Task Completion Rate | 65% | 80% | Track successful task flows |
| Time to Complete Task | 45s | 30s | Measure from intent to completion |
| Assistant Engagement | 20% | 50% | % of users who interact with assistant |
| Page Views per Session | 3.2 | 4.5 | Track page navigation via assistant |
| User Satisfaction (NPS) | +20 | +40 | Post-interaction survey |
| Support Ticket Reduction | - | -30% | Compare before/after |

### Analytics Events to Track

```typescript
// Track these events for analysis
trackEvent('assistant_opened', { entry_point: 'floating_button' });
trackEvent('mode_transition', { from: 'fullscreen', to: 'split' });
trackEvent('page_navigation', { page: 'analytics', via: 'assistant' });
trackEvent('task_completed', { task_type: 'create_quote', duration_ms: 28000 });
trackEvent('assistant_closed', { mode: 'split', session_duration_ms: 120000 });
```

---

## 🔐 Security Considerations

### Data Privacy
- **No PII in Client Tools**: Don't pass sensitive data in tool parameters
- **Token Validation**: Verify Supabase auth tokens for all API requests
- **Session Management**: Clear assistant state on logout
- **Iframe Security**: Use CSP headers to prevent XSS in loaded pages

### Rate Limiting
- **ChatKit Requests**: Respect OpenAI rate limits
- **Page Navigation**: Prevent rapid navigation spam (debounce 500ms)
- **API Calls**: Implement exponential backoff for retries

### Error Handling
```typescript
// Graceful degradation
try {
  await navigateToPage('analytics');
} catch (error) {
  console.error('[Assistant] Navigation failed:', error);

  // Fallback to traditional navigation
  window.location.href = '/analytics';

  // Notify user
  toast.error('Assistant navigation failed. Opening page normally.');
}
```

---

## 📚 Documentation Requirements

### Developer Documentation
- [ ] Architecture overview diagram
- [ ] Component API reference
- [ ] State management guide
- [ ] Client tool registration guide
- [ ] Testing guide
- [ ] Performance optimization tips

### User Documentation
- [ ] Feature introduction video
- [ ] Keyboard shortcuts cheat sheet
- [ ] Tips & tricks for efficient usage
- [ ] FAQ and troubleshooting
- [ ] Accessibility features guide

### Agent Builder Documentation
- [ ] How to configure client tools
- [ ] Navigation command patterns
- [ ] Best practices for contextual guidance
- [ ] Example workflows

---

## 🤝 Team Roles & Responsibilities

| Role | Responsibilities | Team Member |
|------|-----------------|-------------|
| **Product Owner** | Define requirements, prioritize features, UAT | TBD |
| **Tech Lead** | Architecture decisions, code reviews, tech guidance | TBD |
| **Frontend Developer 1** | Layout system, state management, animations | TBD |
| **Frontend Developer 2** | ChatKit integration, client tools, page routing | TBD |
| **UI/UX Designer** | Visual design, interaction patterns, accessibility | TBD |
| **QA Engineer** | Test planning, automated tests, manual testing | TBD |
| **Agent Engineer** | Agent Builder workflow, prompt engineering | TBD |

---

## 📝 Appendix

### Dependencies

```json
{
  "dependencies": {
    "@openai/chatkit-react": "^1.2.0",
    "framer-motion": "^11.0.0",
    "zustand": "^4.5.0",
    "react-router-dom": "^6.21.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/react-hooks": "^8.0.1",
    "playwright": "^1.40.0"
  }
}
```

### Related Resources

- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/guides/chatkit)
- [Agent Builder Guide](https://platform.openai.com/docs/guides/agent-builder)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-06 | Initial specification | Claude Code |

---

## ✅ Sign-off

**Prepared By**: Claude Code Assistant
**Date**: 2025-11-06
**Status**: Draft - Pending Review

**Approvals Required**:
- [ ] Product Owner
- [ ] Tech Lead
- [ ] UI/UX Designer
- [ ] Engineering Manager

---

*This is a living document. Please submit updates via pull request or direct edits.*
