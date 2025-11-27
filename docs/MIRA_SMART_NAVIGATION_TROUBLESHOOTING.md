# MIRA Smart Navigation - Troubleshooting Guide

## Issue: Split View Opens But No MIRA Response

### Symptoms
- User clicks starter prompt button
- Page navigates to the correct screen
- Split view panel opens on the right
- **BUT**: MIRA doesn't show any response or the chat is empty

### Root Cause
This was a **timing issue**. The original implementation was:
1. Navigate to new page
2. Open split view
3. Send message to MIRA

The problem: `sendMessage()` was called **before** the navigation completed, so the message context was lost or the chat panel wasn't fully mounted.

### Solution Applied
Changed the execution order and added rendering delay:

```javascript
// BEFORE (broken):
navigate(route);
openSplit();
sendMessage(prompt); // Called too early!

// AFTER (fixed):
openSplit();              // 1. Open split view first
navigate(route);          // 2. Navigate to target page
requestAnimationFrame(() => {  // 3. Wait for render
  requestAnimationFrame(() => {
    sendMessage(prompt);  // 4. Send message after render complete
  });
});
```

### Why This Works
1. **`openSplit()`** - Tells the split view to open (updates state machine)
2. **`navigate()`** - Initiates page transition
3. **Double `requestAnimationFrame`** - Ensures:
   - First RAF: Navigation state update processed
   - Second RAF: New page fully rendered and split view mounted
   - Then `sendMessage()` executes with proper context

### Alternative Solutions Considered

#### Option 1: setTimeout with fixed delay
```javascript
setTimeout(() => sendMessage(prompt), 300);
```
**Pros:** Simple, works most of the time
**Cons:** Fixed delay might be too short on slow devices or too long on fast ones

#### Option 2: useEffect with location dependency
```javascript
useEffect(() => {
  if (pendingMessage) {
    sendMessage(pendingMessage);
    setPendingMessage(null);
  }
}, [location]);
```
**Pros:** Reacts to actual navigation changes
**Cons:** More complex state management, harder to debug

#### Option 3: React Router's useNavigate callback
```javascript
navigate(route, { state: { sendPrompt: prompt } });
// In target page: useEffect with location.state
```
**Pros:** Proper data flow
**Cons:** Requires changes to every target page

**We chose `requestAnimationFrame` because it's:**
- Browser-native timing
- Adapts to actual rendering speed
- No arbitrary delays
- Clean implementation

## Testing the Fix

### Manual Test Steps

1. **Navigate to Home Page** (`/advisor/home`)

2. **Click "Customer Analysis" Starter Button**
   - Expected: Navigate to `/advisor/customers`
   - Expected: Split view opens on right side
   - Expected: MIRA shows typing indicator immediately
   - Expected: MIRA responds with "Show me my top customers by premium value"

3. **Click "Sales Performance" Starter Button**
   - Expected: Navigate to `/advisor/analytics`
   - Expected: Split view opens
   - Expected: MIRA processes "What are my sales trends for this quarter?"

4. **Click "Pending Tasks" Starter Button**
   - Expected: Navigate to `/advisor/smart-plan`
   - Expected: Split view opens
   - Expected: MIRA shows tasks

5. **Click "Recommendations" Starter Button**
   - Expected: Navigate to `/advisor/smart-plan`
   - Expected: Split view opens
   - Expected: MIRA provides recommendations

### Debugging Tips

If messages still don't appear:

1. **Check Browser Console**
   ```javascript
   // Look for errors like:
   // "AgentChatProvider not found"
   // "sendMessage is not a function"
   ```

2. **Verify Provider Hierarchy**
   ```javascript
   // Ensure this hierarchy in App.jsx:
   <AgentChatProvider>
     <MiraChatProvider>
       <SplitViewWrapper>
         <Routes>...</Routes>
       </SplitViewWrapper>
     </MiraChatProvider>
   </AgentChatProvider>
   ```

3. **Check Network Tab**
   - Look for POST requests to `/api/agent-chat`
   - Verify request payload contains your message
   - Check for 200 OK response

4. **Inspect Split View State**
   ```javascript
   // Add to Home.jsx temporarily:
   console.log('Split mode:', mode);
   console.log('AgentChat messages:', messages);
   ```

5. **Verify Navigation Completed**
   ```javascript
   // Add to Home.jsx:
   console.log('Navigating to:', targetRoute);
   console.log('Location after navigate:', location.pathname);
   ```

## Common Issues and Fixes

### Issue: Message Sends But No Response

**Symptom:** Message appears in chat but MIRA never responds

**Possible Causes:**
1. Agent API not running
2. SUPABASE_ANON_KEY missing
3. Network error

