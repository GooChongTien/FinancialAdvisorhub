# MIRA Smart Navigation Feature

## Overview

The MIRA Smart Navigation feature enables intelligent routing of users to the appropriate screen based on their conversation with MIRA. When users click starter prompts or type natural language queries, MIRA detects the intent and automatically navigates them to the most relevant page while opening the split-view chat panel.

## Architecture

### Components

1. **Intent Routing Configuration** (`src/lib/aial/intent/intentRouting.js`)
   - Maps conversation intents to application routes
   - Detects intent from user prompts using keyword matching
   - Builds navigation URLs based on intent and execution results

2. **Home Page Integration** (`src/admin/pages/Home.jsx`)
   - Enhanced starter prompt buttons with smart navigation
   - Auto-detection of intent from free-text queries
   - Seamless integration with AgentChatProvider

3. **Translation Support** (`src/lib/i18n/locales/*/translation.json`)
   - Multilingual support for all starter prompts
   - Languages: English, Spanish, Chinese, Malay, Tamil, Hindi

## Intent-to-Route Mapping

The system supports the following intent categories:

### Customer Intents
- `customer.analysis` → Customer List page
- `customer.search` → Customer List page
- `customer.temperature` → Customer List page with temperature filter

### Analytics Intents
- `analytics.sales` → Analytics Dashboard
- `analytics.performance` → Analytics Dashboard
- `analytics.dashboard` → Analytics Dashboard

### Task & Meeting Intents
- `task.list` → Smart Plan page
- `meeting.prep` → Smart Plan page
- `todo.view` → Smart Plan page

### Compliance & Alerts
- `compliance.alert` → Smart Plan page

### Lead Enrichment
- `lead.enrichment` → Proposal Detail page (when lead found)
- Fallback → Customer List page (when lead not found)

### Service Requests
- `service.request` → Service Requests page
- `service.detail` → Service Request Detail page

### Other Intents
- `news.view` → News page
- `entity.customer` → Entity Customers page
- `product.search` → Products page
- `smartplan.view` → Smart Plan page

## How It Works

### Starter Prompt Flow

1. **User clicks a starter prompt button**
   - Example: "Show me my top customers by premium value"

2. **System determines the target route**
   - Uses predefined route from starter prompt configuration
   - Example: `Customer` page

3. **Navigation occurs**
   - User navigated to the target page
   - Split-view chat panel opens
   - Prompt sent to MIRA for processing

4. **MIRA responds with contextual answer**
   - Response tailored to the current page context
   - User can continue conversation in split-view

### Free-Text Query Flow

1. **User types a custom query**
   - Example: "What are my sales trends for this quarter?"

2. **System detects intent**
   - Keyword-based intent detection
   - Example: Detects "sales" + "quarter" → `analytics.sales` intent

3. **Navigation URL built**
   - Maps intent to route: `analytics.sales` → `/advisor/analytics`

4. **Smart navigation executes**
   - Navigates to Analytics page
   - Opens split-view
   - Sends query to MIRA

## Configuration

### Adding New Intents

To add a new intent route mapping, edit `src/lib/aial/intent/intentRouting.js`:

```javascript
export const INTENT_ROUTE_MAP = {
  "your.intent.name": {
    route: "PageRouteName",
    requiresParams: false, // Set to true if URL needs params
    getParams: (intentResult) => {
      // Optional: build query params from intent result
      return `id=${intentResult.someId}`;
    },
    fallbackRoute: "FallbackPageName", // Optional fallback
  },
};
```

### Adding New Starter Prompts

1. **Update Intent Routing** (`src/lib/aial/intent/intentRouting.js`):

```javascript
export function getStarterPrompts() {
  return [
    // ... existing prompts
    {
      key: "yourNewPrompt",
      intent: "your.intent.name",
      route: "YourTargetPage",
      prompt: "Your prompt text here",
    },
  ];
}
```

2. **Add Translations** (all language files in `src/lib/i18n/locales/*/translation.json`):

```json
{
  "home": {
    "prompts": {
      "yourNewPrompt": {
        "title": "Your Title",
        "description": "Your description",
        "prompt": "Your prompt text"
      }
    }
  }
}
```

3. **Add Icon and Color** (`src/admin/pages/Home.jsx`):

```javascript
import { YourIcon } from "lucide-react";

const starterPrompts = React.useMemo(() => [
  // ... existing prompts
  {
    ...starterPromptsConfig[4], // Your new prompt
    icon: YourIcon,
    color: "bg-indigo-50 text-indigo-600",
  },
], [starterPromptsConfig]);
```

