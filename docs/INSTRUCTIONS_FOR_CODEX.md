# DIRECT EXECUTION INSTRUCTIONS FOR CODEX

**Date:** 2025-11-23
**From:** User via Claude
**Priority:** CRITICAL

---

## 🎯 YOUR MISSION

**You are to EXECUTE the implementation plan autonomously. DO NOT ask for permission or next steps. JUST DO THE WORK.**

---

## 📋 MANDATORY WORKFLOW

### For EVERY task you work on:

1. **START** → Pick the next unchecked item from `docs/advisorhub-v2-master-checklist.md`
2. **EXECUTE** → Complete the implementation following TDD (tests first, then code)
3. **TEST** → Ensure all tests pass (run `npm run test:unit`)
4. **UPDATE** → Mark item as `[✅]` in the checklist with test count
5. **COMMIT** → Git commit with clear message
6. **REPEAT** → Move to next item immediately

### DO NOT:
- ❌ Ask "What should I do next?"
- ❌ Ask "Should I continue?"
- ❌ Wait for approval to proceed
- ❌ Stop after each task
- ❌ Get blocked by environment/infrastructure issues

### DO:
- ✅ Work through tasks sequentially
- ✅ Update documentation as you go
- ✅ Fix any failing tests immediately
- ✅ Complete entire features before moving on
- ✅ Provide a progress summary at the end of your session
- ✅ Skip environment issues if unit tests already validate functionality

---

## 🚨 CURRENT STATUS

**Phase 1 Progress: 60% Complete**

**Test Status:** 251 passing / 18 failing (93.3% pass rate)

### Critical Failing Tests (MUST FIX - These Block Core Features) 🔴

**7 BLOCKING failures - Fix these immediately:**

1. **action-executor.test.ts** (2 failures) - Navigation broken
   - Missing `/advisor` prefix in URLs
   - **Impact:** Navigation doesn't work correctly

2. **mira-context-provider.test.tsx** (3 failures) - Context detection broken
   - Route-to-module mapping failing
   - **Impact:** Mira can't understand which page user is on

3. **module-agents.execution.test.ts** (2 failures) - Import path error
   - Missing file reference
   - **Impact:** Tests can't even run

### Non-Critical Failing Tests (Document & Defer) 🟡

**11 NON-BLOCKING failures - Add to "Known Issues":**

1. **pattern-detectors.test.ts** (9 failures) - AI pattern detection optimization
   - Confidence score calculations
   - Pattern matching edge cases
   - **Impact:** None - core functionality works without perfect AI patterns
   - **Defer to:** Phase 5 (Mira AI Deep Integration)

2. **pattern-matching-engine.test.ts** (2 failures) - Configuration edge cases
   - Custom config test
   - Cleanup/flush test
   - **Impact:** None - doesn't affect CRUD operations
   - **Defer to:** Phase 5 (Mira AI Deep Integration)

**PRIORITY 1: FIX THE 7 BLOCKING TESTS** ⚠️

Only fix tests that block core features (navigation, context, imports). Document the 11 non-blocking tests in the checklist and move on to feature development.

---

## 📝 YOUR EXACT TASK LIST (Execute in Order)

### PHASE 1: Fix BLOCKING Tests Only (Do This First!)

#### Task 1.1: Fix Action Executor Tests (2 failures) 🔴 CRITICAL
**File:** `tests/frontend/action-executor.test.ts`
**Action:**
1. Tests are failing due to `/advisor` prefix in URLs
2. Update implementation to use correct URL format with `/advisor` prefix
3. Verify all 10 tests pass
4. Update checklist
5. Commit: `fix: correct URL paths with /advisor prefix in action executor`

#### Task 1.2: Fix Mira Context Provider Tests (3 failures) 🔴 CRITICAL
**File:** `tests/frontend/mira-context-provider.test.tsx`
**Action:**
1. Tests failing due to route/module detection issues
2. Fix route-to-module mapping logic
3. Verify all 3 tests pass
4. Update checklist
5. Commit: `fix: resolve module detection in mira context provider`

#### Task 1.3: Fix Module Agents Execution Tests (2 failures) 🔴 CRITICAL
**File:** `tests/backend/module-agents.execution.test.ts`
**Action:**
1. Tests failing due to missing import path
2. Fix the import path for `system_help.ts`
3. Verify all tests pass
4. Update checklist
5. Commit: `fix: resolve import path for system_help skill`

