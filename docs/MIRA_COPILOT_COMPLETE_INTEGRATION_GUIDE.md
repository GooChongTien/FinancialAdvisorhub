# Mira Co-Pilot - Complete Integration Guide

**Version:** 1.0
**Date:** November 19, 2025
**Status:** Production Ready ✅

## Executive Summary

This guide provides complete integration instructions for the **Mira Co-Pilot** system - a next-generation AI assistant that combines behavioral intelligence, pattern recognition, smart actions, and proactive UI to create an unprecedented user experience.

### What is Mira Co-Pilot?

Mira Co-Pilot is an **intelligent, context-aware assistant** that:
- 🧠 **Learns from user behavior** - Tracks navigation, actions, and patterns
- 🔍 **Detects patterns** - Recognizes when users struggle or succeed
- ⚡ **Suggests smart actions** - Recommends next steps based on context
- 🎯 **Executes proactively** - Offers to complete tasks before you ask
- 🎨 **Adapts to preferences** - Fully customizable behavior and UI

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MIRA CO-PILOT SYSTEM                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  PHASE A: Behavioral Tracking Foundation                            │
├──────────────────────────────────────────────────────────────────────┤
│  • BehavioralTracker - Tracks clicks, navigation, form interactions │
│  • BehavioralAnalyticsUploader - Uploads data to backend            │
│  • Privacy controls and data sanitization                           │
└──────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE B: Pattern Recognition Engine                                │
├──────────────────────────────────────────────────────────────────────┤
│  • PatternMatchingEngine - Real-time pattern detection              │
│  • PatternLibrary - 8 pre-built patterns (struggle, success, etc.)  │
│  • PatternDetectors - Specialized detectors for each module         │
│  • ProactivePatternEngine - Emerging pattern detection              │
└──────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE C: Smart Contextual Actions                                  │
├──────────────────────────────────────────────────────────────────────┤
│  • ActionRegistry - 17 pre-built action templates                   │
│  • ActionExecutor - Validation, permissions, undo/redo              │
│  • ActionSuggestionEngine - Context-aware suggestions               │
│  • KeyboardShortcutManager - Cmd/Ctrl+K and action shortcuts        │
└──────────────────────────────────────────────────────────────────────┘
                                 ↓
┌──────────────────────────────────────────────────────────────────────┐
│  PHASE D: Proactive Assistance UI                                   │
├──────────────────────────────────────────────────────────────────────┤
│  • CommandPalette - Global command palette (Cmd/Ctrl+K)             │
│  • ProactiveSuggestionToast - Non-intrusive notifications           │
│  • InlineSuggestionPanel - Sidebar suggestions                      │
│  • ContextualHelp - Smart tooltips and guidance                     │
│  • EngagementTracker - Learning from user interactions              │
│  • UserPreferences - Comprehensive settings management              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complete File Structure

