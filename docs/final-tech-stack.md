# Final Technology Stack - Insurance Advisor Application
## Ready for Implementation ✅

**Document Version:** 1.0 FINAL  
**Date:** October 27, 2025  
**Status:** APPROVED - Ready to Build

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  React Web App (Desktop + Tablet + Mobile Responsive)       │
│  - React 18+                                                 │
│  - TypeScript                                                │
│  - Material-UI or Ant Design                                │
│  - React Router                                              │
│  - Zustand/Redux for state                                  │
│  - PWA capabilities (Add to Home Screen)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Azure API Management                                        │
│  - Rate limiting                                             │
│  - Authentication validation                                 │
│  - Request routing                                           │
│  - Monitoring                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MICROSERVICES LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  All services: Node.js + NestJS + TypeScript                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │   Lead       │  │  Client      │     │
│  │  Service     │  │  Service     │  │  Service     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Proposal    │  │  Analytics   │  │  Document    │     │
│  │  Service     │  │  Service     │  │  Service     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Calendar    │  │  Broadcast   │                        │
│  │  Service     │  │  Service     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Azure MySQL        Redis Cache        Azure Blob Storage   │
│  (Primary DB)       (Sessions/Cache)   (Documents/Files)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Technology
**Framework:** React 18.x  
**Language:** TypeScript 5.x  
**Build Tool:** Vite (faster than Create React App)  

### UI Component Library
**Recommendation:** Material-UI (MUI) v5
- ✅ Most mature React UI library
- ✅ Excellent TypeScript support
- ✅ Comprehensive components
- ✅ Good documentation
- ✅ Enterprise-ready

**Alternative:** Ant Design
- Good for data-heavy applications
- More opinionated (less customization)

### State Management
**Recommendation:** Zustand
- ✅ Simpler than Redux
- ✅ Less boilerplate
- ✅ TypeScript first
- ✅ Perfect for medium complexity apps

**Alternative:** Redux Toolkit
- If you need time-travel debugging
- If team is already familiar with Redux

### Routing
**React Router v6**
- ✅ Standard for React apps
- ✅ Nested routing support
- ✅ TypeScript support

### Forms
**React Hook Form + Zod**
- ✅ Best performance
- ✅ TypeScript validation schemas
- ✅ Easy to use
- ✅ Works great with complex forms (Fact Finding)

### Data Fetching
**React Query (TanStack Query)**
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Works perfectly with REST APIs

### Styling
**Styled Components or Emotion**
- CSS-in-JS approach
- Works well with MUI
- Component-scoped styles

### Charts/Visualization
**Recharts or Chart.js**
- For analytics dashboard
- Performance metrics
- Conversion funnel

### Date/Time
**date-fns**
- Lightweight
- Tree-shakable
- Better than moment.js

### PDF Generation (Client-side)
**react-pdf or jsPDF**
- For quotation previews
- Client-side PDF rendering

---

## Backend Stack

### Core Technology
**Framework:** NestJS 10.x  
**Runtime:** Node.js 20.x LTS  
**Language:** TypeScript 5.x

### Why NestJS?
```typescript
// Clean, structured, testable code
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: FilterLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }
}
```

### Database ORM
**TypeORM** (comes with NestJS)
- ✅ TypeScript-native
- ✅ Great MySQL support
- ✅ Migrations built-in
- ✅ Active Record or Data Mapper patterns

**Alternative:** Prisma
- Newer, faster
- Better TypeScript inference
- Great for new projects

### API Documentation
**Swagger/OpenAPI** (NestJS built-in)
- Auto-generated API docs
- Interactive API testing
- TypeScript decorators

### Validation
**class-validator + class-transformer**
- ✅ Decorators for validation
- ✅ Automatic DTO validation
- ✅ Type-safe

```typescript
export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('SG')
  phoneNumber: string;
}
```

### Caching
**cache-manager with Redis**
- Built-in NestJS support
- Easy to use
- Decorator-based

