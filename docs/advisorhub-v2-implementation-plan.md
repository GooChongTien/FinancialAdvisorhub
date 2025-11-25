# AdvisorHub V2 Implementation Plan
## Test-Driven Development Approach

**Document Version:** 1.1
**Created:** 2025-11-22
**Last Updated:** 2025-11-22
**Methodology:** Test-Driven Development (TDD)
**Team Size:** 2-3 Developers
**Total Duration:** 18-20 weeks

---

## 🎯 Progress Summary

**Overall Progress:** Phase 1 Foundation (60% Complete)

### ✅ Completed Items
- **Database Migrations**: 5/8 migrations (Entity customers, Service requests, Milestones, Projections, User preferences)
- **Testing Infrastructure**: Vitest + React Testing Library configured, Playwright installed
- **i18n Foundation**: 5 languages implemented (300+ translation keys), Language detection & switching working
- **Base Components**: 4/8 components complete (EntityCustomerForm, CompanyDetailsCard, KeymanDetailsForm, EmployeeListUpload)
  - **Test Coverage**: 76 tests, 100% passing
  - Components fully tested with TDD approach (RED → GREEN → REFACTOR)

### 🔄 In Progress
- Remaining base components (OurJourneyTimeline, MilestoneCard, CurrencySelector, LanguageSwitcher)
- Remaining database migrations (Exchange rates, Enhanced broadcasts, Task transcripts)

