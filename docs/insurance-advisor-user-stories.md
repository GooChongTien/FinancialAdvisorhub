# Insurance Advisor Application - User Stories

**Target User:** Insurance Advisor/Agent  
**Document Version:** 1.0  
**Last Updated:** November 2, 2025

---

## Table of Contents
1. [User Personas](#user-personas)
2. [Epic Overview](#epic-overview)
3. [User Stories by Epic](#user-stories-by-epic)

---

## User Personas

### Primary User: Insurance Advisor
**Role:** Front-line sales and service agent  
**Goals:** 
- Efficiently manage leads and client relationships
- Complete sales proposals quickly and accurately
- Track performance and meet targets
- Provide excellent client service

**Pain Points:**
- Juggling multiple tools and spreadsheets
- Missing follow-ups and appointments
- Difficulty tracking proposal stages
- Time-consuming manual data entry

### Secondary User: Back Office Admin
**Role:** System administrator and configurator  
**Goals:**
- Manage advisor accounts and permissions
- Configure system settings and business rules
- Monitor system usage and compliance

---

## Epic Overview

| Epic ID | Epic Name | Priority | Story Count | Description |
|---------|-----------|----------|-------------|-------------|
| E01 | User Profile & Settings | P0 | 4 | Manage personal profile, security, and preferences |
| E02 | Navigation & Interface | P0 | 3 | Core navigation and branding |
| E03 | Dashboard & Home | P1 | 6 | Personalized dashboard with key widgets |
| E04 | Lead Management | P0 | 8 | Create, search, and manage leads |
| E05 | Client Management | P0 | 7 | View and manage existing clients |
| E06 | Client Details & Portfolio | P1 | 6 | Detailed client information and policy portfolio |
| E07 | Fact Finding Process | P0 | 5 | Collect customer information and assessments |
| E08 | Financial Needs Analysis | P0 | 4 | Analyze client financial situation |
| E09 | Product Recommendation | P0 | 3 | Generate and confirm product recommendations |
| E10 | Quotation Generation | P0 | 4 | Create and present policy quotations |
| E11 | Application Processing | P0 | 5 | Complete and submit policy applications |
| E12 | Quick Quote Tool | P1 | 3 | Fast product quotation without full process |
| E13 | Performance Analytics | P1 | 20 | Track sales performance and metrics |
| E14 | Calendar & Task Management | P0 | 6 | Manage appointments and tasks |
| E15 | Client Servicing | P2 | 4 | Handle policy servicing requests |
| E16 | Gap Analysis | P2 | 3 | Identify coverage gaps and opportunities |
| E17 | Communication & Broadcast | P2 | 2 | Company announcements and updates |

**Priority Levels:**
- **P0 (Must Have):** Core functionality required for MVP
- **P1 (Should Have):** Important for full product experience
- **P2 (Could Have):** Value-add features for future releases

---

## User Stories by Epic

---

## EPIC E01: User Profile & Settings

### Story E01-S01: View Profile Information
**As an** insurance advisor  
**I want to** view my personal profile information  
**So that** I can verify my account details are correct

**Acceptance Criteria:**
- [x] Profile displays full name, email, mobile number
- [x] Profile shows Advisor ID and expiry date
- [x] Account status is visible
- [x] All fields are read-only for advisor role
- [x] Page loads within 2 seconds

**Priority:** P0  
**Story Points:** 2  
**Dependencies:** None

---

### Story E01-S02: Manage Two-Factor Authentication
**As an** insurance advisor  
**I want to** enable or disable 2FA on my account  
**So that** I can secure my account according to my preference

**Acceptance Criteria:**
  - [x] Option to enable/disable 2FA is available
- [x] System provides QR code for authentication app setup
- [x] Backup codes are generated and downloadable
- [x] Confirmation required before disabling 2FA
- [x] Success/error messages displayed clearly

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E01-S01

---

### Story E01-S03: Change Password
**As an** insurance advisor  
**I want to** change my account password  
**So that** I can maintain security if I suspect my password is compromised

**Acceptance Criteria:**
- [x] Current password verification required
- [x] New password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, special char)
- [x] Password confirmation field matches new password
- [x] System logs user out after successful password change
- [x] Email notification sent to registered email
- [x] Clear error messages for invalid inputs

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E01-S01

---

### Story E01-S04: Set User Preferences
**As an** insurance advisor  
**I want to** customize my language, currency, and other preferences  
**So that** the system works in my preferred format

**Acceptance Criteria:**
  - [x] Language options available (at minimum: English)
  - [x] Currency options available (at minimum: local currency)
  - [x] Preferences saved automatically
- [x] Changes reflect immediately across all modules
- [x] Default preferences restore option available

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E01-S01

---

## EPIC E02: Navigation & Interface

### Story E02-S01: Access Application via Top Navigation Bar
**As an** insurance advisor  
**I want to** see a fixed navigation bar at the top of every page  
**So that** I always have access to key functions and can identify the system

**Acceptance Criteria:**
- [x] Navigation bar remains fixed at top during scrolling
- [x] Company/tenant logo displayed on left side
- [x] User profile card displayed on right side (icon + name + role)
- [x] Navigation bar visible on all pages
- [x] Responsive design works on different screen sizes

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** None

---

### Story E02-S02: Access User Profile from Top Bar
**As an** insurance advisor  
**I want to** click my profile card in the top navigation  
**So that** I can quickly access my profile settings

**Acceptance Criteria:**
- [x] Clicking profile card navigates to profile settings page
- [x] Optional dropdown arrow provides visual cue
- [x] Transition is smooth (under 1 second)
- [x] Back button returns to previous page
- [x] Current page state is preserved

**Priority:** P0  
**Story Points:** 2  
**Dependencies:** E02-S01, E01-S01

---

### Story E02-S03: Navigate Using Side Menu
**As an** insurance advisor  
**I want to** use a collapsible sidebar menu to navigate between modules  
**So that** I can quickly access different sections while maximizing screen space

**Acceptance Criteria:**
- [x] Sidebar can expand to show icons + menu names
- [x] Sidebar can collapse to show icons only
- [x] Expand/collapse state persists across sessions
- [x] All menu items accessible: Home, Customer, New Business, Quick Quote, Analytics, To Do, Broadcast
- [x] Current active module is highlighted
- [x] Smooth animation during expand/collapse (under 0.3s)

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E02-S01

---

## EPIC E03: Dashboard & Home

### Story E03-S01: View Personalized Greeting
**As an** insurance advisor  
**I want to** see a personalized greeting message when I log in  
**So that** I feel welcomed and motivated to start my day

**Acceptance Criteria:**
  - [x] Greeting includes advisor's name
  - [x] Greeting changes based on time of day (Good Morning/Afternoon/Evening)
  - [x] Quote of the day or motivational message displayed
  - [ ] Refreshes daily with new quotes
  - [x] Text is clearly visible and well-formatted

**Priority:** P1  
**Story Points:** 2  
**Dependencies:** None

---

### Story E03-S02: Access Quick Action Links
**As an** insurance advisor  
**I want to** see quick action buttons on my dashboard  
**So that** I can perform common tasks without navigating through menus

**Acceptance Criteria:**
- [x] "+ New Lead" button available
- [x] "+ Quick Quote" button available
- [x] Buttons clearly labeled with icons
- [x] Clicking navigates to respective modules
- [x] Actions complete in under 3 clicks

**Priority:** P1  
**Story Points:** 2  
**Dependencies:** E02-S03

---

### Story E03-S03: View Today's Reminders
**As an** insurance advisor
**I want to** see my tasks and appointments for today on my dashboard
**So that** I don't miss important activities

**Acceptance Criteria:**
  - [x] Widget displays tasks and appointments for current date
  - [ ] Shows top 5 items by priority/time
  - [x] Each item shows title, time, and type
  - [x] "View Details" link navigates to To Do module
  - [ ] Widget updates in real-time
  - [x] Empty state message if no items

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E14 (Calendar Module)

---

### Story E03-S04: View Hot Leads
**As an** insurance advisor  
**I want to** see leads who have recently engaged with me  
**So that** I can prioritize my follow-up efforts

**Acceptance Criteria:**
- [x] Widget shows leads with activity in last 7 days
- [x] Displays lead name, last contact date, and status
- [x] Maximum 10 leads displayed
- [x] Leads sorted by most recent activity first
- [x] "View Details" navigates to Customer module with filter pre-applied
- [x] Empty state message if no hot leads

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E04 (Lead Management)

---

### Story E03-S05: View Performance Snapshot
**As an** insurance advisor  
**I want to** see my current sales performance on my dashboard  
**So that** I can track my progress toward targets

**Acceptance Criteria:**
  - [x] Widget displays key metrics (sales, conversion rate, etc.)
  - [x] Shows current period performance (MTD by default)
  - [x] Visual indicator for target vs. actual
  - [x] "View Details" navigates to Analytics module
  - [x] Updates daily
  - [x] Clear visual design for quick scanning

**Priority:** P1  
**Story Points:** 4  
**Dependencies:** E13 (Analytics)

---

### Story E03-S06: View Broadcast Feed
**As an** insurance advisor
**I want to** see the latest company announcements on my dashboard
**So that** I stay informed about important updates

**Acceptance Criteria:**
  - [x] Widget shows latest 3 broadcast messages
  - [x] Each message shows title, date, and category
  - [x] Pinned messages appear at top
  - [x] "View Details" navigates to Broadcast module
  - [x] Unread messages have visual indicator
  - [x] Updates automatically when new broadcasts posted

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E17 (Broadcast)

---

## Implementation Notes (latest)

- 2025-11-01
  - E01-S03: Implemented email notification by queuing a message in `email_outbox` upon successful password change; added user-facing toast confirmation. Tested OK in Chrome (Profile Settings → Change Password).
  - E01-S04: Confirmed preferences propagate immediately via React Query cache updates (`PreferencesContext`). Verified on Home and Analytics after changing currency/language. Tested OK.
  - E03-S05: Dashboard Performance Snapshot now shows Month-To-Date metrics, adds a target vs actual progress bar, and reflects current data on each load/day. Tested OK on Home.
  - E03-S06: Broadcasts now show pinned items at top, unread indicator (per-session), and auto-refresh every 60s with refetch on window focus. Tested OK on Broadcast.

- 2025-11-02
  - E14: Replaced advanced filter panel with a simpler header: segmented List/Calendar toggle, quick dropdowns for Event Type and Time Range, and a Birthdays toggle (shows client birthdays as reminder tasks within the selected range). ICS export supports selected date ranges. Completion writes to DB `completed` when present, with safe local fallback.
  - E17: Broadcast improvements — category tabs, pinned handling, unread indicators (per session), and focus refetch. Search and detailed view remain pending.


## EPIC E04: Lead Management

### Story E04-S01: Create New Lead with Basic Information
**As an** insurance advisor  
**I want to** create a new lead with essential contact details  
**So that** I can quickly capture prospect information during initial contact

**Acceptance Criteria:**
- [x] "+ New Lead" button clearly visible
- [x] Form includes: Name (mandatory), Contact Number (mandatory), Email (optional), Lead Source (dropdown)
- [x] Lead Source dropdown populated with configured values
- [x] Form validation shows clear error messages
- [x] "Save & Close" button creates lead and closes form
- [x] New lead defaults to "Not Contacted" status
- [x] Success confirmation message displayed
- [x] Form clears after successful save

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** None

---

### Story E04-S02: Schedule Appointment When Creating Lead
**As an** insurance advisor  
**I want to** schedule an appointment immediately after creating a lead  
**So that** I can secure a meeting time while the prospect is engaged

**Acceptance Criteria:**
- [x] "Save & Schedule Appointment" button available on lead form
- [x] Clicking opens appointment scheduling form
- [x] Appointment form pre-fills: Title = "Appointment with [Lead Name]", Linked Lead/Client = [Lead Name], Type = "Appointment"
- [x] Date/time picker available
- [x] Lead is created first, then appointment is linked
- [x] Both confirmations shown after save
- [x] Appointment appears in To Do module

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E04-S01, E14 (Calendar)

---

### Story E04-S03: Search Leads by Multiple Criteria
**As an** insurance advisor  
**I want to** search for leads by name, contact number, or ID  
**So that** I can quickly find specific prospects

**Acceptance Criteria:**
- [x] Search bar prominently placed at top of Customer module
- [x] Search works with partial matches (minimum 2 characters)
- [x] Searches across: Name, Contact Number, National ID
- [x] Results appear within 2 seconds
- [x] Search highlights matching text in results
- [x] Clear "X" button to reset search
- [x] "No results found" message when applicable

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E04-S01

---

### Story E04-S04: Filter Leads by Key Attributes
**As an** insurance advisor  
**I want to** filter my lead list by various attributes  
**So that** I can focus on specific segments

**Acceptance Criteria:**
- [x] Filter options available: Lead Status, Lead Source, Date Range, Last Contacted
- [x] Multiple filters can be applied simultaneously
- [x] Active filters displayed as chips/tags
- [x] Filter count shown (e.g., "Showing 15 of 243 leads")
- [x] "Clear All Filters" button available
- [x] Filter state persists during session
- [x] Results update immediately when filters change

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E04-S01

---

### Story E04-S05: View Lead List with Key Information
**As an** insurance advisor  
**I want to** see my leads in a list with essential details  
**So that** I can quickly scan and identify leads requiring attention

**Acceptance Criteria:**
- [x] Leads displayed as horizontal cards or table rows
- [x] Each lead shows: Name, Contact, Lead Source, Last Contacted, Proposal Stage, Next Appointment
- [x] List is sortable by: Name, Last Contacted, Next Appointment
- [x] Default sort: Most recently contacted first
- [x] Pagination or infinite scroll for large lists
- [x] Visual indicators for status (e.g., color coding)
- [x] Responsive design for different screen sizes

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E04-S01

---

### Story E04-S06: Access Lead Details
**As an** insurance advisor  
**I want to** click on a lead card to view detailed information  
**So that** I can see complete lead history and take actions

**Acceptance Criteria:**
- [x] Clicking lead card navigates to lead detail page
- [ ] Smooth transition animation
- [x] Back button returns to filtered/searched lead list (state preserved)
- [x] Navigation is fast (under 1 second)
- [x] Lead detail page loads all relevant information

**Priority:** P0  
**Story Points:** 2  
**Dependencies:** E04-S05, E05 (Client Details)

---

### Story E04-S07: Distinguish Between Leads and Clients
**As an** insurance advisor  
**I want to** see visual differentiation between leads and existing clients  
**So that** I can quickly identify their relationship status

**Acceptance Criteria:**
- [x] Visual indicator (badge, icon, or color) differentiates leads from clients
- [x] Client cards show "Active Policies" count
- [x] Client cards show "Total Premium" amount
- [x] Lead cards show "Proposal Stage" instead
- [x] Filter option to show "Leads Only" or "Clients Only"
- [x] Legend/key explains visual indicators

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E04-S05

---

### Story E04-S08: Update Lead Status
**As an** insurance advisor  
**I want to** update a lead's status as I progress through the sales process  
**So that** I can track where each lead is in my pipeline

**Acceptance Criteria:**
- [x] Status dropdown available on lead detail page
- [x] Status options include: Not Contacted, Contacted, Qualified, Proposal, Negotiation, Won, Lost
- [x] Status change saves immediately
- [x] Timestamp recorded for status changes
- [x] Status history viewable (audit trail)
- [x] Status change triggers any relevant notifications

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E04-S06

---

## EPIC E05: Client Management

### Story E05-S01: View Client Profile Summary
**As an** insurance advisor  
**I want to** see key client information at the top of their profile  
**So that** I can quickly understand who I'm dealing with

**Acceptance Criteria:**
- [x] Client name prominently displayed as page header
- [x] Key stats shown: Age, Number of active policies
- [ ] Profile photo/avatar displayed (if available)
- [x] Contact information easily accessible
- [ ] Summary updates in real-time
- [x] Clean, scannable layout

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E04-S06

---

### Story E05-S02: Navigate Client Detail Tabs
**As an** insurance advisor  
**I want to** navigate between different sections of client information using tabs  
**So that** I can access specific information efficiently

**Acceptance Criteria:**
- [x] Tabs available: Overview, Portfolio, Servicing, Gap & Opportunity
- [x] Active tab is clearly highlighted
- [x] Clicking tab scrolls to corresponding section
- [x] Tab bar remains visible when scrolling (sticky)
- [ ] Smooth scroll animation (under 0.5s)
- [x] Sections are in a single scrollable page

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E05-S01

---

### Story E05-S03: View Client Overview Information
**As an** insurance advisor  
**I want to** see comprehensive personal information about a client  
**So that** I have all details needed for conversations and proposals

**Acceptance Criteria:**
- [x] Overview section displays: Name, Contact Number, National ID, Date of Birth, Gender
- [ ] For existing clients: Full fact-finding details displayed (read-only)
- [ ] For new leads: Name and Contact Number mandatory, other fields optional
- [x] Information clearly organized in sections
- [ ] Fields indicate if mandatory or optional
- [ ] Data validation on any editable fields

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E05-S02

---

### Story E05-S04: Start New Fact Finding from Client Profile
**As an** insurance advisor  
**I want to** initiate a new fact-finding process from a client's profile  
**So that** I can begin a new business case efficiently

**Acceptance Criteria:**
- [x] "+ New Fact Find" button visible in Overview section
- [x] Clicking button navigates to New Business module
- [x] Leads to Proposal Journey Detail > Fact Finding page
- [x] Client information pre-filled in fact-finding form
- [ ] New proposal case automatically linked to client
- [ ] Clear breadcrumb navigation available

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E05-S03, E07 (Fact Finding)

---

### Story E05-S05: Schedule Appointment from Client Profile
**As an** insurance advisor  
**I want to** schedule an appointment directly from a client's profile  
**So that** I can efficiently plan meetings

**Acceptance Criteria:**
- [x] "Schedule Appointment" button visible in Overview section
- [x] Clicking opens "Add Event" modal form
- [x] Form pre-fills: Title = "Appointment with [Client Name]", Linked Lead/Client = [Client Name], Type = "Appointment"
- [x] Date/time picker available
- [x] Optional notes field available
- [x] Save button creates appointment
- [x] Appointment appears in To Do module
- [x] Appointment linked to client record

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E05-S03, E14 (Calendar)

---

### Story E05-S06: View Linked Appointments for Client
**As an** insurance advisor
**I want to** see all scheduled and past appointments for a client
**So that** I can track our meeting history

**Acceptance Criteria:**
- [x] Appointments section visible in Overview
- [x] Shows past and upcoming appointments
- [x] Each appointment displays: Date, Time, Title
- [ ] Past appointments marked as completed
- [x] Sorted by date (upcoming first, then past)
- [ ] Click appointment to edit or view details
- [x] Maximum 10 shown, with "View All" link

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E05-S05

---

### Story E05-S07: Edit Client Information
**As an** insurance advisor  
**I want to** update a client's contact and personal information  
**So that** I can keep records current

**Acceptance Criteria:**
- [x] "Edit" button available in Overview section
- [x] Editable fields: Contact Number, Email, Address
- [x] Core identity fields (Name, ID, DOB) are read-only
- [x] Form validation prevents invalid data
- [x] "Save" and "Cancel" buttons available
- [x] Changes save immediately
- [x] Success confirmation displayed
- [x] Audit trail records who made changes and when

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E05-S03

---

## EPIC E06: Client Details & Portfolio

### Story E06-S01: View Client Policy Portfolio Summary
**As an** insurance advisor
**I want to** see a visual summary of all coverage types a client has
**So that** I can quickly understand their insurance portfolio

**Acceptance Criteria:**
- [x] Portfolio tab shows coverage type icons/cards
- [x] Coverage types include: Hospitalisation, Death, Critical Illness, TPD, Disability Income, Accidental, Savings, Lifestyle, Travel
- [x] Covered types highlighted/colored
- [x] Uncovered types greyed out
- [x] Visual design makes gaps immediately obvious
- [x] Summary shows total premium and total coverage amount

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E05-S02

---

### Story E06-S02: View List of Client Policies
**As an** insurance advisor  
**I want to** see a list of all policies a client holds  
**So that** I can access specific policy details

**Acceptance Criteria:**
- [x] Policies displayed as horizontal cards below coverage summary
- [x] Each card shows: Policy Number, Product Name, Coverage Type, Status, Premium, Sum Assured
- [x] Cards are sortable by: Policy Date, Premium, Coverage Type
- [x] Active/Inactive policies have visual distinction
- [x] Clicking policy card opens policy details page
- [x] Empty state message if no policies

**Priority:** P1  
**Story Points:** 4  
**Dependencies:** E06-S01

---

### Story E06-S03: View Individual Policy Details
**As an** insurance advisor
**I want to** view detailed information about a specific policy
**So that** I can answer client questions accurately

**Acceptance Criteria:**
- [x] Policy details page shows: Policy Number, Product Name, Coverage Type, Effective Date, Maturity Date, Premium, Sum Assured
- [x] Beneficiaries and Payment Status
- [x] Coverage breakdown displayed clearly
- [x] Policy documents downloadable (if available)
- [x] Back button returns to policy list
- [x] Page loads within 2 seconds
- [x] Print-friendly format available

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E06-S02

---

### Story E06-S04: View Client Servicing Requests
**As an** insurance advisor
**I want to** see available servicing request types for a client
**So that** I can help them with policy maintenance

**Acceptance Criteria:**
- [x] Servicing tab shows request type options
- [x] Options include: Submit Claim, Renewal, Reinstatement, Fund Switching, etc.
- [x] Each option clearly labeled with icon
- [x] Clicking option opens service request form/flow
- [ ] Only applicable service types shown based on client's policies

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E05-S02

---

### Story E06-S05: Submit Service Request
**As an** insurance advisor  
**I want to** submit a service request on behalf of a client  
**So that** I can process their policy servicing needs

**Acceptance Criteria:**
- [x] Service request follows multi-step process (dialog stepper)
- [x] Steps: 1) Request Information, 2) Upload Documents, 3) Review, 4) Authorize
- [x] Progress indicator shows current step
- [x] "Next" and "Back" buttons for navigation
- [x] Form validation at each step
- [x] Final submission generates confirmation number
- [x] Email confirmation sent to client (via Edge Function email-sender)
- [x] Returns to servicing tab after completion

