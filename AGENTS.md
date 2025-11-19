# AGENTS.md - Codex Custom Instructions

This file provides context and guidelines for OpenAI Codex when working with this codebase. Codex automatically reads this file to understand project conventions, architecture, and preferences.

## Project Overview

**AdvisorHub** is an insurance advisor application that helps insurance advisors manage leads, customers, proposals, policies, and analytics. The application includes an AI assistant named "Mira" for intelligent task automation and assistance.

### Tech Stack

**Frontend:**
- React 18 + Vite
- TypeScript/JavaScript (mixed codebase)
- Tailwind CSS for styling
- Radix UI for accessible component primitives
- React Router v6 for routing
- TanStack Query (React Query) for data fetching
- Zustand for state management
- XState for complex state machines

**Backend:**
- Supabase (PostgreSQL database + Edge Functions)
- TypeScript for Edge Functions
- OpenAI/Anthropic APIs for AI features
- Supabase Auth for authentication

**Testing:**
- Playwright for E2E tests
- Vitest for unit tests
- k6 for load testing

---

## Project Structure

```
AdvisorHub/
├── src/
│   ├── admin/              # Main admin application
│   │   ├── api/           # API clients (Supabase, adviseUAdminApi)
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── state/         # State management (Zustand stores)
│   │   └── utils/         # Utilities and helpers
│   ├── lib/
│   │   ├── aial/          # AIAL (AI Abstraction Layer)
│   │   └── mira/          # Mira AI agent integration
│   └── entities/          # JSON schemas for data entities
├── backend/               # Backend services (if any)
├── supabase/
│   ├── functions/         # Supabase Edge Functions
│   └── migrations/        # Database migrations
├── tests/                 # Test files
└── docs/                  # Documentation
```

---

## Code Style & Conventions

### File Naming
- React components: PascalCase (e.g., `LeadList.jsx`, `CustomerDetail.tsx`)
- Utilities/helpers: camelCase (e.g., `utils.js`, `e2eHelpers.ts`)
- API files: camelCase (e.g., `agent-chat.ts`, `supabase.ts`)
- Test files: `.spec.ts` or `.test.ts` suffix

### Component Structure
```jsx
// Preferred component structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';

export function ComponentName({ prop1, prop2 }) {
  // Hooks first
  const { data } = useQuery(...);
  
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {...}, []);
  
  // Handlers
  const handleClick = () => {...};
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### TypeScript vs JavaScript
- **Use TypeScript** for new files, especially:
  - Backend/Edge Functions (`supabase/functions/**/*.ts`)
  - Complex utilities
  - API clients
  - Test files
- **JavaScript is acceptable** for:
  - Existing React components (migrate gradually)
  - Simple utilities
  - Scripts

### Import Organization
1. React and React-related imports
2. Third-party libraries
3. Internal utilities/helpers
4. Types/interfaces
5. Relative imports (components, etc.)

```javascript
// Example
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/admin/components/ui/button';
import { adviseUAdminApi } from '@/admin/api/adviseUAdminApi';
import type { Lead } from '@/entities/Lead.schema.json';
```

---

## Key Patterns & Best Practices

### Data Fetching
- **Always use TanStack Query** for API calls
- Use query keys that match the data structure
- Implement proper error handling and loading states

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['leads', leadId],
  queryFn: () => adviseUAdminApi.leads.get(leadId),
});
```

### State Management
- **Zustand** for global state (user preferences, auth state)
- **React Query** for server state
- **Local state** (`useState`) for UI-only state
- **XState** for complex state machines (Mira agent flows)

### Styling
- **Tailwind CSS** utility classes (preferred)
- Use `clsx` for conditional classes
- Custom components in `src/admin/components/ui/` follow shadcn/ui patterns

### Error Handling
- Always handle errors gracefully
- Show user-friendly error messages
- Log errors appropriately (use backend logger for server-side)

