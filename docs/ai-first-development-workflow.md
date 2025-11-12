# AI-First Development Workflow
## Insurance Advisor Application - Practical Implementation Guide

**Document Version:** 1.0  
**Last Updated:** October 27, 2025  
**Target:** Build Phase 1 MVP in 3-4 months using AI acceleration

---

## Overview: Your AI-Powered Development Strategy

This guide provides **exact prompts, tools, and workflows** to build your insurance advisor app 40-50% faster using AI.

### **The Core Principle:**
```
AI generates 70% → Human reviews and enhances 30% → Ship faster
```

---

## Part 1: Setup Your AI Development Environment

### **Tools You Need (Install Today)**

#### 1. **Cursor IDE** (Primary Tool) - $20/month
**Download:** https://cursor.sh

**Why Cursor?**
- Built-in Claude integration
- Understands your entire codebase
- Can edit multiple files at once
- Best for full-stack development

**Setup:**
```bash
# Install Cursor
1. Download from cursor.sh
2. Import your VS Code settings (if migrating)
3. Sign up for Cursor Pro ($20/month)
4. Set Claude Sonnet as default model
```

#### 2. **GitHub Copilot** (Secondary) - $10/month
**Install:** VS Code extension or Cursor plugin

**Why Copilot?**
- Great for line-by-line suggestions
- Autocomplete on steroids
- Works alongside Cursor

**Setup:**
```bash
1. Install GitHub Copilot extension
2. Sign in with GitHub account
3. Subscribe to Copilot ($10/month)
```

#### 3. **v0.dev** (UI Components) - Free/Paid
**URL:** https://v0.dev

**Why v0?**
- Generates React components from text
- Built by Vercel (Next.js creators)
- Great for rapid UI prototyping

**Setup:**
```bash
1. Create account at v0.dev
2. Connect Vercel account (optional)
3. Start with free tier
```

#### 4. **Claude.ai** (Architecture & Planning) - Free/$20/month
**URL:** https://claude.ai

**Why Claude (me!)?**
- Architecture decisions
- Complex problem solving
- Code review
- Debugging help

**You're already here! ✅**

#### 5. **bolt.new** (Quick Prototypes) - Free
**URL:** https://bolt.new

**Why bolt.new?**
- Full-stack app in browser
- Instant preview
- Great for testing ideas
- Can export code

---

## Part 2: Project Initialization (Day 1)

### **Step 1: Generate Project Structure with AI**

#### **Backend (NestJS) - Use Cursor**

**Prompt to Cursor:**
```
Create a NestJS project structure for an insurance advisor application with:

Project name: insurance-advisor-api
Features needed:
- TypeScript strict mode
- Microservices architecture support
- TypeORM for MySQL
- Redis cache integration
- Passport JWT authentication
- Swagger API documentation
- Environment configuration
- Logger (Winston)
- Validation pipes (class-validator)
- CORS enabled

Folder structure:
/src
  /modules
    /auth
    /leads
    /clients
    /proposals
    /users
  /common
    /decorators
    /filters
    /guards
    /interceptors
    /pipes
  /config
  /database

Include:
- Package.json with all dependencies
- .env.example
- tsconfig.json
- Docker compose for local dev (MySQL + Redis)
- README with setup instructions
```

**Expected Output:** Complete NestJS project structure in ~2 minutes

---

#### **Frontend (React) - Use Cursor**

**Prompt to Cursor:**
```
Create a React + TypeScript project for an insurance advisor web application with:

Setup:
- Vite as build tool (not CRA)
- TypeScript strict mode
- React 18+
- React Router v6
- Material-UI (MUI) v5
- Zustand for state management
- React Query for API calls
- React Hook Form + Zod for forms
- Axios for HTTP client

Folder structure:
/src
  /components
    /common (reusable components)
    /layout (Header, Sidebar, Footer)
  /features
    /auth
    /leads
    /clients
    /proposals
    /dashboard
  /hooks (custom hooks)
  /services (API clients)
  /store (Zustand stores)
  /types (TypeScript types)
  /utils (helper functions)
  /config
  
Include:
- Package.json with all dependencies
- .env.example
- tsconfig.json
- Vite config with path aliases
- ESLint + Prettier config
- README with setup instructions
- Basic routing setup
- MUI theme configuration
```

**Expected Output:** Complete React project structure in ~2 minutes

---

### **Step 2: Generate Docker Compose (Local Development)**

**Prompt to Cursor:**
```
Create a docker-compose.yml file for local development with:

Services:
1. MySQL 8.0
   - Port 3306
   - Database: insurance_advisor
   - User: dev_user
   - Password: dev_password
   - Volume for data persistence
   - Health check

2. Redis 7.0
   - Port 6379
   - Volume for data persistence
   - Memory limit: 512MB

3. Azurite (Azure Storage Emulator)
   - Blob storage port: 10000
   - Queue storage port: 10001
   - Table storage port: 10002

Also create:
- .env.local file with connection strings
- README section on starting services
```

