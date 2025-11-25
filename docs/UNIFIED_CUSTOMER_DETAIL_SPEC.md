# Unified Customer Detail Page Specification

**Date:** 2025-11-23
**Status:** 📋 Specification - Ready for Implementation

## Overview

Redesign the customer detail page to handle both Individual and Entity customers in a unified interface with a frozen header, tabbed navigation, and comprehensive customer journey visualization.

## Route Changes

### Removed Routes
- ❌ `/advisor/entity-customers` - Remove EntityCustomers.jsx page
- ❌ `/advisor/entity-customers/detail` - Remove EntityCustomerDetail.jsx page

### Unified Route
- ✅ `/advisor/customers/detail?id={customerId}` - Handles both Individual and Entity customers

## Page Structure

### 1. Frozen Header (Sticky Top Bar)

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [<-] {Customer Name/Company Name}          [Relationship] [Temp]│
│      {X proposals | X requests | X policies}                    │
│ ┌──────────┬──────────┬──────────┬────────────────┐            │
│ │ Overview │ Portfolio│ Servicing│ Gap & Opportun.│            │
│ └──────────┴──────────┴──────────┴────────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

**Header Components:**

1. **Back Button** (left edge)
   - Icon: `<-` (Arrow Left)
   - Action: Navigate to `/advisor/customers`
   - Position: Near side menu edge

2. **Customer Name** (main title)
   - **Individual:** Display customer's full name (e.g., "Sarah Chen")
   - **Entity:** Display company name (e.g., "Acme Corporation Pte Ltd")
   - Style: Large, bold text

3. **Summary Counts** (below name)
   - Format: "X active proposal, X service request, X active policies"
   - Example: "1 active proposal, 0 service request, 2 active policies"
   - Style: Smaller, muted text

4. **Labels** (beside name, right side)
   - **Relationship Type Badge:**
     - "New" (blue) or "Existing" (green)
     - Logic: Based on policies count
   - **Customer Temperature Badge:**
     - "Hot" (red), "Warm" (orange), or "Cold" (blue/grey)

5. **Tabs** (bottom of header)
   - **Tab States:**
     - **If Relationship = "New":** Only "Overview" enabled
     - **If Relationship = "Existing":** All 4 tabs enabled
   - **Tab Behavior:**
     - Clickable tabs change active view
     - Mobile: Swipe left/right to switch tabs
     - Disabled tabs: Grey out, non-clickable

**Tabs:**
1. Overview (always enabled)
2. Portfolio (enabled if existing customer)
3. Servicing (enabled if existing customer)
4. Gap & Opportunity (enabled if existing customer + hidden for Entity)

---

## Tab Content (Scrollable Area)

### Tab 1: Overview

#### Section 1: Our Journey (Timeline Component)

**Purpose:** Visual narrative of advisor-customer relationship milestones

**Design:**
- Horizontal timeline with alternating milestone cards
- Timeline line runs through the middle
- Prezi-style focus: Click milestone to center and zoom
- Drag-to-pan and wheel zoom enabled
- "Fit" button to reset view

**Milestone Card Structure:**
```javascript
{
  date: "2019-01",      // Month & Year
  title: "First Policy Purchased",
  description: "Purchased Health Shield Pro",  // Optional, 1-2 lines
  eventType: "first_policy",  // Determines icon and color
  icon: "🛡️",
  accentColor: "blue"
}
```

**Event Types:**

| Event Type | Icon | Accent Color | Example Label |
|------------|------|--------------|---------------|
| `first_policy` | 🛡️ Shield | Blue | "Jan 2019 – First Policy Purchased" |
| `new_policy` | 📄 Document | Indigo | "Jun 2020 – Added Health Plan" |
| `marriage` | 💍 Rings | Gold | "Aug 2021 – Married" |
| `newborn` | 👶 Baby | Pink | "May 2023 – Baby Arrival" |
| `policy_claim` | 💰 Hand with Coin | Red | "Dec 2024 – Medical Claim Submitted" |
| `policy_renewal` | 🔄 Refresh | Green | "Jan 2025 – Policy Renewed" |
| `fund_switch` | 💱 Currency Exchange | Purple | "Mar 2024 – Fund Switching" |
| `beneficiary_change` | 👨‍👩‍👧‍👦 Family | Teal | "Sep 2023 – Updated Beneficiary" |

