# AI-First Development with Claude Code
## Insurance Advisor Application - Claude Code Edition

**Document Version:** 2.0  
**Last Updated:** October 27, 2025  
**Primary Tool:** Claude Code (by Anthropic)

---

## Why Claude Code is Perfect for This Project

### **Advantages Over Other Tools:**

1. **Full Task Delegation**
   - You describe what you want
   - Claude Code builds it autonomously
   - Creates multiple files at once
   - Understands your entire codebase

2. **Terminal-Native**
   - Works with any IDE/editor
   - No need to switch tools
   - Integrates with your workflow
   - Git-friendly

3. **Context-Aware**
   - Reads your entire project
   - Understands dependencies
   - Maintains consistency
   - Follows your patterns

4. **Built by Anthropic**
   - Best Claude integration
   - Regular updates
   - Optimized for Claude's strengths

---

## Part 1: Setup Claude Code

### **Installation & Configuration**

If you already have Claude Code installed, ensure it's configured:

```bash
# Check installation
claude --version

# If not installed, follow: https://docs.claude.com/en/docs/claude-code

# Configure for your project
cd /path/to/your/projects
mkdir insurance-advisor
cd insurance-advisor
```

### **Project Structure**

```bash
insurance-advisor/
├── backend/          # NestJS API
├── frontend/         # React Web App
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── .claude/         # Claude Code config (auto-generated)
```

---

## Part 2: Generate Backend with Claude Code

### **Task 1: Initialize NestJS Project**

**Open terminal and use Claude Code:**

```bash
cd insurance-advisor
claude task "Initialize a production-ready NestJS backend project"
```

**Then provide detailed instructions:**

```
Project Name: insurance-advisor-api
Location: ./backend

Requirements:
1. NestJS 10.x with TypeScript strict mode
2. Microservices architecture structure
3. TypeORM for MySQL database
4. Redis integration for caching
5. Passport JWT authentication
6. Swagger/OpenAPI documentation
7. Winston logger
8. class-validator for validation
9. CORS configuration
10. Environment configuration (@nestjs/config)

Folder Structure:
/src
  /modules
    /auth (authentication & authorization)
    /leads (lead management)
    /clients (client management)
    /proposals (proposal workflow)
    /users (user management)
    /appointments (calendar & tasks)
    /analytics (performance tracking)
  /common
    /decorators
    /filters (exception filters)
    /guards (auth guards)
    /interceptors
    /pipes (validation pipes)
  /config (configuration modules)
  /database (TypeORM config, migrations)

Files to Create:
- src/main.ts (entry point with Swagger)
- src/app.module.ts
- src/app.controller.ts
- src/app.service.ts
- package.json (with all dependencies)
- tsconfig.json (strict mode)
- .env.example
- .gitignore
- README.md (with setup instructions)
- docker-compose.yml (MySQL 8.0 + Redis 7.0)

Configuration:
- Port: 3001
- Database: MySQL 8.0
- Cache: Redis 7.0
- Swagger: /api/docs

Include:
- Global validation pipe
- Global exception filter
- Request logging interceptor
- CORS for localhost:3000
- Helmet for security headers
```

**Claude Code will:**
- Create entire project structure
- Generate all configuration files
- Set up Docker Compose
- Create README with instructions
- Initialize Git repository

**Time: 2-3 minutes**

---

### **Task 2: Generate Database Entities**

```bash
claude task "Create TypeORM entities for insurance advisor application"
```

**Instructions:**