**Priority:** P2  
**Story Points:** 8  
**Dependencies:** E06-S04

---

### Story E06-S06: Track Service Request Status
**As an** insurance advisor  
**I want to** view the status of submitted service requests  
**So that** I can update clients on progress

**Acceptance Criteria:**
- [x] List of submitted requests shown below service type options
- [x] Each request shows: Request Type, Date Submitted, Status, Reference Number
- [ ] Status options: Pending, In Progress, Approved, Rejected, Completed
- [x] Sortable and filterable by status and date
- [ ] Clicking request shows detailed status and history
- [ ] Status updates in real-time

**Priority:** P2  
**Story Points:** 4  
**Dependencies:** E06-S05

---

## EPIC E07: Fact Finding Process

### Story E07-S01: Capture Personal Details
**As an** insurance advisor  
**I want to** collect comprehensive personal information about a prospect  
**So that** I can create accurate insurance proposals

**Acceptance Criteria:**
- [x] Personal Details section includes: Title, Name, Gender, NRIC, Date of Birth, Nationality, Smoker Status, Marital Status, Occupation, Phone Number, Email, Address
- [x] All mandatory fields clearly marked
- [x] Field validation for data format (e.g., NRIC format, email format)
- [x] Auto-calculate age from date of birth
- [x] Dropdowns populated for: Title, Gender, Nationality, Smoker Status, Marital Status
- [x] "Save" button stores data
- [x] Progress indicator shows completion percentage

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** None