**Expected Output:** Working docker-compose.yml

---

### **Step 3: Initialize Git Repositories**

**Manual Step (2 minutes):**
```bash
# Backend
cd insurance-advisor-api
git init
git add .
git commit -m "Initial NestJS setup with AI"
git remote add origin <your-backend-repo-url>
git push -u origin main

# Frontend
cd ../insurance-advisor-web
git init
git add .
git commit -m "Initial React setup with AI"
git remote add origin <your-frontend-repo-url>
git push -u origin main
```

---

## Part 3: Database Design (Day 2)

### **Generate Database Schema with AI**

#### **Prompt to Cursor (in backend project):**

```
Create TypeORM entities for an insurance advisor application with these models:

1. User Entity
   - id (uuid, primary key)
   - email (unique, indexed)
   - password (hashed)
   - firstName
   - lastName
   - role (enum: advisor, admin, manager)
   - advisorId (string, optional)
   - advisorIdExpiry (date, optional)
   - status (enum: active, inactive, suspended)
   - phone
   - createdAt
   - updatedAt
   - Relations: one-to-many with Leads

2. Lead Entity
   - id (uuid, primary key)
   - name (required)
   - email (optional)
   - phone (required, indexed)
   - nationalId (optional)
   - dateOfBirth (optional)
   - gender (enum: male, female, other)
   - status (enum: not_contacted, contacted, qualified, nurturing, converted, lost)
   - source (enum: referral, website, campaign, walk_in, other)
   - advisorId (foreign key to User)
   - lastContactedAt (date)
   - nextAppointmentAt (date, optional)
   - notes (text)
   - createdAt (indexed)
   - updatedAt
   - Relations: many-to-one with User, one-to-many with Proposals

3. Client Entity (extends Lead)
   - All Lead fields plus:
   - address (text)
   - occupation
   - annualIncome (decimal)
   - maritalStatus (enum)
   - numberOfDependents (integer)
   - Relations: one-to-many with Policies, one-to-many with Proposals

4. Proposal Entity
   - id (uuid, primary key)
   - proposalNumber (unique, indexed)
   - clientId (foreign key)
   - advisorId (foreign key)
   - stage (enum: fact_finding, fna, recommendation, quotation, application)
   - status (enum: draft, in_progress, pending_approval, approved, rejected, completed)
   - totalPremium (decimal)
   - data (jsonb - for flexible proposal data)
   - createdAt (indexed)
   - updatedAt
   - submittedAt (nullable)
   - Relations: many-to-one with Client, many-to-one with User

5. Policy Entity
   - id (uuid, primary key)
   - policyNumber (unique, indexed)
   - clientId (foreign key)
   - proposalId (foreign key, nullable)
   - productName
   - coverageType (enum)
   - sumAssured (decimal)
   - premium (decimal)
   - premiumFrequency (enum: monthly, quarterly, annually)
   - status (enum: active, lapsed, cancelled)
   - effectiveDate
   - expiryDate
   - createdAt
   - updatedAt
   - Relations: many-to-one with Client

6. Appointment Entity
   - id (uuid, primary key)
   - title
   - type (enum: appointment, task, reminder)
   - startTime
   - endTime
   - allDay (boolean)
   - clientId (foreign key, nullable)
   - leadId (foreign key, nullable)
   - advisorId (foreign key)
   - notes (text)
   - status (enum: scheduled, completed, cancelled)
   - createdAt
   - updatedAt
   - Relations: many-to-one with User, Client, or Lead

For each entity:
- Use proper decorators (@Entity, @Column, @PrimaryGeneratedColumn, etc.)
- Add proper indexes
- Include validation decorators where appropriate
- Add timestamps (createdAt, updatedAt)
- Include proper TypeScript types
- Add relations with cascade options where appropriate

Also generate:
- Initial migration file
- Seed data for development
```

**Expected Output:** 
- 6 entity files in `/src/modules/*/entities/`
- Migration files in `/src/database/migrations/`
- Seed file in `/src/database/seeds/`

---

## Part 4: Authentication System (Day 2-3)

### **Generate Complete Auth Module**

#### **Prompt to Cursor:**