```
Create the following TypeORM entities in ./backend/src/modules:

1. User Entity (./backend/src/modules/users/entities/user.entity.ts)
Fields:
- id: uuid (primary key, generated)
- email: string (unique, indexed, lowercase)
- password: string (hashed, select: false by default)
- firstName: string (required)
- lastName: string (required)
- role: enum (advisor, admin, manager, support)
- advisorId: string (nullable, for external ID)
- advisorIdExpiry: date (nullable)
- status: enum (active, inactive, suspended)
- phone: string (required)
- lastLoginAt: timestamp (nullable)
- createdAt: timestamp (auto)
- updatedAt: timestamp (auto)
- deletedAt: timestamp (nullable, for soft delete)

Relations:
- One-to-many with Lead (as advisor)
- One-to-many with Proposal (as advisor)
- One-to-many with Appointment (as advisor)

Methods:
- hashPassword(): async method to hash password before insert
- validatePassword(password): async method to check password
- toJSON(): remove password from response

Indexes:
- email (unique)
- status
- role
- createdAt

2. Lead Entity (./backend/src/modules/leads/entities/lead.entity.ts)
Fields:
- id: uuid (primary key)
- name: string (required, min 2 chars)
- email: string (nullable, validated email format)
- phone: string (required, indexed)
- nationalId: string (nullable)
- dateOfBirth: date (nullable)
- gender: enum (male, female, other, prefer_not_to_say)
- status: enum (not_contacted, contacted, qualified, nurturing, converted, lost, default: not_contacted)
- source: enum (referral, website, campaign, walk_in, call_in, social_media, other)
- notes: text (nullable)
- lastContactedAt: timestamp (nullable, indexed)
- nextAppointmentAt: timestamp (nullable, indexed)
- convertedAt: timestamp (nullable)
- advisorId: uuid (foreign key to User, required)
- createdAt: timestamp (auto, indexed)
- updatedAt: timestamp (auto)
- deletedAt: timestamp (nullable, soft delete)

Relations:
- Many-to-one with User (advisor)
- One-to-many with Appointment
- One-to-many with Proposal

Indexes:
- advisorId
- status
- source
- createdAt
- phone
- composite (advisorId, status)

3. Client Entity (./backend/src/modules/clients/entities/client.entity.ts)
Extends Lead with additional fields:
- address: text
- occupation: string
- annualIncome: decimal (10,2)
- maritalStatus: enum (single, married, divorced, widowed)
- numberOfDependents: integer (default 0)
- riskProfile: enum (low, low_medium, medium_high, high)

Additional Relations:
- One-to-many with Policy

4. Proposal Entity (./backend/src/modules/proposals/entities/proposal.entity.ts)
Fields:
- id: uuid (primary key)
- proposalNumber: string (unique, auto-generated, indexed)
- clientId: uuid (foreign key, can be Lead or Client)
- advisorId: uuid (foreign key to User)
- stage: enum (fact_finding, fna, recommendation, quotation, application)
- status: enum (draft, in_progress, pending_approval, approved, rejected, completed, cancelled)
- totalPremium: decimal (12,2)
- totalSumAssured: decimal (15,2)
- data: jsonb (for flexible fact-finding and proposal data)
- factFindingData: jsonb
- fnaData: jsonb
- recommendationData: jsonb
- quotationData: jsonb
- applicationData: jsonb
- submittedAt: timestamp (nullable)
- approvedAt: timestamp (nullable)
- completedAt: timestamp (nullable)
- createdAt: timestamp (indexed)
- updatedAt: timestamp

Relations:
- Many-to-one with Client
- Many-to-one with User (advisor)
- One-to-many with Policy

Indexes:
- proposalNumber (unique)
- clientId
- advisorId
- stage
- status
- createdAt
- composite (advisorId, stage)

Methods:
- generateProposalNumber(): auto-generate unique proposal number

5. Policy Entity (./backend/src/modules/policies/entities/policy.entity.ts)
Fields:
- id: uuid (primary key)
- policyNumber: string (unique, indexed)
- clientId: uuid (foreign key)
- proposalId: uuid (foreign key, nullable)
- productName: string
- productType: string
- coverageType: enum (life, health, critical_illness, disability, accident, savings, investment)
- sumAssured: decimal (15,2)
- premium: decimal (12,2)
- premiumFrequency: enum (monthly, quarterly, semi_annual, annual)
- status: enum (active, pending, lapsed, cancelled, matured)
- effectiveDate: date
- expiryDate: date (nullable)
- lastPremiumPaidDate: date (nullable)
- nextPremiumDueDate: date (nullable)
- beneficiaryInfo: jsonb
- createdAt: timestamp
- updatedAt: timestamp

Relations:
- Many-to-one with Client
- Many-to-one with Proposal (optional)

Indexes:
- policyNumber (unique)
- clientId
- status
- effectiveDate
- expiryDate

6. Appointment Entity (./backend/src/modules/appointments/entities/appointment.entity.ts)
Fields:
- id: uuid (primary key)
- title: string (required)
- type: enum (appointment, task, reminder)
- description: text (nullable)
- startTime: timestamp (required, indexed)
- endTime: timestamp (nullable)
- allDay: boolean (default false)
- location: string (nullable)
- clientId: uuid (foreign key, nullable)
- leadId: uuid (foreign key, nullable)
- advisorId: uuid (foreign key, required)
- status: enum (scheduled, completed, cancelled, no_show)
- reminderSent: boolean (default false)
- notes: text (nullable)
- createdAt: timestamp
- updatedAt: timestamp

Relations:
- Many-to-one with User (advisor)
- Many-to-one with Client (optional)
- Many-to-one with Lead (optional)

Indexes:
- advisorId
- startTime
- status
- clientId
- leadId
- composite (advisorId, startTime)

For ALL Entities:
- Use proper TypeORM decorators
- Add class-validator decorators for validation
- Include JSDoc comments
- Use TypeScript strict mode
- Enable soft deletes where appropriate
- Add createdAt/updatedAt timestamps
- Create proper indexes for performance
- Add foreign key constraints
- Use cascade options appropriately

Also Generate:
- Initial migration file for all entities
- Database seeder with sample data for development
```

**Claude Code will:**
- Create all 6 entity files
- Generate migration file
- Create seed data file
- Set up proper relationships
- Add all indexes

**Time: 5 minutes**

---

### **Task 3: Generate Authentication Module**

```bash
claude task "Create complete JWT authentication system"
```

**Instructions:**

