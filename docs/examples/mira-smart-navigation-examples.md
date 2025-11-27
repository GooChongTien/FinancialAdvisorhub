# MIRA Smart Navigation - Code Examples

## Example 1: Adding a New Starter Prompt

Let's add a "Policy Review" starter prompt that navigates to the Policies page.

### Step 1: Add Intent Route Mapping

**File:** `src/lib/aial/intent/intentRouting.js`

```javascript
export const INTENT_ROUTE_MAP = {
  // ... existing mappings

  // New intent for policy review
  "policy.review": {
    route: "PolicyDetail",
    requiresParams: false,
  },
};
```

### Step 2: Add Intent Detection

**File:** `src/lib/aial/intent/intentRouting.js`

```javascript
export function detectIntentFromPrompt(prompt) {
  if (!prompt) return "advisor.action.summary";
  const lc = prompt.toLowerCase();

  // ... existing detection logic

  // New: Policy review detection
  if (
    (lc.includes("policy") || lc.includes("policies")) &&
    (lc.includes("review") || lc.includes("check") || lc.includes("status"))
  ) {
    return "policy.review";
  }

  return "advisor.action.summary";
}
```

### Step 3: Add to Starter Prompts Configuration

**File:** `src/lib/aial/intent/intentRouting.js`

```javascript
export function getStarterPrompts() {
  return [
    // ... existing prompts
    {
      key: "policyReview",
      intent: "policy.review",
      route: "PolicyDetail",
      prompt: "Show me my active policies that need review",
    },
  ];
}
```

### Step 4: Add Translations

**File:** `src/lib/i18n/locales/en/translation.json`

```json
{
  "home": {
    "prompts": {
      "policyReview": {
        "title": "Policy Review",
        "description": "Review active policies and their status",
        "prompt": "Show me my active policies that need review"
      }
    }
  }
}
```

**Repeat for other languages:** es, zh, ms, ta, hi

### Step 5: Add Icon and Styling

**File:** `src/admin/pages/Home.jsx`

```javascript
import {
  CheckSquare,
  Sparkles,
  TrendingUp,
  Users,
  Shield, // New icon for policy review
} from "lucide-react";

const starterPrompts = React.useMemo(() => [
  {
    ...starterPromptsConfig[0],
    icon: Users,
    color: "bg-blue-50 text-blue-600",
  },
  {
    ...starterPromptsConfig[1],
    icon: TrendingUp,
    color: "bg-purple-50 text-purple-600",
  },
  {
    ...starterPromptsConfig[2],
    icon: CheckSquare,
    color: "bg-green-50 text-green-600",
  },
  {
    ...starterPromptsConfig[3],
    icon: Sparkles,
    color: "bg-orange-50 text-orange-600",
  },
  {
    ...starterPromptsConfig[4], // New policy review prompt
    icon: Shield,
    color: "bg-red-50 text-red-600",
  },
], [starterPromptsConfig]);
```

### Step 6: Update Grid Layout (Optional)

If adding a 5th button, update the grid to show 3 columns on larger screens:

**File:** `src/admin/pages/Home.jsx`

```jsx
{/* Starter Buttons Grid */}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {starterPrompts.map((item) => (
    // ... button JSX
  ))}
</div>
```

## Example 2: Creating a Dynamic Route with Parameters

Let's create a "Customer Detail" intent that navigates to a specific customer.

### Step 1: Intent Executor

**File:** `src/lib/aial/intent/customerDetail.js`