### API Integration
- Use `adviseUAdminApi` for admin API calls
- Use `supabaseClient` for direct Supabase operations
- Edge Functions are in `supabase/functions/`

---

## Mira AI Agent Integration

### Overview
Mira is the AI assistant integrated into AdvisorHub. It uses:
- **AIAL (AI Abstraction Layer)** for provider abstraction
- **Supabase Edge Functions** for agent endpoints
- **Intent-based routing** for understanding user requests

### Key Files
- `src/lib/mira/` - Frontend Mira integration
- `supabase/functions/agent-chat/` - Main agent chat endpoint
- `supabase/functions/agent-tools/` - Agent tools endpoint
- `backend/services/agent/` - Agent service layer

### When Working with Mira
- Follow the intent-based architecture
- Use the established patterns in existing Mira code
- Reference `docs/MIRA_*` files for architecture details

---

## Database & Supabase

### Schema
- Database migrations in `supabase/migrations/`
- Follow naming conventions: `YYYYMMDD_description.sql`
- Use RLS (Row Level Security) policies

### Edge Functions
- TypeScript only
- Use Deno runtime (Supabase Edge Functions use Deno)
- Import from `_shared/` for common utilities
- Follow the pattern in existing functions

---

## Testing

### E2E Tests (Playwright)
- Located in `tests/e2e/`
- Use `tests/utils/e2eHelpers.ts` for common utilities
- Follow existing test patterns

### Unit Tests (Vitest)
- Located alongside source files or in `tests/`
- Use `@testing-library/react` for component tests
- Mock Supabase/API calls appropriately

---

## Common Tasks & Patterns

### Adding a New Page
1. Create component in `src/admin/pages/`
2. Add route in `src/admin/utils/index.js` (pageRoutes)
3. Add navigation item in `AdminLayout.jsx` if needed
4. Create API functions if needed

### Adding a New API Endpoint
1. Create Edge Function in `supabase/functions/`
2. Add API client method in `src/admin/api/adviseUAdminApi.js`
3. Use TanStack Query in components

### Working with Forms
- Use React Hook Form for form management
- Use Zod for validation schemas
- Follow existing form patterns in the codebase

---

## Things to Avoid

❌ **Don't:**
- Mix different state management libraries unnecessarily
- Create new API clients when `adviseUAdminApi` exists
- Hardcode API URLs (use environment variables)
- Skip error handling
- Ignore TypeScript errors (fix or properly type)
- Create components without proper prop types
- Use inline styles when Tailwind classes work

✅ **Do:**
- Follow existing patterns
- Use TypeScript for new files
- Write tests for new features
- Document complex logic
- Use existing utilities and helpers
- Follow the project's file structure

---

## Environment Variables

Key environment variables (see `.env.example` if exists):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key (backend)
- `ANTHROPIC_API_KEY` - Anthropic API key (backend)

---

## Documentation

- Architecture docs: `docs/MIRA_*`, `docs/AI_INTEGRATION_*`
- Setup guides: `SETUP_INSTRUCTIONS.md`, `CODEX_SETUP.md`
- Implementation plans: `docs/MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md`

---

## When Codex Makes Changes

1. **Preserve existing patterns** - Follow the codebase style
2. **Update related files** - If changing an API, update types, tests, etc.
3. **Add error handling** - Don't skip error cases
4. **Use TypeScript** - Prefer TypeScript for new code
5. **Test changes** - Consider adding/updating tests
6. **Document complex logic** - Add comments for non-obvious code

---

## Quick Reference

**Start dev server:** `npm run dev`  
**Run tests:** `npm run test:unit` or `npm run test:e2e`  
**Format code:** `npm run format`  
**Build:** `npm run build`

**Main entry points:**
- Frontend: `src/main.jsx`
- Admin app: `src/admin/` directory
- Edge Functions: `supabase/functions/`

---

This file helps Codex understand your project better. Update it as the project evolves!