```
Create a production-ready authentication system in ./backend/src/modules/auth:

Module Structure:
/auth
  /strategies
    - jwt.strategy.ts
    - local.strategy.ts
  /guards
    - jwt-auth.guard.ts
    - roles.guard.ts
  /decorators
    - current-user.decorator.ts
    - roles.decorator.ts
    - public.decorator.ts
  /dto
    - login.dto.ts
    - register.dto.ts
    - refresh-token.dto.ts
  - auth.module.ts
  - auth.controller.ts
  - auth.service.ts

Features to Implement:

1. Auth Service Methods:
   - login(loginDto): Validate credentials, return JWT tokens
   - register(registerDto): Create new user (admin only)
   - validateUser(email, password): Check user exists and password correct
   - refreshToken(refreshToken): Generate new access token
   - logout(userId): Invalidate refresh token
   - changePassword(userId, oldPassword, newPassword): Update password
   - hashPassword(password): bcrypt with 10 rounds

2. JWT Strategy:
   - Validate JWT tokens
   - Extract user from token
   - Attach user to request object
   - Token expiration: 8 hours
   - Refresh token expiration: 7 days

3. Local Strategy:
   - Username/password authentication
   - Rate limiting: 5 attempts per 15 minutes per IP
   - Lock account after 5 failed attempts

4. Guards:
   - JwtAuthGuard: Protect routes requiring authentication
   - RolesGuard: Check user has required role(s)
   - Both guards should be composable

5. Decorators:
   - @CurrentUser(): Get current user from request
   - @Roles('admin', 'advisor'): Specify required roles
   - @Public(): Mark route as public (skip auth)

6. DTOs:
   LoginDto:
   - email (required, email format, lowercase)
   - password (required, min 8 chars)

   RegisterDto:
   - email (required, email format, unique)
   - password (required, min 8 chars, must contain uppercase, lowercase, number)
   - firstName (required, min 2 chars)
   - lastName (required, min 2 chars)
   - role (required, enum)
   - phone (required, valid phone format)

7. API Endpoints:
   POST /auth/login
   - Body: LoginDto
   - Returns: { access_token, refresh_token, user, expiresIn }
   - Public endpoint

   POST /auth/register
   - Body: RegisterDto
   - Returns: { user }
   - Protected: Admin only

   POST /auth/refresh
   - Body: { refresh_token }
   - Returns: { access_token }
   - Public endpoint

   POST /auth/logout
   - Invalidates refresh token
   - Protected endpoint

   GET /auth/profile
   - Returns current user data
   - Protected endpoint

   POST /auth/change-password
   - Body: { oldPassword, newPassword }
   - Protected endpoint

8. Security Features:
   - Passwords hashed with bcrypt (10 rounds)
   - JWT secret from environment variable
   - Refresh tokens stored in Redis
   - Rate limiting on login endpoint
   - Account lockout after failed attempts
   - Password strength requirements
   - Token blacklisting on logout

9. Error Handling:
   - Proper error messages (don't reveal user existence)
   - Log authentication attempts
   - Return 401 for invalid credentials
   - Return 403 for insufficient permissions

10. Testing:
    - Unit tests for auth service
    - Integration tests for auth controller
    - E2E tests for authentication flows
    - Mock UserRepository
    - Test rate limiting
    - Test role guards

Include:
- Swagger documentation for all endpoints
- Request/response examples
- Error response schemas
- Security descriptions

Environment Variables Required:
- JWT_SECRET
- JWT_EXPIRATION (default: 8h)
- REFRESH_TOKEN_EXPIRATION (default: 7d)
```

**Claude Code will:**
- Create complete auth module
- Generate all DTOs, guards, strategies
- Write comprehensive tests
- Add Swagger documentation

**Time: 10 minutes**

---

### **Task 4: Generate CRUD Module (Lead Management)**

```bash
claude task "Create complete Lead Management CRUD module"
```

**Instructions:**