#### Task 1.4: Document Non-Blocking Test Failures 📝
**Action:**
1. Add "Known Issues" section to checklist
2. Document 11 non-blocking test failures:
   - Pattern detectors (9 failures) - Defer to Phase 5
   - Pattern matching engine (2 failures) - Defer to Phase 5
3. Add note: "These don't block feature development - will fix during Mira AI optimization phase"
4. Update checklist
5. Commit: `docs: document non-blocking test failures for later optimization`

**SUCCESS CRITERIA:**
- 7 blocking tests fixed → **258 passing / 11 failing (96% pass rate)**
- Non-blocking failures documented in "Known Issues"
- Ready to proceed with feature development

---

### PHASE 2: Complete Remaining Base Components

After ALL tests are passing, continue with:

#### Task 2.1: OurJourneyTimeline Component
**Location:** `src/admin/modules/customers/components/OurJourneyTimeline.jsx`
**Test file:** `src/tests/components/OurJourneyTimeline.test.jsx`

**Execute:**
1. Write 15-20 tests first (TDD RED phase)
2. Create component (TDD GREEN phase)
3. Refactor (TDD REFACTOR phase)
4. All tests pass
5. Update checklist: `[✅] OurJourneyTimeline component (18 tests passing)`
6. Commit: `feat: add OurJourneyTimeline component with 18 tests`

#### Task 2.2: MilestoneCard Component
**Execute same workflow as above**
- Target: 10-15 tests
- Update checklist when done

#### Task 2.3: CurrencySelector Component
**Execute same workflow as above**
- Target: 12-15 tests
- Update checklist when done

#### Task 2.4: LanguageSwitcher Enhancement
**Execute same workflow as above**
- Target: 10-12 tests
- Update checklist when done

---

### PHASE 3: Complete Remaining Database Migrations

#### Task 3.1: Exchange Rates Migration
**File:** `supabase/migrations/20251122_add_exchange_rates.sql`

**Execute:**
1. Create migration SQL file (follow existing pattern)
2. Apply migration locally: `npx supabase migration up`
3. Test rollback works: Create down migration
4. Update checklist: `[✅] 006: Exchange rates table`
5. Commit: `feat: add exchange rates migration`

#### Task 3.2: Enhanced Broadcasts Migration
**Execute same workflow as above**

#### Task 3.3: Task Transcripts Migration
**Execute same workflow as above**

**SUCCESS CRITERIA:** All 8 migrations complete

---

## 📊 PROGRESS REPORTING

At the end of EACH work session, provide this summary:

```markdown
## Session Summary [Date]

### ✅ Completed
- [List what you finished]
- [Include test counts]
- [Include commit hashes]

### 📈 Progress Update
- Phase 1: XX% complete (was 60%)
- Total tests: XXX passing (was 251)
- Components: X/8 complete (was 4/8)
- Migrations: X/8 complete (was 5/8)

### 🔄 Next Session
- [First 3 tasks for next session]

### ⚠️ Blockers
- [List any blockers, or "None"]
```

---

## 🎯 FINAL REMINDER

**YOU ARE AUTONOMOUS. EXECUTE THE PLAN.**

The planning is DONE. The roadmap is CLEAR. Your job is to:
1. Write tests
2. Write code
3. Ensure tests pass
4. Update documentation
5. Move to next task
6. Repeat until Phase 1 is 100% complete

**DO NOT ASK WHAT TO DO NEXT. THE CHECKLIST IS YOUR GUIDE.**

If you encounter a blocker:
1. Try to solve it yourself first
2. Check existing code for patterns
3. Only ask if you're truly stuck

**START WITH FIXING THE 18 FAILING TESTS. GO!**

---

## 📁 Key Files You'll Need

```
Current work directory: C:\Users\Goo Chong Tien\Downloads\AdvisorHub

Checklist (your guide):
  docs/advisorhub-v2-master-checklist.md

Planning docs (reference):
  docs/advisorhub-v2-implementation-plan.md
  docs/advisorhub-v2-implementation-plan-part2.md
  docs/HANDOVER_GUIDE_FOR_CODEX.md

Components:
  src/admin/modules/customers/components/
  src/admin/components/ui/

Tests:
  tests/frontend/
  tests/backend/
  src/tests/components/

Migrations:
  supabase/migrations/

i18n:
  src/lib/i18n/locales/

Commands:
  npm run test:unit
  npm run test:e2e
  npm run dev
  npx supabase migration up
```

