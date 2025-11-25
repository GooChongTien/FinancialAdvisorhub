# Entity Lead Validation Update

**Date:** 2025-11-23
**Change:** Simplified required fields for entity lead creation

## What Changed

### Before
Entity leads required **5 mandatory fields:**
1. ✓ Company Name
2. ✓ Business Registration Number
3. ✓ Industry
4. ✓ Contact Person Name
5. ✓ Contact Number

### After (Current)
Entity leads require only **3 mandatory fields:**
1. ✓ Company Name
2. ✓ Contact Person Name (Keyman)
3. ✓ Contact Number

**All other fields are now optional** (but validated if provided)

## Rationale

This change makes it easier to quickly capture entity leads in the system, allowing advisors to add minimal information upfront and fill in additional details later during the sales process.

## Field Status Summary

| Field | Status | Validation |
|-------|--------|------------|
| Company Name | **Required** | Min 3 characters |
| Contact Person Name | **Required** | Any text |
| Contact Number | **Required** | Min 8 digits |
| Business Registration No. | Optional | 4-15 alphanumeric (if provided) |
| Industry | Optional | Any text |
| Email | Optional | Valid email format (if provided) |
| Number of Employees | Optional | Positive integer (if provided) |
| Annual Revenue | Optional | Positive number (if provided) |

## Visual Changes

### Form Labels Updated
- **Business Registration No.** - Now shows `(Optional)` instead of `*`
- **Industry** - Now shows `(Optional)` instead of `*`

### Validation Behavior
- ✅ Business registration number only shows error if **provided in invalid format**
- ✅ Industry has **no validation** (accepts any text)
- ✅ Required fields still show validation errors when empty

## Example Use Cases

### Quick Lead Capture (Minimal)
```javascript
{
  customer_type: "Entity",
  company_name: "ABC Corp",
  name: "John Tan",
  contact_number: "91234567"
}
```
✅ **Valid** - Ready to save

### Lead with Partial Info
```javascript
{
  customer_type: "Entity",
  company_name: "XYZ Industries",
  industry: "Manufacturing",  // Optional but provided
  name: "Sarah Lee",
  contact_number: "98765432",
  email: "sarah@xyz.com"  // Optional but provided
}
```
✅ **Valid** - Optional fields enhance the record

### Complete Lead
```javascript
{
  customer_type: "Entity",
  company_name: "TechCorp Pte Ltd",
  business_registration_no: "202300001A",
  industry: "Technology",
  num_employees: 50,
  annual_revenue: 5000000,
  name: "David Wong",
  contact_number: "91112222",
  email: "david@techcorp.com"
}
```
✅ **Valid** - All information captured

## Error Scenarios

### Invalid: Missing Required Fields
```javascript
{
  customer_type: "Entity",
  company_name: "AB",  // Too short
  name: "",  // Missing
  contact_number: "123"  // Too short
}
```
**Errors:**
- "Company name must be at least 3 characters"
- "Contact person name is required"
- "Enter a valid contact number with at least 8 digits"

### Invalid: Bad Format in Optional Field
```javascript
{
  customer_type: "Entity",
  company_name: "Valid Corp",
  business_registration_no: "12",  // Invalid format
  name: "John Doe",
  contact_number: "91234567"
}
```
**Errors:**
- "Invalid format (4-15 alphanumeric characters)"

Note: If business_registration_no is left empty, no error is shown.

## Impact Analysis

### ✅ Benefits
1. **Faster lead entry** - Fewer required fields means quicker data capture
2. **Better user experience** - Less friction during busy prospecting periods
3. **Flexible workflow** - Advisors can add details progressively as they learn more about the company
4. **No data loss** - All fields still available for complete information when needed

### ✅ No Breaking Changes
- Existing individual lead flow unchanged
- All form fields remain in place
- Validation still ensures data quality for provided fields
- Backend database schema unchanged

### ✅ Testing Status
- **126 component tests passing**
- Form validation tested for all scenarios
- No regressions detected

## Files Modified

1. **src/admin/modules/customers/components/NewLeadDialog.jsx**
   - Updated validation function (lines 42-58)
   - Updated form labels to show "(Optional)"
   - Updated submit handler to only mark required fields

2. **docs/ADD_LEAD_ENTITY_SUPPORT.md** - Updated validation documentation
3. **docs/ADD_LEAD_FORM_CHANGES.md** - Updated examples and validation tables

## User Instructions

### For Advisors
When adding a new entity lead:
1. Select "Entity (Company)" as customer type
2. Fill in the **3 required fields**:
   - Company Name (at least 3 characters)
   - Contact Person Name
   - Contact Number (at least 8 digits)
3. Optionally fill in:
   - Business Registration No. (if known)
   - Industry
   - Number of Employees
   - Annual Revenue
   - Email
4. Save the lead

The system will accept the lead with just the 3 required fields, allowing you to add more information later.

## Backward Compatibility

✅ **100% Backward Compatible**
- Existing leads with all fields filled remain valid
- New minimal leads are also valid
- All validation rules for optional fields still apply when data is provided
- No database migration required

## Future Considerations

Potential enhancements:
1. **Progressive disclosure** - Show optional fields on request ("Add more details...")
2. **Required field indicators** - Visual hints during data entry
3. **Validation levels** - "Minimal", "Standard", "Complete" lead quality indicators
4. **Auto-enrichment** - Fetch company data from registry using business registration number