```
src/
├── lib/mira/
│   ├── behavioral-tracker.ts              (Phase A - 800 lines)
│   ├── behavioral-analytics-uploader.ts   (Phase A - 400 lines)
│   ├── pattern-library.ts                 (Phase B - 650 lines)
│   ├── pattern-detectors.ts               (Phase B - 850 lines)
│   ├── pattern-matching-engine.ts         (Phase B - 700 lines)
│   ├── suggestion-engagement-tracker.ts   (Phase D - 450 lines)
│   ├── user-preferences.ts                (Phase D - 500 lines)
│   ├── actions/
│   │   ├── types.ts                       (Phase C - 330 lines)
│   │   ├── action-templates.ts            (Phase C - 540 lines)
│   │   ├── action-executor.ts             (Phase C - 480 lines)
│   │   ├── action-suggestions.ts          (Phase C - 380 lines)
│   │   ├── action-registry.ts             (Phase C - 250 lines)
│   │   ├── keyboard-shortcuts.ts          (Phase C - 340 lines)
│   │   └── index.ts                       (Phase C - 25 lines)
│   └── proactive-ui/
│       └── index.ts                       (Phase D - 10 lines)
│
└── admin/
    ├── components/mira/
    │   ├── CommandPalette.tsx             (Phase D - 370 lines)
    │   ├── ProactiveSuggestionToast.tsx   (Phase D - 170 lines)
    │   ├── ContextualHelp.tsx             (Phase D - 290 lines)
    │   └── index.ts                       (Phase D - 10 lines)
    ├── components/MiraCopilot/
    │   ├── InlineSuggestionPanel.tsx      (Existing - 215 lines)
    │   └── ActionCard.tsx                 (Existing - 70 lines)
    └── hooks/
        └── useCommandPalette.ts           (Phase D - 60 lines)

docs/
├── PHASE_A_IMPLEMENTATION_SUMMARY.md
├── PHASE_B_IMPLEMENTATION_SUMMARY.md
├── PHASE_C_IMPLEMENTATION_SUMMARY.md
├── PHASE_D_IMPLEMENTATION_SUMMARY.md
└── MIRA_COPILOT_COMPLETE_INTEGRATION_GUIDE.md (this file)

**Total:** ~8,000 lines of production code across 4 phases
```

---

## Quick Start: 5-Minute Integration

### Step 1: Initialize Behavioral Tracking

```tsx
// src/App.tsx or your root component
import { useEffect } from "react";
import { behavioralTracker } from "@/lib/mira/behavioral-tracker";
import { miraUserPreferences } from "@/lib/mira/user-preferences";

function App() {
  useEffect(() => {
    // Check if tracking is enabled in preferences
    const prefs = miraUserPreferences.getPreferences();

    if (prefs.privacy.trackBehavior) {
      // Start behavioral tracking
      behavioralTracker.startTracking();

      console.log("Mira behavioral tracking started");
    }

    return () => {
      // Cleanup on unmount
      behavioralTracker.destroy();
    };
  }, []);

  return (
    <div className="app">
      {/* Your app content */}
    </div>
  );
}
```

### Step 2: Add Command Palette

```tsx
// src/App.tsx
import { CommandPalette, useCommandPalette } from "@/admin/components/mira";
import { actionExecutor } from "@/lib/mira/actions";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider";

function App() {
  const { isOpen, close } = useCommandPalette(); // Automatically registers Cmd/Ctrl+K
  const { getContext } = useMiraContext();

  const handleActionSelect = async (action) => {
    await actionExecutor.execute({
      action,
      parameters: {},
      context: getContext(),
    });
  };

  return (
    <>
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        onActionSelect={handleActionSelect}
      />
      {/* Rest of your app */}
    </>
  );
}
```

### Step 3: Add Inline Suggestions

```tsx
// src/admin/layout/AdminLayout.tsx
import { InlineSuggestionPanel } from "@/admin/components/mira";
import { useAgentChat } from "@/admin/hooks/useAgentChat";

function AdminLayout({ children }) {
  const { sendMessage, isLoading } = useAgentChat();

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <InlineSuggestionPanel
          onSuggestionSelect={(suggestion) => {
            sendMessage(suggestion.promptText);
          }}
          isBusy={isLoading}
        />
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

### Step 4: Enable Proactive Suggestions

```tsx
// src/components/MiraProactiveManager.tsx
import { useEffect, useState } from "react";
import { ProactiveSuggestionToast } from "@/admin/components/mira";
import { actionSuggestionEngine } from "@/lib/mira/actions";
import { suggestionEngagementTracker, miraUserPreferences } from "@/lib/mira/proactive-ui";
import { behavioralTracker } from "@/lib/mira/behavioral-tracker";
import { patternMatchingEngine } from "@/lib/mira/pattern-matching-engine";