```
Create a full-featured Lead Management module in ./backend/src/modules/leads:

Module Structure:
/leads
  /dto
    - create-lead.dto.ts
    - update-lead.dto.ts
    - filter-leads.dto.ts
    - lead-response.dto.ts
  /entities
    - lead.entity.ts (already exists, ensure consistency)
  - leads.module.ts
  - leads.controller.ts
  - leads.service.ts
  - leads.repository.ts (custom repository if needed)

Service Implementation:

1. LeadsService Methods:
   - create(createLeadDto, currentUser): Create new lead
   - findAll(filters, pagination, currentUser): Get paginated leads with filters
   - findOne(id, currentUser): Get single lead by ID
   - update(id, updateLeadDto, currentUser): Update lead
   - remove(id, currentUser): Soft delete lead
   - updateStatus(id, status, currentUser): Update lead status
   - search(query, currentUser): Search leads by name/email/phone
   - getLeadsByAdvisor(advisorId, filters): Get advisor's leads
   - convertToClient(id, currentUser): Convert lead to client
   - getLeadStats(currentUser): Get lead statistics

2. Authorization Logic:
   - Advisors: Can only see/edit their own leads
   - Managers: Can see team leads
   - Admins: Can see all leads
   - Enforce in service layer

3. DTOs:

   CreateLeadDto:
   - name (required, string, 2-100 chars)
   - email (optional, email format, lowercase)
   - phone (required, valid phone number)
   - nationalId (optional, string)
   - dateOfBirth (optional, ISO date)
   - gender (optional, enum)
   - source (required, enum)
   - notes (optional, text)
   - nextAppointmentAt (optional, future date)

   UpdateLeadDto:
   - All CreateLeadDto fields (all optional)
   - status (optional, enum)
   - lastContactedAt (optional, timestamp)

   FilterLeadsDto:
   - status (optional, enum, multiple allowed)
   - source (optional, enum, multiple allowed)
   - search (optional, string, searches name/email/phone)
   - fromDate (optional, ISO date)
   - toDate (optional, ISO date)
   - page (optional, number, default 1, min 1)
   - limit (optional, number, default 50, min 1, max 100)
   - sortBy (optional, string, default 'createdAt')
   - sortOrder (optional, enum: ASC/DESC, default DESC)

   LeadResponseDto:
   - Transform entity for API response
   - Exclude sensitive fields
   - Include computed fields (daysAgo, isOverdue, etc.)
   - Include related data counts

4. Controller Endpoints:

   POST /leads
   - Create new lead
   - @UseGuards(JwtAuthGuard)
   - @Body() createLeadDto
   - Returns: LeadResponseDto
   - Status: 201

   GET /leads
   - Get all leads with filters and pagination
   - @UseGuards(JwtAuthGuard)
   - @Query() filters: FilterLeadsDto
   - Returns: PaginatedResponse<LeadResponseDto>
   - Status: 200

   GET /leads/:id
   - Get single lead by ID
   - @UseGuards(JwtAuthGuard)
   - @Param('id') id: string
   - Returns: LeadResponseDto
   - Status: 200
   - Error: 404 if not found or no access

   PUT /leads/:id
   - Update lead
   - @UseGuards(JwtAuthGuard)
   - @Param('id') id: string
   - @Body() updateLeadDto
   - Returns: LeadResponseDto
   - Status: 200

   PATCH /leads/:id/status
   - Update lead status
   - @UseGuards(JwtAuthGuard)
   - @Param('id') id: string
   - @Body() { status }
   - Returns: LeadResponseDto
   - Status: 200

   DELETE /leads/:id
   - Soft delete lead
   - @UseGuards(JwtAuthGuard, RolesGuard)
   - @Roles('admin', 'manager')
   - @Param('id') id: string
   - Returns: { message: 'Lead deleted successfully' }
   - Status: 200

   POST /leads/:id/convert
   - Convert lead to client
   - @UseGuards(JwtAuthGuard)
   - @Param('id') id: string
   - Returns: ClientResponseDto
   - Status: 200

   GET /leads/search
   - Search leads (alternative to query param)
   - @UseGuards(JwtAuthGuard)
   - @Query('q') query: string
   - Returns: LeadResponseDto[]
   - Status: 200

   GET /leads/stats
   - Get lead statistics
   - @UseGuards(JwtAuthGuard)
   - Returns: LeadStatsDto
   - Status: 200

5. Features:
   - Pagination with page/limit
   - Sorting by any field
   - Multiple filters can be combined
   - Full-text search across name/email/phone
   - Role-based data access
   - Audit logging for all changes
   - Soft deletes (deletedAt)
   - Optimistic locking for updates
   - Transaction support

6. Error Handling:
   - NotFoundException: Lead not found
   - ForbiddenException: No access to lead
   - ConflictException: Duplicate phone/email
   - BadRequestException: Invalid input
   - Proper error messages

7. Database Optimization:
   - Use QueryBuilder for complex filters
   - Eager load relations when needed
   - Use indexes for filtered fields
   - Implement query result caching (Redis, 5 min)
   - Pagination to prevent loading all records

8. Validation:
   - All DTOs have class-validator decorators
   - Custom validators for phone number format
   - Custom validators for business rules
   - Sanitize inputs (trim strings, lowercase emails)

9. Testing:
   - Unit tests for service (80%+ coverage)
   - Integration tests for controller
   - Test all authorization scenarios
   - Test pagination edge cases
   - Test filter combinations
   - Mock repository
   - Test data fixtures

10. Documentation:
    - Swagger decorators on all endpoints
    - @ApiTags('Leads')
    - @ApiResponse for all status codes
    - @ApiOperation descriptions
    - Request/response examples
    - Error response schemas

Include:
- Audit logging interceptor
- Performance monitoring
- Request validation pipe
- Response transformation interceptor
```

**Claude Code will:**
- Create complete Lead Management module
- All CRUD operations
- Advanced filtering and search
- Role-based access control
- Comprehensive tests
- Full Swagger documentation

**Time: 15 minutes**

---

## Part 3: Generate Frontend with Claude Code

### **Task 5: Initialize React Project**

```bash
claude task "Initialize production-ready React TypeScript project with Vite"
```

**Instructions:**