## Intent Detection Algorithm

The `detectIntentFromPrompt()` function uses keyword matching:

```javascript
// Example: Customer analysis detection
if (
  (lc.includes("customer") || lc.includes("client")) &&
  (lc.includes("top") || lc.includes("premium") || lc.includes("value"))
) {
  return "customer.analysis";
}
```

**Best Practices:**
- Use specific combinations to avoid false positives
- Order checks from most specific to least specific
- Consider synonyms and variations
- Test with real user queries

## Telemetry

The system tracks navigation events for analytics:

```javascript
trackMiraEvent("mira.smart_navigation", {
  persona,
  mode: activeMode,
  detectedIntent,
  targetRoute: navigationUrl,
  source: "home-dashboard-starter" | "home-dashboard-auto",
});
```

**Tracked Fields:**
- `persona` - User's MIRA persona setting
- `mode` - Current MIRA mode (command, assistant, etc.)
- `detectedIntent` - Which intent was detected
- `targetRoute` - Where the user was navigated to
- `source` - How navigation was triggered (starter button vs auto-detection)

## Testing

### Manual Testing Checklist

- [ ] Click each starter prompt button
- [ ] Verify navigation to correct page
- [ ] Confirm split-view opens
- [ ] Check MIRA receives and processes prompt
- [ ] Test free-text queries for each intent category
- [ ] Verify fallback behavior when intent not detected
- [ ] Test all translations (6 languages)
- [ ] Verify telemetry events fire correctly

### Test Queries

**Customer Analysis:**
- "Show me my top customers by premium"
- "Which clients have the highest value?"

**Sales Performance:**
- "What are my sales trends for this quarter?"
- "Show me performance for this month"

**Pending Tasks:**
- "Show me my pending tasks"
- "What appointments do I have coming up?"

**Recommendations:**
- "What recommendations do you have for me?"
- "Give me some insights for today"

## Troubleshooting

### Navigation Not Working

**Symptom:** User clicks starter prompt but stays on home page

**Possible Causes:**
1. Route not defined in `pageRoutes` (src/admin/utils/index.js)
2. `navigate()` function not available in component
3. JavaScript error in `handleCommandRun`

**Solution:**
- Check browser console for errors
- Verify route exists in routing configuration
- Ensure React Router is properly configured

### Wrong Page Opened

**Symptom:** Navigation goes to incorrect page

**Possible Causes:**
1. Intent detection matching wrong pattern
2. Route mapping misconfigured
3. Multiple intents matching (ambiguous prompt)

**Solution:**
- Review `detectIntentFromPrompt()` logic
- Make intent patterns more specific
- Check `INTENT_ROUTE_MAP` configuration

### MIRA Not Responding

**Symptom:** Navigation works but chat doesn't start

**Possible Causes:**
1. `sendMessage()` not being called
2. AgentChatProvider not initialized
3. Split-view not opening

**Solution:**
- Verify `openSplit()` is called
- Check AgentChatProvider is wrapping the app
- Inspect network requests for chat API calls

## Future Enhancements

1. **ML-Based Intent Detection**
   - Replace keyword matching with trained model
   - Improve accuracy for ambiguous queries
   - Support more natural language variations

2. **Contextual Routing**
   - Consider user's current page when routing
   - Maintain context across navigation
   - Smart back-button behavior

3. **Multi-Step Workflows**
   - Chain multiple screens for complex tasks
   - Guided navigation with progress indicators
   - Resume interrupted workflows

4. **Personalized Prompts**
   - Learn from user's frequent queries
   - Suggest prompts based on behavior
   - Adaptive starter button order

5. **Voice Navigation**
   - Voice-activated starter prompts
   - Hands-free navigation
   - Integration with voice transcription

## Related Files

- `src/lib/aial/intent/intentRouting.js` - Core routing logic
- `src/admin/pages/Home.jsx` - Home page with starter prompts
- `src/admin/utils/index.js` - Route definitions
- `src/lib/aial/intent/leadEnrichment.js` - Lead intent executor
- `src/lib/aial/intent/meetingPrep.js` - Meeting intent executor
- `src/lib/aial/intent/complianceAlert.js` - Compliance intent executor
- `src/admin/state/providers/AgentChatProvider.jsx` - Chat state management
- `src/lib/i18n/locales/*/translation.json` - Translations

## Support

For issues or questions about MIRA Smart Navigation:
1. Check this documentation
2. Review telemetry events in MIRA Ops Console
3. Inspect browser console for errors
4. Contact development team with reproduction steps
