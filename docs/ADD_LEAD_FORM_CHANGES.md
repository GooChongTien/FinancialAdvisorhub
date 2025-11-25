# Add New Lead Form - Before & After

## Visual Comparison

### BEFORE (Individual Only)
```
┌─────────────────────────────────────┐
│  👤 Add New Lead                    │
├─────────────────────────────────────┤
│                                     │
│  Name *                             │
│  [Enter full name____________]      │
│                                     │
│  Contact Number *                   │
│  [+65 1234 5678___________]        │
│                                     │
│  Email (Optional)                   │
│  [email@example.com_______]        │
│                                     │
│  Lead Source                        │
│  [Referral ▼]                      │
│                                     │
│  [Save & Close]                     │
│  [📅 Save & Schedule Appointment]   │
└─────────────────────────────────────┘
```

### AFTER (Individual + Entity Support)
```
┌───────────────────────────────────────────────────────┐
│  👤 Add New Lead                                      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Customer Type *                                      │
│  ┌──────────────┬──────────────────┐                │
│  │ Individual ✓ │ Entity (Company) │                │
│  └──────────────┴──────────────────┘                │
│                                                       │
│  ┌─ When "Entity" is selected ──────────────────┐   │
│  │                                               │   │
│  │  Company Name *                               │   │
│  │  [Enter company name________________]         │   │
│  │                                               │   │
│  │  Business Registration No. *                  │   │
│  │  [e.g., 202300001A_______________]           │   │
│  │                                               │   │
│  │  Industry *                                   │   │
│  │  [e.g., Technology, Finance_____]            │   │
│  │                                               │   │
│  │  ┌──────────────────┬──────────────────┐     │   │
│  │  │ Num of Employees │ Annual Revenue   │     │   │
│  │  │ [50_________]   │ [5000000____]   │     │   │
│  │  └──────────────────┴──────────────────┘     │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
│  Contact Person Name * (or "Name" for Individual)    │
│  [Enter contact person name_____________]             │
│                                                       │
│  Contact Number *                                     │
│  [+65 1234 5678______________________]               │
│                                                       │
│  Email (Optional)                                     │
│  [email@example.com_________________]                │
│                                                       │
│  Lead Source                                          │
│  [Referral ▼]                                        │
│                                                       │
│  [Save & Close]                                       │
│  [📅 Save & Schedule Appointment]                     │
└───────────────────────────────────────────────────────┘
```

## Key Changes Summary

### 1. Customer Type Selector (NEW)
- **Position:** First field in the form
- **Default:** Individual
- **Options:** Individual | Entity (Company)
- **Behavior:** Dynamically shows/hides entity fields

### 2. Entity Fields Section (CONDITIONAL)
**Appears only when "Entity" is selected:**

| Field | Required | Validation | Example |
|-------|----------|------------|---------|
| Company Name | ✓ | Min 3 chars | TechCorp Pte Ltd |
| Business Reg No. | - | 4-15 alphanumeric (if provided) | 202300001A |
| Industry | - | Any text | Technology |
| Num of Employees | - | Positive integer | 50 |
| Annual Revenue | - | Positive number | 5000000 |

**Note:** Only **Company Name**, **Contact Person Name**, and **Contact Number** are mandatory for entity leads.

### 3. Contextual Labels
- **"Name" field** → **"Contact Person Name"** (when Entity)
- Placeholder updates based on customer type

### 4. Dialog Size
- Width: `sm:max-w-md` → `sm:max-w-2xl` (wider for entity fields)
- Added scrolling for smaller screens

## Example Scenarios

### Scenario 1: Individual Lead (Existing Flow - Unchanged)
1. Open dialog → "Individual" already selected
2. Fill: Name, Contact Number, Email
3. Select Lead Source
4. Save

**Data Submitted:**
```json
{
  "customer_type": "Individual",
  "name": "John Tan",
  "contact_number": "91234567",
  "email": "john@example.com",
  "lead_source": "Referral",
  "status": "Not Initiated",
  "last_contacted": "2025-11-23T14:30:00Z"
}
```