### Authentication
**Passport.js + JWT**
- Multiple strategies (Azure AD, Okta)
- NestJS guards
- Role-based access control

### File Storage
**@nestjs/azure-storage**
- Direct Azure Blob integration
- Streaming support
- SAS token generation

### Background Jobs
**Bull (Redis-based queue)**
- Report generation
- Email sending
- Data processing

### Logging
**Winston or Pino**
- Structured logging
- Log levels
- Azure Monitor integration

### Testing
**Jest** (built-in)
- Unit tests
- Integration tests
- E2E tests

---

## Database

### Primary Database
**Azure Database for MySQL**
- Version: 8.0
- Flexible Server tier
- High availability enabled
- Automated backups

**Connection Pool:**
- Min: 10 connections
- Max: 100 connections
- Idle timeout: 10 minutes

### ORM/Query Builder
**TypeORM with MySQL driver**

**Example Schema:**
```typescript
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'enum', enum: LeadStatus })
  status: LeadStatus;

  @Column({ name: 'lead_source' })
  leadSource: string;

  @ManyToOne(() => User, user => user.leads)
  advisor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Caching Layer
**Azure Cache for Redis**
- Version: 6.x
- Standard tier (C1 minimum)
- 1GB cache size

**Cache Strategy:**
- Session storage: 8 hours TTL
- User profile: 15 minutes TTL
- Lead lists: 5 minutes TTL
- Analytics: 15 minutes TTL
- Product catalog: 1 hour TTL

### File Storage
**Azure Blob Storage**
- Standard tier
- Hot access tier
- Lifecycle management enabled

**Containers:**
- `documents` - Application forms, quotations
- `uploads` - User uploaded files
- `avatars` - Profile pictures
- `reports` - Generated reports

---

## Authentication & Authorization

### OAuth2 Flow
```
┌──────────┐                                   ┌──────────┐
│  Client  │                                   │ Identity │
│  (React) │                                   │ Provider │
└────┬─────┘                                   └────┬─────┘
     │                                              │
     │ 1. Redirect to login                        │
     ├────────────────────────────────────────────>│
     │                                              │
     │ 2. User authenticates                        │
     │    (Azure AD / Okta)                         │
     │                                              │
     │ 3. Redirect with auth code                   │
     │<─────────────────────────────────────────────┤
     │                                              │
     │ 4. Exchange code for token ┌───────────┐    │
     ├───────────────────────────>│   Auth    │───>│
     │                             │  Service  │    │
     │ 5. Return JWT token         └───────────┘<───┤
     │<─────────────────────────────┤              │
     │                               │              │
     │ 6. API calls with JWT         │              │
     ├──────────────────────────────>│              │
```

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "advisor@company.com",
  "name": "John Doe",
  "role": "advisor",
  "permissions": ["lead:read", "lead:write", "proposal:create"],
  "iat": 1635724800,
  "exp": 1635753600
}
```

### Authorization Strategy
**Role-Based Access Control (RBAC)**

**Roles:**
- `advisor` - Insurance advisor
- `admin` - Back office administrator
- `manager` - Team manager
- `support` - Support team

**Permissions:**
```typescript
enum Permission {
  // Lead permissions
  LEAD_READ = 'lead:read',
  LEAD_WRITE = 'lead:write',
  LEAD_DELETE = 'lead:delete',
  
  // Client permissions
  CLIENT_READ = 'client:read',
  CLIENT_WRITE = 'client:write',
  CLIENT_PII = 'client:pii',
  
  // Proposal permissions
  PROPOSAL_CREATE = 'proposal:create',
  PROPOSAL_SUBMIT = 'proposal:submit',
  PROPOSAL_APPROVE = 'proposal:approve',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
}
```

### Implementation
```typescript
// Guard decorator
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PROPOSAL_SUBMIT)
@Post('proposals/:id/submit')
async submitProposal(@Param('id') id: string) {
  return this.proposalService.submit(id);
}
```

