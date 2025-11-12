# Chats Sidebar Feature & UI/UX Summary

## Purpose
- Surface up to 20 of the most recent Mira chat sessions directly in the side menu.
- Allow advisors to resume conversations quickly without opening the full chat history.
- Provide a persistent entry point into the comprehensive “All Chats” archive.

## Key Behaviours
- **Recency-first list**: Threads sorted by last update time (most recent on top); capped at 20 items to preserve scannability.
- **Independent scroll**: When the list exceeds ~7 items, a lightweight scrollbar appears inside the sidebar panel only.
- **Thread cards**: Each row shows the chat title (auto-generated) and a relative timestamp (“Updated 2m ago”, “Yesterday”, etc.); active chat remains highlighted.
- **Collapsed mode**: Sidebar icons condense into circular buttons—recent chats as stacked glyphs with tooltips, plus an always-visible “All Chats” icon.
- **CTA placement**: “All Chats” button stays pinned at the bottom of the section for consistent access.

## All Chats View
- Full-page archive accessed via the CTA.
- Includes search (title + message preview), sort control (Recent, Oldest, Alphabetical), and list of every chat thread.
- Selecting a row opens Mira in the main workspace with that thread active; “New Chat” button starts a fresh thread.

## Deferred Items
- Supabase data model & migrations for persistent threads will be defined once Mira conversation data requirements are aligned in a later phase.