```
Create a complete authentication system with:

1. Auth Module (/src/modules/auth/)
   Structure:
   - auth.module.ts
   - auth.controller.ts
   - auth.service.ts
   - strategies/jwt.strategy.ts
   - strategies/azure-ad.strategy.ts
   - strategies/local.strategy.ts
   - guards/jwt-auth.guard.ts
   - guards/roles.guard.ts
   - decorators/roles.decorator.ts
   - dto/login.dto.ts
   - dto/register.dto.ts

2. Features:
   - Local authentication (email/password)
   - JWT token generation and validation
   - Azure AD strategy (for staff)
   - Password hashing with bcrypt
   - Refresh token support
   - Role-based access control
   - Guards for protecting routes
   - Decorators for role checking

3. API Endpoints:
   POST /auth/login
     - Body: { email, password }
     - Returns: { access_token, refresh_token, user }
   
   POST /auth/register (admin only)
     - Body: { email, password, firstName, lastName, role }
     - Returns: { user }
   
   POST /auth/refresh
     - Body: { refresh_token }
     - Returns: { access_token }
   
   POST /auth/logout
     - Invalidates tokens
   
   GET /auth/profile
     - Protected route
     - Returns current user

4. Security:
   - JWT secret from environment variable
   - Token expiration: 8 hours
   - Refresh token expiration: 7 days
   - Password minimum 8 characters
   - Rate limiting on login (5 attempts per 15 minutes)

5. Include:
   - Unit tests for auth service
   - Integration tests for auth controller
   - Swagger documentation
   - Error handling
   - Validation pipes

Use best practices:
- Dependency injection
- Clean architecture
- Proper error messages
- TypeScript strict mode
```

**Expected Output:** Complete, production-ready auth system in ~5 minutes

---

## Part 5: CRUD Operations (Day 3-5)

### **Generate Lead Management Module**

This is where AI really shines! Let me show you how to generate a complete CRUD module.

#### **Prompt to Cursor:**

```
Create a complete Lead Management module with:

1. Module Structure (/src/modules/leads/)
   - leads.module.ts
   - leads.controller.ts
   - leads.service.ts
   - entities/lead.entity.ts (already exists, update if needed)
   - dto/create-lead.dto.ts
   - dto/update-lead.dto.ts
   - dto/filter-leads.dto.ts
   - interfaces/lead.interface.ts

2. Service Methods (leads.service.ts):
   - create(createLeadDto): Create new lead
   - findAll(filters, pagination): Get all leads with filters
   - findOne(id): Get single lead by ID
   - update(id, updateLeadDto): Update lead
   - delete(id): Soft delete lead
   - findByAdvisor(advisorId, filters): Get leads for specific advisor
   - updateStatus(id, status): Update lead status
   - searchLeads(query): Search leads by name, email, phone

3. Controller Endpoints:
   POST /leads
     - Create new lead
     - Body: CreateLeadDto
     - Auth: Required
     - Returns: Created lead
   
   GET /leads
     - Get all leads with filters
     - Query params: status, source, search, page, limit, sortBy, sortOrder
     - Auth: Required
     - Returns: Paginated lead list
   
   GET /leads/:id
     - Get single lead
     - Auth: Required
     - Returns: Lead details
   
   PUT /leads/:id
     - Update lead
     - Body: UpdateLeadDto
     - Auth: Required
     - Returns: Updated lead
   
   DELETE /leads/:id
     - Soft delete lead
     - Auth: Required (admin only)
     - Returns: Success message
   
   PATCH /leads/:id/status
     - Update lead status
     - Body: { status }
     - Auth: Required
     - Returns: Updated lead
   
   GET /leads/search
     - Search leads
     - Query: q (search term)
     - Auth: Required
     - Returns: Matching leads

4. DTOs with Validation:
   CreateLeadDto:
   - name (string, required, min 2 chars)
   - email (email, optional)
   - phone (string, required, valid phone format)
   - source (enum, required)
   - notes (string, optional)

   FilterLeadsDto:
   - status (enum, optional)
   - source (enum, optional)
   - search (string, optional)
   - page (number, default 1)
   - limit (number, default 50, max 100)
   - sortBy (string, default 'createdAt')
   - sortOrder (enum: ASC/DESC, default DESC)

5. Features:
   - Pagination (default 50 per page)
   - Filtering by status, source
   - Search by name, email, phone
   - Sorting by any field
   - Role-based access (advisors see only their leads, admins see all)
   - Audit logging for all changes
   - Validation on all inputs
   - Proper error handling
   - Swagger documentation

6. Include:
   - Unit tests for service (80% coverage)
   - Integration tests for controller
   - Mock data for testing
   - Error handling for edge cases

Best practices:
- Use dependency injection
- Proper TypeScript types
- Clean code with comments
- Transaction support for updates
- Optimized database queries with indexes
```

**Expected Output:** Complete Lead Management module in ~10 minutes

---

### **Repeat for Other Modules**

Use similar prompts for:
- **Clients Module** (copy Lead prompt, adjust fields)
- **Proposals Module** (more complex, add stage management)
- **Appointments Module** (calendar functionality)
- **Analytics Module** (read-only, aggregations)