**Mira Insight** (below timeline):
- AI-generated paragraph summarizing customer journey
- Example: "Sarah has been your customer for 3,892 days. You have witnessed her ups and downs including marriage, newborn, accidental claim, and more. She will be turning 40 years old on 15 Mar, remember to celebrate with her and do an annual policy review..."

**Technical Requirements:**
- Use React Spring for smooth animations
- Implement zoom/pan with react-zoom-pan-pinch or similar
- Responsive: Vertical timeline on mobile
- Data source: `milestones` API endpoint

---

#### Section 2: Individual Details / Company Details

**Individual Details Fields:**
- Name
- Phone Number
- Email
- National ID
- Date of Birth
- Gender
- Marital Status
- Occupation
- Nationality
- Address

**Company Details Fields** (for Entity customers):
- Company Name
- Business Registration No
- Industry
- Keyman (linked contact person)
- Number of Employees
- Annual Revenue

**Layout:** 2-column grid on desktop, single column on mobile

---

#### Section 3: Quick Action

**Buttons:**

1. **New Proposal**
   - Action: Navigate to New Business page with customer pre-filled
   - Icon: Document Plus
   - Style: Primary button

2. **Resume Proposal**
   - Action: Navigate to proposal list filtered by customer
   - User selects proposal to continue
   - Icon: Play Circle
   - Style: Secondary button

3. **Schedule Appointment**
   - Action: Open "Add Event" form
   - Pre-fill: Title and linked customer
   - Icon: Calendar Plus
   - Style: Secondary button

---

#### Section 4: Appointments

**Content:**
- Display upcoming and past appointment summary cards
- Click card → Navigate to `/advisor/smart-plan` with event details
- Show: Date, Time, Title, Status

**States:**
- Empty state: "No appointments scheduled"
- Loading state: Skeleton cards

---

### Tab 2: Portfolio

#### Section 1: Coverage Overview

**Purpose:** Visual infographic showing covered vs uncovered needs

**Coverage Types:**

**Individual Customers:**
- Hospitalisation
- Death
- Critical Illness
- TPD (Total Permanent Disability)
- Disability Income
- Accidental
- Savings
- Lifestyle
- Travel

**Entity Customers:**
- Term Life
- Hospitalisation
- Medical
- Outpatient Dental
- Outpatient Clinical

**Design:**
- Use icons for each coverage type
- **Covered needs:** Full color with checkmark
- **Uncovered needs:** Grey out with cross/empty circle
- Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile

---

#### Section 2: Active Policies

**Individual Policies:**

**Policy Card (Horizontal Layout):**
```
┌─────────────────────────────────────────────────────────┐
│ Product Name                              [Status Badge]│
│ Policy No: ABC123456                                    │
│ Coverage: Hospitalisation | Sum Assured: $500,000       │
│ Premium: $250/month | Frequency: Monthly                │
└─────────────────────────────────────────────────────────┘
```

**Fields:**
- **Header:** Product Name + Status Badge
- Policy Number
- Coverage Type
- Sum Assured
- Premium Amount
- Frequency (Monthly/Quarterly/Annually)

**Click Behavior:**
- Click card → Navigate to Policy Detail page
- Back button → Return to portfolio tab

---

**Entity Policies (Group Policies):**

**Group Policy Card:**
```
┌─────────────────────────────────────────────────────────┐
│ Group Term Life Insurance                [Status Badge]│
│ Policy No: GRP789012                                    │
│ Members Covered: 50 employees                           │
│ Total Premium: $5,000/month | Frequency: Monthly        │
└─────────────────────────────────────────────────────────┘
```

---

### Tab 3: Servicing

#### Section 1: Available Service Requests

**Individual Service Types:**
- Submit Claim
- Renew Policy
- Reinstate Policy
- Fund Switching
- Premium Payment
- Change Customer Details
- Change Beneficiary
- Others

**Entity Service Types:**
- Change of Members (add/remove employees)
- Change Rider
- Policy Renewal
- Premium Payment
- Change Company Details
- Submit Group Claim
- Others

**Design:** Grid of action cards/buttons

---

#### Section 2: Service Request History

**Service Request Card:**
```
┌─────────────────────────────────────────────────────────┐
│ [Icon] Request Type                      [Status Badge]│
│ Request ID: SR-2024-001                                 │
│ Submitted: 15 Jan 2025 | Updated: 20 Jan 2025           │
│ Status: Processing                                      │
└─────────────────────────────────────────────────────────┘
```

