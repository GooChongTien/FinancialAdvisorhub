# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdvisorHub is an insurance advisor application built as a wireframe/prototype using React + Vite + Tailwind CSS. The project follows a component-based architecture with JSON schemas defining data entities.

**Tech Stack:**
- Frontend: React 18 + Vite
- Styling: Tailwind CSS
- Routing: React Router v6
- Data: JSON schemas + Supabase client (configured but may use Base44 client)
- UI Components: Custom components with Radix UI primitives (@radix-ui/react-*)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

## Project Architecture

### Routing System
All routes are centralized in `src/admin/utils/index.js`:
- Exports `pageRoutes` object mapping route names to paths
- Use `createPageUrl(descriptor)` to programmatically create URLs
- Use `getPageNameFromPath(pathname)` to get route name from path
- All routes are wrapped in `Layout` component with sidebar navigation

**Route structure:**
```
/ → Home (Dashboard)
/customers → Customer List
/customers/detail → Customer Detail
/new-business → New Business (Proposal Wizard)
/quick-quote → Quick Quote
/quote-summary → Quote Summary
/proposals/detail → Proposal Detail
/policies/detail → Policy Detail
/analytics → Analytics Dashboard
/smart-plan → Smart Plan
/broadcast → Broadcast Messages
/profile-settings → Profile Settings
```

### Component Organization

```
src/
├── admin/
│   ├── api/
│   │   ├── adviseUAdminApi.js
│   │   └── supabaseClient.js
│   ├── components/
│   │   └── ui/                 # shadcn-style base components
│   ├── layout/
│   │   └── AdminLayout.jsx     # Main layout wrapper with sidebar
│   ├── modules/
│   │   ├── analytics/
│   │   │   ├── api/
│   │   │   └── components/
│   │   ├── customers/
│   │   │   └── components/
│   │   └── recommendation/
│   │       └── components/
│   ├── pages/                  # Route-level screens
│   ├── state/                  # React contexts and providers
│   └── utils/                  # Shared helpers (routing, formatting)
├── entities/                   # JSON schemas defining data structures
├── lib/                        # Shared libraries
├── App.jsx                     # Router wiring for admin portal
├── index.css                   # Global styles
└── main.jsx                    # Entry point (ReactDOM.render)
```

### Data Schema System

Entity schemas are defined in `src/entities/*.schema.json`. These JSON schemas define the structure for:
- **Lead**: Customer leads with contact info, status, source tracking
- **Proposal**: Insurance proposals with stage tracking
- **Policy**: Active insurance policies
- **Product**: Insurance products
- **Task**: To-do items and appointments
- **Broadcast**: Broadcast messages

**Important:** Always reference these schemas when creating forms or displaying data. The schemas use JSON Schema format with properties, types, enums, and required fields.

### Component Patterns

**UI Components** (`src/admin/components/ui/`):
- Built using Radix UI primitives with custom styling
- Follow shadcn/ui conventions for composition
- Use `clsx` for conditional className composition
- Support Tailwind CSS utility classes

**Feature Components** (`src/admin/modules/customers/components/`, `src/admin/modules/recommendation/components/`):
- Complex, domain-specific components
- May contain local state and business logic
- Often consume data from parent pages

**Page Components** (`src/admin/pages/`):
- Top-level route components
- Handle data fetching and state management
- Compose feature and UI components

## Styling Guidelines

- **Tailwind CSS** is the primary styling method
- Use utility classes directly in JSX
- Custom styles in `src/index.css`
- No CSS modules or styled-components

**Common patterns:**
```jsx
// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">

// Conditional styles with clsx
<div className={clsx(
  "base-class",
  condition && "conditional-class"
)}>
```

## Path Aliases

Vite is configured with path aliases in `vite.config.js`:
- `@/` maps to `src/`

**Usage:**
```javascript
import { Button } from "@/components/ui/button"
import { pageRoutes } from "@/utils"
```

## Entity Schema Reference

When creating forms or data displays, reference the schema in `src/entities/[Entity].schema.json`:

**Example - Lead Schema:**
```json
{
  "required": ["name", "contact_number"],
  "properties": {
    "name": { "type": "string" },
    "contact_number": { "type": "string" },
    "email": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["Not Contacted", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]
    },
    "lead_source": {
      "type": "string",
      "enum": ["Referral", "Social Media", "Walk-in", "Cold Call", "Website", "Event", "Other"]
    }
  }
}
```