export function MiraProactiveManager() {
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  useEffect(() => {
    // Subscribe to emerging patterns
    const unsubscribe = patternMatchingEngine.onEmergingPatterns(
      async (patterns) => {
        // Get preferences
        const prefs = miraUserPreferences.getPreferences();
        if (!prefs.suggestions.showToasts) return;

        // Get behavioral context
        const context = behavioralTracker.getContext();

        // Generate suggestions from patterns
        const suggestions = await actionSuggestionEngine.getSuggestions(context, 1);

        if (suggestions.length > 0) {
          const suggestion = suggestions[0];

          // Check if should show
          if (miraUserPreferences.shouldShowSuggestion(
            suggestion.confidence,
            context.currentModule
          )) {
            // Track shown
            const eventId = suggestionEngagementTracker.trackShown(
              suggestion,
              context,
              "toast"
            );

            setActiveSuggestion({ suggestion, eventId });
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  const handleAccept = async (suggestion, eventId) => {
    const context = behavioralTracker.getContext();

    // Track acceptance
    suggestionEngagementTracker.trackAccepted(
      eventId,
      suggestion,
      context,
      "toast"
    );

    // Execute action
    await actionExecutor.execute({
      action: suggestion.action,
      parameters: suggestion.suggestedParameters || {},
      context,
    });

    setActiveSuggestion(null);
  };

  const handleDismiss = (suggestion, eventId) => {
    const context = behavioralTracker.getContext();

    // Track dismissal
    suggestionEngagementTracker.trackDismissed(
      eventId,
      suggestion,
      context,
      undefined,
      "toast"
    );

    setActiveSuggestion(null);
  };

  if (!activeSuggestion) return null;

  return (
    <ProactiveSuggestionToast
      suggestion={activeSuggestion.suggestion}
      onAccept={() => handleAccept(activeSuggestion.suggestion, activeSuggestion.eventId)}
      onDismiss={() => handleDismiss(activeSuggestion.suggestion, activeSuggestion.eventId)}
      autoHideDuration={miraUserPreferences.getPreferences().notifications.autoHideDuration}
      position={miraUserPreferences.getPreferences().notifications.position}
    />
  );
}
```

### Step 5: Add to Root Layout

```tsx
// src/App.tsx - Complete integration
import { BrowserRouter } from "react-router-dom";
import { MiraContextProvider } from "@/admin/state/providers/MiraContextProvider";
import { CommandPalette, useCommandPalette } from "@/admin/components/mira";
import { MiraProactiveManager } from "@/components/MiraProactiveManager";
import { actionExecutor } from "@/lib/mira/actions";
import { useMiraContext } from "@/admin/state/providers/MiraContextProvider";

function AppContent() {
  const { isOpen, close } = useCommandPalette();
  const { getContext } = useMiraContext();

  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        onActionSelect={async (action) => {
          await actionExecutor.execute({
            action,
            parameters: {},
            context: getContext(),
          });
        }}
      />

      {/* Proactive Suggestions */}
      <MiraProactiveManager />

      {/* Your routes */}
      <Routes>
        {/* ... */}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MiraContextProvider>
        <AppContent />
      </MiraContextProvider>
    </BrowserRouter>
  );
}
```

---

## Advanced Integration

### Adding Contextual Help to Forms

```tsx
// src/admin/pages/Customer.tsx
import { ContextualHelp } from "@/admin/components/mira";

function CustomerForm() {
  return (
    <form>
      <div>
        <label htmlFor="customer-income">Annual Income</label>
        <input id="customer-income" type="number" />

        <ContextualHelp
          targetId="customer-income"
          content={{
            title: "Annual Income Guidelines",
            description: "Enter the customer's gross annual income before taxes.",
            tips: [
              "Include salary, bonuses, and commissions",
              "Add investment income if substantial",
              "Use most recent tax return as reference"
            ],
            docsUrl: "/docs/customer-income",
            relatedActions: [
              {
                label: "Import from last year",
                action: () => autoFillFromLastYear()
              }
            ]
          }}
          trigger="hover"
          placement="right"
          delay={500}
        />
      </div>
    </form>
  );
}
```

### Creating Custom Actions

```tsx
// src/lib/mira/custom-actions.ts
import { actionRegistry } from "@/lib/mira/actions";
import type { MiraAction } from "@/lib/mira/actions/types";

// Define custom action
const customAction: MiraAction = {
  id: "export_customer_report",
  name: "Export Customer Report",
  description: "Export detailed customer analysis as PDF",
  category: "data",
  priority: "high",
  requiredPermission: "read",
  requiresConfirmation: false,
  undoable: false,
  icon: "file-down",
  keyboard_shortcut: "ctrl+shift+e",
  tags: ["export", "report", "customer"],
  parameters: [
    {
      name: "customerId",
      type: "string",
      required: true,
      description: "Customer ID to export"
    },
    {
      name: "format",
      type: "string",
      required: false,
      defaultValue: "pdf",
      constraints: {
        enum: ["pdf", "csv", "excel"]
      }
    }
  ]
};

// Register custom action
actionRegistry.registerAction(customAction);

// Register execution handler
actionExecutor.registerHandler("export_customer_report", async (params, context) => {
  const response = await fetch(`/api/customers/${params.customerId}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format: params.format || "pdf" })
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `customer-${params.customerId}.${params.format}`;
  a.click();

  return {
    success: true,
    message: "Report exported successfully",
    data: { downloadUrl: url }
  };
});
```

### Creating Custom Patterns

```tsx
// src/lib/mira/custom-patterns.ts
import { patternLibrary } from "@/lib/mira/pattern-library";
import type { Pattern } from "@/lib/mira/types";

const customPattern: Pattern = {
  id: "custom_export_workflow",
  patternType: "export_workflow",
  patternName: "Export Workflow Detection",
  description: "User is preparing to export data",
  category: "workflow",
  indicators: {
    required: [
      { type: "navigation", value: "/analytics" },
      { type: "filter_application", value: "date_range" },
      { type: "time_on_page", value: 30000, operator: ">" }
    ],
    optional: [
      { type: "scroll_to_bottom", value: true }
    ]
  },
  confidence: {
    baseConfidence: 0.7,
    requiredIndicatorWeight: 0.9,
    optionalIndicatorWeight: 0.1
  },
  suggestedActions: [
    "export_analytics_report",
    "apply_analytics_filter",
    "create_dashboard_bookmark"
  ],
  triggerConditions: {
    minConfidence: 0.75,
    cooldownPeriod: 60000
  }
};

// Register custom pattern
patternLibrary.registerPattern(customPattern);
```

---

## Configuration & Settings

### User Preference Presets

```typescript
import { miraUserPreferences } from "@/lib/mira/user-preferences";

// Apply preset for new users
miraUserPreferences.applyPreset("beginner");

// Or for power users
miraUserPreferences.applyPreset("advanced");

// Custom configuration
miraUserPreferences.updatePreferences({
  proactiveMode: "balanced",
  suggestions: {
    enabled: true,
    showToasts: true,
    minConfidenceThreshold: 0.75,
    suggestionFrequency: "medium"
  },
  notifications: {
    position: "bottom-right",
    autoHideDuration: 8000
  }
});
```

### Privacy Settings

```typescript
// Disable behavioral tracking
miraUserPreferences.updateSection("privacy", {
  trackBehavior: false,
  shareAnonymousData: false
});

// Set data retention
miraUserPreferences.updateSection("privacy", {
  dataRetentionDays: 7 // Only keep 7 days of data
});
```

### Module-Specific Settings

```typescript
// Disable suggestions for specific modules
miraUserPreferences.updateSection("moduleSettings", {
  customer: { enabled: true },
  analytics: { enabled: true },
  broadcast: { enabled: false } // No suggestions in broadcast
});
```

---

## Monitoring & Analytics

### Engagement Statistics

```typescript
import { suggestionEngagementTracker } from "@/lib/mira/suggestion-engagement-tracker";

// Get overall statistics
const stats = suggestionEngagementTracker.getStats();

console.log(`Acceptance Rate: ${stats.acceptanceRate.toFixed(1)}%`);
console.log(`Average Time to Interaction: ${stats.avgTimeToInteraction}ms`);
console.log(`Top Accepted Patterns:`, stats.topAcceptedPatterns);
console.log(`Top Dismissed Patterns:`, stats.topDismissedPatterns);

// Get recent events
const recentEvents = suggestionEngagementTracker.getRecentEvents(20);

// Export for analysis
const allEvents = suggestionEngagementTracker.getStats();
```

### Pattern Performance

```typescript
import { patternMatchingEngine } from "@/lib/mira/pattern-matching-engine";

// Get pattern statistics
const patternStats = patternMatchingEngine.getStats();

console.log(`Total Patterns: ${patternStats.totalPatterns}`);
console.log(`Active Patterns: ${patternStats.activePatterns}`);
console.log(`Avg Confidence: ${patternStats.averageConfidence}`);

// Get top performing patterns
const topPatterns = patternMatchingEngine.getTopPerformingPatterns(10);
```

### Action Usage

```typescript
import { actionRegistry } from "@/lib/mira/actions";

// Get action statistics
const actionStats = actionRegistry.getStats();

console.log(`Total Actions: ${actionStats.totalActions}`);
console.log(`Actions by Category:`, actionStats.actionsByCategory);
console.log(`Actions with Shortcuts: ${actionStats.actionsWithShortcuts}`);

// Get most used actions
const mostUsed = actionRegistry.getMostUsedActions(10);
```

---

## Testing

### Unit Tests Example

```typescript
// tests/mira/integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { behavioralTracker } from "@/lib/mira/behavioral-tracker";
import { patternMatchingEngine } from "@/lib/mira/pattern-matching-engine";
import { actionSuggestionEngine } from "@/lib/mira/actions";

describe("Mira Integration", () => {
  beforeEach(() => {
    behavioralTracker.clearHistory();
  });

  it("should detect pattern and suggest action", async () => {
    // Simulate user navigation
    behavioralTracker.trackNavigation({
      fromPage: "/dashboard",
      toPage: "/customers",
      module: "customer"
    });

    behavioralTracker.trackNavigation({
      fromPage: "/customers",
      toPage: "/customer/123",
      module: "customer"
    });

    // Get behavioral context
    const context = behavioralTracker.getContext();

    // Match patterns
    const patterns = await patternMatchingEngine.matchPatterns(context);

    expect(patterns.length).toBeGreaterThan(0);

    // Generate suggestions
    const suggestions = await actionSuggestionEngine.getSuggestions(context, 3);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].action).toBeDefined();
    expect(suggestions[0].confidence).toBeGreaterThan(0);
  });
});
```

---

## Performance Optimization

### 1. Lazy Loading

```typescript
// Lazy load pattern detectors
const patternDetectors = {
  customer: () => import("@/lib/mira/pattern-detectors/customer"),
  analytics: () => import("@/lib/mira/pattern-detectors/analytics"),
  // ...
};

// Load only when needed
const detector = await patternDetectors[module]();
```

### 2. Debouncing

```typescript
// Debounce pattern matching
import { debounce } from "lodash";

const debouncedPatternMatch = debounce(
  () => patternMatchingEngine.matchPatterns(context),
  1000 // Wait 1 second after last action
);
```

### 3. Memoization

```typescript
import { useMemo } from "react";

function MiraComponent() {
  const suggestions = useMemo(
    () => actionSuggestionEngine.getSuggestions(context),
    [context.currentPage, context.currentModule] // Only recalculate on page/module change
  );
}
```

---

## Troubleshooting

### Issue: Command Palette doesn't open

**Solution:**
```typescript
// Check if keyboard shortcuts are enabled
const prefs = miraUserPreferences.getPreferences();
console.log("Shortcuts enabled:", prefs.keyboardShortcuts.enabled);

// Manually open
const { open } = useCommandPalette();
open();
```

### Issue: No suggestions appearing

**Solution:**
```typescript
// Check preferences
const prefs = miraUserPreferences.getPreferences();
console.log("Suggestions enabled:", prefs.suggestions.enabled);
console.log("Min confidence:", prefs.suggestions.minConfidenceThreshold);

// Check if patterns are being detected
const context = behavioralTracker.getContext();
const patterns = await patternMatchingEngine.matchPatterns(context);
console.log("Detected patterns:", patterns);
```

### Issue: Behavioral tracking not working

**Solution:**
```typescript
// Check if tracking is started
console.log("Tracking active:", behavioralTracker.isTracking());

// Start manually
behavioralTracker.startTracking();

// Check privacy settings
const prefs = miraUserPreferences.getPreferences();
console.log("Track behavior:", prefs.privacy.trackBehavior);
```

---

## Security Best Practices

### 1. Data Sanitization

```typescript
// Never track sensitive form values
behavioralTracker.setSensitiveFields([
  "password",
  "credit_card",
  "ssn",
  "nric",
  "medical_history"
]);
```

### 2. Permission Checks

```typescript
// Always check permissions before executing actions
actionExecutor.execute({
  action,
  parameters,
  context: {
    ...context,
    permissions: ["read", "write"] // User's actual permissions
  }
});
```

### 3. Data Retention

```typescript
// Set appropriate retention period
miraUserPreferences.updateSection("privacy", {
  dataRetentionDays: 30 // Comply with privacy regulations
});
```

---

## Deployment Checklist

- [ ] All 4 phases integrated (A, B, C, D)
- [ ] Command Palette accessible via Cmd/Ctrl+K
- [ ] Inline suggestions panel visible in layout
- [ ] Proactive toasts configured and working
- [ ] User preferences accessible in settings
- [ ] Contextual help added to key forms
- [ ] Behavioral tracking initialized on app mount
- [ ] Pattern detection active
- [ ] Action executor registered with all handlers
- [ ] Engagement tracking uploading to backend
- [ ] Privacy settings configured appropriately
- [ ] Performance optimizations applied (debouncing, memoization)
- [ ] Error boundaries in place
- [ ] Accessibility tested (keyboard navigation, screen readers)
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness checked
- [ ] Analytics/monitoring configured
- [ ] Documentation updated
- [ ] User onboarding/tutorial created

---

## Support & Resources

### Documentation
- [Phase A: Behavioral Tracking](./PHASE_A_IMPLEMENTATION_SUMMARY.md)
- [Phase B: Pattern Recognition](./PHASE_B_IMPLEMENTATION_SUMMARY.md)
- [Phase C: Smart Actions](./PHASE_C_IMPLEMENTATION_SUMMARY.md)
- [Phase D: Proactive UI](./PHASE_D_IMPLEMENTATION_SUMMARY.md)

### Code Examples
- See `src/lib/mira/` for core implementations
- See `src/admin/components/mira/` for UI components
- See `tests/` for comprehensive test examples

### Troubleshooting
- Check browser console for Mira debug logs (prefix: `[Mira]`, `[BehavioralTracker]`, etc.)
- Use React DevTools to inspect component state
- Check localStorage for `mira_user_preferences` and other Mira data

---

## Conclusion

The Mira Co-Pilot system is now fully integrated and production-ready. With **8,000+ lines of production code** across **4 comprehensive phases**, you have a best-in-class AI assistant that:

✅ Learns from user behavior
✅ Detects patterns intelligently
✅ Suggests smart actions
✅ Executes proactively
✅ Respects user preferences
✅ Provides contextual help
✅ Improves continuously

**Welcome to the future of AI-assisted workflows!**
