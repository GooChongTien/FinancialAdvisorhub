# Project Structure

This document describes the organization of the AdvisorHub codebase.

## Directory Overview

```
AdvisorHub/
├── backend/              # Backend services (Edge Functions, APIs)
│   ├── api/              # API endpoints
│   └── services/         # Business logic services
├── docs/                 # Project documentation
│   ├── archived/         # Old documentation and reference materials
│   ├── mira/             # Mira agent-specific documentation
│   ├── setup/            # Setup and configuration guides
│   └── sql/              # SQL reference files
├── scripts/              # Utility scripts organized by function
│   ├── database/         # Database operations (run-query.js, run-sql.js)
│   ├── docs-gen/         # Documentation generation scripts
│   ├── e2e/              # E2E testing utilities
│   ├── email/            # Email processing scripts
│   ├── load-testing/     # Performance/load testing (k6)
│   ├── ops/              # Operations utilities
│   └── setup/            # Setup and installation scripts
├── src/                  # Frontend source code
│   ├── admin/            # Admin portal
│   │   ├── api/          # API clients
│   │   ├── components/   # Reusable UI components
│   │   │   ├── mira/     # Mira chat components
│   │   │   └── ui/       # Base UI components (shadcn-style)
│   │   ├── layout/       # Layout components
│   │   ├── modules/      # Feature modules
│   │   │   ├── analytics/
│   │   │   ├── customers/
│   │   │   └── recommendation/
│   │   ├── pages/        # Route-level page components
│   │   │   └── admin/    # Admin-specific pages
│   │   ├── state/        # State management (contexts, providers)
│   │   └── utils/        # Utility functions
│   ├── entities/         # JSON schemas defining data structures
│   └── lib/              # Shared libraries
│       └── mira/         # Mira client-side logic
├── supabase/             # Supabase backend
│   ├── functions/        # Edge Functions
│   │   ├── _shared/      # Shared utilities, services, types
│   │   │   ├── scripts/  # Backend utility scripts
│   │   │   └── services/ # Shared business logic
│   │   ├── admin-intents/
│   │   ├── admin-tools/
│   │   ├── admin-workflows/
│   │   ├── agent-chat/
│   │   └── workflows/
│   └── migrations/       # Database migrations (timestamped)
└── tests/                # Test suites

```

## Key Directories Explained

### `/scripts/` - Organized by Function
Scripts are now organized into functional categories for easier discovery and maintenance:

- **database/** - Scripts for running SQL queries and database operations
- **docs-gen/** - Scripts that generate documentation (navigation maps, user stories)
- **e2e/** - End-to-end testing utilities (user creation, data setup)
- **email/** - Email processing and outbox management
- **load-testing/** - Performance testing scripts (k6)
- **ops/** - Operational utilities (preview server, smoke tests)
- **setup/** - Installation and configuration scripts

### `/docs/` - Documentation Hub
All project documentation is centralized here:

- **archived/** - Old versions, deprecated docs, historical reference materials
- **setup/** - Setup guides (CODEX, agents, general setup instructions)
- **mira/** - Mira agent architecture, ADRs, and implementation details
- **sql/** - SQL reference files

**Key files:**
- `MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md` - Current Mira roadmap
- `Enhanced Mira Co-Pilot Implementation Plan v2.md` - Latest implementation plan
- `advisorhub-navigation-data-map-v2.md` - Current navigation structure
- `advisorhub-navigation-map-complete.xlsx` - Complete navigation reference

### `/src/admin/` - Frontend Application
The main admin portal frontend:

- **components/ui/** - Base UI components (buttons, inputs, cards) following shadcn/ui patterns
- **components/mira/** - Mira chat interface components
- **modules/** - Feature-specific components organized by domain
- **pages/** - Route-level components (one per route)
- **state/** - React contexts and providers for state management
- **utils/** - Helper functions and utilities

### `/supabase/functions/` - Edge Functions
Deno-based Edge Functions for backend logic:

- **_shared/** - Common code shared across functions
  - `services/` - Business logic (tools, routing, execution)
  - `scripts/` - Backend utility scripts (seeding, testing)
- Individual function folders for each deployed endpoint

### `/entities/` - Data Schema Definitions
JSON Schema files defining the structure of data entities (Lead, Proposal, Policy, Product, etc.)

## File Naming Conventions

- **Components:** PascalCase (e.g., `CustomerDetail.jsx`)
- **Utilities:** camelCase (e.g., `createPageUrl.js`)
- **Constants:** UPPER_SNAKE_CASE or camelCase
- **Migrations:** `YYYYMMDDHHMMSS_description.sql`
- **Scripts:** kebab-case or snake_case

## What's NOT in the Repository

The following are excluded via `.gitignore`:

- Build outputs (`dist/`, `build/`)
- Dependencies (`node_modules/`)
- Environment files (`.env`, `.env.local`)
- Logs and temporary files (`*.log`, `*.tmp`, `temp/`)
- IDE caches (`.vscode/`, `.vs/`, `.idea/`)
- Backup files (`*.bak`, `*.backup`)

## Cleanup History

**Last cleanup:** November 20, 2025
- Removed empty/invalid files, temporary files, backup files
- Archived old documentation versions
- Organized scripts into functional subdirectories
- Moved root-level docs to `/docs/`
- Moved setup scripts to `/scripts/setup/`

See `docs/archived/README.md` for details on archived materials.

## Contributing

When adding new files:

1. **Scripts:** Place in appropriate `/scripts/[category]/` subfolder
2. **Documentation:** Add to `/docs/` or relevant subfolder
3. **Components:** Follow the existing directory structure in `/src/admin/`
4. **Migrations:** Use timestamp prefix and descriptive names
5. **Tests:** Place adjacent to the code being tested or in `/tests/`

## Questions?

Refer to:
- `CLAUDE.md` - Project overview and development guidelines
- `README.md` - Getting started guide
- `docs/setup/` - Setup and configuration instructions