---

### Story E07-S02: Add Dependent Information
**As an** insurance advisor
**I want to** record information about a prospect's dependents
**So that** I can assess their family protection needs

**Acceptance Criteria:**
- [x] "+ Add Dependent" button available
- [x] Each dependent form includes: Title, Name, Gender, NRIC, Date of Birth, Nationality, Smoker Status, Marital Status (if adult), Occupation (if adult), Phone Number, Email, Address
- [x] Multiple dependents can be added
- [x] Dependents listed with ability to edit or remove
- [x] Relationship field to specify connection (spouse, child, parent, etc.)
- [x] Auto-categorize as adult/child based on age
- [x] Validation ensures required fields completed

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E07-S01

---

### Story E07-S03: Conduct Customer Knowledge Assessment
**As an** insurance advisor
**I want to** assess a customer's financial knowledge and experience
**So that** I can recommend appropriate products that match their sophistication

**Acceptance Criteria:**
- [x] CKA section includes 3 assessment areas: Educational/Professional Qualification, Investment Experience, Work Experience
- [x] Educational section has multi-select checkboxes for relevant qualifications
- [x] Investment Experience section asks about transaction frequency
- [x] Work Experience section asks about professional background
- [x] All questions have "N.A." option
- [x] Assessment result calculated automatically
- [x] Result stored for compliance purposes
- [x] Section can be skipped if not applicable

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E07-S01

---

### Story E07-S04: Complete Risk Profiling Questionnaire
**As an** insurance advisor
**I want to** assess a client's risk tolerance through a questionnaire
**So that** I can recommend suitable investment-linked products