## Important Development Notes

### Adding New Routes
1. Add route definition to `pageRoutes` in `src/admin/utils/index.js`
2. Create page component in `src/admin/pages/`
3. Add route to `App.jsx` within the `LayoutContainer`
4. Route will automatically get sidebar navigation via Layout

### Creating New Components
- UI components → `src/admin/components/ui/`
- Feature components → `src/admin/modules/[feature]/components/`
- Page components → `src/admin/pages/`

### Working with Forms
- Reference entity schemas for field validation
- Use controlled components with React state
- Follow schema enums for dropdown/select options
- Mark required fields based on schema's `required` array

### State Management
- Local component state for UI-only state
- Lift state up for shared state between siblings
- URL params for shareable/bookmarkable state (filters, pagination)
- Currently no global state library (Redux/Zustand) - add if needed

## Code Style

- **File Extensions:** `.jsx` for React components, `.js` for utilities
- **Naming:**
  - Components: PascalCase (e.g., `CustomerDetail.jsx`)
  - Utilities: camelCase (e.g., `createPageUrl`)
  - Constants: UPPER_SNAKE_CASE or camelCase
- **Imports:** Relative imports within same feature, aliased imports (`@/`) for cross-feature
- **Props:** Destructure in function signature when possible

## Testing
No testing framework currently configured. When adding tests:
- Consider Vitest (Vite-native)
- Jest + React Testing Library as alternative
- Place tests adjacent to components: `Component.test.jsx`
- Playwright smoke tests expect `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (local only) or relaxed RLS for inserts.

## API Integration

The project has API client stubs in `src/admin/api/`:
- `supabaseClient.js` - Supabase configuration
- `adviseUAdminApi.js` - AdviseU Admin API client

**When implementing API calls:**
1. Create service modules under the relevant domain (e.g., `src/admin/modules/analytics/api/`)
2. Use React Query (TanStack Query) for data fetching (currently not installed)
3. Keep API logic separate from components

## Common Workflows

### Adding a New Page with CRUD
1. Define entity schema in `src/entities/[Entity].schema.json` (if new entity)
2. Add route to `src/admin/utils/index.js`
3. Create page in `src/admin/pages/[EntityName].jsx`
4. Create reusable components in `src/admin/modules/[entity]/components/`
5. Add route to `App.jsx`

### Updating Entity Schema
1. Modify schema in `src/entities/[Entity].schema.json`
2. Update forms consuming that schema
3. Update display components showing that data
4. Update validation logic referencing the schema

### Adding UI Component
1. Create in `src/admin/components/ui/[component-name].jsx`
2. Follow Radix UI + Tailwind pattern from existing components
3. Export from component file
4. Import using `@/components/ui/[component-name]`

## Dependencies of Note

**UI/Styling:**
- `@radix-ui/react-*` - Accessible UI primitives
- `tailwindcss` - Utility-first CSS
- `clsx` - Conditional classNames
- `lucide-react` - Icon library (likely used)

**Routing:**
- `react-router-dom` - Client-side routing

**Data (Potential):**
- `@supabase/supabase-js` - Supabase client
- `@tanstack/react-query` - Data fetching (if installed)
- `pg` - PostgreSQL client (backend/server-side if needed)

## Build & Deployment

- Build output: `dist/`
- Vite optimizes for production automatically
- No special environment variables required for basic operation
- API URLs should be configured via `.env` files (create `.env.local` for local dev)

## Documentation Location

Additional project documentation is in `docs/`:
- `ai-first-development-workflow.md` - AI-assisted development guide
- `claude-code-workflow.md` - Claude Code specific workflows
- `final-tech-stack.md` - Technology decisions and architecture
- `phased-implementation-roadmap.md` - Project roadmap
- `technical-constraints-for-designers.md` - Design system constraints

## Git Workflow

Based on recent commits:
- Feature branches for new work
- Commit messages follow conventional format
- Recent focus: Design system implementation, UI components, dashboard enhancements

## Notes for Claude Code

- This is a **wireframe/prototype** project - focus on functionality and clean code
- **Always check entity schemas** before creating forms or data displays
- Use existing UI components from `src/admin/components/ui/` - don't recreate basic components
- Follow the established routing pattern in `src/admin/utils/index.js`
- Maintain responsive design with Tailwind breakpoints (sm, md, lg, xl)
- When creating new features, look at similar existing pages as templates
