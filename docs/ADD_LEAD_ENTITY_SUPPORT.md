# Add Lead Form: Entity Customer Support

**Date:** 2025-11-23
**Feature:** Enhanced "Add New Lead" form to support both Individual and Entity customers

## Overview

The "Add New Lead" dialog now allows users to choose between creating an Individual or Entity (Company) lead, with appropriate fields and validation for each type.

## Changes Made

### File Modified
`src/admin/modules/customers/components/NewLeadDialog.jsx`

### UI Enhancements

#### 1. Customer Type Selector
- **Location:** First field in the form
- **Options:**
  - Individual (default)
  - Entity (Company)
- **Behavior:** Dynamically shows/hides fields based on selection

#### 2. Entity-Specific Fields (shown only when Entity is selected)

**Required Fields:**
- **Company Name** - Minimum 3 characters
- **Business Registration No.** - 4-15 alphanumeric characters (e.g., 202300001A)
- **Industry** - Text input (e.g., Technology, Finance, Healthcare)

**Optional Fields:**
- **Number of Employees** - Positive integer
- **Annual Revenue** - Positive number with decimal support

#### 3. Contextual Labels
- **Name field:**
  - Individual: "Name"
  - Entity: "Contact Person Name"
- **Placeholder text updates** based on customer type

### Validation Rules

#### Individual Customer
- ✓ Name is required
- ✓ Contact number is required (min 8 digits)
- ✓ Email is optional but must be valid format if provided

#### Entity Customer
**Required fields:**
- ✓ Company name (min 3 characters)
- ✓ Contact person name
- ✓ Contact number (min 8 digits)

**Optional fields with validation:**
- ✓ Business registration number - 4-15 alphanumeric format (if provided)
- ✓ Industry - any text
- ✓ Email - valid format (if provided)
- ✓ Number of employees - positive integer (if provided)
- ✓ Annual revenue - positive number (if provided)

### Form Data Structure

```javascript
{
  customer_type: "Individual" | "Entity",

  // Common fields
  name: string,
  contact_number: string,
  email: string,
  lead_source: string,

  // Entity-specific fields
  company_name: string,
  business_registration_no: string,
  industry: string,
  num_employees: number | null,
  annual_revenue: number | null,

  // Auto-populated
  status: "Not Initiated",
  last_contacted: ISO timestamp
}
```

### Mira Prefill Support

The form now supports prefilling all entity-specific fields through Mira's AI assistant:

**Supported prefill fields:**
```javascript
[
  "customer_type",
  "name",
  "contact_number",
  "email",
  "lead_source",
  "company_name",
  "business_registration_no",
  "industry",
  "num_employees",
  "annual_revenue"
]
```

**Example Mira command:**
> "Add new entity lead TechCorp, registration 202300001A, industry Technology, contact person John Doe at 91234567"

## User Experience

### Adding an Individual Lead (Existing Flow)
1. Open "Add New Lead" dialog
2. "Individual" is selected by default
3. Fill in Name, Contact Number, Email (optional)
4. Select Lead Source
5. Save & Close or Save & Schedule Appointment

### Adding an Entity Lead (New Flow)
1. Open "Add New Lead" dialog
2. Change Customer Type to "Entity (Company)"
3. **Entity section appears** with required fields:
   - Company Name
   - Business Registration No.
   - Industry
4. Optionally fill:
   - Number of Employees
   - Annual Revenue
5. Fill Contact Person details (Name, Contact Number, Email)
6. Select Lead Source
7. Save & Close or Save & Schedule Appointment

## Visual Changes

### Dialog Size
- Increased from `sm:max-w-md` to `sm:max-w-2xl` to accommodate additional fields
- Added `max-h-[90vh] overflow-y-auto` for scrolling on smaller screens

### Field Layout
- Entity fields use a 2-column grid for Employee count and Revenue
- All other fields remain full-width
- Consistent spacing with `space-y-4` and `space-y-2`

### Error Display
- Inline error messages below each field
- Red border highlighting on invalid fields
- Consistent error text styling (`text-sm text-red-600`)

## Validation Examples

### Valid Entity Lead
```javascript
{
  customer_type: "Entity",
  company_name: "TechCorp Pte Ltd",
  business_registration_no: "202300001A",
  industry: "Technology",
  name: "John Doe",
  contact_number: "91234567",
  email: "john@techcorp.com",
  lead_source: "Referral",
  num_employees: "50",
  annual_revenue: "5000000"
}
```

### Invalid Entity Lead (Missing Required Fields)
```javascript
{
  customer_type: "Entity",
  company_name: "AB", // Too short (min 3 chars)
  business_registration_no: "123", // Invalid format (only if provided)
  name: "",
  contact_number: "12345", // Too short (min 8 digits)
}
```
**Errors shown:**
- "Company name must be at least 3 characters"
- "Invalid format (4-15 alphanumeric characters)" (only if reg no. is provided)
- "Contact person name is required"
- "Enter a valid contact number with at least 8 digits"

**Valid Minimal Entity Lead:**
```javascript
{
  customer_type: "Entity",
  company_name: "TechCorp Pte Ltd",
  name: "John Doe",
  contact_number: "91234567"
}
```
All other fields are optional.

## Backend Compatibility

### API Expectations
The form submits data with `customer_type` field set to either "Individual" or "Entity".

**Numeric field handling:**
- `num_employees`: Converted to integer (or null if empty)
- `annual_revenue`: Converted to float (or null if empty)

### Database Schema
Assumes the backend `leads` table supports:
- `customer_type` column (varchar/enum)
- `company_name` column (varchar)
- `business_registration_no` column (varchar)
- `industry` column (varchar)
- `num_employees` column (integer)
- `annual_revenue` column (decimal/numeric)

## Testing Recommendations

### Manual Testing
1. ✅ Individual lead creation (existing flow)
2. ✅ Entity lead creation with all required fields
3. ✅ Entity lead creation with optional fields
4. ✅ Validation errors for missing required fields
5. ✅ Validation errors for invalid formats
6. ✅ Customer type switching (fields show/hide correctly)
7. ✅ Mira prefill for entity leads
8. ✅ Form reset on close/cancel

### Automated Testing
Consider adding tests for:
- Entity lead validation rules
- Field visibility based on customer type
- Numeric field conversion
- Mira prefill with entity fields

## Backwards Compatibility

✅ **Fully backwards compatible**
- Individual lead creation works exactly as before
- Default customer type is "Individual"
- Existing code expecting individual leads will continue to work
- Entity fields are optional at the database level (can be NULL)

## Future Enhancements

Potential improvements:
1. **Industry dropdown** - Predefined list of industries
2. **Keyman details** - Separate section for key person in entity
3. **Employee roster upload** - Link to bulk employee upload
4. **Revenue currency** - Multi-currency support
5. **Company search** - Auto-complete from existing companies
6. **Validation against registry** - Real-time business registration number validation

## Summary

This enhancement seamlessly integrates entity customer support into the existing lead creation workflow, providing a unified interface for advisors to add both individual and company leads with appropriate validation and data capture for each type.