**Time Saved:** ~2-3 weeks of boilerplate coding

---

## Part 6: Frontend Components (Day 5-10)

### **Generate UI Components with v0.dev**

#### **Example: Lead List Component**

**Go to v0.dev and prompt:**

```
Create a React component for displaying a list of insurance leads with:

Layout:
- Table view with columns: Name, Phone, Email, Status, Source, Last Contacted, Actions
- Search bar at top
- Filter dropdowns for Status and Source
- Pagination controls at bottom (showing "1-50 of 243")
- "Create New Lead" button at top right

Features:
- Clickable rows that navigate to lead detail page
- Status badge with colors (green=contacted, yellow=qualified, red=lost)
- Sort by clicking column headers
- Responsive design (mobile shows cards instead of table)
- Loading skeleton while fetching data
- Empty state message when no leads

Styling:
- Use Material-UI components
- Clean, professional design
- Proper spacing and typography
- Status colors: Contacted=green, Qualified=blue, Lost=red, Not Contacted=gray

Props:
- leads: array of lead objects
- onLeadClick: function
- onCreateLead: function
- isLoading: boolean
```

**v0 generates:** Beautiful React component in 30 seconds

**Then:** Copy code to your project, adjust as needed

---

#### **Example: Lead Creation Form**

**Prompt to v0.dev:**

```
Create a React form component for creating new insurance leads with:

Fields:
- Name (text input, required)
- Email (email input, optional)
- Phone (phone input, required)
- Lead Source (dropdown: Referral, Website, Campaign, Walk-in, Other)
- Notes (textarea, optional)

Features:
- Form validation (show errors below fields)
- Required field indicators (asterisk)
- Submit button (disabled while submitting)
- Cancel button
- Success message after submission
- Error handling with retry button
- Loading state during submission

Styling:
- Material-UI TextField components
- Two-column layout on desktop, single column on mobile
- Action buttons at bottom right
- Proper spacing and labels

Props:
- onSubmit: function
- onCancel: function
- isSubmitting: boolean

Use React Hook Form for form management
Use Zod for validation schema
```

**v0 generates:** Complete form component in 30 seconds

---

### **Generate Complex Forms with Cursor**

For more complex forms like Fact Finding, use Cursor:

#### **Prompt to Cursor:**

```
Create a multi-step fact finding form for insurance proposals with:

Steps:
1. Personal Details (name, DOB, gender, NRIC, contact info)
2. Dependents (add multiple dependents with same fields)
3. Customer Knowledge Assessment (questionnaire)
4. Risk Profiling (6 questions with scoring)

Features:
- Step indicator at top (showing current step)
- Form validation per step
- "Next" and "Back" buttons
- "Save as Draft" button on each step
- Auto-save every 2 minutes
- Progress saved to localStorage
- Can resume from any step
- Final review before submission
- Loading states
- Error handling

Components to create:
/components/FactFinding/
  - FactFindingWizard.tsx (main wrapper)
  - StepIndicator.tsx
  - PersonalDetailsStep.tsx
  - DependentsStep.tsx
  - CKAStep.tsx
  - RiskProfilingStep.tsx
  - ReviewStep.tsx

Use:
- React Hook Form for form state
- Zustand for wizard state
- Material-UI Stepper component
- Zod for validation
- React Query for API calls

Include:
- TypeScript types for all data
- Proper error messages
- Responsive design
- Accessibility (ARIA labels)
```

**Expected Output:** Complete multi-step form in ~15 minutes

**Manual work needed:** 
- Connect to API
- Add business-specific validation
- Test edge cases

---

## Part 7: API Integration (Day 10-12)

### **Generate API Service Layer**

#### **Prompt to Cursor:**