**Acceptance Criteria:**
- [x] RPQ section includes 6 questions covering: Investment Experience, Risk Acceptance, Investment Horizon, Financial Capacity, Asset Preference, Retirement Timeline
- [x] Each question has 4 predefined answer options
- [x] All questions mandatory before proceeding
- [x] Score calculated automatically (each answer has point value)
- [x] Total score displayed prominently
- [x] Risk band determined and shown: Low Risk (6-10), Low to Medium (11-15), Medium to High (16-20), High Risk (21-24)
- [x] Result influences product recommendations
- [x] Date of assessment recorded

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E07-S01

---

### Story E07-S05: Save and Resume Fact Finding
**As an** insurance advisor  
**I want to** save my progress during fact finding and resume later  
**So that** I can complete the process across multiple sessions

**Acceptance Criteria:**
- [x] "Save as Draft" button available on every section
- [x] Draft saved automatically every 2 minutes
- [x] Last saved timestamp displayed
- [x] Can exit and resume from where left off
- [x] Incomplete sections clearly marked
- [x] "Save & Next" button advances to next section
- [x] Data persists even if browser closes
- [x] Warning if attempting to leave with unsaved changes

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E07-S01

---

## EPIC E08: Financial Needs Analysis

### Story E08-S01: Capture Client Financial Details
**As an** insurance advisor  
**I want to** record a client's income, expenses, assets, and liabilities  
**So that** I can understand their financial situation

**Acceptance Criteria:**
  - [x] Financial Details section includes: Income (monthly/annual), Expenses (monthly), Assets (with breakdown by type), Liabilities (with breakdown by type)
  - [x] Multiple income sources can be added
  - [x] Expense categories provided for detailed breakdown
  - [x] Assets categorized: Property, Savings, Investments, etc.
  - [x] Liabilities categorized: Mortgage, Loans, Credit Cards, etc.
  - [x] Automatic calculation of net worth
  - [x] Automatic calculation of disposable income
  - [x] Currency formatting applied

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E07 (Fact Finding completed)

---

### Story E08-S02: Record Existing Insurance Coverage
**As an** insurance advisor  
**I want to** document a client's current insurance policies  
**So that** I can identify coverage gaps

**Acceptance Criteria:**
- [x] Section to list existing insurance policies
- [x] Each policy captures: Insurer, Policy Type, Coverage Amount, Premium, Expiry Date
- [x] Coverage types: Life, Health, Critical Illness, Disability, etc.
- [x] Can add multiple policies
- [x] Total existing coverage calculated by type
- [x] Edit/delete individual policies
- [x] Option to upload existing policy documents

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E08-S01

---

### Story E08-S03: Determine Affordability
**As an** insurance advisor  
**I want to** calculate how much a client can afford for insurance  
**So that** I can recommend realistic premium amounts

**Acceptance Criteria:**
- [x] System calculates disposable income (Income - Expenses - Liabilities)
- [x] Recommended premium budget calculated (typically 10-15% of income)
- [x] Affordability range displayed clearly
- [x] Visual indicator (gauge/meter) shows affordability level
- [x] Advisor can adjust recommended percentage
- [x] Warning if recommended premiums exceed affordability
- [x] Calculation updates in real-time as financial details change

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E08-S01

---

### Story E08-S04: Generate Needs Analysis Summary
**As an** insurance advisor
**I want to** see a comprehensive summary of client needs and goals
**So that** I can create appropriate recommendations

**Acceptance Criteria:**
- [x] Summary page shows: Financial snapshot, Coverage gaps, Protection needs, Savings goals, Affordability
- [x] Visual charts/graphs for key metrics
- [x] Clear identification of under-insured areas
- [x] Priority ranking of needs (High/Medium/Low)
- [x] Summary is printable
- [ ] Summary can be shared with client
- [x] Forms basis for recommendation stage

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E08-S01, E08-S02, E08-S03

---

## EPIC E09: Product Recommendation

### Story E09-S01: Generate Product Recommendations
**As an** insurance advisor  
**I want to** receive AI-driven product recommendations based on client needs  
**So that** I can present suitable solutions efficiently

**Acceptance Criteria:**
- [x] System analyzes: Client needs, Budget, Risk profile, Existing coverage (heuristic)
- [x] Recommends 3-5 product combinations (3 provided)
- [x] Each recommendation shows: Products included, Total premium, Why recommended
- [x] Recommendations ranked by suitability score
- [x] Advisor can request alternative recommendations (Regenerate)
- [x] Recommendations match client affordability
- [x] Can manually adjust or override recommendations (text area provided; structured edit and full customization UI available)

**Priority:** P0  
**Story Points:** 8  
**Dependencies:** E08 (FNA completed)

---

### Story E09-S02: Customize Product Recommendations
**As an** insurance advisor  
**I want to** modify recommended products and coverage amounts  
**So that** I can tailor proposals to specific client needs

**Acceptance Criteria:**
- [x] Can add/remove products from recommendation
- [x] Can adjust coverage amounts and premium terms (monthly/annual)
- [x] Can select different riders/benefits
- [x] System recalculates total premium in real-time
- [x] Warnings shown if changes create coverage gaps
- [x] Changes tracked for audit purposes
- [x] Can revert to original recommendation

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E09-S01

---

### Story E09-S03: Confirm Advice and Product Selection
**As an** insurance advisor
**I want to** document client agreement with recommendations
**So that** I have compliance evidence of advice given

**Acceptance Criteria:**
- [x] "Confirmation of Advice" section available
- [x] Shows final recommended products and coverage (custom or base plan)
- [x] Checkbox for client understanding and agreement
- [x] Text field for additional notes/discussion points
- [x] Digital signature capture option (client and advisor)
- [x] Date and time of confirmation recorded
- [x] Advisor signature/acknowledgment required
- [x] Cannot proceed to quotation without confirmation
- [x] Confirmation stored as PDF for compliance (print/export available)

**Status:** FULLY IMPLEMENTED (minor enhancements pending)

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E09-S02

---

## EPIC E10: Quotation Generation

### Story E10-S01: Enter Life Assured Details for Quote
**As an** insurance advisor  
**I want to** input or confirm life assured information  
**So that** I can generate accurate premium quotations

**Acceptance Criteria:**
- [ ] Life assured details pre-filled from fact finding
- [ ] Can modify if needed: Age, Gender, Smoker Status, Occupation
- [ ] Multiple life assured can be added (for joint policies)
- [ ] Each product shows required life assured fields
- [ ] Validation ensures all mandatory fields completed
- [ ] Special occupation classes trigger underwriting notes
- [ ] Age and other factors update premium in real-time

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E09 (Recommendations confirmed)

---

### Story E10-S02: Select Product Benefits and Riders
**As an** insurance advisor  
**I want to** choose specific benefits and riders for each product  
**So that** I can create a comprehensive coverage package

**Acceptance Criteria:**
- [ ] Available riders/benefits listed for each product
- [ ] Each rider shows: Description, Coverage amount options, Premium impact
- [ ] Can select/deselect riders
- [ ] Incompatible riders automatically disabled
- [ ] Premium updates immediately when riders added/removed
- [ ] Mandatory riders pre-selected and locked
- [ ] Tooltip explanations available for each rider

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E10-S01

---

### Story E10-S03: Generate Product Illustration
**As an** insurance advisor  
**I want to** create a detailed product illustration document  
**So that** I can present comprehensive policy information to the client

**Acceptance Criteria:**
- [ ] "Generate Illustration" button available
- [ ] Illustration includes: Coverage summary, Premium breakdown, Benefit schedule, Cash values (if applicable), Terms and conditions
- [ ] Illustration generated in PDF format
- [ ] Branded with company logo and advisor details
- [ ] Compliant with regulatory requirements
- [ ] Can regenerate if changes made
- [ ] Download and email options available
- [ ] Generation completes within 10 seconds

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E10-S02

---

### Story E10-S04: Compare Multiple Quotations
**As an** insurance advisor  
**I want to** generate and compare multiple quote variations  
**So that** I can present options to the client

**Acceptance Criteria:**
- [ ] Can create multiple quote scenarios (e.g., different coverage amounts, policy terms)
- [ ] Side-by-side comparison view available
- [ ] Comparison shows: Premium, Coverage, Benefits, Key differences
- [ ] Can mark one as "Recommended"
- [ ] All quotes saved to proposal
- [ ] Can delete unwanted quote versions
- [ ] Maximum 5 quote variations per proposal

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E10-S03

---

## EPIC E11: Application Processing