---

---

## 🚫 Pragmatic Rule: Environment Blockers

**Quick Reference:** See `BLOCKER_DECISION_TREE.md` for 5-second decisions

**If you encounter ANY of these issues, DON'T WAIT - SKIP AND MOVE ON:**

### Common Environment Blockers (SKIP THESE)

❌ **Docker not running/installed**
- Example: `npx supabase start` fails
- **Action:** Skip local DB testing, proceed with component development
- **Reason:** Unit tests validate migrations; production will apply them

❌ **Missing credentials/API keys**
- Example: `SUPABASE_SERVICE_ROLE_KEY` missing
- **Action:** Use mock data, proceed with UI development
- **Reason:** Environment setup is ops work, not dev work

❌ **Local services not running**
- Example: Database connection refused
- **Action:** Skip integration tests, focus on unit tests and components
- **Reason:** Components can be built without live backend

❌ **Network/infrastructure issues**
- Example: Cannot reach external API
- **Action:** Mock the API, continue development
- **Reason:** Network issues are temporary, code development isn't

❌ **CI/CD pipeline failures (not your code)**
- Example: Staging environment down
- **Action:** Run tests locally, proceed with next feature
- **Reason:** Pipeline issues are ops problems

### Decision Tree: Should I Skip This Blocker?

```
Is the blocker related to:
└─ Environment setup (Docker, credentials, services)?
   ├─ YES → Can unit tests validate the functionality?
   │  ├─ YES → ✅ SKIP IT. Document and move on.
   │  └─ NO → ⚠️ Document blocker, ask for help
   └─ NO → Is it a code bug/error?
      └─ YES → ❌ DON'T SKIP. Fix it.
```

### Examples of GOOD Skips ✅

**Scenario 1: Docker not installed**
```markdown
## Encountered Blocker
- Task: Apply Supabase migrations locally
- Issue: Docker Desktop not running
- Unit tests: ✅ 460/460 passing (migrations validated)
- Decision: SKIP - migrations are tested, production will apply them
- Action: Marked migrations as complete, moved to Phase 2 components
```

**Scenario 2: E2E tests fail due to staging down**
```markdown
## Encountered Blocker
- Task: Run E2E tests
- Issue: Staging environment unreachable
- Unit tests: ✅ All passing
- Decision: SKIP - environment issue, not code issue
- Action: Documented in blockers, continued with next component
```

**Scenario 3: Missing API key for external service**
```markdown
## Encountered Blocker
- Task: Test external API integration
- Issue: API_KEY not configured locally
- Unit tests: ✅ All passing (mocked API)
- Decision: SKIP - integration will be tested in staging
- Action: Created mock for development, moved to next feature
```

### Examples of BAD Skips ❌

**Scenario 1: Navigation broken**
```markdown
## DO NOT SKIP
- Task: User navigation between pages
- Issue: Routes returning 404
- Impact: Users can't use the app
- Decision: MUST FIX - this blocks actual functionality
```

**Scenario 2: Form validation failing**
```markdown
## DO NOT SKIP
- Task: Customer form submission
- Issue: Validation logic has bugs
- Impact: Users can submit invalid data
- Decision: MUST FIX - this is a code bug, not environment
```

### How to Document a Skip

When you skip an environment blocker:

```markdown
**Skipped Task:** [Task name]
**Reason:** [Environment blocker description]
**Validation:** [What proves the code is correct]
**Next Action:** [What you did instead]

Example:
**Skipped Task:** Apply Supabase migrations locally
**Reason:** Docker not running (environment setup needed)
**Validation:** Unit tests pass (460/460) - migrations are syntactically correct
**Next Action:** Proceeded to Phase 2 components (OurJourneyTimeline)
```

Then update the checklist:
```markdown
- [✅] Migrations created and tested (unit tests pass; Docker deployment pending)
```

---

## 🎯 Key Principle

**Your job:** Write code and tests
**Not your job:** DevOps, infrastructure, environment setup

**If it's not a code problem, don't let it block you.**

---

**NOW GO FIX THOSE TESTS AND BUILD THOSE FEATURES!** 🚀