### Scenario 2: Entity Lead (New Flow)
1. Open dialog
2. Change Customer Type to "Entity (Company)"
3. Fill entity section:
   - Company Name: "TechCorp Pte Ltd"
   - Business Reg: "202300001A"
   - Industry: "Technology"
   - Employees: 50
   - Revenue: 5000000
4. Fill contact person:
   - Name: "Sarah Lee"
   - Contact: "98765432"
   - Email: "sarah@techcorp.com"
5. Select Lead Source
6. Save

**Data Submitted:**
```json
{
  "customer_type": "Entity",
  "company_name": "TechCorp Pte Ltd",
  "business_registration_no": "202300001A",
  "industry": "Technology",
  "num_employees": 50,
  "annual_revenue": 5000000,
  "name": "Sarah Lee",
  "contact_number": "98765432",
  "email": "sarah@techcorp.com",
  "lead_source": "Referral",
  "status": "Not Initiated",
  "last_contacted": "2025-11-23T14:30:00Z"
}
```

## Mira AI Integration

### Before
```
User: "Add new lead John at 91234567"
Mira: [Prefills] name="John", contact_number="91234567"
```

### After (Enhanced)
```
User: "Add new entity lead TechCorp, reg 202300001A, industry Tech, contact Sarah 91234567"
Mira: [Prefills]
  customer_type="Entity"
  company_name="TechCorp"
  business_registration_no="202300001A"
  industry="Tech"
  name="Sarah"
  contact_number="91234567"
```

## Validation Behavior

### Individual Lead Validation
| Field | Validation |
|-------|------------|
| Name | Required |
| Contact Number | Required, min 8 digits |
| Email | Optional, valid format if provided |

### Entity Lead Validation (Additional)
| Field | Validation |
|-------|------------|
| Company Name | Required, min 3 chars |
| Business Reg No. | Optional, 4-15 alphanumeric if provided |
| Industry | Optional |
| Contact Person Name | Required |
| Num of Employees | Optional, positive integer if provided |
| Annual Revenue | Optional, positive number if provided |

**Key Point:** Only 3 fields are mandatory for entity leads:
1. Company Name
2. Contact Person Name
3. Contact Number

## Error Messages

### Invalid Entity Lead Example
```
┌───────────────────────────────────────┐
│  Company Name *                       │
│  [AB________________________]         │
│  ⚠️ Company name must be at least    │
│     3 characters                      │
│                                       │
│  Business Registration No. (Optional) │
│  [123_______________________]         │
│  ⚠️ Invalid format (4-15              │
│     alphanumeric characters)          │
│                                       │
│  Contact Person Name *                │
│  [_________________________]          │
│  ⚠️ Contact person name is required  │
│                                       │
│  Contact Number *                     │
│  [12345_____________________]         │
│  ⚠️ Enter a valid contact number     │
│     with at least 8 digits            │
└───────────────────────────────────────┘
```

**Note:** Business registration number only shows error if provided in invalid format. Industry has no validation.

## Testing Checklist

- ✅ Individual lead creation (existing flow)
- ✅ Entity lead creation with all fields
- ✅ Customer type switching (fields show/hide)
- ✅ Validation for individual leads
- ✅ Validation for entity leads
- ✅ Required field errors display
- ✅ Format validation (reg no, email, phone)
- ✅ Numeric field validation (employees, revenue)
- ✅ Form reset on close
- ✅ Mira prefill for both types
- ✅ All existing tests pass (171/171)

## Deployment Notes

### Database Requirements
Ensure `leads` table has these columns:
- `customer_type` VARCHAR
- `company_name` VARCHAR
- `business_registration_no` VARCHAR
- `industry` VARCHAR
- `num_employees` INTEGER
- `annual_revenue` DECIMAL

### Backend API
Update lead creation endpoint to accept:
- All new entity fields
- `customer_type` enum/varchar

### Migration Impact
✅ **No breaking changes** - Existing individual lead flow unchanged