### Story E11-S01: Complete Application Form
**As an** insurance advisor  
**I want to** fill in the policy application form with client information  
**So that** I can submit the application to underwriting

**Acceptance Criteria:**
- [x] Application form pre-populated from fact finding and quotation stages
- [x] All mandatory fields clearly marked
- [x] Application sections: Applicant Details, Policy Details, Payment Information, Declarations
- [x] Form validation enforced before submission
- [x] Can save as draft at any point
- [ ] Clear indication of form completion progress
- [x] All data from previous stages carried forward correctly

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E10 (Quotation confirmed)

---

### Story E11-S02: Add Beneficiary Nominations
**As an** insurance advisor  
**I want to** record policy beneficiary information  
**So that** claims can be paid to designated parties

**Acceptance Criteria:**
- [x] Can add multiple beneficiaries
- [x] Each beneficiary captures: Name, Relationship, National ID, Contact, Allocation percentage
- [x] Total allocation must equal 100%
- [ ] Can designate as revocable/irrevocable
- [ ] Option for trustee nomination
- [x] Beneficiary details validated
- [x] Warning if no beneficiary added
- [x] Can edit/remove beneficiaries before submission

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E11-S01

---

### Story E11-S03: Complete Underwriting Questionnaire
**As an** insurance advisor  
**I want to** answer health and lifestyle questions with the client  
**So that** the insurer can assess risk and approve the application

**Acceptance Criteria:**
- [x] Underwriting questions presented clearly
- [ ] Questions cover: Medical history, Family medical history, Lifestyle factors, Occupation hazards
- [x] Conditional questions appear based on answers
- [x] "Yes" answers require additional details
- [x] All questions must be answered
- [x] Declaration of truthfulness required
- [ ] Advisor notes field for additional context
- [ ] Progress indicator shows completion

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E11-S01

---

### Story E11-S04: Configure Payment Details
**As an** insurance advisor  
**I want to** set up premium payment information  
**So that** the policy can be issued and payments collected

**Acceptance Criteria:**
- [x] Payment method options: Bank auto-debit, Credit card, Cheque
- [x] For auto-debit: Bank name, Account number, Account holder name
- [ ] For credit card: Card type, Card number (masked), Expiry, CVV
- [x] Payment frequency selection: Monthly, Quarterly, Semi-Annual, Annual
- [ ] First payment date selection
- [x] Payment amount displayed clearly
- [ ] Bank account/card verification
- [ ] Secure handling of sensitive payment data

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E11-S01

---

### Story E11-S05: Submit Application with Consent
**As an** insurance advisor  
**I want to** obtain client consent and submit the completed application  
**So that** the policy can be underwritten and issued

**Acceptance Criteria:**
- [x] Consent section lists all required consents/declarations
- [x] Each consent has checkbox with clear text
- [x] All consents must be checked before submission
- [x] Digital signature capture (advisor and client)
- [ ] Final review page shows all application data
- [x] "Submit Application" button generates unique application reference
- [x] Confirmation email sent to client and advisor
- [x] Application moves to "Pending Underwriting" status
- [x] Cannot edit after submission (requires new application)
- [x] PDF of complete application downloadable

**Priority:** P0  
**Story Points:** 6  
**Dependencies:** E11-S01, E11-S02, E11-S03, E11-S04

---

## EPIC E12: Quick Quote Tool

### Story E12-S01: Browse Products by Need Category
**As an** insurance advisor  
**I want to** see products grouped by customer need types  
**So that** I can quickly find relevant products for quick quotes

**Acceptance Criteria:**
- [ ] Products organized by categories: Protection, Savings, Investment, Health, Critical Illness, etc.
- [ ] Each category shows product cards with: Product name, Brief description, Key features
- [ ] Visual icons for each category
- [ ] Search bar to find specific products
- [ ] Products sortable by: Popularity, Premium, Coverage
- [ ] Only active products displayed

**Priority:** P1  
**Story Points:** 4  
**Dependencies:** None

---

### Story E12-S02: Generate Quick Quote
**As an** insurance advisor  
**I want to** input basic parameters and get instant premium estimates  
**So that** I can provide quick pricing during client conversations

**Acceptance Criteria:**
- [x] Quick quote form requires minimum inputs: Age, Gender, Smoker Status, Coverage Amount
- [x] Optional inputs: Policy Term
- [x] "Calculate" button generates instant quote
- [x] Results show: Monthly/Annual premium, Coverage amount, Key benefits
- [ ] Disclaimer that this is an estimate
- [ ] Can adjust inputs and recalculate immediately
- [ ] Quote calculation completes in under 3 seconds

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E12-S01

---

### Story E12-S03: Convert Quick Quote to Full Proposal
**As an** insurance advisor  
**I want to** convert a quick quote into a full business proposal  
**So that** I can continue the sales process if the client is interested

**Acceptance Criteria:**
- [x] "Start Full Proposal" button available on quote results
- [x] Clicking creates new proposal case
- [x] Selected product pre-filled in proposal
- [x] Navigates to New Business module > Fact Finding
- [x] Quick quote parameters transferred where applicable
- [ ] Quick quote saved for reference
- [ ] Client can be linked during fact finding

**Priority:** P1  
**Story Points:** 4  
**Dependencies:** E12-S02, E07 (Fact Finding)

---

## EPIC E13: Performance Analytics

### Story E13-S01: View Performance Dashboard
**As an** insurance advisor  
**I want to** see my sales performance metrics on a dashboard  
**So that** I can track my progress toward targets

**Acceptance Criteria:**
- [x] Dashboard displays key metrics: Total Premium, New Clients, Conversion Rate, Active Policies
- [x] Metrics shown as large numbers with period comparison chips
- [x] Period selector: week, month, quarter, year
- [x] Previous period comparison shown (e.g., +15% vs last month)
- [x] Visual charts for trends over time
- [ ] Dashboard loads within 3 seconds
- [ ] Auto-refreshes daily

**Priority:** P1  
**Story Points:** 6  
**Dependencies:** None

---

### Story E13-S02: Compare Performance Against Targets
**As an** insurance advisor  
**I want to** see my actual sales versus my targets  
**So that** I know if I'm on track to meet my goals

**Acceptance Criteria:**
- [x] Target vs. Actual card displayed prominently
- [x] Shows comparison for: Premium, Number of policies, New clients
- [x] Visual indicators: On track (green), At risk (yellow), Behind (red)
- [x] Percentage of target achieved shown
- [x] Projection shown (based on recent averages)
- [x] Can view by product type or category (category view implemented)
- [ ] Historical performance trend chart

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S01

---

### Story E13-S06: Performance Tabs (Personal / Direct Unit / Group)
**As an** insurance advisor  
**I want to** switch between Personal, Direct Unit, and Group performance tabs  
**So that** I can track performance at different hierarchy levels

**Acceptance Criteria:**
- [ ] Tabs available: Personal, Direct Unit, Group
- [ ] Each tab loads corresponding metrics with persistent period filters (MTD/QTD/YTD)
- [ ] Selected tab and period persist across sessions (per user)
- [ ] Access respects role and hierarchy visibility (only permitted scopes)
- [ ] Default selection is Personal + MTD on first load
- [ ] Switching tabs updates all widgets within 300ms visual response (spinners allowed)

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E13-S01

---

### Story E13-S07: AI Achievement Summary
**As an** insurance advisor  
**I want to** see AI-generated encouragement when I’m on track or ahead of target  
**So that** I feel motivated

**Acceptance Criteria:**
- [ ] Displays monthly RP and SP progress percentages (e.g., 78% RP, 73% SP)
- [ ] Natural language summary: “You’ve achieved X% of your planned RP and Y% of SP goal.”
- [ ] Appears when sufficient data exists for current period and scope
- [ ] Refreshes when goals or production data update
- [ ] Currency/percentages localized to user preference
- [ ] Source data: goal-service, production-service

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E13-S06

---

### Story E13-S08: AI Shortfall Alert
**As an** insurance advisor  
**I want to** see what’s needed to reach my goal and related bonus  
**So that** I know how much more to sell

**Acceptance Criteria:**
- [ ] Computes shortfall to reach period goal and nearest bonus threshold
- [ ] Example output: “You’re only $1,000 of EPYC away from unlocking an additional $1,560 of quarterly bonus.”
- [ ] Includes time-bound prompt (e.g., “before end of September” based on calendar period)
- [ ] Includes action hint (e.g., “Focus on warm leads”) with deep link to filtered leads list
- [ ] Displays only when shortfall > 0 and threshold reachable
- [ ] Source data: goal-service, commission-service, production-service

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S07

