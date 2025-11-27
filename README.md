# AdvisorHub

An AI-powered insurance advisor application built with React, Vite, and Supabase. AdvisorHub helps insurance advisors manage customers, create proposals, track policies, and leverage AI assistance through the MIRA (Multi-Intent Routing Assistant) system.

## Features

- **Customer Management**: Track leads, contacts, and customer relationships
- **Smart Planning**: AI-powered insurance planning with multi-step workflows
- **Proposal & Quote Generation**: Quick quote generation and detailed proposal creation
- **Policy Management**: Track active policies and policy details
- **Analytics Dashboard**: Visualize business metrics and performance
- **MIRA AI Assistant**: Intelligent routing and intent-based navigation
- **Multilingual Support**: English, Spanish, Hindi, Malay, Tamil, and Chinese
- **Broadcast Messaging**: Send targeted messages to customers
- **Temperature Scoring**: Customer engagement tracking with temperature-based insights

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router v6** - Client-side routing
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **i18next** - Internationalization

### Backend & Data
- **Supabase** - Backend as a Service (Database, Auth, Edge Functions)
- **PostgreSQL** - Database
- **Supabase Edge Functions** - Serverless functions (Deno runtime)

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **XState** - State machines for complex workflows

### Visualization
- **Recharts** - Charts and graphs
- **D3.js** - Advanced data visualizations
- **XYFlow** - Interactive node-based diagrams

### Testing & Quality
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **Testing Library** - Component testing utilities
- **Prettier** - Code formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (for MIRA AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/GooChongTien/FinancialAdvisorhub.git
cd FinancialAdvisorhub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── admin/
│   ├── api/              # API clients (Supabase, AdviseU)
│   ├── components/
│   │   └── ui/           # Reusable UI components (shadcn-style)
│   ├── layout/           # Layout components
│   ├── modules/          # Feature modules
│   │   ├── analytics/
│   │   ├── customers/
│   │   └── recommendation/
│   ├── pages/            # Route-level page components
│   ├── state/            # Global state management
│   └── utils/            # Utility functions
├── entities/             # JSON schema definitions
├── lib/
│   ├── aial/             # AI abstraction layer
│   └── i18n/             # Internationalization
├── App.jsx               # App component and routing
├── main.jsx              # Application entry point
└── index.css             # Global styles

supabase/
├── functions/            # Edge Functions
│   ├── agent-chat/       # AI chat endpoint
│   ├── workflows/        # Workflow management
│   └── _shared/          # Shared utilities
└── migrations/           # Database migrations
```

## Key Features

### MIRA AI Assistant

MIRA (Multi-Intent Routing Assistant) provides intelligent navigation and task assistance:
- Intent-based routing to relevant pages
- Smart plan generation
- Conversational interface
- Multi-language support

### Smart Planning

AI-powered insurance planning system with:
- Workflow visualization
- Step-by-step guidance
- Knowledge base integration
- Automated recommendations

### Customer Temperature Scoring

Track customer engagement with temperature-based metrics:
- Hot (85-100): Highly engaged customers
- Warm (55-84): Moderately engaged
- Cool (30-54): Low engagement
- Cold (0-29): Inactive customers

## Development

### Component Development

UI components follow the shadcn/ui pattern:
- Located in `src/admin/components/ui/`
- Built with Radix UI primitives
- Styled with Tailwind CSS
- Fully accessible (ARIA compliant)

### Adding New Routes

1. Define route in `src/admin/utils/index.js`
2. Create page component in `src/admin/pages/`
3. Add route to `App.jsx`
4. Update sidebar navigation if needed

### Entity Schemas

Data models are defined in `src/entities/*.schema.json`:
- Lead, Customer, Proposal, Policy, Product, Task, Broadcast
- JSON Schema format
- Used for validation and form generation

## Supabase Setup

See `docs/setup/SETUP_INSTRUCTIONS.md` for detailed Supabase configuration including:
- Database setup
- Edge Functions deployment
- Environment secrets configuration
- RLS policies

## Testing

### Unit Tests
```bash
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

Tests require proper environment configuration. See `scripts/setup/prepare-test-db.mjs` for test database setup.

## Deployment

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

### Deploy to Vercel/Netlify

The application is configured for easy deployment to Vercel or Netlify:
1. Connect your GitHub repository
2. Set environment variables
3. Deploy!

### Deploy Supabase Edge Functions

```bash
npx supabase functions deploy --project-ref your_project_ref
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

Additional documentation available in `docs/`:
- `CLAUDE.md` - Development guide for AI assistants
- `ai-first-development-workflow.md` - AI-assisted development practices
- `final-tech-stack.md` - Technology decisions and rationale
- `mira-smart-navigation.md` - MIRA AI system documentation

## License

This project is private and proprietary.

## Support

For issues and questions, please create an issue in the GitHub repository.

---

Built with Claude Code
