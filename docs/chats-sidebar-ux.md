# Chats Sidebar & History UX

## Sidebar Overview
- Purpose: quick access to the last 20 Mira conversations.
- Behaviors: recency sorting, thin-scroll region after ~7 items, dedicated **All Chats** action.

### Expanded Sidebar Wireframe
```
┌──────────────────────────────┐
│ Chats                        │ ← section header
├──────────────────────────────┤
│ ● Renewal follow-up     2m   │
│   Updated 2m ago             │
│------------------------------│
│ ● Onboarding walkthrough ... │
│   Updated 15m ago            │ ← list scrolls independently
│   ⋮                          │
│------------------------------│
│ ● Claims escalation     Tue  │
│   Last reply Tuesday         │
├──────────────────────────────┤
│ [ ⋯ All Chats ]              │ ← fixed CTA (icon + label)
└──────────────────────────────┘
```

### Collapsed Sidebar Wireframe
```
┌──────┐
│ 💬   │ ← icon button: opens Ask Mira
├──────┤
│ ◎    │ ← stacked chat icons (recent threads)
│ ◎    │
│ ◎    │
│ ⋮    │
├──────┤
│ ⋯    │ ← All Chats icon button
└──────┘
```

### Interaction Notes
- Hover states highlight rows without shifting layout.
- Active chat row stays tinted while viewing that thread.
- Scroll only affects the list region; header and CTA stay pinned.

## “All Chats” Page Wireframe
```
┌────────────────────────────────────────────────────┐
│ All Chats         [Search........][Sort: Recent ▾] │
├────────────────────────────────────────────────────┤
│ ● Renewal follow-up        Updated 2 minutes ago   │
│   Last message • “Policy renewal quote looks good” │
├────────────────────────────────────────────────────┤
│ ● Policy comparison        Yesterday               │
│   Last message • “Let’s compare premiums.”         │
├────────────────────────────────────────────────────┤
│ ● Claims escalation        3 Oct                   │
│   Last message • “Escalated to compliance team.”   │
├────────────────────────────────────────────────────┤
│                     … more rows …                  │
└────────────────────────────────────────────────────┘
```
- Search filters titles & previews (debounced).
- Sort toggles: `Recent`, `Oldest`, `Alphabetical`.
- Row click navigates back to Mira chat with that thread selected.

## Component Specs
- `MiraChatProvider`
  - Context wrapper supplying recent threads, active thread id, and mutations (touch, rename, delete).
  - Persists active thread in session storage.
- `MiraChatSidebar`
  - Consumes provider data, renders scrollable list, handles empty/error states.
  - Emits `onSelect(threadId)` to provider, triggers navigation.
- `MiraChatListItem`
  - Displays title + relative timestamp + optional subtitle.
  - Accepts `isActive`, `onClick`, `updatedAt` props.
- `AllChatsPage`
  - Uses search + sort controls, fetches full list via `MiraChatProvider` helpers.
  - Reuses `MiraChatListItem` styling for consistency.
- `RelativeTimeLabel`
  - Utility component or hook to display “Updated 2m ago”, “Yesterday”, etc.
- Data source: `adviseUAdminApi.entities.MiraChat` (Supabase-backed threads table).
- Route additions: `/chat` (single session) and `/chats` (history index).