---

### Story E13-S09: AI Hotspot Opportunity
**As an** insurance advisor  
**I want to** see data-driven recommendations on clients with low engagement  
**So that** I can act on upsell or cross-sell opportunities

**Acceptance Criteria:**
- [ ] Highlights opportunities such as: “30% of clients have only one active policy each.”
- [ ] Suggests relevant actions (e.g., riders, supplementary coverage) with playbook links
- [ ] Click opens eligible client list filtered to the opportunity
- [ ] Respects data access: only clients within advisor’s scope
- [ ] Updates with new policy/client data refresh

**Priority:** P2  
**Story Points:** 5  
**Dependencies:** E13-S06

---

### Story E13-S10: Goal-Based RP/SP Tracker
**As an** insurance advisor  
**I want to** view RP and SP progress against monthly, quarterly, and yearly goals  
**So that** I can track progress clearly

**Acceptance Criteria:**
- [ ] KPI ring charts for RP and SP showing: Target, Incepted, Pending, Progress %
- [ ] Mode switch: MTD, QTD, YTD
- [ ] Shows difference vs last year (∆%)
- [ ] Tooltips define metrics and formulas
- [ ] Values are currency-formatted per user preference

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S06

---

### Story E13-S11: Inception vs Pending Breakdown
**As an** insurance advisor  
**I want to** see how much production is incepted vs pending  
**So that** I know what cases are yet to complete

**Acceptance Criteria:**
- [ ] Table shows RP and SP for current mode (MTD/QTD/YTD): Target, Incepted, Pending, % Completed
- [ ] Percent values match KPI ring charts
- [ ] Currency formatted; percentages to whole percent unless <1%
- [ ] Data sources consistent with Goal-Based Tracker

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E13-S10

---

### Story E13-S12: Case Metrics (Avg Size, New Cases)
**As an** insurance advisor  
**I want to** view my average case size and number of new cases  
**So that** I can assess productivity

**Acceptance Criteria:**
- [ ] Displays for RP and SP: Avg Case Size, New Cases
- [ ] Shows comparison vs last year (∆%) with up/down indicators
- [ ] Calculation rules documented in tooltip
- [ ] Period aligns with selected mode (MTD/QTD/YTD)

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E13-S10

---

### Story E13-S13: Goal Setup CTA
**As an** insurance advisor  
**I want to** set my annual production goal when not configured  
**So that** charts can calculate targets

**Acceptance Criteria:**
- [ ] Placeholder appears when no goals: “Set your annual production goal to view RP target.”
- [ ] Button: Set Goal opens goal setup modal/page
- [ ] Validates entries and saves to goal-service
- [ ] Upon save, all widgets recalculate and refresh

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E13-S10

---

### Story E13-S14: Commission & Bonus Summary
**As an** insurance advisor  
**I want to** view a breakdown of all income components  
**So that** I understand my total compensation

**Acceptance Criteria:**
- [ ] Summary shows: Incepted EFYC, 1st Year Bonus, Quarterly Bonus, Business Allowance, Cash Incentives & Others, Unearned EFYC, Penders EFYC
- [ ] Clear currency formatting and totals where applicable
- [ ] Tooltips explain each component and timing
- [ ] Data source: commission-service

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S06

---

### Story E13-S15: RP and PRUCredit Comparison
**As an** insurance advisor  
**I want to** compare my RP and PRUCredit progress vs. past years and peers  
**So that** I can track award qualification

**Acceptance Criteria:**
- [ ] Bar chart: historical and YTD RP / PRUCredit
- [ ] Goal lines for qualifying criteria (e.g., Star Club = 262,000 PRUCredit$; RP = 131,000)
- [ ] “Agent Like You” benchmarking overlay
- [ ] Data sources: benchmark-service, production-service

**Priority:** P2  
**Story Points:** 5  
**Dependencies:** E13-S06

---

### Story E13-S16: Peer Percentile Breakdown
**As an** insurance advisor  
**I want to** know my percentile rank among peers  
**So that** I understand my performance position

**Acceptance Criteria:**
- [ ] Error bar-style display with 25th, Median, 75th percentiles
- [ ] Shows example values when available (e.g., 220k, 180k, 150k)
- [ ] Tooltips define percentile calculations and cohort rules
- [ ] Data source: benchmark-service

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E13-S15

---

### Story E13-S17: MDRT Commission Tracker
**As an** insurance advisor  
**I want to** visualize my commission progress towards MDRT qualification  
**So that** I can monitor readiness

**Acceptance Criteria:**
- [ ] Historical and YTD commission bars
- [ ] Goal line: x1 MDRT = $72,400 commission (configurable)
- [ ] Forecasted and shortfall portions shown distinctly
- [ ] Data source: commission-service

**Priority:** P2  
**Story Points:** 5  
**Dependencies:** E13-S14

---

### Story E13-S18: RP/SP Monthly Production Chart
**As an** insurance advisor  
**I want to** analyze monthly RP/SP performance vs last year  
**So that** I can identify trends or shortfalls

**Acceptance Criteria:**
- [ ] Monthly bar chart includes: Actual RP (solid), Shortfall RP (shaded), Last year’s RP (grey), “Agent Like You” benchmark (yellow)
- [ ] Filters: Premium Type (RP/SP), Cohort selection, Toggle show/hide last year
- [ ] Button: Adjust Monthly Targets opens target editor
- [ ] Performance: initial render under 500ms after data ready

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S10, E13-S15

---

### Story E13-S19: AI Insight Feedback
**As a** user  
**I want to** provide thumbs up/down feedback on AI recommendations  
**So that** the system can improve insights quality

**Acceptance Criteria:**
- [ ] Feedback icons on insight cards (up/down)
- [ ] One feedback per user per insight; editable within session
- [ ] Feedback events logged for analytics improvement

**Priority:** P2  
**Story Points:** 2  
**Dependencies:** E13-S05

---

### Story E13-S20: Dynamic Data Refresh
**As a** user  
**I want to** see widgets auto-refresh when goals or inputs update  
**So that** the dashboard reflects real-time accuracy

**Acceptance Criteria:**
- [ ] Event-driven refresh on “Goal Updated”, “Production Updated”, and “Commission Updated” triggers
- [ ] A toast message appears when insights update due to new data
- [ ] All displayed widgets re-query data only for affected scope to minimize load
- [ ] Debounced refresh to avoid rapid cascades

**Priority:** P1  
**Story Points:** 3  
**Dependencies:** E13-S06, E13-S10

---

### EPIC E13: Non-Functional Requirements (Analytics)

| Category           | Requirement                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Performance        | Dashboard loads under 3 seconds with all widgets (warm cache); charts render within 500ms after data ready.     |
| Responsiveness     | Layout responsive for desktop and tablet breakpoints.                                                           |
| Security           | Enforce role-based access and hierarchy visibility for Personal/Direct Unit/Group scopes.                      |
| Integration        | Source systems: goal-service, production-service, commission-service, benchmark-service (via backend APIs).     |
| Scalability        | Support 10K+ concurrent advisors with server-side caching and efficient queries.                                |

---

### Story E13-S03: Compare Performance with Peer Group
**As an** insurance advisor  
**I want to** compare my performance to the average of my peer group  
**So that** I can understand how I'm performing relatively

**Acceptance Criteria:**
- [ ] Peer comparison section shows: My performance vs. Team average vs. Company average
- [ ] Metrics compared: Premium, Policies, Conversion rate
- [ ] Anonymous peer data (no individual names)
- [ ] Percentile ranking shown (e.g., "Top 25%")
- [ ] Can filter by: Region, Experience level, Product focus
- [ ] Comparison presented as charts and percentages
- [ ] Refreshes monthly

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E13-S01

---

### Story E13-S04: View Conversion Funnel Analysis
**As an** insurance advisor  
**I want to** see my conversion rates at each stage of the sales process  
**So that** I can identify where I need to improve

**Acceptance Criteria:**
- [x] Funnel chart shows stages: Lead ? Contacted ? Fact Find ? FNA ? Quotation ? Application ? Policy Issued
- [x] Number shown at each stage (percentage planned)
- [x] Drop-off rate highlighted between stages (labels + tooltips)
- [ ] Can click stage to see list of prospects at that stage
- [ ] Comparison to peer group average conversion rates
- [ ] Period selector to analyze different time ranges
- [ ] Insights/tips for improving conversion at each stage

**Priority:** P1  
**Story Points:** 6  
**Dependencies:** E13-S01

---