### 📊 Test Metrics
- **Unit Tests**: 76 tests passing (100% pass rate)
- **Component Coverage**: EntityCustomerForm (16), CompanyDetailsCard (24), KeymanDetailsForm (18), EmployeeListUpload (18)
- **Test Execution Time**: <10s for all unit tests

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [TDD Principles & Standards](#tdd-principles--standards)
3. [Phase Breakdown](#phase-breakdown)
4. [Phase 1: Foundation & Infrastructure](#phase-1-foundation--infrastructure)
5. [Phase 2: Entity Customers & Servicing](#phase-2-entity-customers--servicing)
6. [Phase 3: Smart Plan Transformation](#phase-3-smart-plan-transformation)
7. [Phase 4: Visualizers Module](#phase-4-visualizers-module)
8. [Phase 5: Mira AI Deep Integration](#phase-5-mira-ai-deep-integration)
9. [Phase 6: News & Analytics](#phase-6-news--analytics)
10. [Phase 7: Multi-Language & Currency](#phase-7-multi-language--currency)
11. [Phase 8: Proposals & Products](#phase-8-proposals--products)
12. [Testing Strategy](#testing-strategy)
13. [Definition of Done](#definition-of-done)
14. [Risk Management](#risk-management)

---

## Project Overview

### Goals
Transform AdvisorHub into V2 with 10 major enhancements focusing on:
- Entity customer support (B2B market)
- AI-powered assistance across all modules
- Financial visualization tools
- Comprehensive servicing capabilities
- Multi-language and multi-currency support

### Success Criteria
- ✅ All P0 features delivered and tested
- ✅ 90%+ test coverage for critical paths
- ✅ <2s page load time for all pages
- ✅ Zero critical bugs in production
- ✅ 95%+ user satisfaction score

---

## TDD Principles & Standards

### Test-First Development Cycle

```
1. Write Test (RED) → Test fails because feature doesn't exist
2. Write Code (GREEN) → Minimal code to make test pass
3. Refactor (REFACTOR) → Improve code quality while keeping tests green
4. Repeat
```

### Testing Pyramid

```
        /\
       /E2E\         10% - End-to-End Tests
      /------\
     /Integr-\       30% - Integration Tests
    /----------\
   /    Unit    \    60% - Unit Tests
  /--------------\
```

### Test Categories

| Category | Tools | Coverage Target | Execution Time |
|----------|-------|----------------|----------------|
| **Unit Tests** | Vitest + React Testing Library | 80%+ | <30s |
| **Integration Tests** | Vitest + MSW | 70%+ | <2min |
| **E2E Tests** | Playwright | Critical paths | <10min |
| **Visual Tests** | Percy / Chromatic | UI components | <5min |
| **API Tests** | Supertest | 90%+ | <1min |

### Testing Standards

**Unit Tests:**
- Test file location: `{component}.test.jsx` next to component
- Naming: `describe('ComponentName')` → `it('should do something')`
- Mock external dependencies (API, hooks, context)
- Test behavior, not implementation

**Integration Tests:**
- Test file location: `__tests__/integration/{feature}.test.js`
- Test multiple components working together
- Use MSW for API mocking
- Test data flow and state management

**E2E Tests:**
- Test file location: `e2e/{feature}.spec.js`
- Test critical user journeys
- Use real database (seeded test data)
- Run in CI/CD pipeline

---

## Phase Breakdown

### Timeline Overview

```
Phase 1: Foundation & Infrastructure          [Weeks 1-2]   🔵🔵
Phase 2: Entity Customers & Servicing         [Weeks 3-4]   🔵🔵
Phase 3: Smart Plan Transformation            [Weeks 5-6]   🔵🔵
Phase 4: Visualizers Module                   [Weeks 7-8]   🔵🔵
Phase 5: Mira AI Deep Integration             [Weeks 9-10]  🔵🔵
Phase 6: News & Analytics                     [Weeks 11-12] 🔵🔵
Phase 7: Multi-Language & Currency            [Weeks 13-14] 🔵🔵
Phase 8: Proposals & Products                 [Weeks 15-16] 🔵🔵
Phase 9: Polish & Performance                 [Weeks 17-18] 🔵🔵
Phase 10: UAT & Launch                        [Weeks 19-20] 🔵🔵
```

### Phase Summary

| Phase | Priority | Epics | Stories | Story Points | Risk |
|-------|----------|-------|---------|--------------|------|
| Phase 1 | P0 | 5 | 18 | 55 | High |
| Phase 2 | P0 | 4 | 22 | 65 | High |
| Phase 3 | P0 | 5 | 25 | 70 | Medium |
| Phase 4 | P1 | 4 | 20 | 80 | High |
| Phase 5 | P0-P1 | 6 | 28 | 85 | High |
| Phase 6 | P1 | 4 | 18 | 45 | Low |
| Phase 7 | P0-P2 | 3 | 15 | 50 | Medium |
| Phase 8 | P1 | 5 | 24 | 70 | Medium |
| **Total** | - | **36** | **170** | **520** | - |

---

## Phase 1: Foundation & Infrastructure
**Duration:** 2 weeks | **Priority:** P0 | **Risk:** High

### Phase Goals
- Establish database schema for new features
- Set up testing infrastructure
- Create base components and utilities
- Implement i18n foundation

### Epics

#### Epic 1.1: Database Schema & Migrations
**Story Points:** 13 | **Priority:** P0

##### User Story 1.1.1: Entity Customer Schema
**As a** developer
**I want** to extend the customer table to support entity customers
**So that** we can store company information alongside individual data

**Acceptance Criteria:**
- [ ] Customer table has `customer_type` column (Individual/Entity)
- [ ] Entity-specific columns exist (company_name, business_registration_no, etc.)
- [ ] Migration script runs without errors
- [ ] Rollback script works correctly
- [ ] Existing data is not affected

**Test Cases (TDD):**

```javascript
// tests/database/migrations/001_entity_customers.test.js

describe('Entity Customer Schema Migration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Migration Up', () => {
    it('should add customer_type column with default value', async () => {
      await runMigration('001_entity_customers_up');

      const column = await getColumnInfo('customers', 'customer_type');
      expect(column).toExist();
      expect(column.type).toBe('varchar(20)');
      expect(column.default).toBe('Individual');
    });

    it('should add all entity-specific columns', async () => {
      await runMigration('001_entity_customers_up');

      const entityColumns = [
        'company_name',
        'business_registration_no',
        'industry',
        'keyman_details',
        'num_employees',
        'annual_revenue'
      ];

      for (const columnName of entityColumns) {
        const column = await getColumnInfo('customers', columnName);
        expect(column).toExist();
      }
    });

    it('should set existing customers to Individual type', async () => {
      // Create existing customers
      await createTestCustomer({ name: 'John Doe' });
      await createTestCustomer({ name: 'Jane Smith' });

      await runMigration('001_entity_customers_up');

      const customers = await getAllCustomers();
      customers.forEach(customer => {
        expect(customer.customer_type).toBe('Individual');
      });
    });

    it('should allow creating entity customers after migration', async () => {
      await runMigration('001_entity_customers_up');

      const entityCustomer = await createCustomer({
        customer_type: 'Entity',
        company_name: 'TechCorp Pte Ltd',
        business_registration_no: '202300001A',
        industry: 'Technology',
        num_employees: 50,
        annual_revenue: 5000000
      });

      expect(entityCustomer).toExist();
      expect(entityCustomer.customer_type).toBe('Entity');
      expect(entityCustomer.company_name).toBe('TechCorp Pte Ltd');
    });
  });

  describe('Migration Down', () => {
    it('should rollback all entity columns', async () => {
      await runMigration('001_entity_customers_up');
      await runMigration('001_entity_customers_down');

      const column = await getColumnInfo('customers', 'customer_type');
      expect(column).toBeNull();
    });

    it('should preserve existing customer data', async () => {
      const customer = await createTestCustomer({ name: 'Test User' });
      await runMigration('001_entity_customers_up');
      await runMigration('001_entity_customers_down');

      const retrievedCustomer = await getCustomerById(customer.id);
      expect(retrievedCustomer.name).toBe('Test User');
    });
  });
});
```

**Implementation Tasks:**
- [ ] Write migration file `001_entity_customers.sql`
- [ ] Add SQL for adding columns
- [ ] Add SQL for default values
- [ ] Create rollback script
- [ ] Test migration on local database
- [ ] Document schema changes

**Dependencies:** None

---

##### User Story 1.1.2: Service Request Schema
**As a** developer
**I want** to create a service_requests table
**So that** we can track customer service requests

**Acceptance Criteria:**
- [ ] Service_requests table exists with all required columns
- [ ] Foreign key to customers table is properly set
- [ ] Status enum has correct values
- [ ] Indexes are created for performance
- [ ] Cascade delete rules are configured

**Test Cases (TDD):**

```javascript
// tests/database/migrations/002_service_requests.test.js

describe('Service Requests Schema Migration', () => {
  beforeEach(async () => {
    await resetDatabase();
    await runMigration('001_entity_customers_up');
  });

  describe('Table Creation', () => {
    it('should create service_requests table', async () => {
      await runMigration('002_service_requests_up');

      const tableExists = await checkTableExists('service_requests');
      expect(tableExists).toBe(true);
    });

    it('should have all required columns', async () => {
      await runMigration('002_service_requests_up');

      const requiredColumns = [
        'id', 'customer_id', 'service_type', 'status',
        'description', 'created_at', 'updated_at',
        'completed_at', 'created_by'
      ];

      for (const columnName of requiredColumns) {
        const column = await getColumnInfo('service_requests', columnName);
        expect(column).toExist();
      }
    });

    it('should have foreign key constraint to customers', async () => {
      await runMigration('002_service_requests_up');

      const constraints = await getForeignKeys('service_requests');
      const customerFK = constraints.find(fk => fk.column === 'customer_id');

      expect(customerFK).toExist();
      expect(customerFK.references_table).toBe('customers');
      expect(customerFK.references_column).toBe('id');
    });

    it('should have correct status enum values', async () => {
      await runMigration('002_service_requests_up');

      const statusColumn = await getColumnInfo('service_requests', 'status');
      const allowedStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];

      expect(statusColumn.check_constraint).toInclude(allowedStatuses);
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await runMigration('002_service_requests_up');
    });

    it('should create a service request', async () => {
      const customer = await createTestCustomer();

      const serviceRequest = await createServiceRequest({
        customer_id: customer.id,
        service_type: 'Submit Claim',
        status: 'Pending',
        description: 'Medical claim for hospitalization'
      });

      expect(serviceRequest).toExist();
      expect(serviceRequest.customer_id).toBe(customer.id);
    });

    it('should prevent creating service request with invalid status', async () => {
      const customer = await createTestCustomer();

      await expect(
        createServiceRequest({
          customer_id: customer.id,
          service_type: 'Submit Claim',
          status: 'InvalidStatus',
          description: 'Test'
        })
      ).rejects.toThrow();
    });

    it('should cascade delete service requests when customer is deleted', async () => {
      const customer = await createTestCustomer();
      const serviceRequest = await createServiceRequest({
        customer_id: customer.id,
        service_type: 'Renew Policy',
        status: 'Pending',
        description: 'Policy renewal'
      });

      await deleteCustomer(customer.id);

      const deletedSR = await getServiceRequestById(serviceRequest.id);
      expect(deletedSR).toBeNull();
    });
  });

  describe('Indexes', () => {
    it('should have index on customer_id for performance', async () => {
      await runMigration('002_service_requests_up');

      const indexes = await getIndexes('service_requests');
      const customerIndex = indexes.find(idx => idx.columns.includes('customer_id'));

      expect(customerIndex).toExist();
    });

    it('should have index on status for filtering', async () => {
      await runMigration('002_service_requests_up');

      const indexes = await getIndexes('service_requests');
      const statusIndex = indexes.find(idx => idx.columns.includes('status'));

      expect(statusIndex).toExist();
    });
  });
});
```

**Implementation Tasks:**
- [ ] Write migration file `002_service_requests.sql`
- [ ] Define table schema with columns
- [ ] Add foreign key constraints
- [ ] Create indexes for performance
- [ ] Add check constraints for status
- [ ] Create rollback script
- [ ] Test migration

**Dependencies:** 1.1.1 (Entity Customer Schema)

---

##### User Story 1.1.3: Customer Milestones Schema
**As a** developer
**I want** to create a customer_milestones table
**So that** we can store "Our Journey" timeline events

**Acceptance Criteria:**
- [ ] Customer_milestones table exists
- [ ] Supports different event types
- [ ] Stores icon and color information
- [ ] Can query milestones by customer
- [ ] Ordered by event_date

**Test Cases (TDD):**

```javascript
// tests/database/migrations/003_customer_milestones.test.js

describe('Customer Milestones Schema Migration', () => {
  beforeEach(async () => {
    await resetDatabase();
    await runMigration('001_entity_customers_up');
  });

  describe('Table Creation', () => {
    it('should create customer_milestones table', async () => {
      await runMigration('003_customer_milestones_up');

      const tableExists = await checkTableExists('customer_milestones');
      expect(tableExists).toBe(true);
    });

    it('should have all required columns', async () => {
      await runMigration('003_customer_milestones_up');

      const columns = await getTableColumns('customer_milestones');
      const expectedColumns = [
        'id', 'customer_id', 'event_type', 'event_title',
        'event_description', 'event_date', 'icon', 'color', 'created_at'
      ];

      expectedColumns.forEach(col => {
        expect(columns).toContainEqual(expect.objectContaining({ name: col }));
      });
    });

    it('should have valid event types', async () => {
      await runMigration('003_customer_milestones_up');

      const eventTypeColumn = await getColumnInfo('customer_milestones', 'event_type');
      const validTypes = ['first_policy', 'renewal', 'claim', 'life_event', 'policy_change'];

      expect(eventTypeColumn.check_constraint).toInclude(validTypes);
    });
  });

  describe('Milestone Operations', () => {
    beforeEach(async () => {
      await runMigration('003_customer_milestones_up');
    });

    it('should create a milestone', async () => {
      const customer = await createTestCustomer();

      const milestone = await createMilestone({
        customer_id: customer.id,
        event_type: 'first_policy',
        event_title: 'First Policy Purchased',
        event_description: 'LifeShield Plus policy',
        event_date: '2024-01-15',
        icon: '🎉',
        color: '#10b981'
      });

      expect(milestone).toExist();
      expect(milestone.event_type).toBe('first_policy');
    });

    it('should retrieve milestones ordered by date', async () => {
      const customer = await createTestCustomer();

      await createMilestone({
        customer_id: customer.id,
        event_type: 'first_policy',
        event_date: '2024-01-15'
      });

      await createMilestone({
        customer_id: customer.id,
        event_type: 'renewal',
        event_date: '2024-06-15'
      });

      await createMilestone({
        customer_id: customer.id,
        event_type: 'claim',
        event_date: '2024-03-20'
      });

      const milestones = await getMilestonesByCustomer(customer.id);

      expect(milestones).toHaveLength(3);
      expect(milestones[0].event_date).toBe('2024-01-15');
      expect(milestones[1].event_date).toBe('2024-03-20');
      expect(milestones[2].event_date).toBe('2024-06-15');
    });

    it('should filter milestones by event type', async () => {
      const customer = await createTestCustomer();

      await createMilestone({ customer_id: customer.id, event_type: 'first_policy' });
      await createMilestone({ customer_id: customer.id, event_type: 'renewal' });
      await createMilestone({ customer_id: customer.id, event_type: 'claim' });

      const claimMilestones = await getMilestonesByCustomer(customer.id, {
        event_type: 'claim'
      });

      expect(claimMilestones).toHaveLength(1);
      expect(claimMilestones[0].event_type).toBe('claim');
    });
  });
});
```

**Implementation Tasks:**
- [ ] Write migration file `003_customer_milestones.sql`
- [ ] Define table schema
- [ ] Add event_type enum/check constraint
- [ ] Create indexes
- [ ] Add foreign key to customers
- [ ] Create rollback script
- [ ] Test migration

**Dependencies:** 1.1.1

---

##### User Story 1.1.4: Financial Projections Schema
**As a** developer
**I want** to create a financial_projections table
**So that** we can store visualizer projection data

**Acceptance Criteria:**
- [ ] Financial_projections table exists
- [ ] Uses JSONB for flexible data storage
- [ ] Stores multiple scenarios per customer
- [ ] Stores life events and their impacts
- [ ] Can be queried efficiently

**Test Cases (TDD):**

```javascript
// tests/database/migrations/004_financial_projections.test.js

describe('Financial Projections Schema Migration', () => {
  beforeEach(async () => {
    await resetDatabase();
    await runMigration('001_entity_customers_up');
  });

  describe('Table Creation', () => {
    it('should create financial_projections table', async () => {
      await runMigration('004_financial_projections_up');

      const tableExists = await checkTableExists('financial_projections');
      expect(tableExists).toBe(true);
    });

    it('should have JSONB columns for flexible data', async () => {
      await runMigration('004_financial_projections_up');

      const projectionDataColumn = await getColumnInfo('financial_projections', 'projection_data');
      const lifeEventsColumn = await getColumnInfo('financial_projections', 'life_events');
      const scenariosColumn = await getColumnInfo('financial_projections', 'scenarios');

      expect(projectionDataColumn.type).toBe('jsonb');
      expect(lifeEventsColumn.type).toBe('jsonb');
      expect(scenariosColumn.type).toBe('jsonb');
    });

    it('should have GIN indexes on JSONB columns for performance', async () => {
      await runMigration('004_financial_projections_up');

      const indexes = await getIndexes('financial_projections');
      const jsonbIndexes = indexes.filter(idx => idx.type === 'gin');

      expect(jsonbIndexes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Projection Operations', () => {
    beforeEach(async () => {
      await runMigration('004_financial_projections_up');
    });

    it('should create a financial projection', async () => {
      const customer = await createTestCustomer();

      const projection = await createFinancialProjection({
        customer_id: customer.id,
        projection_data: {
          income: { monthly: 5000, annual: 60000 },
          expenses: { monthly: 3500, annual: 42000 },
          assets: { cash: 50000, investments: 100000 },
          liabilities: { mortgage: 300000, loans: 20000 }
        },
        life_events: [
          {
            type: 'new_born',
            year: 2025,
            impact: { expenses_increase: 1000 }
          }
        ],
        scenarios: {
          baseline: { projected_wealth: [100000, 120000, 140000] },
          with_insurance: { projected_wealth: [100000, 125000, 155000] }
        }
      });

      expect(projection).toExist();
      expect(projection.projection_data.income.monthly).toBe(5000);
    });

    it('should query projections by JSONB fields', async () => {
      const customer1 = await createTestCustomer({ name: 'Customer 1' });
      const customer2 = await createTestCustomer({ name: 'Customer 2' });

      await createFinancialProjection({
        customer_id: customer1.id,
        life_events: [{ type: 'new_born', year: 2025 }]
      });

      await createFinancialProjection({
        customer_id: customer2.id,
        life_events: [{ type: 'marriage', year: 2024 }]
      });

      const projectionsWithNewBorn = await queryProjections({
        life_events_contains: { type: 'new_born' }
      });

      expect(projectionsWithNewBorn).toHaveLength(1);
      expect(projectionsWithNewBorn[0].customer_id).toBe(customer1.id);
    });

    it('should update projection scenarios', async () => {
      const customer = await createTestCustomer();
      const projection = await createFinancialProjection({
        customer_id: customer.id,
        scenarios: { baseline: { projected_wealth: [100000] } }
      });

      const updated = await updateFinancialProjection(projection.id, {
        scenarios: {
          baseline: { projected_wealth: [100000] },
          with_insurance: { projected_wealth: [120000] },
          aggressive: { projected_wealth: [150000] }
        }
      });

      expect(Object.keys(updated.scenarios)).toHaveLength(3);
    });
  });
});
```

**Implementation Tasks:**
- [ ] Write migration file `004_financial_projections.sql`
- [ ] Define table with JSONB columns
- [ ] Create GIN indexes on JSONB fields
- [ ] Add foreign key to customers
- [ ] Create rollback script
- [ ] Test JSONB queries
- [ ] Document JSON schema

**Dependencies:** 1.1.1

---

##### User Story 1.1.5: Enhanced User Preferences Schema
**As a** developer
**I want** to add preferred_language and preferred_currency support to user preferences
**So that** users can set their language and currency preferences

**Acceptance Criteria:**
- [ƒo.] user_preferences table stores preferred_language with defaults
- [ƒo.] user_preferences table stores preferred_currency with defaults
- [ƒo.] Existing users are backfilled with defaults (en / SGD)
- [ƒo.] Valid language and currency constraints exist
- [ƒo.] Preference endpoints persist to both user_preferences and profiles where possible

**Test Cases (TDD):**

```javascript
// tests/database/migrations/005_user_preferences.test.js

describe('User Preferences Schema Migration', () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedUsers(); // Create some existing users
  });

  describe('Migration Up', () => {
    it('should add preferred_language column', async () => {
      await runMigration('005_user_preferences_up');

      const column = await getColumnInfo('users', 'preferred_language');
      expect(column).toExist();
      expect(column.type).toBe('varchar(10)');
      expect(column.default).toBe('en');
    });

    it('should add preferred_currency column', async () => {
      await runMigration('005_user_preferences_up');

      const column = await getColumnInfo('users', 'preferred_currency');
      expect(column).toExist();
      expect(column.type).toBe('varchar(3)');
      expect(column.default).toBe('SGD');
    });

    it('should set default language for existing users', async () => {
      await runMigration('005_user_preferences_up');

      const users = await getAllUsers();
      users.forEach(user => {
        expect(user.preferred_language).toBe('en');
      });
    });

    it('should set default currency for existing users', async () => {
      await runMigration('005_user_preferences_up');

      const users = await getAllUsers();
      users.forEach(user => {
        expect(user.preferred_currency).toBe('SGD');
      });
    });

    it('should enforce valid language codes', async () => {
      await runMigration('005_user_preferences_up');

      const user = await createUser({ email: 'test@test.com' });

      // Valid languages
      await expect(
        updateUser(user.id, { preferred_language: 'en' })
      ).resolves.not.toThrow();

      await expect(
        updateUser(user.id, { preferred_language: 'zh' })
      ).resolves.not.toThrow();

      // Invalid language
      await expect(
        updateUser(user.id, { preferred_language: 'invalid' })
      ).rejects.toThrow();
    });

    it('should enforce valid currency codes', async () => {
      await runMigration('005_user_preferences_up');

      const user = await createUser({ email: 'test@test.com' });

      // Valid currencies
      await expect(
        updateUser(user.id, { preferred_currency: 'SGD' })
      ).resolves.not.toThrow();

      await expect(
        updateUser(user.id, { preferred_currency: 'USD' })
      ).resolves.not.toThrow();

      // Invalid currency
      await expect(
        updateUser(user.id, { preferred_currency: 'XYZ' })
      ).rejects.toThrow();
    });
  });

  describe('User Preferences Operations', () => {
    beforeEach(async () => {
      await runMigration('005_user_preferences_up');
    });

    it('should update user language preference', async () => {
      const user = await createUser({ email: 'user@test.com' });

      const updated = await updateUser(user.id, {
        preferred_language: 'zh'
      });

      expect(updated.preferred_language).toBe('zh');
    });

    it('should update user currency preference', async () => {
      const user = await createUser({ email: 'user@test.com' });

      const updated = await updateUser(user.id, {
        preferred_currency: 'MYR'
      });

      expect(updated.preferred_currency).toBe('MYR');
    });

    it('should update both preferences simultaneously', async () => {
      const user = await createUser({ email: 'user@test.com' });

      const updated = await updateUser(user.id, {
        preferred_language: 'ms',
        preferred_currency: 'MYR'
      });

      expect(updated.preferred_language).toBe('ms');
      expect(updated.preferred_currency).toBe('MYR');
    });
  });
});
```

**Implementation Tasks:**
- [ ] Write migration file `005_user_preferences.sql`
- [ ] Add preferred_language column with default 'en'
- [ ] Add preferred_currency column with default 'SGD'
- [ ] Add check constraints for valid values
- [ ] Update existing users with defaults
- [ ] Create rollback script
- [ ] Test migration

**Dependencies:** None

---

#### Epic 1.2: Testing Infrastructure Setup
**Story Points:** 13 | **Priority:** P0

##### User Story 1.2.1: Unit Testing Framework
**As a** developer
**I want** to set up Vitest and React Testing Library
**So that** we can write unit tests for components and utilities

**Acceptance Criteria:**
- [ ] Vitest is installed and configured
- [ ] React Testing Library is set up
- [ ] Test coverage reporting works
- [ ] Tests can run in watch mode
- [ ] CI/CD integration is configured

**Test Cases (Configuration Validation):**

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/mocks/',
        'vite.config.js',
        'vitest.config.js'
      ],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

```javascript
// src/tests/setup.js
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
```

**Validation Tests:**

```javascript
// src/tests/__tests__/setup.test.js

describe('Test Infrastructure', () => {
  it('should have React Testing Library available', () => {
    const { render } = require('@testing-library/react');
    expect(render).toBeDefined();
  });

  it('should have user-event available', () => {
    const userEvent = require('@testing-library/user-event');
    expect(userEvent).toBeDefined();
  });

  it('should have jest-dom matchers', () => {
    expect(expect.toBeInTheDocument).toBeDefined();
    expect(expect.toHaveClass).toBeDefined();
  });

  it('should have mocked window.matchMedia', () => {
    expect(window.matchMedia).toBeDefined();
    const result = window.matchMedia('(min-width: 768px)');
    expect(result.matches).toBe(false);
  });

  it('should have mocked IntersectionObserver', () => {
    expect(global.IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer.observe).toBeDefined();
  });
});
```

**Implementation Tasks:**
- [ ] Install Vitest: `npm install -D vitest`
- [ ] Install React Testing Library: `npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- [ ] Create `vitest.config.js`
- [ ] Create `src/tests/setup.js`
- [ ] Update `package.json` scripts
- [ ] Create test utilities folder
- [ ] Create mock factories
- [ ] Document testing conventions
- [ ] Run validation tests

**Dependencies:** None

---

##### User Story 1.2.2: Integration Testing with MSW
**As a** developer
**I want** to set up Mock Service Worker (MSW)
**So that** we can test API integration without hitting real endpoints

**Acceptance Criteria:**
- [ ] MSW is installed and configured
- [ ] API handlers are set up for all endpoints
- [ ] Mock data factories are created
- [ ] Integration tests can intercept API calls
- [ ] Error scenarios can be simulated

**Test Cases:**

```javascript
// src/tests/mocks/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Customers API
  http.get('/api/customers', ({ request }) => {
    const url = new URL(request.url);
    const customerType = url.searchParams.get('customer_type');

    const customers = mockCustomers.filter(c =>
      !customerType || c.customer_type === customerType
    );

    return HttpResponse.json({ data: customers });
  }),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = mockCustomers.find(c => c.id === params.id);

    if (!customer) {
      return HttpResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: customer });
  }),

  http.post('/api/customers', async ({ request }) => {
    const body = await request.json();
    const newCustomer = {
      id: crypto.randomUUID(),
      ...body,
      created_at: new Date().toISOString()
    };

    return HttpResponse.json({ data: newCustomer }, { status: 201 });
  }),

  // Service Requests API
  http.get('/api/service-requests', () => {
    return HttpResponse.json({ data: mockServiceRequests });
  }),

  http.post('/api/service-requests', async ({ request }) => {
    const body = await request.json();
    const newSR = {
      id: crypto.randomUUID(),
      ...body,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    return HttpResponse.json({ data: newSR }, { status: 201 });
  }),

  // Error simulation handlers
  http.get('/api/customers/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),

  http.get('/api/customers/timeout', () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json({ data: [] }));
      }, 10000); // Simulate timeout
    });
  })
];
```

```javascript
// src/tests/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```javascript
// src/tests/mocks/browser.js
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

```javascript
// src/tests/setup.js (add to existing setup)
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

**Validation Tests:**

```javascript
// src/tests/__tests__/msw-setup.test.js

describe('MSW Integration', () => {
  it('should intercept GET requests', async () => {
    const response = await fetch('/api/customers');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeInstanceOf(Array);
  });

  it('should intercept POST requests', async () => {
    const newCustomer = {
      name: 'John Doe',
      customer_type: 'Individual',
      contact_number: '12345678'
    };

    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCustomer)
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe('John Doe');
    expect(data.data.id).toBeDefined();
  });

  it('should simulate 404 errors', async () => {
    const response = await fetch('/api/customers/non-existent-id');

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Customer not found');
  });

  it('should simulate 500 errors', async () => {
    const response = await fetch('/api/customers/error');

    expect(response.status).toBe(500);
  });

  it('should allow runtime handler override', async () => {
    // Override handler for specific test
    server.use(
      http.get('/api/customers', () => {
        return HttpResponse.json({ data: [] });
      })
    );

    const response = await fetch('/api/customers');
    const data = await response.json();

    expect(data.data).toHaveLength(0);
  });
});
```

**Implementation Tasks:**
- [ ] Install MSW: `npm install -D msw`
- [ ] Initialize MSW: `npx msw init public/ --save`
- [ ] Create `src/tests/mocks/handlers.js`
- [ ] Create `src/tests/mocks/server.js`
- [ ] Create `src/tests/mocks/browser.js`
- [ ] Update test setup to use MSW
- [ ] Create mock data factories
- [ ] Document MSW usage patterns
- [ ] Run validation tests

**Dependencies:** 1.2.1

---

##### User Story 1.2.3: E2E Testing with Playwright
**As a** developer
**I want** to set up Playwright for E2E testing
**So that** we can test complete user journeys

**Acceptance Criteria:**
- [ ] Playwright is installed and configured
- [ ] Test database seeding works
- [ ] Screenshot and video recording configured
- [ ] Tests run in multiple browsers
- [ ] CI/CD integration works

**Configuration:**

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Test Utilities:**

```javascript
// e2e/utils/test-helpers.js

export async function seedTestData(database) {
  // Seed users
  await database.execute(`
    INSERT INTO users (id, email, role) VALUES
    ('test-user-1', 'advisor@test.com', 'advisor'),
    ('test-user-2', 'admin@test.com', 'admin')
  `);

  // Seed customers
  await database.execute(`
    INSERT INTO customers (id, name, customer_type, contact_number) VALUES
    ('test-customer-1', 'John Doe', 'Individual', '12345678'),
    ('test-customer-2', 'TechCorp Pte Ltd', 'Entity', '87654321')
  `);

  // Seed products
  await database.execute(`
    INSERT INTO products (id, product_name, product_type) VALUES
    ('test-product-1', 'LifeShield Plus', 'Term Life'),
    ('test-product-2', 'Group Life Elite', 'Group Life')
  `);
}

export async function clearTestData(database) {
  await database.execute('DELETE FROM service_requests');
  await database.execute('DELETE FROM customer_milestones');
  await database.execute('DELETE FROM financial_projections');
  await database.execute('DELETE FROM proposals');
  await database.execute('DELETE FROM policies');
  await database.execute('DELETE FROM customers');
  await database.execute('DELETE FROM users');
}

export async function loginAsAdvisor(page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'advisor@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/advisor/home');
}

export async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}
```

**Validation Tests:**

```javascript
// e2e/smoke.spec.js
import { test, expect } from '@playwright/test';
import { seedTestData, clearTestData, loginAsAdvisor } from './utils/test-helpers';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear and seed test data
    await clearTestData(context._connection);
    await seedTestData(context._connection);
  });

  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AdvisorHub/);
  });

  test('should login successfully', async ({ page }) => {
    await loginAsAdvisor(page);
    await expect(page).toHaveURL('/advisor/home');
    await expect(page.getByText('Good morning')).toBeVisible();
  });

  test('should navigate to customers page', async ({ page }) => {
    await loginAsAdvisor(page);
    await page.click('text=Customers');
    await expect(page).toHaveURL('/advisor/customers');
    await expect(page.getByText('Customer Management')).toBeVisible();
  });

  test('should display customer list', async ({ page }) => {
    await loginAsAdvisor(page);
    await page.goto('/advisor/customers');

    // Should see at least 2 customers from seed data
    const customerCards = page.locator('[data-testid="customer-card"]');
    await expect(customerCards).toHaveCount(2);
  });

  test('should create new customer', async ({ page }) => {
    await loginAsAdvisor(page);
    await page.goto('/advisor/customers');

    await page.click('text=+New Lead');
    await page.fill('[name="name"]', 'New Test Customer');
    await page.fill('[name="contact_number"]', '99999999');
    await page.click('text=Save & Close');

    await expect(page.getByText('Customer created successfully')).toBeVisible();
  });

  test('should take screenshot on failure', async ({ page }) => {
    await loginAsAdvisor(page);

    // Intentionally fail to test screenshot capture
    await expect(page.getByText('This text does not exist')).toBeVisible();
  });
});
```

**Implementation Tasks:**
- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Run Playwright init: `npx playwright install`
- [ ] Create `playwright.config.js`
- [ ] Create `e2e/utils/test-helpers.js`
- [ ] Create database seeding scripts
- [ ] Create smoke tests
- [ ] Configure CI/CD for Playwright
- [ ] Document E2E testing patterns
- [ ] Run validation tests

**Dependencies:** 1.2.1, 1.2.2

---

I'll continue building out this implementation plan. Would you like me to:

1. Continue with the remaining user stories for Phase 1 (Epic 1.3, 1.4, 1.5)?
2. Move to Phase 2 and complete all phases?
3. Focus on a specific area in more detail?

The document is already quite comprehensive. Should I proceed to complete all 8 phases with similar detail level, or would you prefer a summary format for later phases?
