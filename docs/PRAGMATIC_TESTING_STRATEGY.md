# Pragmatic Testing Strategy

**Philosophy:** Ship features fast. Test what matters. Add comprehensive tests later.

---

## 🎯 Core Principle

**Your goal:** Deliver working features to users
**Not your goal:** 100% test coverage with perfect test architecture

**Rule:** If test takes >30 minutes to figure out, SKIP IT and ship the feature.

---

## 📊 Testing Priority Pyramid

```
┌─────────────────────────────────────┐
│  Priority 1: MANUAL TESTING         │  ← Always do this
│  (Run the app, click around)        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Priority 2: CRITICAL UNIT TESTS    │  ← Only for pure logic
│  (Business logic, calculations)     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Priority 3: HAPPY PATH E2E         │  ← One test per feature
│  (User can complete the flow)       │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Priority 4: EDGE CASES             │  ← Do this LAST
│  (Error handling, validation)       │
└─────────────────────────────────────┘
```

---

## ✅ What to Test (Do These)

### 1. Pure Business Logic ✅

**Test if:** Function has calculations, transformations, business rules

**Example:**
```javascript
// ✅ TEST THIS - Pure logic
function calculatePremium(age, coverage) {
  const baseRate = 100;
  const ageFactor = age > 50 ? 1.5 : 1.0;
  return baseRate * ageFactor * coverage;
}

// Simple test
it('should calculate premium correctly', () => {
  expect(calculatePremium(55, 1000)).toBe(150000);
});
```

**Why:** Logic bugs are silent killers. Catch them with quick tests.

---

### 2. Critical User Flows (E2E) ✅

**Test if:** Users MUST be able to do this to use the app

**Example:**
```javascript
// ✅ TEST THIS - Critical flow
test('user can create a customer', async ({ page }) => {
  await page.goto('/customers');
  await page.click('text=New Customer');
  await page.fill('[name="name"]', 'John Doe');
  await page.click('text=Save');

  await expect(page.getByText('John Doe')).toBeVisible();
});
```

**Why:** If this breaks, users can't use the app. Must catch it.

---

### 3. API Contracts ✅

**Test if:** Backend endpoint exists and returns expected shape

**Example:**
```javascript
// ✅ TEST THIS - API contract
it('should return customer list', async () => {
  const response = await fetch('/api/customers');
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data).toHaveProperty('customers');
  expect(Array.isArray(data.customers)).toBe(true);
});
```

**Why:** Frontend depends on API shape. Quick to test, high value.

---

## 🚫 What NOT to Test (Skip These)

### 1. React Component Rendering Details ❌

**Skip if:** Testing implementation details like state updates, prop drilling

**Example:**
```javascript
// ❌ DON'T TEST THIS - Too complex, low value
it('should update state when props change', () => {
  const { rerender } = render(<Customer id="1" />);
  expect(getState()).toBe('loading');

  rerender(<Customer id="2" />);
  expect(getState()).toBe('loading');
  // ... 50 lines of state testing ...
});
```

**Why:** React already tests React. You're testing the framework, not your code.

**Instead:** Manual test or simple E2E test.

---

### 2. Complex Integration Tests ❌

**Skip if:** Test requires mocking 5+ dependencies or complex setup

**Example:**
```javascript
// ❌ DON'T TEST THIS - Setup is nightmare
it('should integrate customer with temperature in list', () => {
  const mockStore = createMockStore();
  const mockRouter = createMockRouter();
  const mockContext = createMockContext();
  const mockApi = createMockApi();
  // ... 100 lines of setup ...

  render(
    <Provider store={mockStore}>
      <Router router={mockRouter}>
        <Context.Provider value={mockContext}>
          <CustomerList />
        </Context.Provider>
      </Router>
    </Provider>
  );
  // ... now finally test something ...
});
```

**Why:** Test is more complex than the code. Not worth it.