```
Project Name: insurance-advisor-web
Location: ./frontend

Setup:
1. Vite 5.x as build tool
2. React 18.x
3. TypeScript 5.x (strict mode)
4. Material-UI (MUI) v5
5. React Router v6
6. Zustand for state management
7. React Query (TanStack Query) for data fetching
8. React Hook Form + Zod for forms
9. Axios for HTTP client
10. date-fns for date manipulation

Folder Structure:
/src
  /components
    /common (Button, Input, Card, Modal, etc.)
    /layout (AppLayout, Header, Sidebar, Footer)
  /features
    /auth (Login, Register, Profile)
    /leads (LeadList, LeadDetail, LeadForm)
    /clients (ClientList, ClientDetail, ClientProfile)
    /proposals (ProposalList, ProposalWizard)
    /dashboard (Dashboard, Widgets)
    /analytics (Charts, Reports)
    /appointments (Calendar, AppointmentForm)
  /hooks (custom React hooks)
  /services (API service layer)
  /store (Zustand stores)
  /types (TypeScript interfaces and types)
  /utils (helper functions, formatters)
  /config (app configuration)
  /theme (MUI theme customization)
  /routes (route definitions)

Files to Create:
- src/main.tsx (entry point)
- src/App.tsx (root component with routing)
- src/vite-env.d.ts (Vite types)
- package.json (all dependencies)
- tsconfig.json (strict TypeScript config)
- tsconfig.node.json (for Vite config)
- vite.config.ts (with path aliases, proxy)
- .env.example (environment variables)
- .gitignore
- README.md (setup instructions)
- index.html
- eslint.config.js (ESLint 9.x flat config)
- .prettierrc (code formatting)

Vite Configuration:
- Port: 3000
- API proxy: /api -> http://localhost:3001
- Path aliases: @ -> ./src
- Build optimizations
- PWA support (optional)

MUI Theme:
- Primary color: #1976d2 (blue)
- Secondary color: #dc004e (pink)
- Success: #4caf50
- Warning: #ff9800
- Error: #f44336
- Typography: Roboto font
- Dark mode support
- Responsive breakpoints
- Custom component styles

ESLint + Prettier:
- TypeScript rules
- React hooks rules
- Import sorting
- Unused imports removal
- Consistent formatting

Environment Variables:
- VITE_API_URL (default: http://localhost:3001)
- VITE_APP_NAME (default: Insurance Advisor)

Initial Routes:
- / -> Dashboard (protected)
- /login -> Login page (public)
- /leads -> Lead list (protected)
- /leads/:id -> Lead detail (protected)
- /clients -> Client list (protected)
- /proposals -> Proposal list (protected)
- /calendar -> Appointments (protected)
- /analytics -> Analytics (protected)
- /profile -> User profile (protected)

Include:
- Loading spinner component
- Error boundary
- Not found (404) page
- Unauthorized (403) page
- Layout with sidebar navigation
- Protected route wrapper
- Auth context provider
```

**Claude Code will:**
- Create complete React project
- Set up all configurations
- Create folder structure
- Add routing
- Set up MUI theme

**Time: 3 minutes**

---

### **Task 6: Generate API Service Layer**

```bash
claude task "Create complete API service layer with React Query hooks"
```

**Instructions:**