---

## DevOps & Infrastructure

### Container Orchestration
**Azure Kubernetes Service (AKS)**
- Node pool: 3-5 nodes (start with 3)
- Node size: Standard_D4s_v3 (4 vCPU, 16 GB RAM)
- Auto-scaling: Min 3, Max 10 nodes

### Container Registry
**Azure Container Registry (ACR)**
- Standard tier
- Geo-replication: Optional (for multi-region)

### CI/CD Pipeline
**GitHub Actions** (recommended) or **Azure DevOps**

**Pipeline Stages:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run unit tests
      - Run integration tests
      - Generate coverage report

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build Docker images
      - Push to ACR
      - Tag with version

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - Update Kubernetes manifests
      - Deploy to AKS
      - Run smoke tests
      - Monitor health
```

### Monitoring
**Azure Monitor + Application Insights**
- Request tracking
- Performance metrics
- Error logging
- Custom events

**Metrics to Track:**
- API response times
- Error rates
- Active users
- Database query performance
- Cache hit rates

### Logging
**Centralized Logging**
- All services log to stdout
- Azure Monitor collects logs
- Structured JSON logging
- Log retention: 90 days

**Log Levels:**
```
ERROR - Critical issues requiring immediate attention
WARN  - Potential issues, degraded performance
INFO  - Important business events
DEBUG - Detailed diagnostic information (dev/staging only)
```

### Alerting
**Azure Monitor Alerts**
- Response time > 3 seconds
- Error rate > 1%
- Service unavailable
- Database connection pool exhausted
- High memory/CPU usage

---

## Security Implementation

### HTTPS/TLS
**TLS 1.2 minimum**
- Azure Application Gateway handles SSL termination
- Certificates from Azure Key Vault
- Auto-renewal configured

### Encryption at Rest
**AES-256 encryption**
- Azure MySQL: Enabled by default
- Azure Blob Storage: Enabled by default
- Redis: Enable encryption in transit

### Secrets Management
**Azure Key Vault**
- Database passwords
- API keys
- JWT secret
- Third-party service credentials
- Encryption keys

**Never in code:**
```typescript
// ❌ BAD
const dbPassword = 'mysecretpassword';