**Instead:** Ship feature, test manually, add E2E test later.

---

### 3. Third-Party Library Behavior ❌

**Skip if:** Testing that a library works as documented

**Example:**
```javascript
// ❌ DON'T TEST THIS - Testing react-router
it('should navigate when clicking link', async () => {
  render(<Link to="/customers">Go</Link>);
  await userEvent.click(screen.getByText('Go'));
  expect(mockNavigate).toHaveBeenCalledWith('/customers');
});
```

**Why:** React Router already has tests. Trust it works.

**Instead:** Manual test during development.

---

## 🎯 Decision Tree: Should I Test This?

```
Will this feature handle money,
calculations, or critical business logic?
├─ YES → Write unit test (5-10 minutes)
└─ NO → Is it a critical user flow?
    ├─ YES → Write simple E2E test (10-15 minutes)
    └─ NO → Is the test taking >30 minutes to figure out?
        ├─ YES → SKIP TEST. Ship feature. Manual test.
        └─ NO → Write simple test if you want
```

---

## ⏱️ Time-Boxing Tests

**If test takes longer than these times, SKIP IT:**

| Test Type | Time Limit | If Exceeded |
|-----------|------------|-------------|
| Unit test (pure function) | 10 minutes | Skip - logic too complex, refactor later |
| Component test (simple) | 15 minutes | Skip - test manually instead |
| Component test (complex) | 30 minutes | ALWAYS SKIP - defer to E2E |
| Integration test | 20 minutes | Skip - mock complexity not worth it |
| E2E test | 20 minutes | OK to spend time - high value |

**Rule:** If you're stuck on test setup, you're wasting time. Ship the feature.

---

## 🚀 Recommended Workflow

### Step 1: Build the Feature (80% of time)

```bash
# Focus on making it work
1. Write component
2. Test manually in browser
3. Verify it works
4. Commit: "feat: add customer temperature badge"
```

### Step 2: Add Critical Tests Only (20% of time)

```bash
# Only test what matters
1. Does it have business logic? → Unit test (5 min)
2. Is it a critical flow? → E2E test (15 min)
3. Neither? → Skip tests, move on
```

### Step 3: Document What You Skipped

```markdown
## Features Without Tests (Add Later)

- CustomerTemperature integration
  - Reason: Complex React integration, not worth test setup time
  - Manual testing: ✅ Works in dev
  - Defer to: E2E test suite expansion (Phase 9)
```

---

## 📋 Examples

### Example 1: CustomerTemperature Feature ✅ SHIP IT

**Codex's situation:**
- Feature works manually ✅
- Test setup is complex and taking hours ❌
- Getting stuck on "how to test it" ❌

**Pragmatic approach:**
```bash
1. ✅ Test TemperatureBadge in isolation (10 min unit test)
2. ✅ Ship the feature (it works manually)
3. ✅ Document: "CustomerTemperature - defer integration test to E2E"
4. ✅ Move to next feature
```

**Update checklist:**
```markdown
- [✅] Customer temperature tracking (manual testing verified)
  - Unit tests: TemperatureBadge (8 tests)
  - Integration test: Deferred to E2E suite
  - Status: Shipped and working
```

---

### Example 2: Premium Calculation ✅ TEST IT

**Feature:** Calculate insurance premium based on age/coverage

**Pragmatic approach:**
```javascript
// ✅ MUST TEST - Handles money
describe('calculatePremium', () => {
  it('calculates correctly for under 50', () => {
    expect(calculatePremium(30, 1000)).toBe(100000);
  });

  it('calculates correctly for over 50', () => {
    expect(calculatePremium(55, 1000)).toBe(150000);
  });
});
```

**Why test:** Money calculations = must be correct. Test takes 5 minutes, high value.

---

### Example 3: Form Validation ✅ SIMPLE TEST

**Feature:** Customer form validates email