```
Create a complete API service layer for the React app with:

Structure:
/src/services/
  - api.ts (Axios instance configuration)
  - auth.service.ts
  - leads.service.ts
  - clients.service.ts
  - proposals.service.ts
  - appointments.service.ts

Features:
1. Axios Configuration (api.ts):
   - Base URL from environment variable
   - Request interceptor (add JWT token to headers)
   - Response interceptor (handle errors globally)
   - Timeout: 30 seconds
   - Retry logic (3 attempts for failed requests)

2. Auth Service (auth.service.ts):
   - login(email, password)
   - logout()
   - refreshToken()
   - getCurrentUser()
   - updateProfile(data)

3. Leads Service (leads.service.ts):
   - getLeads(filters): GET /leads with query params
   - getLead(id): GET /leads/:id
   - createLead(data): POST /leads
   - updateLead(id, data): PUT /leads/:id
   - deleteLead(id): DELETE /leads/:id
   - updateLeadStatus(id, status): PATCH /leads/:id/status
   - searchLeads(query): GET /leads/search

4. For each service method:
   - Proper TypeScript types
   - Error handling
   - Response type definitions
   - JSDoc comments

5. React Query Hooks:
Create custom hooks using React Query:
/src/hooks/
  - useLeads.ts
  - useLead.ts
  - useCreateLead.ts
  - useUpdateLead.ts
  - useDeleteLead.ts

Example hook structure:
```typescript
export const useLeads = (filters: LeadFilters) => {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsService.getLeads(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLeadDto) => leadsService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create lead');
    },
  });
};
```

6. Type Definitions:
/src/types/
  - lead.types.ts
  - client.types.ts
  - proposal.types.ts
  - api.types.ts

Include:
- Response type definitions
- Request DTO types
- Error types
- Pagination types

7. Error Handling:
- Global error interceptor
- Toast notifications for errors
- Retry logic for network failures
- Token refresh on 401 errors
```

**Expected Output:** Complete API layer with React Query hooks in ~20 minutes

---

## Part 8: State Management (Day 12-13)

### **Generate Zustand Stores**

#### **Prompt to Cursor:**

```
Create Zustand stores for global state management:

1. Auth Store (/src/store/auth.store.ts):
   State:
   - user: User | null
   - isAuthenticated: boolean
   - isLoading: boolean
   
   Actions:
   - login(credentials): Promise<void>
   - logout(): void
   - setUser(user): void
   - updateProfile(data): Promise<void>
   
   Persistence:
   - Persist to localStorage
   - Auto-hydrate on app load

2. UI Store (/src/store/ui.store.ts):
   State:
   - sidebarOpen: boolean
   - theme: 'light' | 'dark'
   - notifications: Notification[]
   
   Actions:
   - toggleSidebar(): void
   - setTheme(theme): void
   - addNotification(notification): void
   - removeNotification(id): void

3. Proposal Store (/src/store/proposal.store.ts):
   State:
   - currentProposal: Proposal | null
   - currentStep: number
   - isDirty: boolean
   
   Actions:
   - setProposal(proposal): void
   - updateProposal(data): void
   - nextStep(): void
   - previousStep(): void
   - saveDraft(): Promise<void>
   - setDirty(dirty): void

For each store:
- TypeScript types for state and actions
- Middleware for logging (dev only)
- Persistence where appropriate
- DevTools integration
- Comments explaining usage

Example structure:
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        
        login: async (credentials) => {
          set({ isLoading: true });
          try {
            const response = await authService.login(credentials);
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },
        
        logout: () => {
          authService.logout();
          set({ user: null, isAuthenticated: false });
        },
        
        setUser: (user) => set({ user }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
```
```

**Expected Output:** Complete state management setup in ~10 minutes

---

## Part 9: Dashboard & Analytics (Day 13-15)

### **Generate Dashboard Components**

#### **Prompt to v0.dev:**

```
Create a dashboard for insurance advisors with:

Layout:
- Grid layout (3 columns on desktop, 1 on mobile)
- Welcome message at top with user name and greeting
- 6 widget cards

Widgets:
1. Quick Stats (top row, 3 cards):
   - Total Leads (number + trend indicator)
   - Conversion Rate (percentage + sparkline chart)
   - This Month's Premium (dollar amount + comparison to last month)

2. Today's Appointments (left column):
   - List of appointments with time and client name
   - "No appointments" empty state
   - "View All" link at bottom

3. Hot Leads (middle column):
   - List of 5 leads with high engagement
   - Show name, last contacted, status badge
   - "View All" link

4. Performance Chart (right column):
   - Line chart showing sales trend (last 6 months)
   - Toggle between Premium and Policies count
   - Comparison line for target

Styling:
- Material-UI Card components
- Clean, professional design
- Proper spacing
- Loading skeletons for each widget
- Consistent color scheme

Make it:
- Responsive (stack on mobile)
- Interactive (clickable items)
- Data-driven (props for all data)
```

**v0 generates:** Beautiful dashboard in 30 seconds

---

### **Generate Charts with AI**

#### **Prompt to Cursor:**

```
Create reusable chart components using Recharts:

1. PerformanceLineChart.tsx
   - Line chart showing performance over time
   - Props: data (array), xKey, yKey, title, color
   - Tooltip with formatted values
   - Responsive container
   - Grid and axes
   - Legend

2. ConversionFunnelChart.tsx
   - Funnel chart for sales stages
   - Props: data (stages with counts)
   - Percentage labels
   - Color gradient
   - Click handler for each stage

3. PieChart.tsx
   - Pie chart for distribution
   - Props: data, label, value
   - Legend
   - Tooltips
   - Percentage labels