```
Create API service layer in ./frontend/src/services and ./frontend/src/hooks:

1. Axios Configuration (./frontend/src/services/api.ts):
   - Base URL from environment variable
   - Request interceptor: Add JWT token to Authorization header
   - Request interceptor: Add request ID for tracking
   - Response interceptor: Handle errors globally
   - Response interceptor: Refresh token on 401
   - Timeout: 30 seconds
   - Retry logic: 3 attempts with exponential backoff
   - Request/response logging (dev only)

2. Auth Service (./frontend/src/services/auth.service.ts):
   Methods:
   - login(email, password): POST /auth/login
   - logout(): POST /auth/logout
   - refreshToken(): POST /auth/refresh
   - getCurrentUser(): GET /auth/profile
   - changePassword(oldPassword, newPassword): POST /auth/change-password
   - updateProfile(data): PUT /auth/profile

3. Leads Service (./frontend/src/services/leads.service.ts):
   Methods:
   - getLeads(filters): GET /leads with query params
   - getLead(id): GET /leads/:id
   - createLead(data): POST /leads
   - updateLead(id, data): PUT /leads/:id
   - deleteLead(id): DELETE /leads/:id
   - updateLeadStatus(id, status): PATCH /leads/:id/status
   - searchLeads(query): GET /leads/search
   - convertToClient(id): POST /leads/:id/convert
   - getLeadStats(): GET /leads/stats

4. Clients Service (./frontend/src/services/clients.service.ts):
   Methods:
   - getClients(filters): GET /clients
   - getClient(id): GET /clients/:id
   - updateClient(id, data): PUT /clients/:id
   - getClientPolicies(id): GET /clients/:id/policies
   - getClientProposals(id): GET /clients/:id/proposals

5. Proposals Service (./frontend/src/services/proposals.service.ts):
   Methods:
   - getProposals(filters): GET /proposals
   - getProposal(id): GET /proposals/:id
   - createProposal(data): POST /proposals
   - updateProposal(id, data): PUT /proposals/:id
   - submitProposal(id): POST /proposals/:id/submit
   - updateStage(id, stage): PATCH /proposals/:id/stage

6. Appointments Service (./frontend/src/services/appointments.service.ts):
   Methods:
   - getAppointments(filters): GET /appointments
   - getAppointment(id): GET /appointments/:id
   - createAppointment(data): POST /appointments
   - updateAppointment(id, data): PUT /appointments/:id
   - deleteAppointment(id): DELETE /appointments/:id
   - getCalendarEvents(start, end): GET /appointments/calendar

7. Type Definitions (./frontend/src/types/):
   Files:
   - api.types.ts (ApiResponse, PaginatedResponse, ApiError)
   - lead.types.ts (Lead, CreateLeadDto, UpdateLeadDto, FilterLeadsDto)
   - client.types.ts (Client, Policy, UpdateClientDto)
   - proposal.types.ts (Proposal, ProposalStage, ProposalStatus)
   - auth.types.ts (User, LoginDto, TokenResponse)
   - appointment.types.ts (Appointment, AppointmentType)

   Include proper TypeScript interfaces for:
   - Request DTOs
   - Response types
   - Enum types
   - Pagination types
   - Error types

8. React Query Hooks (./frontend/src/hooks/):

   useLeads.ts:
   ```typescript
   export const useLeads = (filters: LeadFilters) => {
     return useQuery({
       queryKey: ['leads', filters],
       queryFn: () => leadsService.getLeads(filters),
       staleTime: 5 * 60 * 1000, // 5 minutes
       retry: 2,
     });
   };

   export const useLead = (id: string) => {
     return useQuery({
       queryKey: ['lead', id],
       queryFn: () => leadsService.getLead(id),
       enabled: !!id,
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
       onError: (error: ApiError) => {
         toast.error(error.message || 'Failed to create lead');
       },
     });
   };

   export const useUpdateLead = () => {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: ({ id, data }: { id: string; data: UpdateLeadDto }) =>
         leadsService.updateLead(id, data),
       onSuccess: (_, variables) => {
         queryClient.invalidateQueries({ queryKey: ['leads'] });
         queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
         toast.success('Lead updated successfully');
       },
       onError: (error: ApiError) => {
         toast.error(error.message || 'Failed to update lead');
       },
     });
   };

   export const useDeleteLead = () => {
     const queryClient = useQueryClient();
     
     return useMutation({
       mutationFn: (id: string) => leadsService.deleteLead(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['leads'] });
         toast.success('Lead deleted successfully');
       },
     });
   };
   ```

   Create similar hooks for:
   - useClients, useClient, useUpdateClient
   - useProposals, useProposal, useCreateProposal, useUpdateProposal
   - useAppointments, useAppointment, useCreateAppointment

9. Error Handling:
   - Global error interceptor in axios
   - Toast notifications for errors
   - Retry logic for network failures
   - Token refresh on 401
   - Redirect to login on 403
   - Error boundary for React errors

10. Features:
    - Request cancellation for query changes
    - Optimistic updates for mutations
    - Cache invalidation strategies
    - Loading states
    - Error states
    - Success callbacks
    - Retry logic

Include:
- JSDoc comments for all functions
- TypeScript strict mode
- Error type definitions
- Toast notification integration (react-toastify)
```

**Claude Code will:**
- Create all service files
- Generate React Query hooks
- Set up type definitions
- Implement error handling
- Add toast notifications

**Time: 15 minutes**

---

### **Task 7: Generate UI Components**

For UI components, you can use **Claude Code** or **v0.dev**. I recommend:

**Claude Code for:** Complex, stateful components  
**v0.dev for:** Quick visual components

#### **Option A: Using Claude Code**

```bash
claude task "Create Lead List component with table and filters"
```

**Instructions:**

```
Create a Lead List component in ./frontend/src/features/leads/LeadList.tsx:

Features:
1. Table Display:
   - Columns: Name, Phone, Email, Status, Source, Last Contacted, Actions
   - Sortable columns (click header to sort)
   - Clickable rows (navigate to detail page)
   - Status badges with colors
   - Action menu (Edit, Delete, Convert to Client)
   - Responsive (cards on mobile, table on desktop)

2. Search & Filters:
   - Search bar (searches name/email/phone)
   - Status filter (multi-select dropdown)
   - Source filter (multi-select dropdown)
   - Date range filter (From Date - To Date)
   - Clear all filters button
   - Active filter chips

3. Pagination:
   - Show "Showing 1-50 of 243 leads"
   - Page size selector (25, 50, 100)
   - Previous/Next buttons
   - Page number selector
   - Go to page input

4. Top Actions:
   - "+ New Lead" button (primary)
   - Export button (secondary)
   - Refresh button (icon only)

5. States:
   - Loading: Skeleton table rows
   - Empty: "No leads found" with illustration
   - Error: Error message with retry button
   - Success: Display data

6. Status Colors:
   - Not Contacted: Gray
   - Contacted: Blue
   - Qualified: Green
   - Nurturing: Yellow
   - Converted: Purple
   - Lost: Red

Technologies:
- React + TypeScript
- Material-UI Table, Button, Chip, TextField, Select
- React Query (useLeads hook)
- React Router (useNavigate)
- date-fns for date formatting

Props:
- None (manages own state with URL params)

URL State:
- Sync filters with URL query params
- Example: /leads?status=contacted,qualified&search=john&page=2

Include:
- TypeScript types
- Proper loading states
- Error handling
- Accessibility (ARIA labels)
- Responsive design
- Unit tests
```