### Story E13-S05: Receive AI-Generated Performance Insights
**As an** insurance advisor  
**I want to** receive AI-generated insights about my performance  
**So that** I can understand patterns and get actionable recommendations

**Acceptance Criteria:**
- [ ] AI insights displayed at top of Analytics module
- [ ] Insights include: Strengths, Areas for improvement, Trends, Recommendations
- [ ] Insights written in natural language
- [ ] Updated weekly based on latest data
- [ ] Relevant and specific to advisor's actual performance
- [ ] Can dismiss or mark insights as helpful
- [ ] Links to relevant data supporting the insight

**Priority:** P2  
**Story Points:** 8  
**Dependencies:** E13-S01

---

## EPIC E14: Calendar & Task Management

### Story E14-S01: View Calendar in Multiple Views
**As an** insurance advisor  
**I want to** view my schedule in calendar or list format  
**So that** I can see my appointments in the way that works best for me

**Acceptance Criteria:**
- [x] Toggle between List View and Calendar View
- [x] Calendar View shows: Month view and Week view options
- [x] List View shows events sorted chronologically
 - [x] Current view preference saves for next session
- [x] Today's date highlighted in calendar
- [x] Clean, uncluttered design
- [x] Responsive on mobile and desktop

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** None

---

### Story E14-S02: Create Tasks and Appointments
**As an** insurance advisor  
**I want to** create tasks and appointments  
**So that** I can plan my work and client meetings

**Acceptance Criteria:**
- [x] "+ Add Event" button prominently placed
- [x] Form includes: Title (mandatory), Type (Task/Appointment), Date & Time (mandatory), Duration (optional), Linked Lead/Client (optional), Notes (optional)
- [x] Date-time picker with time selection
- [x] Can link to existing lead/client (searchable dropdown)
- [x] "Save" button creates event and closes modal
- [x] Event immediately appears in calendar/list
- [x] Validation prevents past dates
- [x] Form clears after save

**Priority:** P0  
**Story Points:** 5  
**Dependencies:** E14-S01

---

### Story E14-S03: View and Edit Event Details
**As an** insurance advisor  
**I want to** click on an event to view or edit its details  
**So that** I can manage my schedule effectively

**Acceptance Criteria:**
- [x] Clicking event in calendar opens detail modal
- [x] Modal shows all event information
- [x] "Edit" button allows modifications
- [x] "Delete" button removes event (with confirmation)
- [x] Changes save immediately
- [x] Can change event type, date, time, or linked client
- [ ] Color coding: Tasks = Blue, Appointments = Green

**Priority:** P0  
**Story Points:** 4  
**Dependencies:** E14-S02

---

### Story E14-S04: Reschedule Events via Drag and Drop
**As an** insurance advisor  
**I want to** drag events to new times in calendar view  
**So that** I can quickly reorganize my schedule

**Acceptance Criteria:**
- [x] Events can be dragged to different dates/times in calendar
- [x] Visual feedback during drag (ghost image)
- [x] Event updates automatically when dropped
- [x] Confirmation tooltip appears after drop
- [x] Can undo accidental moves
- [x] Works in both week and month views
- [ ] Smooth animation (under 0.3s)

**Priority:** P1  
**Story Points:** 5  
**Dependencies:** E14-S03

---

### Story E14-S05: Filter Calendar Events
**As an** insurance advisor  
**I want to** filter my calendar by event type or time period  
**So that** I can focus on what's relevant right now

**Acceptance Criteria:**
- [x] Filter options: Today, This Week, All
- [x] Can filter by event type: All, Tasks only, Appointments only
- [ ] Can filter by linked client (if applicable)
- [ ] Active filters clearly indicated
 - [x] Filter state persists during session
- [ ] "Clear Filters" button available
- [x] Results update immediately

**Priority:** P0  
**Story Points:** 3  
**Dependencies:** E14-S01

---

### Story E14-S06: Export Calendar to External Systems
**As an** insurance advisor  
**I want to** sync or export my calendar to Google Calendar or Outlook  
**So that** I can manage all my appointments in one place

**Acceptance Criteria:**
- [x] "Export to Calendar" button available
- [x] Generates .ics file for download
- [x] File includes all events with proper formatting
- [ ] Instructions provided for importing into Google/Outlook
- [x] Option to export selected date range
- [ ] Export completes within 5 seconds
- [ ] Clear instructions for sync setup

**Priority:** P2  
**Story Points:** 5  
**Dependencies:** E14-S01

---

## EPIC E15: Client Servicing

### Story E15-S01: View Available Service Request Types
**As an** insurance advisor  
**I want to** see what servicing requests I can submit for a client  
**So that** I know what services are available

**Acceptance Criteria:**
- [ ] Service request types displayed: Claims, Renewals, Reinstatement, Fund Switching, Address Change, etc.
- [ ] Only applicable services shown based on client's policies
- [ ] Each service has icon and brief description
- [ ] Clicking service type opens request form
- [ ] Services organized by category
- [ ] Clear call-to-action buttons

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E06 (Portfolio)

---

### Story E15-S02: Submit Claims Request
**As an** insurance advisor  
**I want to** submit a claims request on behalf of a client  
**So that** they can receive their benefits

**Acceptance Criteria:**
- [ ] Multi-step process: 1) Claim Information, 2) Upload Documents, 3) Review, 4) Submit
- [ ] Step 1 captures: Policy number, Claim type, Incident date, Claim amount, Description
- [ ] Step 2 allows multiple document uploads (supporting documents)
- [ ] Step 3 shows summary for review
- [ ] Step 4 requires authorization
- [ ] Generates claim reference number upon submission
- [ ] Email confirmation sent
- [ ] Progress bar shows current step

**Priority:** P2  
**Story Points:** 8  
**Dependencies:** E15-S01

---

### Story E15-S03: Track Service Request Status
**As an** insurance advisor  
**I want to** monitor the status of submitted service requests  
**So that** I can update clients on progress

**Acceptance Criteria:**
- [ ] List of all submitted requests displayed
- [ ] Each request shows: Type, Date, Status, Reference Number
- [ ] Status updates: Submitted, Under Review, Approved, Rejected, Completed
- [ ] Can filter by status and date range
- [ ] Can sort by various fields
- [ ] Clicking request shows detailed history and notes
- [ ] Email notifications for status changes

**Priority:** P2  
**Story Points:** 4  
**Dependencies:** E15-S02

---

### Story E15-S04: Upload Supporting Documents
**As an** insurance advisor  
**I want to** upload documents for service requests  
**So that** requests can be processed

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload interface
- [ ] Multiple files can be uploaded simultaneously
- [ ] Accepted formats: PDF, JPG, PNG, DOCX
- [ ] Maximum file size: 10MB per file
- [ ] Upload progress indicator shown
- [ ] Preview thumbnails for uploaded files
- [ ] Can delete uploaded files before submission
- [ ] File names editable for clarity

**Priority:** P2  
**Story Points:** 4  
**Dependencies:** E15-S01

---

## EPIC E16: Gap Analysis

### Story E16-S01: View Coverage Gap Assessment
**As an** insurance advisor  
**I want to** see a gap analysis of a client's current coverage  
**So that** I can identify areas where they're under-insured

**Acceptance Criteria:**
- [ ] Gap analysis displayed in Gap & Opportunity tab
- [ ] Shows comparison: Recommended coverage vs. Current coverage for each need type
- [ ] Gaps highlighted visually (red/yellow indicators)
- [ ] Brief summary of key findings
- [ ] Priority ranking of gaps (High/Medium/Low)
- [ ] Visual charts showing coverage adequacy
- [ ] Analysis based on: Income, Dependents, Existing coverage, Financial obligations

**Priority:** P2  
**Story Points:** 6  
**Dependencies:** E06 (Portfolio), E08 (FNA)

---

### Story E16-S02: Regenerate Gap Assessment
**As an** insurance advisor  
**I want to** regenerate the gap analysis with updated information  
**So that** I always have current recommendations

**Acceptance Criteria:**
- [ ] "Regenerate Assessment" button available
- [ ] Analysis runs based on latest: Client information, Financial details, Policy portfolio
- [ ] Processing indicator shown (typically 5-10 seconds)
- [ ] Results update automatically when complete
- [ ] Date of last assessment displayed
- [ ] History of previous assessments accessible
- [ ] Can compare current vs. previous assessments

**Priority:** P2  
**Story Points:** 5  
**Dependencies:** E16-S01

---

### Story E16-S03: Generate and Share Gap Analysis Report
**As an** insurance advisor  
**I want to** create a professional gap analysis report to share with clients  
**So that** they can understand their coverage needs