```javascript
import { registerExecutor, unregisterExecutor } from "./executor.js";
import { getIntentSchema } from "./catalog.js";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { createPageUrl } from "@/admin/utils";

let registrationCount = 0;
let activeExecutor = null;

function makeExecutor({ fetchCustomers, createDestination }) {
  return async (intent, environment = {}) => {
    const prompt = environment.event?.payload?.prompt ?? "";
    const customerName = extractCustomerNameFromPrompt(prompt);

    if (!customerName) {
      return {
        status: "skipped",
        message: "Customer name could not be inferred.",
      };
    }

    const customers = await fetchCustomers();
    const match = findCustomerByName(customers, customerName);

    if (!match) {
      return {
        status: "not_found",
        message: `No customer found matching "${customerName}".`,
      };
    }

    const destination = createDestination(match.id);
    if (environment.navigate) {
      environment.navigate(destination);
    }

    return {
      status: "navigated",
      customer: {
        id: match.id,
        name: match.name,
      },
      navigationUrl: destination,
    };
  };
}

export function registerCustomerDetailExecutor(options = {}) {
  registrationCount += 1;
  if (registrationCount === 1) {
    const executor = makeExecutor({
      fetchCustomers: options.fetchCustomers ??
        (() => adviseUAdminApi.entities.Lead.list(100)),
      createDestination: options.createDestination ??
        ((customerId) => createPageUrl(`CustomerDetail?id=${customerId}`)),
    });
    activeExecutor = executor;
    registerExecutor("customer.detail", executor);
  }

  return () => {
    registrationCount = Math.max(0, registrationCount - 1);
    if (registrationCount === 0 && activeExecutor) {
      unregisterExecutor("customer.detail");
      activeExecutor = null;
    }
  };
}

function extractCustomerNameFromPrompt(prompt) {
  // Extract customer name from phrases like "Show me details for John Doe"
  const match = prompt.match(/(?:for|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  return match ? match[1] : null;
}

function findCustomerByName(customers, name) {
  const lowerName = name.toLowerCase();
  return customers.find(c =>
    c.name?.toLowerCase().includes(lowerName)
  );
}
```

### Step 2: Register Executor in Home Page

**File:** `src/admin/pages/Home.jsx`

```javascript
import { registerCustomerDetailExecutor } from "@/lib/aial/intent/customerDetail.js";

React.useEffect(() => {
  const cleanups = [
    registerLeadEnrichmentExecutor(),
    registerMeetingPrepExecutor({
      fetchTasks: () => adviseUAdminApi.entities.Task.list("-date", 20),
    }),
    registerComplianceAlertExecutor(),
    registerCustomerDetailExecutor(), // New executor
  ];
  return () => {
    cleanups.forEach((dispose) => dispose?.());
  };
}, []);
```

### Step 3: Add to Route Map

**File:** `src/lib/aial/intent/intentRouting.js`

```javascript
export const INTENT_ROUTE_MAP = {
  // ... existing mappings

  "customer.detail": {
    route: "CustomerDetail",
    requiresParams: true,
    getParams: (intentResult) => {
      if (intentResult?.customer?.id) {
        return `id=${intentResult.customer.id}`;
      }
      return null;
    },
    fallbackRoute: "Customer",
  },
};
```

## Example 3: Custom Intent Detection Logic

Create a more sophisticated intent detector using multiple signals:

**File:** `src/lib/aial/intent/intentRouting.js`

```javascript
/**
 * Advanced intent detection with confidence scoring
 */
export function detectIntentWithConfidence(prompt) {
  if (!prompt) return { intent: "advisor.action.summary", confidence: 0 };

  const lc = prompt.toLowerCase();
  const scores = [];

  // Customer analysis intent
  if (lc.includes("customer") || lc.includes("client")) {
    let score = 0.3;
    if (lc.includes("top") || lc.includes("best")) score += 0.3;
    if (lc.includes("premium") || lc.includes("value")) score += 0.2;
    if (lc.includes("analysis") || lc.includes("analyze")) score += 0.2;
    scores.push({ intent: "customer.analysis", confidence: score });
  }

  // Sales analytics intent
  if (lc.includes("sales") || lc.includes("performance")) {
    let score = 0.3;
    if (lc.includes("trend") || lc.includes("chart")) score += 0.3;
    if (lc.includes("quarter") || lc.includes("month")) score += 0.2;
    if (lc.includes("dashboard") || lc.includes("report")) score += 0.2;
    scores.push({ intent: "analytics.sales", confidence: score });
  }

  // Task management intent
  if (lc.includes("task") || lc.includes("todo")) {
    let score = 0.4;
    if (lc.includes("pending") || lc.includes("upcoming")) score += 0.3;
    if (lc.includes("list") || lc.includes("show")) score += 0.2;
    scores.push({ intent: "task.list", confidence: score });
  }

  // Sort by confidence and return highest
  scores.sort((a, b) => b.confidence - a.confidence);

  if (scores.length > 0 && scores[0].confidence >= 0.5) {
    return scores[0];
  }

  return { intent: "advisor.action.summary", confidence: 0 };
}
```

## Example 4: Conditional Navigation

Navigate only if certain conditions are met:

**File:** `src/admin/pages/Home.jsx`

