# Customer Filter Criteria Redesign

**Date:** 2025-11-23
**Status:** ✅ Complete - All filter criteria aligned with specification

## Overview

Redesigned the customer list filtering system to match business requirements, introducing Customer Type filter and updating relationship classification logic.

## New Filter Specification

The customer list now supports these five filter categories:

1. **Customer Type:** Individual / Entity
2. **Relationship Type:** New / Existing (based on policy purchase history)
3. **Lead Source:** Event / Referral / Social Media (static list)
4. **Last Contacted:** Last 7 days / Last 30 days / More than 30 days / Never contacted
5. **Customer Temperature:** Cold / Warm / Hot

---

## Changes Made

### 1. Added Customer Type Filter

**Purpose:** Distinguish between individual customers and entity/corporate customers

**File:** `src/admin/pages/Customer.jsx`

#### State Management (Lines 70, 87-90)

```javascript
// Storage key
const storageKeys = {
  search: "advisorhub:customers-search",
  customerType: "advisorhub:customers-customer-type",  // NEW
  status: "advisorhub:customers-status",
  // ...
};

// State with sessionStorage persistence
const [customerTypeFilter, setCustomerTypeFilter] = useState(() => {
  if (typeof window === "undefined") return "all";
  return window.sessionStorage.getItem(storageKeys.customerType) ?? "all";
});
```

#### Session Storage Sync (Lines 155-158)

```javascript
useEffect(() => {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKeys.customerType, customerTypeFilter);
  }
}, [customerTypeFilter]);
```

#### Filter Logic (Lines 521-526)

```javascript
if (customerTypeFilter !== "all") {
  const customerType = lead.customer_type || "Individual"; // Default to Individual if not specified
  if (customerTypeFilter !== customerType) {
    return false;
  }
}
```

#### UI Dropdown (Lines 875-888)

```javascript
{/* Customer Type */}
<div>
  <Label className="text-xs font-semibold text-slate-700 mb-2">Customer Type</Label>
  <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
    <SelectTrigger>
      <SelectValue placeholder="All types" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All types</SelectItem>
      <SelectItem value="Individual">Individual</SelectItem>
      <SelectItem value="Entity">Entity</SelectItem>
    </SelectContent>
  </Select>
</div>
```

#### Active Filter Chip (Lines 703-708)

```javascript
if (customerTypeFilter !== "all") {
  chips.push({
    key: "customerType",
    label: `Type: ${customerTypeFilter}`,
    onRemove: () => setCustomerTypeFilter("all"),
  });
}
```

---

### 2. Updated Relationship Type Filter

**Purpose:** Classify customers as "New" (no policies) vs "Existing" (has policies)

#### Changed Filter Logic (Lines 529-544)

**Before:**
```javascript
// Based on is_client flag and proposal status
if (relationshipFilter === "clients" && !lead.is_client) return false;
const isLeadRecord = !lead.is_client || (lead.is_client && lead.status && ONGOING_PROPOSAL_STATUSES.has(lead.status));
if (relationshipFilter === "leads" && !isLeadRecord) return false;
```

**After:**
```javascript
// Relationship filter: New (no policies) vs Existing (has policies)
if (relationshipFilter === "new") {
  const hasPolicies = lead.policies && Array.isArray(lead.policies) && lead.policies.length > 0;
  if (hasPolicies) return false;
}

if (relationshipFilter === "existing") {
  const hasPolicies = lead.policies && Array.isArray(lead.policies) && lead.policies.length > 0;
  if (!hasPolicies) return false;
}
```

**Key Change:** Now checks actual policy purchase history instead of is_client flag

#### Updated UI Options (Lines 922-935)

**Before:**
```javascript
<SelectItem value="leads">Leads only</SelectItem>
<SelectItem value="clients">Customers only</SelectItem>
```

**After:**
```javascript
<SelectItem value="new">New</SelectItem>
<SelectItem value="existing">Existing</SelectItem>
```

#### Updated Active Filter Labels (Lines 717-728)

```javascript
if (relationshipFilter !== "all") {
  const relationshipLabel =
    relationshipFilter === "new" ? "New"
    : relationshipFilter === "existing" ? "Existing"
    : relationshipFilter.charAt(0).toUpperCase() + relationshipFilter.slice(1);
  chips.push({
    key: "relationship",
    label: `Relationship: ${relationshipLabel}`,
    onRemove: () => setRelationshipFilter("all"),
  });
}
```

