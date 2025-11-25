# 🤝 Handover Guide for Codex
**From:** Claude Code
**To:** Codex
**Date:** 2025-11-22
**Project:** AdvisorHub V2 Implementation
**Status:** Phase 1 Foundation - 60% Complete

---

## 📋 Table of Contents
1. [What's Been Completed](#whats-been-completed)
2. [What's Next (Your Tasks)](#whats-next-your-tasks)
3. [How to Continue Development](#how-to-continue-development)
4. [How to Update Documentation](#how-to-update-documentation)
5. [Testing Guidelines](#testing-guidelines)
6. [Key Files & Locations](#key-files--locations)
7. [Common Commands](#common-commands)
8. [Getting Help](#getting-help)

---

## ✅ What's Been Completed

### Database Migrations (5/8)
**Location:** `supabase/migrations/`

✅ **Completed:**
1. `20241121000001_entity_customers.sql` - Entity customer schema
2. `20241121000002_service_requests.sql` - Service requests table
3. `20241121000003_customer_milestones.sql` - Customer milestones
4. `20241121000004_financial_projections.sql` - Financial projections
5. `20241121000005_user_preferences.sql` - User language/currency preferences

**Test Status:** All migrations tested and passing ✅

---

### Testing Infrastructure (Complete)
**Location:** `vitest.config.js`, `playwright.config.js`

✅ **Set Up:**
- Vitest configured for unit tests
- React Testing Library installed
- Playwright configured for E2E tests
- Test file structure established

**Test Location:** `src/tests/`

---

### i18n Foundation (Complete - 5 Languages)
**Location:** `src/lib/i18n/`

✅ **Completed:**
- Configuration: `config.js`
- Translations: `locales/[lang]/translation.json`
- Languages: English (en), Chinese (zh), Malay (ms), Tamil (ta), Hindi (hi)
- 300+ translation keys implemented
- LanguageDetector configured
- Fallback mechanism tested

**Test Status:** 14 integration tests passing ✅

---

### Base Components (4/8 - CRITICAL ONES COMPLETE)
**Location:** `src/admin/modules/customers/components/`

✅ **Completed Components:**

#### 1. EntityCustomerForm
- **File:** `EntityCustomerForm.jsx`
- **Tests:** `src/tests/components/EntityCustomerForm.test.jsx`
- **Test Count:** 16 tests passing ✅
- **Purpose:** Form for creating/editing entity (B2B) customers
- **Features:**
  - Customer type selector (Individual/Entity)
  - Conditional field rendering
  - Form validation (email, phone, required fields)
  - i18n support
  - Initial data support (edit mode)

#### 2. CompanyDetailsCard
- **File:** `CompanyDetailsCard.jsx`
- **Tests:** `src/tests/components/CompanyDetailsCard.test.jsx`
- **Test Count:** 24 tests passing ✅
- **Purpose:** Display card for company/entity information
- **Features:**
  - Company information display
  - Number/currency formatting
  - Contact person details
  - Edit button (optional)
  - Empty state handling
  - i18n support

#### 3. KeymanDetailsForm
- **File:** `KeymanDetailsForm.jsx`
- **Tests:** `src/tests/components/KeymanDetailsForm.test.jsx`
- **Test Count:** 18 tests passing ✅
- **Purpose:** Form for capturing Key Man Insurance details
- **Features:**
  - Keyman personal information
  - Position and role fields
  - Date of birth validation (not in future)
  - Annual salary and coverage amount
  - Medical/health notes (optional)
  - Form validation
  - i18n support

#### 4. EmployeeListUpload
- **File:** `EmployeeListUpload.jsx`
- **Tests:** `src/tests/components/EmployeeListUpload.test.jsx`
- **Test Count:** 18 tests passing ✅
- **Purpose:** CSV file upload for bulk employee data (Group Insurance)
- **Features:**
  - Drag & drop file upload
  - CSV parsing and validation
  - File type validation (CSV only)
  - Data preview table
  - Empty row detection with warnings
  - Required column validation
  - i18n support

**Total Tests:** 76 tests, 100% passing ✅
**Test Execution Time:** <10 seconds

---

## 🎯 What's Next (Your Tasks)

### Priority 1: Remaining Database Migrations (3/8)

**Location:** Create in `supabase/migrations/`

#### Task 1.1: Exchange Rates Migration
**File to create:** `20241122000006_exchange_rates.sql`

**What to build:**
```sql
-- Create exchange_rates table
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate decimal(10, 6) NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_date ON exchange_rates(effective_date);

-- Add constraint for positive rates
ALTER TABLE exchange_rates ADD CONSTRAINT check_positive_rate CHECK (rate > 0);
```

**Test in:** `src/tests/database/migrations/` (create new test file following TDD pattern)

---

#### Task 1.2: Enhanced Broadcasts Migration
**File to create:** `20241122000007_enhanced_broadcasts.sql`

**What to build:**
```sql
-- Add new columns to broadcasts table
ALTER TABLE broadcasts ADD COLUMN category varchar(50);
ALTER TABLE broadcasts ADD COLUMN is_pinned boolean DEFAULT false;
ALTER TABLE broadcasts ADD COLUMN priority integer DEFAULT 0;
ALTER TABLE broadcasts ADD COLUMN tags jsonb DEFAULT '[]'::jsonb;

-- Create index for filtering
CREATE INDEX idx_broadcasts_category ON broadcasts(category);
CREATE INDEX idx_broadcasts_pinned ON broadcasts(is_pinned) WHERE is_pinned = true;
```

---

#### Task 1.3: Task Transcripts Migration
**File to create:** `20241122000008_task_transcripts.sql`

**What to build:**
```sql
-- Add columns for Mira AI transcripts and summaries
ALTER TABLE tasks ADD COLUMN transcript jsonb;
ALTER TABLE tasks ADD COLUMN ai_summary text;
ALTER TABLE tasks ADD COLUMN sentiment varchar(20);
ALTER TABLE tasks ADD COLUMN key_points jsonb DEFAULT '[]'::jsonb;
```

---

### Priority 2: Remaining Base Components (4/8)

**Location:** Create in `src/admin/modules/customers/components/`

#### Task 2.1: OurJourneyTimeline Component
**Files to create:**
- Component: `OurJourneyTimeline.jsx`
- Tests: `src/tests/components/OurJourneyTimeline.test.jsx`

**Purpose:** Timeline visualization showing customer journey milestones

**What to build:**
- Timeline layout (vertical or horizontal)
- Milestone markers with dates
- Event descriptions
- Icons for different event types
- Responsive design
- Empty state

**Expected tests:** ~15-20 tests

---

#### Task 2.2: MilestoneCard Component
**Files to create:**
- Component: `MilestoneCard.jsx`
- Tests: `src/tests/components/MilestoneCard.test.jsx`

**Purpose:** Individual milestone card for timeline

**What to build:**
- Date display
- Title and description
- Icon/status indicator
- Category/type badge
- Click handler (optional)

**Expected tests:** ~10-15 tests

---

#### Task 2.3: CurrencySelector Component
**Files to create:**
- Component: `CurrencySelector.jsx`
- Tests: `src/tests/components/CurrencySelector.test.jsx`

**Purpose:** Dropdown for selecting currency (SGD, USD, MYR, etc.)

**What to build:**
- Currency dropdown with icons/flags
- Search/filter functionality
- Save preference to user settings
- i18n support
- Common currencies at top

**Expected tests:** ~12-15 tests

---

#### Task 2.4: LanguageSwitcher Enhancement
**Files to modify:**
- Component: `src/admin/components/ui/LanguageSwitcher.jsx`
- Tests: `src/tests/components/LanguageSwitcher.test.jsx`

**Purpose:** Enhance existing language switcher

**What to add:**
- Flag icons for each language
- Persist selection to localStorage
- Update user preference in database
- Add test coverage

**Expected tests:** ~10-12 tests

---

## 🚀 How to Continue Development

### Step 1: Choose a Task
Pick one task from the "What's Next" section above. Start with migrations or components - your choice!

### Step 2: Follow TDD (Test-Driven Development)

**IMPORTANT:** We're using strict TDD. Always follow this cycle:

```
RED → GREEN → REFACTOR

1. 🔴 RED: Write failing tests first
2. 🟢 GREEN: Write minimal code to pass tests
3. 🔵 REFACTOR: Improve code quality (keeping tests green)
```

#### Example: Creating CurrencySelector

**Step A: Write Tests First (RED phase)**
```javascript
// src/tests/components/CurrencySelector.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencySelector } from '@/admin/components/ui/CurrencySelector';
import '@/lib/i18n/config';

describe('CurrencySelector', () => {
  it('should render currency dropdown', () => {
    render(<CurrencySelector value="SGD" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should display current currency', () => {
    render(<CurrencySelector value="SGD" onChange={vi.fn()} />);
    expect(screen.getByText('SGD')).toBeInTheDocument();
  });

  // Add 10-12 more tests...
});
```

**Step B: Run Tests (should fail)**
```bash
npm run test:unit -- src/tests/components/CurrencySelector.test.jsx
```

**Step C: Create Component (GREEN phase)**
```javascript
// src/admin/components/ui/CurrencySelector.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export function CurrencySelector({ value, onChange }) {
  const { t } = useTranslation();

  const currencies = [
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    // Add more...
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map(currency => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step D: Run Tests (should pass)**
```bash
npm run test:unit -- src/tests/components/CurrencySelector.test.jsx
```

**Step E: Refactor (improve code quality)**
- Extract currency list to a constant
- Add PropTypes or TypeScript types
- Optimize performance
- Improve accessibility

---

### Step 3: Add i18n Support

For every component with user-facing text:

**1. Add translation keys:**
```javascript
// src/lib/i18n/locales/en/translation.json
{
  "currency": {
    "selector": "Select Currency",
    "sgd": "Singapore Dollar",
    "usd": "US Dollar"
    // etc...
  }
}
```

**2. Use in component:**
```javascript
const { t } = useTranslation();
<label>{t('currency.selector')}</label>
```

**3. Test translations:**
```javascript
it('should render labels using i18n', () => {
  render(<CurrencySelector value="SGD" onChange={vi.fn()} />);
  expect(screen.getByText('Select Currency')).toBeInTheDocument();
});
```

---

## 📝 How to Update Documentation

After completing each task, you MUST update both documentation files:

### Document 1: Master Checklist
**File:** `docs/advisorhub-v2-master-checklist.md`

**What to update:**
1. Change `[ ]` to `[✅]` for completed items
2. Add test counts in parentheses

**Example:**
```markdown
### Base Components
- [✅] EntityCustomerForm component (16 tests passing)
- [✅] CompanyDetailsCard component (24 tests passing)
- [✅] KeymanDetailsForm component (18 tests passing)
- [✅] EmployeeListUpload component (18 tests passing)
- [✅] CurrencySelector component (12 tests passing) ← YOUR UPDATE
- [ ] OurJourneyTimeline component
```

---

### Document 2: Implementation Plan Part 2
**File:** `docs/advisorhub-v2-implementation-plan-part2.md`

**What to update:**
1. Find the relevant User Story section (search for component name)
2. Update acceptance criteria with ✅ and test counts
3. Update the "Implementation Tasks" checklist

**Example:**
```markdown
##### User Story 1.4.2: Currency & Language Components
**Acceptance Criteria:**
- [✅] CurrencySelector component exists (12 tests passing) ← YOUR UPDATE
- [ ] LanguageSwitcher enhancement complete
- [✅] All components have unit tests

**Implementation Tasks:**
- [✅] Write test cases for CurrencySelector ← YOUR UPDATE
- [✅] Create CurrencySelector component ← YOUR UPDATE
- [✅] Add i18n support ← YOUR UPDATE
- [✅] Currency list with flags/icons ← YOUR UPDATE
- [✅] Save preference to localStorage ← YOUR UPDATE
- [ ] Write tests for LanguageSwitcher
```

---

### Document 3: Implementation Plan (Progress Summary)
**File:** `docs/advisorhub-v2-implementation-plan.md`

**What to update:**
Update the Progress Summary section at the top:

**Example:**
```markdown
## 🎯 Progress Summary

**Overall Progress:** Phase 1 Foundation (75% Complete) ← UPDATE %

### ✅ Completed Items
- **Base Components**: 5/8 components complete ← UPDATE COUNT
  - **Test Coverage**: 88 tests, 100% passing ← UPDATE TEST COUNT
  - Components: EntityCustomerForm (16), CompanyDetailsCard (24),
    KeymanDetailsForm (18), EmployeeListUpload (18),
    CurrencySelector (12) ← ADD YOUR COMPONENT

### 📊 Test Metrics
- **Unit Tests**: 88 tests passing (100% pass rate) ← UPDATE
- **Component Coverage**: [list all components with counts] ← UPDATE
```

---

## 🧪 Testing Guidelines

### Running Tests

**Run all unit tests:**
```bash
npm run test:unit
```

**Run specific test file:**
```bash
npm run test:unit -- src/tests/components/YourComponent.test.jsx
```

**Run tests in watch mode (during development):**
```bash
npm run test:unit -- --watch
```

**Run E2E tests:**
```bash
npm run test:e2e
```

---

### Test Coverage Standards

Every component MUST have:
- ✅ Unit tests with 80%+ coverage
- ✅ Tests for all user interactions
- ✅ Tests for all edge cases
- ✅ Tests for accessibility (a11y)
- ✅ Tests for i18n integration

**Minimum test count guidelines:**
- Simple components (cards, buttons): 10-15 tests
- Forms: 15-20 tests
- Complex components (tables, wizards): 20-30 tests

---

### Example Test Structure

Use this template for all component tests:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from '@/path/to/YourComponent';
import '@/lib/i18n/config'; // IMPORTANT: Initialize i18n

describe('YourComponent', () => {
  let mockCallback;

  beforeEach(() => {
    mockCallback = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the component', () => {
      render(<YourComponent />);
      // Your assertions...
    });
  });

  describe('User Interactions', () => {
    it('should handle user clicks', async () => {
      const user = userEvent.setup();
      render(<YourComponent onClick={mockCallback} />);

      await user.click(screen.getByRole('button'));
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors', async () => {
      // Test validation...
    });
  });

  describe('Internationalization', () => {
    it('should render labels using i18n', () => {
      // Test translations...
    });
  });
});
```

---

## 📁 Key Files & Locations

### Component Files
```
src/
├── admin/
│   ├── modules/
│   │   └── customers/
│   │       └── components/          ← NEW COMPONENTS GO HERE
│   │           ├── EntityCustomerForm.jsx
│   │           ├── CompanyDetailsCard.jsx
│   │           ├── KeymanDetailsForm.jsx
│   │           └── EmployeeListUpload.jsx
│   └── components/
│       └── ui/                       ← UI COMPONENTS (CurrencySelector, etc.)
│           ├── select.jsx
│           ├── input.jsx
│           └── button.jsx
```

### Test Files
```
src/
└── tests/
    ├── components/                   ← COMPONENT TESTS GO HERE
    │   ├── EntityCustomerForm.test.jsx
    │   ├── CompanyDetailsCard.test.jsx
    │   ├── KeymanDetailsForm.test.jsx
    │   └── EmployeeListUpload.test.jsx
    ├── i18n/                        ← I18N TESTS
    │   └── i18n-integration.test.jsx
    └── database/                     ← MIGRATION TESTS (create this folder)
        └── migrations/
            └── [migration].test.js
```

### i18n Files
```
src/
└── lib/
    └── i18n/
        ├── config.js                ← i18n configuration
        └── locales/
            ├── en/
            │   └── translation.json  ← ADD ENGLISH KEYS HERE
            ├── zh/
            │   └── translation.json  ← ADD CHINESE TRANSLATIONS
            ├── ms/
            │   └── translation.json  ← ADD MALAY TRANSLATIONS
            ├── ta/
            │   └── translation.json  ← ADD TAMIL TRANSLATIONS
            └── hi/
                └── translation.json  ← ADD HINDI TRANSLATIONS
```

### Migration Files
```
supabase/
└── migrations/
    ├── 20241121000001_entity_customers.sql
    ├── 20241121000002_service_requests.sql
    ├── 20241121000003_customer_milestones.sql
    ├── 20241121000004_financial_projections.sql
    ├── 20241121000005_user_preferences.sql
    └── [YOUR NEW MIGRATIONS GO HERE]
```

---

## ⌨️ Common Commands

### Development
```bash
# Start dev server
npm run dev

# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit -- --watch

# Run specific test file
npm run test:unit -- src/tests/components/YourComponent.test.jsx

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Database
```bash
# Apply migrations (local Supabase)
npx supabase migration up

# Create new migration
npx supabase migration new migration_name

# Reset database (WARNING: deletes all data)
npx supabase db reset
```

### Git
```bash
# Check status
git status

# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push changes
git push origin feature/your-feature-name
```

---

## 🆘 Getting Help

### Reference Examples
Look at the completed components for patterns:
- **Form component:** `EntityCustomerForm.jsx` or `KeymanDetailsForm.jsx`
- **Display component:** `CompanyDetailsCard.jsx`
- **File upload component:** `EmployeeListUpload.jsx`
- **i18n usage:** Any of the above components
- **Test patterns:** Any test file in `src/tests/components/`

### Documentation
- **Master Checklist:** `docs/advisorhub-v2-master-checklist.md`
- **Implementation Plan:** `docs/advisorhub-v2-implementation-plan.md` & `part2.md`
- **Project README:** `README.md`
- **CLAUDE.md:** `CLAUDE.md` (project conventions)

### Testing Resources
- **Vitest Docs:** https://vitest.dev
- **React Testing Library:** https://testing-library.com/react
- **Playwright Docs:** https://playwright.dev

---

## ✅ Checklist Before Starting

Before you begin coding, make sure:

- [ ] You've read this entire handover guide
- [ ] You understand the TDD workflow (RED → GREEN → REFACTOR)
- [ ] You know which task you're starting with
- [ ] You can run `npm run dev` successfully
- [ ] You can run `npm run test:unit` and see 76 tests passing
- [ ] You've looked at example components for reference
- [ ] You know how to update the documentation files

---

## 🎯 Success Criteria

You're doing great if:
- ✅ All new tests pass (100% pass rate)
- ✅ Existing tests still pass (don't break what works!)
- ✅ Code follows TDD (tests written first)
- ✅ Components have i18n support
- ✅ Documentation is updated after each task
- ✅ Test count increases with each component
- ✅ Components match the design patterns from examples

---

## 📞 Communication

When you complete a task:
1. ✅ Update both documentation files
2. ✅ Run all tests to ensure nothing broke
3. ✅ Commit your changes with clear message
4. ✅ Let the team know what you completed

**Commit Message Format:**
```
feat: add CurrencySelector component

- Created CurrencySelector with 12 tests
- Added i18n support for 5 languages
- Integrated with user preferences
- All tests passing (88/88)
```

---

## 🚦 Ready to Start?

**Recommended First Task:** CurrencySelector Component
- Good complexity (not too hard, not too easy)
- Clear requirements
- Builds on existing patterns
- ~12-15 tests expected

**Steps:**
1. Create test file: `src/tests/components/CurrencySelector.test.jsx`
2. Write failing tests (RED)
3. Create component: `src/admin/components/ui/CurrencySelector.jsx`
4. Make tests pass (GREEN)
5. Refactor and improve
6. Update documentation
7. Commit!

Good luck! 🚀 You've got solid examples to follow, and the codebase is in great shape.

---

**Questions?** Review the completed components first - they're your best examples!

**Version:** 1.0
**Author:** Claude Code
**Date:** 2025-11-22