```javascript
const handleCommandRun = React.useCallback(
  async (input, options = {}) => {
    const trimmed = input.trim();
    if (!trimmed || isRunningCommand) return;

    // ... existing code ...

    // Detect intent with confidence
    const { intent: detectedIntent, confidence } =
      detectIntentWithConfidence(trimmed);

    // Only navigate if confidence is high
    if (confidence >= 0.7) {
      const navigationUrl = buildNavigationUrl(detectedIntent);

      if (navigationUrl) {
        navigate(navigationUrl);
        openSplit();
        sendMessage(trimmed);

        void trackMiraEvent("mira.smart_navigation", {
          persona,
          mode: activeMode,
          detectedIntent,
          confidence,
          targetRoute: navigationUrl,
          source: "home-dashboard-auto",
        });
        return;
      }
    }

    // Low confidence: just open split view without navigation
    openSplit();
    sendMessage(trimmed);

    void trackMiraEvent("mira.low_confidence_query", {
      persona,
      mode: activeMode,
      detectedIntent,
      confidence,
      source: "home-dashboard",
    });
  },
  [/* dependencies */]
);
```

## Example 5: Multi-Language Intent Detection

Support intent detection across multiple languages:

**File:** `src/lib/aial/intent/multilingualIntentDetection.js`

```javascript
const INTENT_KEYWORDS = {
  "customer.analysis": {
    en: ["customer", "client", "top", "premium", "value"],
    es: ["cliente", "mejor", "prima", "valor"],
    zh: ["客户", "顶级", "保费", "价值"],
    ms: ["pelanggan", "teratas", "premium", "nilai"],
    ta: ["வாடிக்கையாளர்", "சிறந்த", "பிரீமியம்"],
    hi: ["ग्राहक", "शीर्ष", "प्रीमियम", "मूल्य"],
  },
  "analytics.sales": {
    en: ["sales", "trend", "performance", "quarter"],
    es: ["ventas", "tendencia", "rendimiento", "trimestre"],
    zh: ["销售", "趋势", "表现", "季度"],
    ms: ["jualan", "trend", "prestasi", "suku tahun"],
    ta: ["விற்பனை", "போக்கு", "செயல்திறன்"],
    hi: ["बिक्री", "प्रवृत्ति", "प्रदर्शन", "तिमाही"],
  },
};

export function detectIntentMultilingual(prompt, language = "en") {
  if (!prompt) return "advisor.action.summary";

  const lc = prompt.toLowerCase();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const langKeywords = keywords[language] || keywords.en;
    const matchCount = langKeywords.filter(kw => lc.includes(kw)).length;

    // If at least 2 keywords match, consider it the intent
    if (matchCount >= 2) {
      return intent;
    }
  }

  return "advisor.action.summary";
}
```

## Testing Examples

### Unit Test for Intent Detection

```javascript
import { detectIntentFromPrompt } from "@/lib/aial/intent/intentRouting";

describe("Intent Detection", () => {
  test("detects customer analysis intent", () => {
    const prompts = [
      "Show me my top customers by premium value",
      "Which clients have the highest value?",
      "Top customers by premium",
    ];

    prompts.forEach(prompt => {
      const intent = detectIntentFromPrompt(prompt);
      expect(intent).toBe("customer.analysis");
    });
  });

  test("detects analytics intent", () => {
    const intent = detectIntentFromPrompt(
      "What are my sales trends for this quarter?"
    );
    expect(intent).toBe("analytics.sales");
  });

  test("returns default for ambiguous prompt", () => {
    const intent = detectIntentFromPrompt("Hello");
    expect(intent).toBe("advisor.action.summary");
  });
});
```

### Integration Test for Navigation

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "@/admin/pages/Home";

describe("MIRA Smart Navigation", () => {
  test("navigates to customer page on starter prompt click", async () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const customerButton = screen.getByText("Customer Analysis");
    fireEvent.click(customerButton);

    // Wait for navigation
    await waitFor(() => {
      expect(window.location.pathname).toBe("/advisor/customers");
    });
  });
});
```

## Tips and Best Practices

1. **Start Simple**: Begin with keyword-based detection, add ML later if needed
2. **Test Thoroughly**: Cover edge cases and ambiguous queries
3. **Monitor Telemetry**: Track which intents are most used
4. **Iterate**: Refine detection logic based on user behavior
5. **Fallback Gracefully**: Always have a default behavior
6. **Keep Routes Updated**: Ensure all routes in mapping exist in router
7. **Document Intents**: Maintain list of supported intents
8. **Consider Context**: Use page context for better routing decisions
9. **Validate Params**: Check route parameters before navigation
10. **Handle Errors**: Catch and log navigation failures