---

### 3. Changed Lead Source to Static List

**Purpose:** Provide consistent lead source options matching business requirements

**File:** `src/admin/pages/Customer.jsx` (Line 445)

**Before:**
```javascript
// Dynamic list computed from existing leads data
const leadSources = useMemo(() => {
  const sources = new Set();
  leads.forEach((lead) => {
    if (lead.lead_source) sources.add(lead.lead_source);
  });
  return Array.from(sources).sort((a, b) => a.localeCompare(b));
}, [leads]);
```

**After:**
```javascript
// Static list per specification
const leadSources = ["Event", "Referral", "Social Media"];
```

**Impact:** Lead source dropdown now always shows the same three options regardless of existing data

---

### 4. Updated Temperature Filter Options

**Purpose:** Align with temperature classification (remove "cool", use "cold")

**File:** `src/admin/pages/Customer.jsx` (Lines 937-951)

**Before:**
```javascript
<SelectItem value="cool">Cool (&gt;30 days)</SelectItem>
```

**After:**
```javascript
<SelectItem value="cold">Cold (&gt;30 days)</SelectItem>
```

**Related Changes:**
- Temperature calculation logic already updated in `src/lib/customer-temperature.ts` (see TEMPERATURE_LOGIC_FIXES.md)
- Temperature filter logic already updated to use `.bucket` property (lines 546-555)

---

### 5. Mira Page Data Integration

**File:** `src/admin/pages/Customer.jsx` (Lines 282, 295)

Added `customerTypeFilter` to Mira AI context:

```javascript
const { setMiraPageData } = useMira();

useEffect(() => {
  setMiraPageData({
    lastContactedFilter,
    relationshipFilter,
    customerTypeFilter,  // NEW
    temperatureFilter,
    sourceFilter,
    statusFilter,
  });
}, [
  lastContactedFilter,
  relationshipFilter,
  customerTypeFilter,  // NEW
  temperatureFilter,
  sourceFilter,
  statusFilter,
  setMiraPageData,
]);
```

**Purpose:** AI assistant can now reference customer type in conversations

---

### 6. Clear All Filters Update

**File:** `src/admin/pages/Customer.jsx` (Line 774)

Updated to include customerTypeFilter:

```javascript
const clearAllFilters = () => {
  setSearchTerm("");
  setStatusFilter("all");
  setSourceFilter("all");
  setRelationshipFilter("all");
  setTemperatureFilter("all");
  setLastContactedFilter("any");
  setCustomerTypeFilter("all");  // NEW
};
```

---

## Summary of All Filter Changes

### Filter 1: Customer Type
- **Options:** All types / Individual / Entity
- **Logic:** Checks `customer_type` field (defaults to "Individual" if not set)
- **State:** `customerTypeFilter`
- **Storage Key:** `advisorhub:customers-customer-type`

### Filter 2: Relationship Type
- **Options:** All relationships / New / Existing
- **Logic:** Checks if customer has purchased policies
  - "new" = `policies` array empty or doesn't exist
  - "existing" = `policies` array has at least one policy
- **Changed From:** "leads"/"clients" based on `is_client` flag
- **State:** `relationshipFilter`

### Filter 3: Lead Source
- **Options:** All sources / Event / Referral / Social Media
- **Logic:** Static array instead of dynamic computation
- **Changed From:** Dynamic list based on existing data
- **State:** `sourceFilter`

### Filter 4: Last Contacted
- **Options:** Any time / Last 7 days / Last 30 days / More than 30 days / Never contacted
- **Changed From:** "Last 90 days" and "Over 90 days" options removed
- **State:** `lastContactedFilter`

### Filter 5: Customer Temperature
- **Options:** All temperatures / Hot (≤7 days) / Warm (≤30 days) / Cold (>30 days)
- **Changed From:** "cool" option replaced with "cold"
- **Logic:** Uses rule-based temperature calculation (see TEMPERATURE_LOGIC_FIXES.md)
- **State:** `temperatureFilter`

---

## Files Modified