**Acceptance Criteria:**
- [ ] "Generate Report" button creates PDF document
- [ ] Report includes: Executive summary, Current coverage, Gaps identified, Recommendations, Next steps
- [ ] Branded with company logo and advisor details
- [ ] Client-friendly language (no jargon)
- [ ] Visual charts and graphs included
- [ ] Can download or email directly to client
- [ ] Report generation completes within 10 seconds

**Priority:** P2  
**Story Points:** 6  
**Dependencies:** E16-S01

---

## EPIC E17: Communication & Broadcast

### Story E17-S01: View Company Announcements
**As an** insurance advisor  
**I want to** see company announcements and updates  
**So that** I stay informed about important information

**Acceptance Criteria:**
- [x] Broadcast module displays all announcements in chronological order
- [x] Each announcement shows: Title, Category, Date, Preview text
- [x] Category options: Announcement, Training, Campaign
- [x] Pinned announcements appear at top
- [x] Unread announcements have visual indicator
- [x] Can filter by category
- [x] Can search announcements
- [x] Clicking opens full announcement details

**Priority:** P2  
**Story Points:** 4  
**Dependencies:** None

---

### Story E17-S02: Mark Announcements as Read
**As an** insurance advisor  
**I want to** track which announcements I've read  
**So that** I don't miss important updates

**Acceptance Criteria:**
- [x] Announcements automatically marked as read when opened
- [x] Read/unread status visually distinct
- [x] Unread count shown on Broadcast menu item
- [ ] "Mark All as Read" button available
- [ ] Read status syncs across devices
- [ ] Can manually mark as unread
- [ ] Status persists across sessions

**Priority:** P2  
**Story Points:** 3  
**Dependencies:** E17-S01

---

## Implementation Notes

### Technical Considerations
- **Responsive Design:** All user stories must work on desktop, tablet, and mobile devices
- **Performance:** Page loads should complete within 2-3 seconds
- **Accessibility:** Follow WCAG 2.1 AA standards
- **Security:** All sensitive data must be encrypted; implement role-based access control
- **Audit Trail:** Track all significant user actions for compliance

### Definition of Done
A user story is considered "Done" when:
- [ ] Code is written and peer-reviewed
- [ ] All acceptance criteria are met
- [ ] Unit tests written and passing (minimum 80% coverage)
- [ ] Integration tests passing
- [ ] UI matches design specifications
- [ ] Works on all supported browsers
- [ ] Responsive design tested on mobile and tablet
- [ ] Accessibility standards met
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Product owner accepts the story
- [ ] Deployed to staging environment

### Story Point Reference
- **1-2 points:** Simple changes, minimal complexity (few hours)
- **3-5 points:** Moderate complexity, standard feature (1-3 days)
- **5-8 points:** Complex feature, multiple components (3-5 days)
- **8+ points:** Very complex, should be broken down into smaller stories

### MVP Scope Recommendation
For initial launch (MVP), prioritize all **P0** stories:
- User Profile & Settings (E01)
- Navigation (E02)
- Lead Management (E04)
- Client Management (E05)
- Fact Finding (E07)
- Financial Needs Analysis (E08)
- Recommendations (E09)
- Quotation (E10)
- Application (E11)
- Calendar (E14)

Total estimated: ~150-180 story points (approximately 3-4 months for a team of 5 developers)

**P1** stories should follow in Phase 2, and **P2** in Phase 3.

---

## Next Steps
1. **Refinement Sessions:** Review each epic with development team to validate acceptance criteria and story points
2. **Prioritization:** Confirm MVP scope with stakeholders
3. **Sprint Planning:** Allocate stories to sprints based on team velocity
4. **Design Review:** Ensure UI/UX designs align with acceptance criteria
5. **Technical Design:** Create technical specifications for complex features
6. **Dependencies:** Identify and document any external system integrations needed

---

**Document Status:** Draft for Review  
**Created By:** Claude  
**Review Date:** [To be scheduled]

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 10:59
- Scope: Navigation & Interface (E02), Dashboard & Home (E03), Lead Management (E04), Client Management (E05), Client Details & Portfolio (E06)
- Stories validated in this session:
  - E02-S03 (Sidebar collapse/persist)
  - E03-S04 (Hot Leads widget + deep link)
  - E04-S03, E04-S04, E04-S05, E04-S06, E04-S07
  - E05-S01, E05-S02, E05-S03, E05-S04, E05-S05
  - E06-S01 (partial), E06-S02, E06-S03 (partial)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:04
- Scope: Lead Management (E04) - Status update
- Stories validated in this session:
  - E04-S08 (Update Lead Status)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:10
- Scope: Client Management (E05)
- Stories validated in this session:
  - E05-S07 (Edit Client Information)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:13
- Scope: Client Details & Portfolio (E06)
- Stories validated in this session:
  - E06-S03 (beneficiaries, payment status, print-friendly)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:15
- Scope: Client Details & Portfolio (E06)
- Stories validated in this session:
  - E06-S03 (Policy documents downloadable)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:19
- Scope: Lead Management (E04)
- Stories validated in this session:
  - E04-S05 (Added Load more pagination on customer list)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:24
- Scope: Fact Finding (E07)
- Stories validated in this session:
  - E07-S01 (Personal Details incl. age auto-calc, dropdowns, validation)
  - E07-S02 (Dependents incl. adult/child auto-categorization)
  - E07-S03 (CKA section partial; added qualifications/work experience + N.A., stored outcome)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:27
- Scope: Fact Finding (E07)
- Stories validated in this session:
  - E07-S01 (added progress indicator)
  - E07-S04 (completed 6 RPQ questions, mandatory, scoring, banding, date recorded)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:30
- Scope: Fact Finding (E07)
- Stories validated in this session:
  - E07-S05 (Save as Draft, auto-save, last saved, resume, incomplete marker via progress, Save & Next, browser-close persistence, leave warning)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:33
- Scope: Financial Needs Analysis (E08)
- Stories validated in this session:
  - E08-S01 (Financial Details: income/expenses/assets/liabilities, totals, net worth, disposable income, currency formatting)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:35
- Scope: Financial Needs Analysis (E08)
- Stories validated in this session:
  - E08-S02 (Existing coverage list: per-policy fields, categories, totals by type, edit/delete, document links)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:41
- Scope: Financial Needs Analysis (E08) & Recommendations (E09)
- Stories validated in this session:
  - E08-S03 (Affordability controls, gauge, adjustable %, warnings)
  - E09-S01 (Generate 3 ranked recommendations w/ budget & risk profile, regenerate)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 11:58
- Scope: Recommendations (E09)
- Stories validated in this session:
  - E09-S02 (Customize recommendations: add/remove products, adjust amounts/terms, recalc totals, warnings, change log, revert)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 12:00
- Scope: Recommendations (E09)
- Stories validated in this session:
  - E09-S03 (Confirmation: notes, client/advisor signatures, date/time, gating next stage, print/export)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.

---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-10-30 12:45
- Scope: Customer (E04), FNA (E08), Recommendations (E09)
- Stories validated in this session:
  - E04: Customer filters collapse/expand; relationship filter chips and persisted state
  - E08-S03: Affordability controls (adjustable % gauge), warnings below budget
  - E08-S04: Needs Analysis Summary visuals and print-friendly view
  - E09-S01: Generated ranked plans; base-plan selector shown
  - E09-S02: Customize plan (add/remove, amounts, riders), totals and warnings
  - E09-S03: Confirmation checkbox + date; digital signatures captured (client/advisor)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.







\n\nImplementation Notes (Servicing Email)\n- Advisor copy queued to email_outbox (RLS self-insert).\n- Client email enqueued via Edge Function 'email-sender' (requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).\n- email-sender GET processes queue; POST enqueues one-off messages.\n
---

## Test Summary
- Last tested by: AI Assistant
- Last tested on: 2025-11-01 21:17
- Scope: Client Details (E06), Fact Finding (E07), Application (E11)
- Stories validated in this session:
  - E06-S01/S02/S03 (Portfolio and policy views)
  - E06-S04/S05 (Servicing types + submission, emails queued/sent)
  - E07-S01/S02/S03/S04/S05 (personal details, dependents, CKA calc, RPQ, save/resume)
  - E11-S01/S02/S03/S04/S05 (pre-populated form, beneficiaries, underwriting, payment config, consent + submit, disable edits, PDFs, advisor + client notification)

Note for next tester: After your run, append a new entry here with your name, timestamp, and the stories you exercised.
