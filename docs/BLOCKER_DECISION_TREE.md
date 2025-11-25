# Blocker Decision Tree - Quick Reference

**Use this to decide: Should I fix this or skip it?**

---

## ⚡ 5-Second Decision

```
┌─────────────────────────────────────┐
│  Is this blocking a user feature?  │
└─────────────────────────────────────┘
            ↓
    ┌───────┴───────┐
    ↓               ↓
   YES              NO
    │               │
    ↓               ↓
  FIX IT       Can unit tests
  NOW!         validate it?
                    │
            ┌───────┴───────┐
            ↓               ↓
           YES              NO
            │               │
            ↓               ↓
        SKIP IT!      Document &
        Move on       Ask for help
```

---

## 🔴 MUST FIX (Blocking Users)

| Issue | Why Fix | Example |
|-------|---------|---------|
| Navigation broken | Users can't move between pages | Routes return 404 |
| Form submission fails | Users can't save data | Validation error |
| Data not displaying | Users can't see their info | API error |
| Auth broken | Users can't log in | Token expired |
| Critical business logic | Feature doesn't work | Calculations wrong |

**Action:** Stop everything, fix immediately.

---

## 🟢 CAN SKIP (Environment Issues)

| Issue | Why Skip | Example |
|-------|----------|---------|
| Docker not running | Unit tests validate code | `docker: not found` |
| Missing credentials | Mocks work fine | `API_KEY undefined` |
| Service unavailable | Not a code problem | Database connection refused |
| CI/CD failing | Pipeline issue, not code | Staging down |
| External API down | Network issue | API timeout |

**Action:** Document, skip, move to next task.

---

## 🟡 DEPENDS (Use Judgment)

| Issue | Fix If... | Skip If... |
|-------|-----------|------------|
| Test failing | Blocks feature functionality | AI optimization, edge case |
| Performance slow | <2s page load not met | Premature optimization |
| Missing types | Causes runtime errors | Nice-to-have TypeScript |
| Lint errors | Blocks commit | Stylistic preference |
| Warning messages | Indicates real bug | Console noise only |

**Action:** Use the decision tree below.

---

## 🌳 Detailed Decision Tree

```
┌─ Encountered Blocker ─┐
│                        │
└────────┬───────────────┘
         ↓
    Is it related to:
         ↓
    ┌────┴─────┐
    ↓          ↓
Environment   Code
(Docker,     (Bug,
services,    logic,
network)     feature)
    ↓          ↓
    │          ↓
    │     Does it break
    │     user functionality?
    │          ↓
    │     ┌────┴────┐
    │     ↓         ↓
    │    YES        NO
    │     ↓         ↓
    │   FIX IT   Is it tested?
    │   NOW!        ↓
    │          ┌────┴────┐
    │          ↓         ↓
    │         YES        NO
    ↓          ↓         ↓
Unit tests  SKIP     Document
validate?      ↓         ↓
    ↓      Move on   Ask for
┌───┴───┐            help
↓       ↓
YES     NO
↓       ↓
SKIP  Document
↓     & ask
Move on
```

---

## 📋 Examples

### Example 1: Docker Not Running ✅ SKIP

**Blocker:** `npx supabase start` fails - Docker not installed
**Type:** Environment
**Tests:** ✅ 460/460 unit tests passing
**Decision:** SKIP
**Action:** Mark migrations complete, proceed to components

**Why:** Unit tests already validate migrations are correct. Production will apply them.

---

### Example 2: Navigation Broken ❌ FIX

**Blocker:** `/advisor/customers` returns 404
**Type:** Code bug
**Impact:** Users can't access customer page
**Decision:** FIX IMMEDIATELY
**Action:** Debug routing, fix path, test, commit

**Why:** Blocks core user functionality.

---

### Example 3: AI Pattern Test Failing 🟡 DEPENDS → SKIP

**Blocker:** Pattern detector confidence score test fails
**Type:** Code (but non-critical)
**Impact:** None - core CRUD works fine
**Tests:** Core functionality passing
**Decision:** SKIP (defer to Phase 5)
**Action:** Document in "Known Issues", move to features

**Why:** AI optimization is Phase 5 work, doesn't block users now.

---

### Example 4: Form Validation Broken ❌ FIX

**Blocker:** Customer form accepts invalid email
**Type:** Code bug
**Impact:** Bad data enters database
**Decision:** FIX IMMEDIATELY
**Action:** Add validation, add test, fix, commit

**Why:** Data integrity issue blocks production.

---

## 🎯 Quick Cheat Sheet

| Symptom | Action |
|---------|--------|
| "Docker not found" | ✅ SKIP |
| "API_KEY missing" | ✅ SKIP |
| "Connection refused" | ✅ SKIP |
| "Route 404" | ❌ FIX |
| "Form submit error" | ❌ FIX |
| "Data not saving" | ❌ FIX |
| "AI confidence low" | ✅ SKIP (if core works) |
| "Staging down" | ✅ SKIP |
| "Lint warning" | 🟡 Fix if blocks commit |
| "TypeScript error" | ❌ FIX (if runtime error) |

---

## ✅ Documentation Template for Skips

When you skip a blocker, document it:

```markdown
## Skipped Blocker

**Task:** [What you were trying to do]
**Blocker:** [What blocked you]
**Type:** Environment / Non-critical
**Validation:** [How you know code is correct]
**Impact:** None - [why it doesn't block users]
**Next Steps:** [What ops/DevOps needs to do]
**Your Action:** [What you did instead]

Example:
**Task:** Apply Supabase migrations locally
**Blocker:** Docker Desktop not running
**Type:** Environment
**Validation:** Unit tests pass (460/460) - migrations syntactically correct
**Impact:** None - production deployment will apply migrations
**Next Steps:** DevOps to apply migrations in staging/prod
**Your Action:** Marked migrations as ✅, proceeded to Phase 2 components
```

---

## 🚀 Remember

**Your job:** Write features and tests
**Not your job:** DevOps, infrastructure, environment setup

**If unit tests pass, the code is good. Ship it!**

---

**Version:** 1.0
**Last Updated:** 2025-11-23