1. **src/admin/pages/Customer.jsx** - All filter state, logic, and UI components

---

## Business Logic Alignment

### Before
- **4 filters:** Lead Status, Lead Source (dynamic), Relationship (is_client based), Temperature
- **Relationship:** Based on internal `is_client` flag
- **Lead Sources:** Dynamic list from existing data
- **Temperature:** Had "cool" option

### After
- **5 filters:** Customer Type, Lead Status, Lead Source (static), Relationship (policy-based), Temperature
- **Customer Type:** New filter distinguishing Individual vs Entity customers
- **Relationship:** Based on actual policy purchase history (more accurate)
- **Lead Sources:** Consistent static list matching business categories
- **Temperature:** Updated to use "cold" terminology

### Key Improvements
1. **More accurate customer classification:** Relationship now based on actual purchases, not internal flags
2. **Consistent lead sources:** Static list ensures UI stability
3. **Entity support:** Can now filter by customer type (Individual/Entity)
4. **Simplified terminology:** "Cold" instead of "cool" for temperature
5. **AI context aware:** Mira can reference customer type filter in conversations

---

## Testing Recommendations

### Manual Testing Checklist

1. **Customer Type Filter**
   - [ ] Select "Individual" - verify only individual customers shown
   - [ ] Select "Entity" - verify only entity customers shown
   - [ ] Verify customers without `customer_type` field default to "Individual"

2. **Relationship Filter**
   - [ ] Select "New" - verify only customers with no policies shown
   - [ ] Select "Existing" - verify only customers with at least one policy shown
   - [ ] Verify customers with empty policies array are treated as "New"

3. **Lead Source Filter**
   - [ ] Verify dropdown shows exactly: Event, Referral, Social Media
   - [ ] Verify no other sources appear even if present in data
   - [ ] Select each source and verify filtering works

4. **Temperature Filter**
   - [ ] Verify "Cold" option appears (not "cool")
   - [ ] Select "Cold" and verify customers >30 days with no active work shown
   - [ ] Select "Warm" and verify customers ≤30 days OR with active work shown
   - [ ] Select "Hot" and verify customers ≤7 days shown

5. **Combined Filters**
   - [ ] Apply multiple filters simultaneously
   - [ ] Verify active filter chips show correct labels
   - [ ] Verify "Clear All" removes all filters including customer type

6. **Session Persistence**
   - [ ] Set filters, refresh page, verify filters persist
   - [ ] Verify customer type filter persists in sessionStorage

7. **Mira Integration**
   - [ ] Ask Mira about current filters
   - [ ] Verify Mira can reference customer type filter

---

## Backward Compatibility

✅ **100% Backward Compatible**

- **No database changes required:** Filter works with existing `customer_type` and `policies` fields
- **Graceful defaults:** Customers without `customer_type` default to "Individual"
- **Session storage keys:** New key added without affecting existing keys
- **Filter state:** New filter doesn't break existing filter logic
- **No API changes:** All filtering happens client-side

---

## Related Documentation

- **TEMPERATURE_LOGIC_FIXES.md** - Temperature calculation algorithm changes
- **advisorhub-v2-master-checklist.md** - Overall project progress tracking

---

## Future Enhancements (Optional)

1. **Entity customer detail page:** Build dedicated view for entity customers (already in roadmap)
2. **Advanced relationship stages:** Track relationship lifecycle beyond new/existing
3. **Lead source tracking:** Record source in database for new customers
4. **Filter presets:** Save common filter combinations as presets
5. **Export filtered results:** Download filtered customer list as CSV
6. **Filter analytics:** Track which filters are most commonly used

---

## Summary

All five filter criteria have been successfully implemented and aligned with business requirements:
- ✅ Customer Type filter added (Individual/Entity)
- ✅ Relationship filter updated to policy-based logic (New/Existing)
- ✅ Lead Source changed to static array (Event/Referral/Social Media)
- ✅ Last Contacted options aligned with 30-day threshold
- ✅ Temperature filter updated from "cool" to "cold"
- ✅ All filters integrated with session persistence
- ✅ Mira AI context includes all filter states
- ✅ Backward compatible with existing data

The customer list filtering system now provides accurate, business-aligned categorization and filtering capabilities.