**Claude Code will:**
- Create complete component
- Handle all states
- Implement filtering
- Add pagination
- Style with MUI

**Time: 20 minutes**

---

#### **Option B: Using v0.dev (Faster for Pure UI)**

**For simpler visual components:**

1. Go to v0.dev
2. Describe what you want
3. Get instant component
4. Copy to your project

**Example v0.dev prompt:**
```
Create a Material-UI table for insurance leads with:
- Columns: Name, Phone, Email, Status, Source, Actions
- Status badges (colored)
- Search bar above table
- Pagination below
- "New Lead" button top right
- Responsive design
```

**v0.dev generates in 30 seconds!**

---

## Part 4: Zustand State Management

### **Task 8: Generate State Stores**

```bash
claude task "Create Zustand stores for global state"
```

**Instructions:**

```
Create Zustand stores in ./frontend/src/store/:

1. Auth Store (auth.store.ts):
State:
- user: User | null
- isAuthenticated: boolean
- isLoading: boolean
- accessToken: string | null

Actions:
- login(credentials): Promise<void>
- logout(): void
- setUser(user): void
- refreshToken(): Promise<void>
- updateProfile(data): Promise<void>

Persistence:
- Persist user and accessToken to localStorage
- Auto-hydrate on app load
- Clear on logout

2. UI Store (ui.store.ts):
State:
- sidebarOpen: boolean (default: true)
- theme: 'light' | 'dark' (default: 'light')
- notifications: Notification[]

Actions:
- toggleSidebar(): void
- setSidebarOpen(open): void
- setTheme(theme): void
- addNotification(notification): void
- removeNotification(id): void
- clearNotifications(): void

Persistence:
- Persist sidebarOpen and theme to localStorage

3. Proposal Store (proposal.store.ts):
State:
- currentProposal: Proposal | null
- currentStep: number (default: 0)
- isDirty: boolean (default: false)
- factFindingData: object
- fnaData: object
- recommendationData: object

Actions:
- setProposal(proposal): void
- updateProposalData(section, data): void
- nextStep(): void
- previousStep(): void
- goToStep(step): void
- saveDraft(): Promise<void>
- setDirty(dirty): void
- clearProposal(): void

Persistence:
- Auto-save to localStorage every 2 minutes
- Prompt before leaving page if dirty

For Each Store:
- TypeScript types for state and actions
- Zustand devtools middleware (dev only)
- Zustand persist middleware where appropriate
- Zustand immer middleware for nested state
- JSDoc comments
- Proper error handling

Example Structure:
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        
        login: async (credentials) => {
          set({ isLoading: true });
          try {
            const response = await authService.login(credentials);
            set({
              user: response.user,
              accessToken: response.access_token,
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
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        },
        
        setUser: (user) => {
          set({ user });
        },
        
        refreshToken: async () => {
          try {
            const response = await authService.refreshToken();
            set({ accessToken: response.access_token });
          } catch (error) {
            // Token refresh failed, logout user
            get().logout();
          }
        },
      })),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

Include:
- TypeScript strict mode
- Error handling
- Loading states
- Optimistic updates where appropriate
```

**Claude Code will:**
- Create all stores
- Set up persistence
- Add middleware
- Handle errors

**Time: 10 minutes**

---

## Part 5: Testing with Claude Code

### **Task 9: Generate Tests**

```bash
claude task "Generate comprehensive unit tests for LeadsService"
```

**Instructions:**

```
Create comprehensive tests for LeadsService in ./backend/src/modules/leads/leads.service.spec.ts:

Test Structure:
- describe('LeadsService')
  - describe('create')
    - should create lead successfully
    - should validate required fields
    - should assign current user as advisor
    - should set default status
    - should throw on duplicate phone
    - should sanitize input
  - describe('findAll')
    - should return paginated leads
    - should filter by status
    - should filter by multiple statuses
    - should filter by source
    - should search by name
    - should search by email
    - should search by phone
    - should sort by specified field
    - should return only advisor's leads (advisor role)
    - should return all leads (admin role)
    - should handle empty results
    - should apply pagination correctly
  - describe('findOne')
    - should return lead by ID
    - should throw NotFoundException for invalid ID
    - should check advisor ownership (advisor role)
    - should allow access to any lead (admin role)
  - describe('update')
    - should update lead successfully
    - should validate ownership (advisor role)
    - should allow admin to update any lead
    - should not allow updating advisorId
    - should update lastContactedAt when status changes to contacted
    - should log changes for audit
  - describe('delete')
    - should soft delete lead
    - should check permissions (admin/manager only)
    - should not hard delete
    - should throw if advisor tries to delete
  - describe('updateStatus')
    - should update status successfully
    - should set convertedAt when status becomes converted
    - should validate status enum
  - describe('convertToClient')
    - should convert lead to client
    - should copy all lead data
    - should update lead status to converted
    - should create client record

Setup & Mocking:
- Mock LeadRepository (use jest.mock)
- Mock UserService (if needed)
- Mock Logger
- Create test data fixtures
- Setup before each test
- Cleanup after each test

Test Data:
- Create factory functions for test data
- Examples: createMockLead(), createMockUser(), etc.
- Realistic test data
- Edge cases

Assertions:
- Use proper Jest matchers
- Check return values
- Verify mock calls
- Check error types
- Validate state changes

Coverage Target: 80%+

Include:
- Arrange-Act-Assert pattern
- Clear test descriptions
- Isolated tests (no dependencies)
- Test edge cases
- Test error scenarios
- Mock external dependencies
```