**Fix:**
```bash
# Check if agent API is accessible
curl http://localhost:54321/functions/v1/agent-chat

# Verify environment variables
echo $VITE_SUPABASE_ANON_KEY
echo $VITE_SUPABASE_URL
```

### Issue: Multiple Messages Sent

**Symptom:** Same prompt appears multiple times in chat

**Possible Causes:**
1. Multiple clicks (user impatience)
2. React strict mode double-rendering

**Fix:** Already handled by `isRunningCommand` check:
```javascript
if (!trimmed || isRunningCommand) return;
```

### Issue: Wrong Page Opened

**Symptom:** Clicking "Customer Analysis" goes to wrong page

**Possible Causes:**
1. Route mapping incorrect
2. Intent detection wrong

**Fix:**
```javascript
// Verify in intentRouting.js:
"customer.analysis": {
  route: "Customer",  // Should match pageRoutes key
}

// Verify in src/admin/utils/index.js:
const pageRoutes = {
  Customer: "/advisor/customers",  // Must exist
}
```

### Issue: Split View Doesn't Open

**Symptom:** Navigation works but split view never appears

**Possible Causes:**
1. `useMiraMode` not available
2. State machine issue

**Fix:**
```javascript
// Check if MiraMode provider is wrapping the app
// Verify in App.jsx or layout:
import { MiraModeProvider } from '@/admin/state/MiraModeProvider';

<MiraModeProvider>
  <YourApp />
</MiraModeProvider>
```

## Performance Considerations

### RequestAnimationFrame vs setTimeout

**RequestAnimationFrame:**
- Syncs with browser's repaint cycle (typically 16.67ms @ 60fps)
- Adapts to actual rendering speed
- Pauses when tab is not visible (saves CPU)

**Performance Impact:**
- Negligible delay: ~33ms (2 frames)
- User perception: Instantaneous
- No blocking or janky UI

### Memory Leaks

**Concern:** Does `requestAnimationFrame` create memory leaks?

**Answer:** No, because:
1. Callback executes once and completes
2. No event listeners attached
3. No long-running timers
4. Component unmount doesn't affect queued RAF

**If you need to cancel** (not required in this case):
```javascript
const rafId = requestAnimationFrame(() => {
  sendMessage(prompt);
});

// To cancel (if component unmounts):
return () => cancelAnimationFrame(rafId);
```

## Browser Compatibility

RequestAnimationFrame is supported in:
- ✅ Chrome/Edge 10+
- ✅ Firefox 4+
- ✅ Safari 6+
- ✅ All modern mobile browsers

No polyfill needed for this application.

## Related Code Changes

### Files Modified
- `src/admin/pages/Home.jsx:227-274` - Added double RAF delay before sendMessage

### Key Functions
- `handleCommandRun` - Main handler for starter prompts
- `sendMessage` - From AgentChatProvider
- `navigate` - From React Router
- `openSplit` - From useMiraMode

## Monitoring and Telemetry

The fix includes telemetry tracking:

```javascript
trackMiraEvent("mira.smart_navigation", {
  persona,
  mode: activeMode,
  intentGuess: intentName,
  targetRoute: shouldNavigateDirectly,
  source: "home-dashboard-starter",
});
```

**What to monitor:**
1. **Smart navigation event count** - Should increase with fix
2. **Chat message sent event** - Should fire ~33ms after navigation
3. **Error events** - Should decrease

## Rollback Plan

If the fix causes issues, revert to direct calling:

```javascript
// Revert to immediate sendMessage (old behavior):
openSplit();
navigate(route);
sendMessage(prompt);  // Remove RAF wrapper
```

**Impact:** Messages might be lost on navigation, but no crashes.

## Future Improvements

1. **Add Loading State**
   ```javascript
   const [navigating, setNavigating] = useState(false);

   // Show spinner during navigation
   if (navigating) return <Spinner />;
   ```

2. **Persistent Message Queue**
   ```javascript
   // Store pending messages in localStorage
   // Retry if send fails
   ```

3. **Navigation Complete Callback**
   ```javascript
   // Use React Router's future API when available
   navigate(route, {
     onComplete: () => sendMessage(prompt)
   });
   ```

4. **Optimistic UI Updates**
   ```javascript
   // Show message immediately in UI
   // Mark as "pending" until server confirms
   ```

## Summary

**The Issue:** Timing problem - message sent before navigation rendered
**The Fix:** Double `requestAnimationFrame` to delay message sending
**Result:** Split view + MIRA response work reliably on all starter prompts

**Test it yourself:**
1. Go to `/advisor/home`
2. Click any starter prompt
3. Verify you see MIRA's response in split view

Questions? Check:
- Network tab for API calls
- Console for errors
- Provider hierarchy in React DevTools