4. BarChart.tsx
   - Bar chart for comparisons
   - Props: data, xKey, yKey, bars (array of bar configs)
   - Grouped or stacked mode
   - Hover effects

Include:
- TypeScript types
- Responsive design
- Loading states
- Empty states
- Accessibility labels
```

**Expected Output:** Reusable chart components in ~15 minutes

---

## Part 10: Testing Strategy (Ongoing)

### **Generate Unit Tests with AI**

#### **Prompt to Cursor:**

```
Generate comprehensive unit tests for LeadsService:

Test file: leads.service.spec.ts

Test cases:
1. create() method:
   - Should create a lead successfully
   - Should validate required fields
   - Should assign advisor from context
   - Should set default status to "not_contacted"
   - Should throw error on duplicate phone
   - Should sanitize input data

2. findAll() method:
   - Should return paginated leads
   - Should filter by status
   - Should filter by source
   - Should search by name/email/phone
   - Should sort by specified field
   - Should return only advisor's leads (non-admin)
   - Should return all leads (admin)
   - Should handle empty results

3. findOne() method:
   - Should return lead by ID
   - Should throw NotFoundException for invalid ID
   - Should check advisor ownership (non-admin)

4. update() method:
   - Should update lead successfully
   - Should validate ownership
   - Should not allow updating certain fields
   - Should log changes for audit

5. delete() method:
   - Should soft delete lead
   - Should check permissions (admin only)
   - Should not hard delete

Use:
- Jest as testing framework
- Mock repository with jest.mock()
- Setup and teardown for each test
- Proper assertions
- Test data factory
- 80%+ code coverage

Include:
- Mock data generators
- Helper functions for setup
- Clear test descriptions
- Arrange-Act-Assert pattern
```

**Expected Output:** Comprehensive test suite in ~10 minutes

---

## Part 11: Real-World Prompting Examples

### **Example 1: Bug Fix**

**When you encounter a bug:**

**Bad Prompt:**
```
Fix this bug
[paste error]
```

**Good Prompt to Cursor:**
```
I'm getting this error when submitting a lead form:

Error: "Cannot read property 'map' of undefined at LeadsList.tsx:45"

Context:
- Component: LeadsList.tsx
- Occurs when: API returns empty response
- Expected: Should show "No leads found" message
- Actual: Application crashes

Code at line 45:
{leads.data.map(lead => <LeadCard key={lead.id} lead={lead} />)}

Please:
1. Add null/undefined checks
2. Show proper loading state
3. Show empty state message when no leads
4. Add error boundary
5. Include unit test for this scenario
```

**Expected:** AI fixes the bug properly with defensive coding

---

### **Example 2: Adding New Feature**

**Task: Add "Duplicate Lead" feature**

**Prompt to Cursor:**
```
Add a "Duplicate Lead" feature to the Lead Management module:

Requirements:
1. Backend (NestJS):
   - New endpoint: POST /leads/:id/duplicate
   - Should copy all lead fields except:
     * id (generate new)
     * createdAt (set to now)
     * updatedAt (set to now)
   - Append " (Copy)" to lead name
   - Reset status to "not_contacted"
   - Keep same advisor
   - Return new lead
   - Add permission check (lead owner or admin)

2. Frontend (React):
   - Add "Duplicate" button to lead detail page
   - Show confirmation dialog before duplicating
   - Navigate to new lead after duplication
   - Show success toast message
   - Handle errors gracefully

3. Include:
   - Service method
   - Controller endpoint
   - DTO if needed
   - Frontend service call
   - React Query mutation hook
   - UI button component
   - Unit tests for both backend and frontend
   - Swagger documentation

Files to modify:
- Backend: src/modules/leads/leads.service.ts, leads.controller.ts
- Frontend: src/services/leads.service.ts, src/hooks/useLeads.ts, src/pages/LeadDetail.tsx
```

**Expected:** Complete feature implemented across stack in ~10 minutes

---

### **Example 3: Performance Optimization**

**Task: Optimize slow lead list query**

**Prompt to Cursor:**
```
The lead list query is taking 3+ seconds with 1000+ leads. Optimize it.

Current implementation:
```typescript
async findAll(filters: FilterLeadsDto, user: User) {
  const query = this.leadRepository.createQueryBuilder('lead')
    .where('lead.advisorId = :advisorId', { advisorId: user.id });
  
  if (filters.status) {
    query.andWhere('lead.status = :status', { status: filters.status });
  }
  
  const leads = await query.getMany();
  return leads;
}
```

Please optimize by:
1. Adding proper indexes to database
2. Implementing pagination correctly
3. Using select() to fetch only needed fields
4. Adding database query caching with Redis (5 min TTL)
5. Implementing cursor-based pagination for better performance
6. Add explain plan analysis

