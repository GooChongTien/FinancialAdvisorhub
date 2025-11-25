# README FOR CODEX

**Hi Codex! You've been handed a well-planned project. Here's what you need to know:**

---

## 🎯 Your Job

**Execute the implementation plan autonomously.**

You don't need to ask "what should I do next?" - the checklist tells you exactly what to do.

---

## 📋 Your Guide

**Main Checklist:**
`docs/advisorhub-v2-master-checklist.md`

This is your roadmap. Work through items marked `[ ]` and change them to `[✅]` when done.

---

## 🚨 Start Here

**PRIORITY 1:** Fix the 7 BLOCKING failing tests

Current test status: **251 passing, 18 failing** (93.3% pass rate)

**Breakdown:**
- 🔴 7 BLOCKING tests (must fix - break navigation/context)
- 🟡 11 NON-BLOCKING tests (AI optimization - defer to Phase 5)

Your goal: **258 passing, 11 failing** (96% pass rate - blockers fixed)

See `docs/INSTRUCTIONS_FOR_CODEX.md` for the exact failing tests and how to fix them.

**Don't spend time on non-blocking AI/ML optimization tests. Document them and move on to features.**

---

## ⚡ Your Workflow

For every task:

1. **PICK** → Next unchecked item from checklist
2. **TEST** → Write tests first (TDD)
3. **CODE** → Write minimal code to pass tests
4. **VERIFY** → Run `npm run test:unit` - all must pass
5. **UPDATE** → Mark `[✅]` in checklist with test count
6. **COMMIT** → `git commit` with clear message
7. **REPEAT** → Don't stop, move to next task

---

## 📖 Documentation

| File | Purpose |
|------|---------|
| `INSTRUCTIONS_FOR_CODEX.md` | **READ THIS FIRST** - Your detailed execution instructions |
| `HANDOVER_GUIDE_FOR_CODEX.md` | Background on what's been done |
| `PROGRESS_TEMPLATE.md` | Template for your progress reports |
| `advisorhub-v2-master-checklist.md` | **YOUR ROADMAP** - Follow this |
| `advisorhub-v2-implementation-plan.md` | Reference for implementation details |

---

## 🧪 Testing

**Run tests:**
```bash
npm run test:unit          # Unit tests
npm run test:e2e           # E2E tests
npm run test:unit -- --watch  # Watch mode
```

**Current status:**
- ✅ 76 component tests passing (100%)
- ⚠️ 18 tests failing (need fixing)
- ✅ Total: 251/269 tests passing

---

## 📁 Where to Work

**Components:**
```
src/admin/modules/customers/components/   ← Add new components here
src/admin/components/ui/                  ← UI components (buttons, selects, etc.)
```

**Tests:**
```
tests/frontend/                           ← Frontend tests
tests/backend/                            ← Backend tests
src/tests/components/                     ← Component tests
```

**Migrations:**
```
supabase/migrations/                      ← Database migrations
```

**i18n:**
```
src/lib/i18n/locales/                     ← Translation files
```

---

## ✅ Rules

**DO:**
- ✅ Follow TDD (tests first, then code)
- ✅ Update checklist after each task
- ✅ Commit after each completed task
- ✅ Fix failing tests before adding new features
- ✅ Work autonomously through the checklist
- ✅ Skip environment blockers (Docker, credentials, services)

**DON'T:**
- ❌ Ask "what should I do next?"
- ❌ Ask "should I continue?"
- ❌ Wait for permission to proceed
- ❌ Skip updating documentation
- ❌ Add new features while tests are failing
- ❌ Get blocked by Docker/infrastructure issues

---

## 🚫 Environment Blockers - SKIP THESE

**If you hit any of these, SKIP and move on:**
- Docker not running → Skip local DB testing
- Missing credentials → Use mocks
- Services down → Continue with unit tests
- Network issues → Mock external APIs
- CI/CD failures → Run tests locally

**Rule:** If unit tests pass, the code is correct. Environment issues are ops problems, not dev problems.

**See:** `INSTRUCTIONS_FOR_CODEX.md` - "Pragmatic Rule: Environment Blockers" section for details

---

## 📊 Report Your Progress

At the end of each work session, use the template in `PROGRESS_TEMPLATE.md` to report:

- What you completed
- Test counts
- Commit hashes
- Updated metrics
- Next 3 tasks

This helps everyone track progress and keeps the project on course.

---

## 🚀 Getting Started

**Step 1:** Read `INSTRUCTIONS_FOR_CODEX.md`

**Step 2:** Fix the 7 BLOCKING failing tests (detailed in instructions)

**Step 3:** Document the 11 non-blocking tests in "Known Issues"

**Step 4:** Continue with remaining base components

**Step 5:** Complete remaining database migrations

**Step 6:** Move to Phase 2 (Entity Customers & Servicing)

---

## 💡 Need Help?

**For code patterns:** Look at completed components
- `EntityCustomerForm.jsx` (form example)
- `CompanyDetailsCard.jsx` (display component example)
- `EmployeeListUpload.jsx` (file upload example)

**For test patterns:** Look at test files
- `src/tests/components/*.test.jsx` (component tests)
- `tests/frontend/*.test.ts` (frontend tests)

**For TDD workflow:** See `HANDOVER_GUIDE_FOR_CODEX.md` - "How to Continue Development"

**Reference docs:**
- `advisorhub-v2-implementation-plan.md` has detailed test cases for every feature
- `CLAUDE.md` has project conventions and architecture

---

## 🎯 Success Criteria

You're doing great when:
- ✅ All tests passing (100% pass rate)
- ✅ Checklist items updated with `[✅]` and test counts
- ✅ Code committed with clear messages
- ✅ No questions about "what to do next"
- ✅ Steady progress through the plan

---

## 📞 Final Reminder

**The planning is done. The roadmap is clear. Just execute.**

Start with:
1. Read `INSTRUCTIONS_FOR_CODEX.md`
2. Fix failing tests
3. Build remaining components
4. Update checklist as you go

**You got this!** 🚀

---

**Current Phase:** Phase 1 - Foundation (60% complete)

**Your Goal:** Get Phase 1 to 100% completion

**Start Point:** Fix 7 BLOCKING tests (not all 18 - be pragmatic!)

**Target:** 96% pass rate (258 passing / 11 failing)

**Remember:** Don't waste time on AI/ML optimization tests. Focus on features!

**GO!**