**Claude Code will:**
- Generate comprehensive tests
- Create test fixtures
- Set up mocks
- Achieve 80%+ coverage

**Time: 15 minutes**

---

## Part 6: Advanced Workflows

### **Technique 1: Multi-File Changes**

When you need to modify multiple files:

```bash
claude task "Add soft delete functionality to all entities"
```

Claude Code will:
- Identify all entity files
- Add deletedAt column
- Update repositories
- Update services
- Update DTOs
- Generate migration

### **Technique 2: Feature Addition**

```bash
claude task "Add email notification when lead is created"
```

Claude Code will:
- Create email service
- Add email templates
- Update lead service to send email
- Add email configuration
- Write tests

### **Technique 3: Bug Fixing**

```bash
claude task "Fix: Lead search is not working with partial phone numbers"
```

Provide context:
```
Current behavior: Search only matches exact phone number
Expected behavior: Should match partial phone (last 4 digits, etc.)
File: ./backend/src/modules/leads/leads.service.ts
Method: search()
```

---

## Part 7: Quality Control with Claude Code

### **Task 10: Code Review**

```bash
claude task "Review LeadsService for security vulnerabilities and performance issues"
```

**Instructions:**

```
Review ./backend/src/modules/leads/leads.service.ts for:

Security:
- SQL injection vulnerabilities
- Missing authorization checks
- Sensitive data exposure
- Input validation issues
- Rate limiting missing

Performance:
- N+1 query problems
- Missing indexes
- Inefficient queries
- Unnecessary data loading
- Missing caching

Code Quality:
- Error handling
- Type safety
- Code duplication
- Proper logging
- Transaction handling

Provide:
- List of issues found
- Severity (Critical/High/Medium/Low)
- Recommendations for fixing
- Code examples for fixes
```

---

## Part 8: Documentation Generation

### **Task 11: Generate API Documentation**

```bash
claude task "Generate comprehensive API documentation"
```

**Instructions:**

```
Create API documentation in ./backend/docs/API.md:

Include:
- Overview of all endpoints
- Authentication requirements
- Request/response examples
- Error codes and messages
- Rate limiting information
- Pagination details
- Filtering and sorting
- Code examples in curl and JavaScript

Format:
- Markdown with proper headers
- Tables for parameters
- Code blocks for examples
- Clear descriptions
```

---

## Summary: Claude Code vs Cursor

### **Claude Code Advantages:**

✅ **Better for Full Tasks:**
- Generates multiple related files
- Understands entire project context
- Works autonomously

✅ **Terminal-Native:**
- No IDE switching
- Works with any editor
- Git-friendly workflow

✅ **Task Delegation:**
- Describe what you want
- Claude Code figures out how
- Less hand-holding needed

### **When to Use Each:**

**Use Claude Code for:**
- Initializing projects
- Generating modules
- Multi-file changes
- Feature additions
- Test generation
- Documentation

**Use Your IDE for:**
- Quick edits
- Code review
- Debugging
- Running/testing
- Git operations

**Use v0.dev for:**
- Quick UI components
- Visual design
- Component prototyping

---

## Timeline with Claude Code

### **Week 1:**
**Day 1:** Setup + Generate backend structure (3 hours)
**Day 2:** Generate database entities + Auth system (4 hours)
**Day 3:** Generate 2-3 CRUD modules (4 hours)
**Day 4:** Generate frontend structure + API layer (4 hours)
**Day 5:** Generate UI components + Deploy (4 hours)

**Result:** Working prototype with 3-4 modules

### **Week 2-3:**
- Generate remaining backend modules
- Generate frontend features
- Integration testing
- Bug fixes

### **Week 4-12:**
- Polish features
- Performance optimization
- Security hardening
- Production deployment

---

## Next Steps

**Tomorrow:**
1. ✅ Confirm Claude Code is installed
2. ✅ Initialize backend project
3. ✅ Initialize frontend project
4. ✅ Generate auth system
5. ✅ Generate first CRUD module
6. ✅ Deploy working prototype

**You're ready to build with Claude Code! 🚀**

---

**Need help?** I'm here for:
- Writing better prompts
- Debugging issues
- Architecture decisions
- Code review
- Performance optimization

Let's build something amazing!