Provide:
- Migration file for indexes
- Optimized query
- Caching implementation
- Performance comparison (before/after)
- Load testing script
```

**Expected:** Optimized query reducing time to <500ms

---

## Part 12: Quality Control Checklist

### **After AI Generates Code, Always Check:**

#### **✅ Security Checklist**
```
□ No hardcoded secrets or API keys
□ All inputs validated and sanitized
□ SQL injection prevention (parameterized queries)
□ XSS prevention (escaped outputs)
□ CSRF protection enabled
□ Authentication on all protected routes
□ Authorization checks (role-based)
□ Rate limiting on sensitive endpoints
□ Proper error messages (no sensitive data leakage)
□ HTTPS enforced
□ Passwords hashed (bcrypt)
□ JWT tokens properly signed and verified
```

#### **✅ Performance Checklist**
```
□ Database queries optimized
□ Proper indexes on filtered/sorted columns
□ N+1 query problem avoided
□ Pagination implemented
□ Caching for expensive operations
□ Lazy loading for large components
□ Image optimization
□ Code splitting
□ Bundle size acceptable (<500KB initial)
□ API response times <2s
```

#### **✅ Code Quality Checklist**
```
□ TypeScript types for everything
□ No 'any' types
□ Proper error handling
□ Consistent naming conventions
□ Functions are single-purpose
□ Comments for complex logic
□ No duplicate code
□ Proper file organization
□ ESLint/Prettier passing
□ No console.logs in production code
```

#### **✅ Testing Checklist**
```
□ Unit tests for services (80%+ coverage)
□ Integration tests for APIs
□ E2E tests for critical flows
□ All tests passing
□ Edge cases covered
□ Error scenarios tested
□ Mock data properly isolated
```

---

## Part 13: Day-by-Day Execution Plan

### **Week 1: Foundation**

**Monday:**
- Morning: Install Cursor, Copilot, v0.dev accounts
- Afternoon: Generate NestJS backend structure
- Evening: Generate React frontend structure
- **Output:** Both projects initialized and pushed to Git

**Tuesday:**
- Morning: Generate database entities and migrations
- Afternoon: Set up Docker Compose, test local environment
- Evening: Run initial migrations, seed test data
- **Output:** Database schema ready

**Wednesday:**
- Morning: Generate authentication system (backend)
- Afternoon: Generate auth forms (frontend)
- Evening: Connect frontend to backend auth
- **Output:** Working login/logout

**Thursday:**
- Morning: Generate Lead Management module (backend)
- Afternoon: Generate Lead Management UI (frontend)
- Evening: Integration testing
- **Output:** Full CRUD for leads

**Friday:**
- Morning: Code review and cleanup
- Afternoon: Write tests for critical paths
- Evening: Deploy to Dev environment
- **Output:** Working prototype deployed

---

### **Week 2-3: Core Features**

**Focus:** Fact Finding, FNA, Proposals modules

**Daily Pattern:**
```
Morning: Generate backend service + controller
Midday: Generate frontend components
Afternoon: Integration and testing
Evening: Code review and refinement
```

**By end of Week 3:**
- ✅ Complete Fact Finding process
- ✅ FNA data collection
- ✅ Proposal workflow started

---

### **Week 4-6: Advanced Features**

**Focus:** Quotation, Application, Calendar

**Same daily pattern as Week 2-3**

**By end of Week 6:**
- ✅ Quotation generation
- ✅ Application submission
- ✅ Calendar/appointments
- ✅ Basic dashboard

---

### **Week 7-12: Polish & Production**

**Focus:** Testing, optimization, deployment

**Weekly:**
- Week 7-8: Integration testing, bug fixes
- Week 9-10: Performance optimization
- Week 11: Security hardening
- Week 12: UAT and production deployment

---

## Part 14: Advanced AI Techniques

### **Technique 1: Chain of Thought Prompting**

For complex features, break them down:

**Bad:**
```
Build a proposal recommendation engine
```

**Good:**
```
Step 1: Analyze customer data (income, family, goals)
Step 2: Calculate insurance needs based on human capital method
Step 3: Match needs to available products
Step 4: Rank products by suitability score
Step 5: Generate top 3 recommendations with explanations

For Step 1, create a function that...
[detailed requirements]
```

---

### **Technique 2: Iterative Refinement**

Generate, test, refine:

**Round 1:**
```
Create a lead search function with name, email, phone filtering
```

**Round 2 (after testing):**
```
The search is too slow. Optimize by:
- Adding full-text search indexes
- Implementing fuzzy matching
- Using database-level search instead of JS filtering
```

**Round 3:**
```
Add highlight of search terms in results
Add autocomplete suggestions
Add search history
```

---

### **Technique 3: Context Awareness**

Help AI understand your codebase:

**In Cursor, select relevant files and ask:**
```
Given the existing Lead entity and Client entity, create a Proposal entity that:
- References both Lead and Client
- Follows the same pattern as other entities
- Uses consistent naming conventions
- Includes proper relations
```

---

## Part 15: Common Pitfalls & Solutions

### **Pitfall 1: AI Generates Inconsistent Code**

**Problem:** Different naming conventions, styles

**Solution:**
```
Create a .cursorrules file in project root:

Our coding standards:
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use kebab-case for file names
- Always use TypeScript strict mode
- No 'any' types
- All functions must have JSDoc comments
- Use async/await, not promises.then()
- Error handling with try-catch
- Use Material-UI for all UI components
```

---

### **Pitfall 2: AI Doesn't Understand Business Logic**

**Problem:** Generic insurance calculations

**Solution:**
```
Provide specific examples in prompt:

For premium calculation, use this formula:
- Base Premium = (Sum Assured / 1000) × Rate
- Rate depends on age:
  * 18-30: $2.50
  * 31-40: $3.75
  * 41-50: $5.50
  * 51-60: $8.25
  * 61+: $12.00
- Add 50% for smokers
- Add 25% for high-risk occupation

Example:
Age 35, non-smoker, $500,000 coverage:
Base = (500000 / 1000) × 3.75 = $1,875/year
```

---

### **Pitfall 3: AI Generates Insecure Code**

**Problem:** Missing auth checks, SQL injection

**Solution:**
```
Always specify security in prompts:

Create API endpoint with:
- JWT authentication required
- Role check (only advisors and admins)
- Input validation (class-validator)
- SQL injection prevention (TypeORM parameterized queries)
- Rate limiting (5 requests per minute)
- Audit logging
- Error handling without sensitive data exposure
```

---

## Part 16: Measuring Success

### **Track AI Productivity Gains**

**Metrics to measure:**
```
Traditional Development:
- Lead Management CRUD: 3 days
- Auth system: 4 days
- Complex form: 5 days
- API integration: 2 days
Total: 14 days

With AI:
- Lead Management CRUD: 4 hours + 2 hours review = 6 hours
- Auth system: 5 hours + 3 hours review = 8 hours
- Complex form: 6 hours + 4 hours refinement = 10 hours
- API integration: 2 hours + 1 hour review = 3 hours
Total: 27 hours (3.4 days)

Time Saved: 10.6 days (75% reduction)
```

---

## Part 17: Emergency Procedures

### **When AI Gets Stuck**

**Problem:** AI generates broken code repeatedly

**Solution 1: Reset Context**
```
1. Close all files in Cursor
2. Clear chat history
3. Start fresh prompt with minimal context
4. Be more specific in requirements
```

**Solution 2: Switch Tools**
```
If Cursor struggles:
- Try GitHub Copilot for line-by-line
- Try Claude.ai for planning
- Try v0.dev for UI components
- Manual coding for complex logic
```

**Solution 3: Break It Down**
```
Instead of: "Build complete proposal module"
Do: 
1. "Create proposal entity"
2. "Create proposal service with CRUD"
3. "Create proposal controller"
4. "Add validation"
5. "Add tests"
```

---

## Summary: Your AI-First Workflow

### **The Pattern:**
```
1. Plan (Human) → Define requirements, acceptance criteria
2. Generate (AI) → Create code, components, tests
3. Review (Human) → Check security, quality, business logic
4. Refine (AI + Human) → Fix issues, optimize
5. Test (Human) → Integration testing, edge cases
6. Deploy (Human) → Production deployment, monitoring
```

### **Time Allocation:**
```
AI Coding: 60-70%
Human Review: 15-20%
Human Enhancement: 10-15%
Testing: 5-10%
```

### **Expected Timeline:**
```
Week 1: ✅ Foundation + Auth + 1 module
Week 2-3: ✅ 3-4 major modules
Week 4-6: ✅ Advanced features
Week 7-12: ✅ Polish, test, deploy
```

---

## Next Steps

**Tomorrow Morning:**
1. ✅ Install Cursor IDE
2. ✅ Subscribe to Cursor Pro + Copilot
3. ✅ Create accounts on v0.dev
4. ✅ Initialize both projects using prompts from Part 2
5. ✅ Generate auth system using prompts from Part 4

**This Week:**
- Generate all database entities (Day 2)
- Build auth system (Day 2-3)
- Create first CRUD module (Day 3-4)
- Deploy working prototype (Day 5)

**You're ready to build 10x faster! 🚀**

---

**Questions?** Ask me anytime - I'm here to help you succeed with AI-first development!

**Document Status:** Ready for Implementation  
**Last Updated:** October 27, 2025
