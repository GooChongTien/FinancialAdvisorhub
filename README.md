# AdvisorHub

> **AI-Powered Insurance Advisor Platform with Intelligent Agent Workflow Management**

AdvisorHub is a comprehensive insurance advisor application featuring Mira, an intelligent AI co-pilot that assists advisors with customer management, proposal generation, and workflow automation. The platform includes a powerful admin portal for building and managing AI agent workflows using visual graph-based design.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![Supabase](https://img.shields.io/badge/supabase-latest-3ecf8e.svg)

---

## 🌟 Features

### Advisor Portal
- **Customer Management**: Complete CRM with lead tracking, customer profiles, and interaction history
- **Proposal Generation**: Intelligent proposal creation with AI-assisted recommendations
- **Policy Management**: Track and manage active insurance policies
- **Analytics Dashboard**: Real-time insights into sales performance, pipeline, and customer engagement
- **Broadcast Messaging**: Send targeted messages to customer segments
- **Task Management**: Calendar and to-do list with overdue tracking
- **Mira AI Co-Pilot**:
  - Contextual AI assistance across all pages
  - Inline chat panel and full-screen chat mode
  - Behavioral analytics and intent detection
  - Smart action suggestions and workflow automation

### Admin Portal (NEW! 🎉)
- **Visual Workflow Builder**: Drag-and-drop interface powered by React Flow
- **AI Agent Engine**: LangGraph-based workflow execution with state management
- **Node Types**: Agent, Tool, Decision, Transform, Classify, While Loop, State, User Approval
- **Intent Management**: Link intents to workflows for automatic triggering
- **Tool Registry**: Browse, test, and manage available tools with dynamic form generation
- **Execution Logs**: Monitor workflow execution with detailed traces and debugging
- **User Management**: Invite and manage advisors with role-based access control

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing with nested layouts
- **TailwindCSS** - Utility-first CSS framework
- **React Query (TanStack Query)** - Server state management and caching
- **React Flow** - Interactive node-based workflow editor
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Backend & Services
- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions
- **Supabase Edge Functions** - Serverless functions (Deno runtime)
- **LangGraph** - State-based AI workflow orchestration
- **OpenAI API** - LLM integration for AI agent nodes

### AI & Intelligence
- **Custom Intent Router** - Confidence-based intent classification with fallback handling
- **Behavioral Analytics** - Client-side interaction tracking and pattern detection
- **Expert Brain System** - Domain knowledge base with example-based learning
- **Multi-Agent Architecture** - Specialized agents for different domains (customer, FNA, admin)

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Supabase Account** (free tier works)
- **OpenAI API Key** (for AI agent features)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Chongtien32/AdvisorHub.git
cd AdvisorHub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Setup

Run the migrations in order:

```bash
# Navigate to Supabase dashboard > SQL Editor
# Run migrations from supabase/migrations/ in chronological order

# Key migrations:
# 1. 20251119030128_create_agent_engine_schema.sql
# 2. 20251119133300_create_behavioral_schema.sql
# 3. 20251120_add_expert_brain_intents.sql
# 4. 20251120_add_user_roles.sql
# 5. 20251121_add_workflow_trigger_to_intents.sql
```

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy agent-chat
supabase functions deploy admin-workflows
supabase functions deploy admin-intents
supabase functions deploy admin-tools
supabase functions deploy workflows
```

### 6. Seed Initial Data (Optional)

```bash
# Run seed scripts to populate knowledge base and intents
deno run --allow-net --allow-env --allow-read --env-file=.env.local supabase/functions/_shared/scripts/seed-expert-brain.ts
```

### 7. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:5173** and register a new account!

---

## 📁 Project Structure

```
AdvisorHub/
├── src/
│   ├── admin/
│   │   ├── api/                    # API clients (Supabase, AdviseU Admin)
│   │   ├── components/
│   │   │   ├── ui/                 # Base UI components (shadcn-style)
│   │   │   ├── mira/               # Mira AI co-pilot components
│   │   │   └── workflow/           # Workflow node visualizations
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── layout/
│   │   │   ├── AdminPortalLayout.jsx    # Admin portal layout
│   │   │   └── AdvisorPortalLayout.jsx  # Advisor portal layout
│   │   ├── pages/
│   │   │   ├── admin/              # Admin portal pages
│   │   │   │   ├── WorkflowEditor.jsx
│   │   │   │   ├── WorkflowList.jsx
│   │   │   │   ├── IntentManager.jsx
│   │   │   │   ├── ToolRegistry.jsx
│   │   │   │   ├── ExecutionLogs.jsx
│   │   │   │   └── AdvisorManagement.jsx
│   │   │   └── *.jsx               # Advisor portal pages
│   │   ├── state/                  # React context providers
│   │   └── utils/                  # Utility functions and routing
│   ├── lib/                        # Shared libraries
│   │   └── mira/                   # Mira AI utilities
│   ├── entities/                   # JSON schemas for data models
│   ├── App.jsx                     # Main app router
│   └── main.jsx                    # Entry point
├── supabase/
│   ├── functions/
│   │   ├── agent-chat/             # Main AI agent chat endpoint
│   │   ├── admin-workflows/        # Workflow CRUD and execution
│   │   ├── admin-intents/          # Intent management
│   │   ├── admin-tools/            # Tool registry and testing
│   │   ├── workflows/              # Workflow execution endpoint
│   │   └── _shared/
│   │       ├── services/
│   │       │   ├── engine/         # GraphExecutor (LangGraph)
│   │       │   ├── router/         # Intent router
│   │       │   ├── agents/         # Agent implementations
│   │       │   └── tools/          # Tool implementations
│   │       └── scripts/            # Seed and utility scripts
│   └── migrations/                 # Database migrations
├── docs/                           # Documentation
├── tests/                          # Test files
└── public/                         # Static assets
```

---

## 🔑 Key Concepts

### Dual-Portal Architecture

AdvisorHub has two distinct portals with separate layouts and navigation:

1. **Advisor Portal** (`/advisor/*`) - For insurance advisors
   - Customer management, proposals, policies
   - Mira AI co-pilot integration
   - Analytics and reporting
   - Task and broadcast management

2. **Admin Portal** (`/admin/*`) - For system administrators
   - Workflow builder and management
   - Intent and tool configuration
   - Execution monitoring and debugging
   - User and access management

### Mira AI Co-Pilot

Mira is an intelligent AI assistant that:
- Provides contextual help across all pages
- Detects user intent from natural language
- Executes actions and workflows automatically
- Learns from user interactions through behavioral analytics
- Offers smart suggestions based on current context

### Workflow Engine

The workflow engine supports:
- **Visual Design**: Drag-and-drop node-based editor
- **Node Types**:
  - **Agent**: LLM-powered reasoning nodes
  - **Tool**: Execute specific functions (customer lookup, FNA calculation, etc.)
  - **Decision**: Branch based on conditions
  - **Transform**: Data transformation and mapping
  - **Classify**: Categorize inputs
  - **While**: Loop with conditions
  - **State**: State management (set/merge/append/get)
  - **User Approval**: Human-in-the-loop gates
- **Execution**: Real-time workflow execution with LangGraph
- **Logging**: Full execution traces with input/output capture

### Intent-Based Routing

- Intents are classified with confidence scores (high/medium/low)
- Workflows can be automatically triggered by intents
- Fallback handling for low-confidence or unknown intents
- Example-based learning for improved accuracy

---

## 🧪 Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test tests/frontend/intent-router.test.ts
```

**Important**: E2E tests require `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or relaxed RLS policies for inserts.

---

## 🏗️ Development Workflow

### Adding a New Page

1. Create page component in `src/admin/pages/`
2. Add route to `src/App.jsx`
3. Add to `pageRoutes` in `src/admin/utils/index.js`
4. Update navigation in appropriate layout if needed

### Creating a Workflow

1. Navigate to **Admin Portal** → **Workflows**
2. Click **Create Workflow**
3. Add nodes from the palette (drag & drop)
4. Connect nodes by dragging edges
5. Configure each node (click to select, edit in sidebar)
6. Save and test the workflow
7. Link to an intent for automatic triggering (optional)

### Adding a New Tool

1. Create tool implementation in `supabase/functions/_shared/services/tools/`
2. Register tool in `tool-registry.ts`
3. Deploy functions: `supabase functions deploy admin-tools`
4. Tool will appear in Admin Portal → Tools

### Creating Custom Agents

1. Extend `BaseAgent` class in `supabase/functions/_shared/services/agents/`
2. Implement required methods: `generateResponse`, `selectTools`
3. Register agent in agent router
4. Add agent-specific intents and examples

---

## 🌐 API Endpoints

### Edge Functions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent-chat` | POST | Main AI agent chat endpoint |
| `/admin-workflows` | GET | List all workflows |
| `/admin-workflows` | POST | Create new workflow |
| `/admin-workflows/:id` | GET | Get workflow details |
| `/admin-workflows/:id` | PUT | Update workflow metadata |
| `/admin-workflows/:id` | PATCH | Save workflow nodes/edges |
| `/admin-workflows/:id/execute` | POST | Execute workflow |
| `/admin-workflows/execute-by-intent` | POST | Execute by intent trigger |
| `/admin-intents` | GET/POST | Intent management |
| `/admin-tools` | GET/POST | Tool registry and testing |

---

## 🔒 Authentication & Authorization

### User Roles

- **Advisor**: Access to Advisor Portal, can manage customers and proposals
- **Admin**: Access to both portals, can manage workflows and system configuration

### Row-Level Security (RLS)

All database tables have RLS policies enforcing:
- Users can only access their own data (advisor role)
- Admins have full access across all data
- Authenticated users only (no anonymous access)

---

## 📊 Database Schema

### Core Tables

- `profiles` - User profiles and metadata
- `mira_chat_threads` - Chat conversation threads
- `mira_chat_messages` - Individual chat messages
- `mira_chat_actions` - Executed actions from chat
- `mira_intents` - Intent definitions with examples
- `mira_workflows` - Workflow metadata
- `mira_workflow_nodes` - Workflow node definitions
- `mira_workflow_edges` - Workflow edge connections
- `mira_execution_logs` - Workflow execution history

### Entity Tables

- `leads` / `customers` - Customer/lead data
- `proposals` - Insurance proposals
- `policies` - Active policies
- `tasks` - To-do items and calendar events
- `broadcasts` - Broadcast messages

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy (example with Vercel)
vercel --prod
```

### Edge Functions (Supabase)

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy agent-chat
```

### Environment Variables (Production)

Ensure these are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

And in Supabase Dashboard → Project Settings → Edge Functions:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

---

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run format           # Format code with Prettier
npm run lint             # Lint code (if configured)

# Testing
npm run test:unit        # Run unit tests
npm run test:e2e         # Run E2E tests
```

---

## 🐛 Troubleshooting

### Pages redirect to login after authentication

**Solution**: Clear browser cache and localStorage, then hard refresh (Ctrl+Shift+R)

### Workflow execution fails

**Solution**: Check:
1. OpenAI API key is set in Supabase Edge Function secrets
2. Tool registry has the required tools
3. Execution logs in Admin Portal → Executions for error details

### Chat panel doesn't appear

**Solution**:
1. Verify Mira context providers are wrapping the app
2. Check browser console for errors
3. Ensure chat threads table exists in database

### Database migrations fail

**Solution**:
1. Run migrations in chronological order (by filename)
2. Check for schema conflicts
3. Use `manual_fix.sql` and `manual_role_migration.sql` if needed

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test updates

---

## 📚 Documentation

Additional documentation available in `/docs`:

- **Admin Portal Implementation Plan** - Detailed implementation guide
- **Admin Portal Walkthrough** - Feature walkthrough
- **Deployment Guide** - Production deployment instructions
- **Workflow Enhancements Plan** - Advanced workflow features
- **MIRA Consolidated Implementation Plan** - Complete Mira AI architecture

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using React, Supabase, and OpenAI
- Workflow visualization powered by [React Flow](https://reactflow.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

## 📧 Support

For support and questions:
- 📖 Check the [documentation](/docs)
- 🐛 Report bugs via [GitHub Issues](https://github.com/Chongtien32/AdvisorHub/issues)
- 💬 Start a [discussion](https://github.com/Chongtien32/AdvisorHub/discussions)

---

**Made with 🤖 by Claude Code & the AdvisorHub Team**

*Last Updated: January 2025*