// ✅ GOOD
const dbPassword = await keyVault.getSecret('db-password');
```

### API Security
**Rate Limiting:**
- 100 requests per minute per user
- 1000 requests per hour per user
- Burst allowance: 10 requests

**CORS Configuration:**
```typescript
app.enableCors({
  origin: ['https://app.yourcompany.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});
```

### Input Validation
**All inputs validated:**
- Request body validation (class-validator)
- Query parameter validation
- SQL injection prevention (TypeORM parameterized queries)
- XSS prevention (sanitize HTML)
- CSRF protection (tokens)

---

## Development Environment

### Local Development Setup

**Requirements:**
- Node.js 20.x LTS
- Docker Desktop
- VS Code (recommended IDE)
- Git

**Local Stack:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: localdev
      MYSQL_DATABASE: insurance_advisor
    ports:
      - "3306:3306"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  azurite:  # Local Azure Storage emulator
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"  # Blob service
```

**Starting Development:**
```bash
# Install dependencies
npm install

# Start local infrastructure
docker-compose up -d

# Run database migrations
npm run migration:run

# Start dev server
npm run start:dev

# Frontend will be at http://localhost:3000
# Backend API at http://localhost:3001
```

### Environment Files
```bash
# .env.local
DATABASE_URL=mysql://root:localdev@localhost:3306/insurance_advisor
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-development-secret
AZURE_STORAGE_CONNECTION=UseDevelopmentStorage=true
```

---

## Testing Strategy

### Unit Tests
**Framework:** Jest  
**Coverage Target:** 80%

**Example:**
```typescript
describe('LeadsService', () => {
  let service: LeadsService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LeadsService, MockLeadsRepository],
    }).compile();
    
    service = module.get<LeadsService>(LeadsService);
  });
  
  it('should create a lead', async () => {
    const dto = { name: 'John Doe', email: 'john@example.com' };
    const result = await service.create(dto);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('John Doe');
  });
});
```

### Integration Tests
**Test API endpoints end-to-end**
```typescript
describe('Leads API', () => {
  it('POST /leads should create a lead', () => {
    return request(app.getHttpServer())
      .post('/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
      });
  });
});
```

### E2E Tests
**Framework:** Playwright or Cypress  
**Critical Flows:**
- Login → Create lead → Fact finding → Submit application
- Search and filter leads
- Generate quotation
- View analytics dashboard

---

## Performance Optimization

### Frontend Optimization
- **Code splitting** - Lazy load routes
- **Image optimization** - WebP format, lazy loading
- **Bundle size** - Tree shaking, minimize dependencies
- **Caching** - Service worker for static assets
- **CDN** - Serve static files from Azure CDN

### Backend Optimization
- **Database indexing** - All foreign keys, frequently queried columns
- **Query optimization** - Use select specific columns, avoid N+1 queries
- **Caching** - Redis for frequently accessed data
- **Pagination** - Limit result sets to 50 items
- **Connection pooling** - Reuse database connections

### Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_leads_advisor ON leads(advisor_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_stage ON proposals(stage);
```

---

## Deployment Strategy

### Environments

**Development (Dev):**
- Auto-deploy on commit to `develop` branch
- Fake/anonymized data
- Debug logging enabled

**Staging (UAT):**
- Manual deployment from `staging` branch
- Production-like data (anonymized)
- Weekly deployments
- User acceptance testing

**Production (Prod):**
- Manual deployment from `main` branch
- Real data
- Controlled releases
- Rollback plan ready

### Deployment Process
```
1. Code Review → Merge to develop
2. Automated tests run
3. Auto-deploy to Dev
4. QA testing in Dev
5. Create release branch
6. Deploy to Staging
7. UAT in Staging
8. Approve production deployment
9. Deploy to Production (blue-green)
10. Monitor for 24 hours
```

### Rollback Strategy
- Keep previous version images
- Kubernetes rolling update (zero downtime)
- Can rollback in < 5 minutes
- Database migrations must be backward compatible

---

## Third-Party Integrations

### Required Integrations
- **E-signature:** DocuSign or Adobe Sign
- **Email:** SendGrid or AWS SES
- **SMS/OTP:** Twilio or AWS SNS
- **PDF Generation:** PDFKit or Puppeteer (server-side)
- **Payment Gateway:** Stripe or local provider

### Optional Integrations
- **Calendar:** Google Calendar API, Microsoft Graph API
- **CRM:** Salesforce, HubSpot (if needed)
- **Analytics:** Google Analytics, Mixpanel
- **Monitoring:** Sentry for error tracking

---

## Mobile/Responsive Design

### Responsive Breakpoints
```css
/* Mobile first approach */
/* Base styles for mobile (< 768px) */

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}

@media (min-width: 1440px) {
  /* Large desktop styles */
}
```

### PWA Configuration
**Features:**
- Add to home screen
- Offline page (shows when no connection)
- App-like experience
- Push notifications (future)

**manifest.json:**
```json
{
  "name": "Insurance Advisor Portal",
  "short_name": "Advisor",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Browser Support (Simplified for MVP)

### Minimum Requirements
- **Chrome/Edge:** Last 2 versions
- **Safari:** Last 2 versions
- **Firefox:** Last 2 versions
- **Mobile:** iOS 14+, Android 10+

### Polyfills
- Not needed for modern browsers
- Use Vite's default browser target

---

## Scalability Plan

### Current Capacity
- **Concurrent users:** 1,000
- **API throughput:** 10,000 requests/minute
- **Database:** 1M records easily
- **Storage:** 1TB initial

### Scaling Triggers
**Scale up when:**
- Concurrent users > 800
- API response time > 2 seconds
- Database CPU > 80%
- Storage > 80% capacity

**How to scale:**
- AKS: Auto-scale pods (3-10)
- Database: Upgrade tier or add read replicas
- Redis: Upgrade tier or add cluster
- Storage: Auto-scales

---

## Cost Estimates (Monthly)

### Azure Infrastructure (USD)
- **AKS Cluster:** $300-500/month
- **Azure MySQL:** $150-300/month
- **Azure Redis:** $100-150/month
- **Blob Storage:** $20-50/month
- **Application Gateway:** $150/month
- **API Management:** $100-200/month
- **Monitoring:** $50-100/month
- **Key Vault:** $10/month
- **Bandwidth:** $50-100/month

**Total Infrastructure:** ~$930-1,560/month for 1,000 concurrent users

### Development Tools
- **GitHub:** $0-50/month (Team plan)
- **Figma:** $45/month (Professional)
- **Sentry:** $26-80/month (error tracking)
- **SendGrid:** $15-80/month (email)
- **Twilio:** $50-200/month (SMS/OTP)

**Total Tools:** ~$136-455/month

### **TOTAL MONTHLY COST: $1,066-2,015**

*(Scales with usage - can be lower initially with fewer users)*

---

## Migration Path (If Needed Later)

### To Java/Spring
- TypeScript interfaces → Java classes
- TypeORM models → JPA entities
- API contracts remain same (REST)
- Gradual migration (microservice by microservice)

### To Native Mobile (Flutter)
- Reuse REST APIs (no backend changes)
- Develop Flutter app in parallel
- Shared state management approach
- Deploy both web and mobile

---

## Development Timeline with This Stack

### Week 1-2: Setup
- ✅ Finalized tech stack (DONE)
- Initialize repositories
- Set up local development
- Configure Azure resources
- Set up CI/CD pipelines

### Week 3-4: Core Infrastructure
- Authentication service
- API Gateway configuration
- Database setup and migrations
- Base React app with routing

### Week 5-8: Phase 1 Development
- Lead Management module
- Fact Finding process
- FNA module
- Basic calendar

### Week 9-12: Phase 1 Completion
- Product Recommendations
- Quotation generation
- Application submission
- Testing and bug fixes

### Week 13-16: Production Preparation
- Performance optimization
- Security hardening
- UAT
- Production deployment

**Total: 4 months to MVP launch** 🚀

---

## Summary: Why This Stack is Optimal

### ✅ Fastest Time to Market
- Single language (TypeScript) across stack
- Familiar to most developers
- Rich ecosystem
- Fast iteration

### ✅ Scalable & Reliable
- Proven at enterprise scale
- Azure fully supports this stack
- Microservices allow independent scaling
- Easy to maintain and debug

### ✅ Cost Effective
- No expensive licenses
- Open source frameworks
- Azure pricing competitive
- Right-sized for 1,000 users

### ✅ Team Efficiency
- One language = easier code sharing
- Great tooling support
- Strong community
- Easy to hire developers

### ✅ Future Proof
- Can add native mobile later
- Can migrate services if needed
- Modern, actively maintained
- Long-term support

---

## Next Steps

### This Week
1. ✅ Approve this tech stack
2. Initialize Git repositories
3. Set up Azure subscriptions
4. Provision Dev environment
5. Start developer onboarding

### Next Week
6. Kick off UI/UX design (Phase 1)
7. Build authentication service
8. Create base React app
9. Set up database schemas
10. Deploy first service to Dev

---

## Questions & Support

**Technical Questions:** Contact Tech Lead  
**Infrastructure:** Contact DevOps Lead  
**Design:** Contact Design Lead  
**Product:** Contact Product Manager

---

**Document Status:** ✅ FINAL - APPROVED FOR IMPLEMENTATION  
**Stack Approved By:** [Pending signature]  
**Date:** October 27, 2025

🚀 **Ready to build!**