**Pragmatic approach:**
```javascript
// ✅ Simple validation test
it('should reject invalid email', () => {
  const result = validateCustomerForm({ email: 'invalid' });
  expect(result.errors.email).toBe('Invalid email');
});
```

**Skip:** Complex React Testing Library setup with form state
**Do:** Test the validation function directly

---

## ✅ Quality Assurance Strategy

**How to ensure quality without extensive tests:**

### 1. Manual Testing Checklist ✅
```markdown
Before marking feature complete:
- [ ] Feature works in dev environment
- [ ] Tested happy path manually
- [ ] Tested one error case manually
- [ ] No console errors
- [ ] Looks good on mobile
```

### 2. Code Review ✅
- Peer reviews catch bugs tests miss
- Faster than writing complex tests
- Teaches good practices

### 3. Production Monitoring ✅
- Error tracking (Sentry)
- User analytics
- Fix bugs when users report them

### 4. Staged Rollout ✅
- Ship to 10% of users first
- Monitor for errors
- Roll back if issues
- Full rollout if stable

---

## 📊 Coverage Targets (Realistic)

**Don't aim for 100% coverage. Aim for:**

| Category | Target | Acceptable |
|----------|--------|------------|
| Business logic (pure functions) | 90% | 80% |
| API endpoints | 80% | 70% |
| Critical user flows (E2E) | 100% | 80% |
| UI components | 30% | 20% |
| Integration | 20% | 10% |
| **Overall** | **60%** | **50%** |

**Why low UI/integration?** Manual testing + E2E covers it. Unit testing UI is expensive.

---

## 🎯 Success Metrics

**You're doing it right if:**
- ✅ Features ship daily
- ✅ Tests run in <2 minutes
- ✅ Test files are small and readable
- ✅ Manual testing finds issues before users
- ✅ Test setup time < 30 min per feature

**You're doing it wrong if:**
- ❌ Tests take longer to write than features
- ❌ Tests are brittle and break often
- ❌ Fighting with test setup for hours
- ❌ 100% coverage but features are slow
- ❌ Tests don't catch real bugs

---

## 🚀 Updated Instructions for Codex

**When building a feature:**

1. **Build it** (60 minutes)
   - Write the code
   - Test manually
   - Make it work

2. **Test what matters** (20 minutes max)
   - Business logic? → Unit test (5-10 min)
   - Critical flow? → E2E test (10-15 min)
   - Complex integration? → SKIP

3. **Ship it** (5 minutes)
   - Commit
   - Update checklist
   - Move to next feature

**Total time per feature:** 85 minutes (not 4 hours fighting tests!)

---

## 📝 Template: Feature Without Full Tests

When you skip complex tests, document it:

```markdown
## Feature: [Feature Name]

**Status:** ✅ Shipped and working
**Manual Testing:** ✅ Verified in dev environment
**Unit Tests:** ✅ [Pure logic tested] OR ⏭️ [None needed - UI only]
**Integration Tests:** ⏭️ Deferred (complex setup, low ROI)
**E2E Tests:** 📅 Planned for Phase 9
**Coverage:** Adequate for shipping

**Testing Notes:**
- Manually verified: [What you tested]
- Known limitations: [Any known edge cases]
- Production monitoring: [How we'll catch issues]
```

---

## 🎯 Key Takeaways

1. **Ship features > Perfect tests**
2. **Manual testing is valid QA**
3. **Test business logic, not React internals**
4. **30-minute rule: If test takes longer, skip it**
5. **E2E > Integration > Unit for UI features**
6. **Trust libraries, test your code**
7. **Production monitoring catches what tests miss**

---

**Remember:** Tests are tools for confidence, not goals for perfectionism.

**Your job:** Ship working features fast.

**Not your job:** Achieve 100% test coverage with architectural perfection.

---

**Version:** 1.0
**Last Updated:** 2025-11-23
**Philosophy:** Pragmatic > Perfectionist