**Click Behavior:**
- Click card → Navigate to Service Request Detail page
- Show full request details, documents, history, actions

---

### Tab 4: Gap & Opportunity

**(Hidden for Entity Customers)**

#### Section 1: Gap Assessment Summary

**Content:**
- Brief summary of customer's financial gaps
- Opportunities to improve financial health
  - Example: "Sarah's emergency fund is below recommended 6 months. Consider investing excess cash in diversified funds."
  - Example: "Critical illness coverage gap of $200,000 based on income replacement analysis."

**Actions:**
1. **Regenerate Button:**
   - Action: Rerun gap analysis based on latest data
   - Icon: Refresh
   - Loading state during calculation

2. **Generate Report Button:**
   - Action: Generate PDF report
   - Share with customer via email/WhatsApp

---

#### Section 2: Financial Planning History

**Content:**
- List of previously generated gap analysis reports
- Show: Date generated, Advisor name, Report status (Draft/Signed)

**Report Card:**
```
┌─────────────────────────────────────────────────────────┐
│ Gap Analysis Report - Jan 2025           [Signed Badge]│
│ Generated: 10 Jan 2025 | By: John Tan                   │
│ Coverage Gaps: 3 | Opportunities: 2                     │
│ [View PDF] [Share]                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (>1024px)
- Frozen header at top
- Tabs clickable
- Scrollable content area
- Timeline horizontal

### Tablet (768px - 1024px)
- Same as desktop
- Adjusted grid layouts (2 columns)

### Mobile (<768px)
- Frozen header compressed
- Swipe gestures for tab navigation
- Single column layouts
- Timeline vertical
- Collapsed sections with expand/collapse

---

## State Management

### URL Parameters
```
/advisor/customers/detail?id={customerId}&tab={tabName}
```

**Tab Parameter:**
- `overview` (default)
- `portfolio`
- `servicing`
- `gap-opportunity`

### Customer Data Structure
```javascript
{
  id: "cust_123",
  customer_type: "Individual" | "Entity",
  name: "Sarah Chen",  // or company_name for Entity
  relationship_type: "New" | "Existing",
  temperature: { bucket: "hot" | "warm" | "cold", score: 0.9 },

  // Counts
  active_proposals: 1,
  open_service_requests: 0,
  active_policies: 2,

  // Individual fields
  phone: "+65 9123 4567",
  email: "sarah@example.com",
  national_id: "S1234567A",
  date_of_birth: "1985-03-15",
  gender: "Female",
  marital_status: "Married",
  occupation: "Software Engineer",
  nationality: "Singaporean",
  address: "123 Main St, Singapore 123456",

  // Entity fields (if customer_type = "Entity")
  business_registration_no: "202012345A",
  industry: "Technology",
  keyman: { id: "person_1", name: "John Doe" },
  number_of_employees: 50,
  annual_revenue: 5000000,

  // Relationships
  policies: [...],
  proposals: [...],
  service_requests: [...],
  milestones: [...],
  appointments: [...],
  gap_analysis: {...}
}
```

---

## Component Structure

```
CustomerDetail.jsx (Page)
├── CustomerDetailHeader.jsx (Frozen)
│   ├── BackButton.jsx
│   ├── CustomerNameSection.jsx
│   │   ├── CustomerName
│   │   ├── SummaryCounts
│   │   └── Badges (Relationship + Temperature)
│   └── TabNavigation.jsx
│       └── Tab (x4)
├── ScrollableContent.jsx
│   ├── OverviewTab.jsx
│   │   ├── OurJourneyTimeline.jsx
│   │   │   ├── TimelineContainer
│   │   │   ├── MilestoneCard (x N)
│   │   │   └── MiraInsight
│   │   ├── CustomerDetailsSection.jsx
│   │   │   ├── IndividualDetails.jsx (conditional)
│   │   │   └── CompanyDetails.jsx (conditional)
│   │   ├── QuickActions.jsx
│   │   └── AppointmentsSection.jsx
│   ├── PortfolioTab.jsx
│   │   ├── CoverageOverview.jsx
│   │   │   └── CoverageIcon (x N)
│   │   └── ActivePolicies.jsx
│   │       └── PolicyCard (x N)
│   ├── ServicingTab.jsx
│   │   ├── AvailableServiceRequests.jsx
│   │   │   └── ServiceActionCard (x N)
│   │   └── ServiceRequestHistory.jsx
│   │       └── ServiceRequestCard (x N)
│   └── GapOpportunityTab.jsx (conditional - not for Entity)
│       ├── GapAssessmentSummary.jsx
│       └── FinancialPlanningHistory.jsx
│           └── ReportCard (x N)
```

---

## API Endpoints Required

### 1. Get Customer Details
```
GET /api/customers/{id}
Response: Full customer object with all relationships
```

### 2. Get Milestones
```
GET /api/customers/{id}/milestones
Response: Array of milestone objects
```

### 3. Get Policies
```
GET /api/customers/{id}/policies?status=active
Response: Array of policy objects
```

### 4. Get Service Requests
```
GET /api/customers/{id}/service-requests
Response: Array of service request objects
```

### 5. Get Gap Analysis
```
GET /api/customers/{id}/gap-analysis
POST /api/customers/{id}/gap-analysis/regenerate
GET /api/customers/{id}/gap-analysis/history
```

### 6. Get Coverage Summary
```
GET /api/customers/{id}/coverage-summary
Response: Object mapping coverage types to boolean (covered/not)
```

---

## Animation & Interaction Libraries

### Recommended Libraries:

1. **Timeline Animation:**
   - `react-spring` - For smooth spring animations
   - `react-zoom-pan-pinch` - For zoom and pan functionality
   - `framer-motion` - Alternative for animations

2. **Swipe Gestures (Mobile):**
   - `react-swipeable` - For tab swipe navigation

3. **Scroll Behavior:**
   - `react-scroll` or native `IntersectionObserver`

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Remove entity-customers routes
- ✅ Create unified CustomerDetail page structure
- ✅ Implement frozen header with back button
- ✅ Add tab navigation (Overview only, others disabled)
- ✅ Basic layout with scrollable content area

### Phase 2: Overview Tab (Week 2)
- Create Customer Details sections (Individual + Company)
- Implement Quick Actions
- Add Appointments section
- Mock data for testing

### Phase 3: Our Journey Timeline (Week 2-3)
- Build timeline component
- Add milestone cards
- Implement zoom/pan functionality
- Add Mira Insight section
- Integrate milestone API

### Phase 4: Portfolio Tab (Week 3)
- Create Coverage Overview infographic
- Build Policy Card component
- Implement policy list
- Add navigation to policy details

### Phase 5: Servicing Tab (Week 4)
- Create Available Service Requests grid
- Build Service Request History list
- Add service request forms
- Integrate with service request API

### Phase 6: Gap & Opportunity Tab (Week 4)
- Implement gap assessment display
- Add regenerate functionality
- Build Financial Planning History
- Generate/share report features

### Phase 7: Entity Customer Support (Week 5)
- Add Company Details section
- Implement group policy cards
- Add entity-specific service requests
- Hide Gap & Opportunity for entities

### Phase 8: Polish & Testing (Week 5-6)
- Add loading states
- Error handling
- Responsive design
- Mobile swipe gestures
- Performance optimization
- E2E tests

---

## Success Criteria

- ✅ Single unified route handles both Individual and Entity customers
- ✅ Frozen header stays at top during scroll
- ✅ Tab navigation works (click + swipe on mobile)
- ✅ Tab disable logic works (New vs Existing)
- ✅ Our Journey timeline is interactive and visually appealing
- ✅ All sections display correct data for customer type
- ✅ Quick Actions navigate to correct pages
- ✅ Coverage overview accurately reflects policies
- ✅ Service requests can be submitted and viewed
- ✅ Gap analysis can be regenerated and shared
- ✅ Entity customers see appropriate sections
- ✅ Mobile responsive with swipe gestures
- ✅ Performance: <3s initial load, <100ms tab switches

---

## Notes

- This is a major redesign requiring significant development time
- Coordinate with backend team for API endpoints
- Consider phased rollout (Individual first, then Entity)
- Milestone data quality is critical for timeline effectiveness
- Gap analysis requires integration with financial planning logic
- Entity customer sections can be MVP in early phases

---

## Next Steps

1. Review and approve specification
2. Backend: Design and implement API endpoints
3. Frontend: Set up component structure (Phase 1)
4. UI/UX: Design milestone icons and coverage infographic
5. Begin Phase 1 implementation
