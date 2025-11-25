# AdvisorHub V2 Enhancement Requirements

**Document Date:** 2025-11-22
**Purpose:** Comprehensive comparison between current AdvisorHub and AdvisorHub V2 specifications to identify required enhancements.

---

## Executive Summary

This document outlines the major enhancements required to upgrade the current AdvisorHub to V2 specifications. The V2 version introduces significant AI-powered features, entity customer support, new modules, and enhanced user experience across all areas.

### Key Statistics
- **New Modules:** 2 (Visualizers, Servicing)
- **Renamed Modules:** 2 (ToDo → Smart Plan, Broadcast → News)
- **Enhanced Modules:** 6 (Customers, Products, Proposals, Analytics, Mira AI, Profile)
- **New Entity Types:** Entity customers with group insurance support
- **AI Enhancements:** Deep integration of Mira AI assistant across all modules

---

## 1. Customer Management Enhancements

### 1.1 Entity Customer Support ⭐ MAJOR
**Current:** Only supports individual customers
**Required:** Add full entity (company) customer support

**Implementation Details:**
- Add customer type field: `Individual` | `Entity`
- Entity-specific fields:
  - Company Name
  - Business Registration Number
  - Industry
  - Keyman details
  - Number of Employees
  - Annual Revenue
- Different tab structure for entity customers:
  - Overview: "Company Details" instead of "Individual Details"
  - Portfolio: Group insurance policies (Group Life, Group Medical, Group PA)
  - Servicing: Group-specific service requests (change of members, change rider)
  - Gap & Opportunity: Hidden for entities

### 1.2 Customer Temperature Tracking 🌡️
**Current:** Basic lead status tracking
**Required:** Dynamic temperature calculation (Cold/Warm/Hot)

**Temperature Logic:**
```
Cold: Last contacted > 30 days or never + no active proposals/service requests
Warm: Last contacted > 30 days or never + has active proposals/service requests
      OR Last contacted within 30 days
Hot: Last contacted within 7 days
```

**Visual:** Display as label/badge with color coding (blue/yellow/red)

### 1.3 "Our Journey" Timeline Component ⭐ MAJOR
**Current:** No timeline visualization
**Required:** Horizontal timeline showing relationship milestones

**Features:**
- Milestone cards on alternating sides
- Event types with icons and colors:
  - 🎉 First Policy Purchased (Green)
  - 📋 Policy Renewal (Blue)
  - 🔄 Policy Changed (Orange)
  - 👶 Life Event (Yellow) - Marriage, new born, home purchase
  - 💰 Policy Claim (Red)
- Each milestone shows: Month & Year, Event Title, Short Description, Icon

**Technical:** Create reusable React component `<OurJourneyTimeline />`

### 1.4 Enhanced Customer Detail Tabs
**Current:** Basic customer overview
**Required:** Four comprehensive tabs

#### Tab 1: Overview
- **Our Journey** timeline (see 1.3)
- **Individual Details** (for individuals) or **Company Details** (for entities)
- **Quick Action** buttons:
  - New Proposal → Navigate to new proposal creation
  - Resume Proposal → Filter proposals for this customer
  - Schedule Appointment → Pre-fill appointment form with customer
- **Appointments** section: Show upcoming/past appointments with quick navigation to Smart Plan

#### Tab 2: Portfolio
**Current:** Limited policy display
**Required:** Visual coverage analysis + detailed policy list

**Coverage Overview:**
- Infographic visualization of coverage types
- Coverage types: Hospitalisation, Death, Critical Illness, TPD, Disability Income, Accidental, Savings, Lifestyle, Travel
- Color code: Covered needs (colored), Uncovered needs (greyed out)

**Active Policies:**
- Horizontal policy cards showing:
  - Product name (header)
  - Policy status label
  - Policy number
  - Coverage type
  - Sum assured
  - Premium + frequency

#### Tab 3: Servicing ⭐ NEW MODULE
**Required:** New servicing functionality (see Section 5)

#### Tab 4: Gap & Opportunity ⭐ MAJOR
**Current:** Not available
**Required:** AI-powered gap analysis

**Features:**
- Auto-generate gap assessment based on customer data
- Show brief summary of gaps and opportunities
- "Regenerate" button to refresh analysis
- Generate and share professional report
- Financial Planning History list (previously generated reports)

**For Entity:** Hide this tab entirely

### 1.5 Customer List Enhancements
**Current:** Basic filtering
**Required:** Advanced filtering and sorting

**Additional Filters:**
- Customer Type: Individual | Entity
- Relationship Type: New | Existing
- Lead Sources: Event | Referral | Social Media | Website | Walk-in | Cold Call | Other
- Last Contacted: Last 7 days | Last 30 days | More than 30 days | Never contacted
- Customer Temperature: Cold | Warm | Hot

**Sort Options:**
- Alphabetical (A-Z, Z-A)
- Next Appointment (Ascending, Descending)
- Last Created (Newest first, Oldest first)

**Card Display:**
- Header: Name + labels (customer type, relationship type, temperature)
- Below: Phone number, ID number
- Metrics: Last contacted, Active proposals (count), Active service requests (count), Active policies (count), Total monthly premium

---

## 2. Smart Plan Module (Rename from "ToDo") ⭐ MAJOR

### 2.1 Module Rename
**Current:** "ToDo"
**Required:** "Smart Plan"

**Rationale:** Better reflects AI-powered planning capabilities

### 2.2 Enhanced Task/Appointment Management

#### 2.2.1 Task Detail Tabs
**Current:** Basic task view
**Required:** Three tabs with AI integration

**Tab 1: Notes**
- Text notes (rich text editor)
- Voice notes (audio recording with transcription)
- Upload documents (PDF, images, etc.)

**Tab 2: Summary by Mira** ⭐ AI-POWERED
- Auto-generate summary from notes/documents
- Detect customer intents:
  - Create/update customer information
  - Create new proposal
  - Update existing proposal
- When intent detected: Show structured details + confirmation button
- Example: "John Tan wants to upgrade medical plan" → Mira asks "Should I create a draft proposal?" → Creates proposal on confirmation

**Constraints:**
- Intent detection only works if task is linked to a customer
- If no customer linked: Provide abstract summary only, no creation/update actions

#### 2.2.2 Appointment Detail Tabs
**Current:** Basic appointment view
**Required:** Three tabs with transcript analysis

**Tab 1: Transcript** ⭐ AI-POWERED
- Start recording directly in app
- Upload recording/transcript file
- Paste meeting link to add Mira to meeting (virtual AI participant)
- Support multiple transcripts per appointment (sequential recording)

**Tab 2: Notes**
- Same as Task notes (text, voice, documents)

**Tab 3: Summary by Mira** ⭐ AI-POWERED
- Analyze transcript + notes
- Extract structured information:
  - Customer demographics (name, DOB, marital status)
  - Financial data (income, expenses)
  - Insurance needs discussion
- Detect intent to create/update proposal
- Example: "Sarah Chen (new lead) discussed retirement planning" → Mira extracts details → "Should I create a proposal with these details?" → Creates draft proposal on confirmation

**Constraints:**
- Intent detection only works if appointment is linked to a customer
- If no customer linked: Provide abstract summary only

#### 2.2.3 Birthday Reminder System 🎂
**Current:** Not available
**Required:** Automatic birthday tracking

**Features:**
- Auto-scan all customers' date_of_birth
- Generate synthetic tasks for birthdays in current view period
- Visual: Pink cake icon 🎂 + pink label
- Smart date handling: Calculate for current year + next year if viewing ahead
- Toggle: Show/hide birthdays (switch in filter menu)
- Mark as complete after sending wish (hides for current year)

#### 2.2.4 Calendar Integration
**Current:** Internal calendar only
**Required:** External calendar sync

**Supported Calendars:**
- Google Calendar
- Outlook Calendar
- Apple Calendar

**Features:**
- Two-way sync
- "Connect to Calendar" button in settings
- Drag & drop events updates external calendar

#### 2.2.5 Enhanced Filtering
**Current:** Basic filters
**Required:** Comprehensive filtering

**Time Range:**
- Today
- This Week
- This Month
- All Time

**Event Type:**
- Tasks only
- Appointments only
- Both

**Customer:**
- Filter by specific customer (dropdown with search)

**Search:**
- Real-time search by title, notes, customer name

---

## 3. Visualizers Module ⭐ NEW MODULE

### 3.1 Module Overview
**Current:** Does not exist
**Required:** Creative financial visualization tool

**Purpose:** "Creative sandbox to turn numbers into stories"

### 3.2 Core Concept: NPC (Non-Player Character)
**Innovative Approach:**
- Create a "NPC" (non-personalized character) with similar profile to customer
- Allows scenario testing without directly referencing customer
- Customer can visualize without feeling "sold to"

### 3.3 Features

#### 3.3.1 Customer Selection
- Search and select customer from customer list
- Auto-pull customer's financial data:
  - Income (monthly/annual)
  - Expenses (monthly/annual)
  - Assets (current value)
  - Liabilities (outstanding amounts)
- Create NPC with similar profile

#### 3.3.2 Wealth & Cash Flow Projection
**Visualization Types:**
1. **Chart View:** Line/area chart showing wealth projection over time
2. **Sankey Diagram View:** Flow visualization showing income → expenses → savings/investments

**Time Range:** Typically 10-30 years projection

#### 3.3.3 Life Event Simulation
**Add Life Events:**
- Marriage
- New born child
- Buy new house
- Buy new car
- Large expense (education, medical)
- Illness/Injury: Medical costs + temporary income loss
- Death: Family loses main income earner

**Impact Analysis:**
- Visualize how each event affects wealth projection
- Show cash flow changes
- Highlight potential shortfalls

#### 3.3.4 Insurance Scenario Comparison
**Compare Scenarios:**
- Baseline: No additional insurance
- Scenario 1: With proposed insurance coverage
- Scenario 2: Alternative coverage options

**Visualization:**
- Overlay projections on same chart
- Highlight differences in outcomes
- Show protection gaps

#### 3.3.5 Editable Financial Data
**Allow Editing:**
- User can adjust income, expenses, assets, liabilities
- Helps with "What if" analysis
- **Important:** Edits here DO NOT override Financial Planning or Recommendation data in proposals

#### 3.3.6 Dynamic Updates
- When selected customer changes → NPC details update automatically
- Re-run projections with new customer's data

### 3.4 Technical Implementation

#### 3.4.1 Sankey Diagram
**Reference Implementation:** Provided in AdvisorHub2.txt (lines 241-1100)
- Uses D3.js for visualization
- Shows cashflow: Opening Balance + Inflows → Total Cash → Closing Balance/Deficit + Outflows
- Separate Investment outflows (teal) from Other outflows (red)
- Interactive: Click flows to see details

**Key Components:**
```javascript
// Flow categories
Inflows:
  - Active Income
  - Dividend
  - Passive Income
  - Business
  - Rental
  - Other

Outflows:
  - Expenses
  - Installment
  - Investment (displayed separately in teal)
  - Tax
  - Other
```

#### 3.4.2 Chart Projection
**Technology:** D3.js or Chart.js
**Features:**
- X-axis: Years (2025, 2026, ...)
- Y-axis: Dollar amounts ($k format)
- Multiple lines/areas for different scenarios
- Interactive: Click year to see details
- Overlay life events as markers

### 3.5 Mira Integration
**Split View:** When user clicks "Ask Mira" from Visualizers
- Mira understands context: User is viewing customer's financial projection
- Ready to answer questions about:
  - Projection methodology
  - Why certain events have specific impacts
  - Alternative scenarios
  - Insurance recommendations based on gaps

---

## 4. News Module (Rename from "Broadcast") ⭐ MAJOR

### 4.1 Module Rename
**Current:** "Broadcast"
**Required:** "News"

**Rationale:** Better represents content hub nature

### 4.2 Content Categorization ⭐ MAJOR
**Current:** Single broadcast type
**Required:** Three distinct categories

**Categories with Visual Identity:**

| Category | Color | Icon | Purpose |
|----------|-------|------|---------|
| Announcements | Blue | 📢 Megaphone | General news and updates |
| Training | Teal | 🎓 Graduation Cap | Educational content and guides |
| Campaigns | Orange | 📈 Trending Up | Sales campaigns and promotions |

**UI:** Color-coded badges + icons on each news item

### 4.3 Pinned Broadcasts ⭐
**Current:** No pinning
**Required:** Pin important broadcasts to top

**Features:**
- Admin can pin/unpin broadcasts
- Pinned items shown in separate "Pinned Announcements" section at top
- Visual: Gradient background + pin icon
- Always visible regardless of filters

### 4.4 Read Status Tracking ⭐
**Current:** No read tracking
**Required:** Mark as read/unread

**Features:**
- Blue dot indicator for unread items
- Auto-mark as read on:
  - Hover over card
  - Click to view full details
- Storage: sessionStorage (persists during session)
- No database write required (lightweight)

### 4.5 Enhanced Filtering & Sorting
**Current:** Basic display
**Required:** Advanced filtering

**Filter Options:**
- All categories
- Announcements only
- Training only
- Campaigns only

**Sort Options:**
- Newest First
- Oldest First
- Title (A-Z)

**Search:**
- Real-time search by title or content

### 4.6 Mira Integration
**Split View:** When user clicks "Ask Mira" from News
- Mira understands context: User is viewing news feed
- Ready to answer questions about:
  - News content
  - Training materials
  - Campaign details
  - How to apply learnings

---

## 5. Servicing Module ⭐ NEW MODULE

### 5.1 Module Overview
**Current:** Does not exist
**Required:** Service request management system

**Header:** "Service Request Management"

### 5.2 Create Service Request
**Button:** "+New Service Request" (top right)

**Form Fields:**
1. **Select Customer** (required, searchable dropdown)
2. **Service Type** (required, dropdown with available services)
3. **Service-specific fields** (dynamic based on selected type)

### 5.3 Service Types

#### 5.3.1 For Individual Customers
- Submit Claim
- Renew Policy
- Reinstate Policy
- Fund Switching (for ILP)
- Premium Payment
- Change Customer Details
- Change Beneficiary
- Others (free text description)

#### 5.3.2 For Entity Customers
- Change of Members (add/remove employees)
- Change Rider
- Renew Policy
- Premium Payment
- Change Company Details
- Others (free text description)

### 5.4 Service Request List
**Display:** Horizontal detail cards (similar to customer cards)

**Filters:**
- Service Request Type (dropdown with all types)
- Status: Pending | In Progress | Completed | Cancelled

**Sort Options:**
- Last Updated (Ascending | Descending)
- Date Created (Newest | Oldest)

### 5.5 Service Request Detail
**Click card → Navigate to detail page**

**Show:**
- Request number
- Customer name (with link to customer detail)
- Service type
- Status (with status badge)
- Created date
- Last updated date
- Description/Details
- Attachments (documents uploaded)
- Status history timeline
- Action buttons: Update Status | Add Note | Upload Document | Cancel Request

### 5.6 Integration with Customer Detail
**Customer Detail → Servicing Tab:**
- Show "Available Service Requests" (quick actions, same as create service request)
- Show "Service Request History" (list of past requests for this customer)

---

## 6. Products Module Enhancements

### 6.1 Group Insurance Tab ⭐
**Current:** Three tabs (Life, Health, General)
**Required:** Four tabs

**New Tab:** "Group Insurance"
- Group Life Elite
- Group Hospitalisation & Surgical
- Group Personal Accident
- Group Critical Illness
- Group Dental & Optical

### 6.2 Product Card Enhancements
**Current:** Basic product info
**Required:** Rich visual product cards

**Card Components:**
- **Product Image:** Visual representation of product benefit
  - Example: "Smiling old couple" for retirement plan
  - Example: "Happy climbing cat" for pet insurance
  - Example: "Family playing" for family protection
- **Product Name** (header)
- **High-level description** (2-3 lines)
- **Coverage Type Labels** (badges)
- **"Learn More" arrow** (bottom of card)

### 6.3 Product Detail Page Enhancements

#### 6.3.1 Product Brochure Information
**Show:**
- Key coverages (bullet points)
- Benefits (bullet points)
- Insured eligibility rules
- Age limits
- Sum assured ranges
- Premium payment modes

#### 6.3.2 Quick Quote Feature
**Configuration:** Admin can configure per product:
- `allow_quick_quote`: Yes | No
- `require_fact_finding`: Yes | No

**When allow_quick_quote = Yes:**
- Show "Get Quote" button
- Display quotation form with required parameters:
  - **Life Insurance:** DOB, gender, smoker status, sum assured, coverage term
  - **General Insurance:** Car model, manufacture year, coverage level
  - **Group Insurance:** Number of employees, coverage tier
- After "Generate Quote" → Show premium summary

**Next Steps:**
- If require_fact_finding = Yes → Buttons: "Start New Proposal" | "Edit Quote"
- If require_fact_finding = No → Buttons: "Proceed Application" | "Edit Quote"

#### 6.3.3 Quick Application Flow (No Fact Finding)
**When require_fact_finding = No:**
- User can proceed directly to application
- Application form captures:
  - Name (required)
  - Contact number (required)
  - ID number (required)
  - Auto-credit payout details (bank account)
  - Additional product-specific fields

**Customer Linking:**
- Option 1: Search and select existing customer → Auto-fill details
- Option 2: Enter details manually → System checks if customer exists:
  - If exists → Link to existing customer
  - If not exists → Create new customer after purchase completion

**Payment & Completion:**
- Process payment
- Create policy
- Add policy to customer's portfolio
- If new customer → Create customer record with 1 active policy

---

## 7. Proposals Module Enhancements

### 7.1 Entity Proposal Support ⭐ MAJOR
**Current:** Only individual proposals
**Required:** Support entity proposals with different flow

### 7.2 Proposal Flows

#### 7.2.1 Individual Customer Flow
```
Fact Finding → Financial Planning → Recommendation → Quotation → Application
```

**Stages:**
1. **Fact Finding:** Capture customer demographics, lifestyle, health
2. **Financial Planning:** Income, expenses, assets, liabilities, goals
3. **Recommendation:** Advisor's analysis and product recommendations
4. **Quotation:** Generate product quotes with premium calculations
5. **Application:** Full application form, underwriting, submission

#### 7.2.2 Entity Customer Flow
```
Fact Finding → Recommendation → Quotation → Application
```

**Stages:**
1. **Fact Finding:**
   - Company details
   - Keyman details
   - Upload employee list (Excel/CSV)
2. **Recommendation:** Advisor's group insurance recommendations
3. **Quotation:** Generate group premium quotes
4. **Application:** Group application form submission

**Note:** Entity flow skips "Financial Planning" stage

### 7.3 Visual Progress Indicator Enhancements
**Current:** Basic progress bar
**Required:** Interactive stage icons with progress visualization

**Visual Design:**
- Stage icons chain together horizontally
- Icon states:
  - **Not Started:** Grey icon
  - **In Progress:** Blue icon with surrounding pie progress bar (shows % completion)
  - **Completed:** Green icon with checkmark

**Interactions:**
- Click stage icon → Auto-scroll to that stage in vertical layout
- Hover icon → Show stage name + completion %

### 7.4 Proposal List Enhancements

**Additional Filters:**
- Customer Type: Individual | Entity
- Stage: Fact Finding | Financial Planning | Recommendation | Quotation | Application
- Status: In Progress | Pending for UW | Pending for Payment | Completed

**Note:** Completed proposals only shown for 7 days, then move to Customer Portfolio → Policy

**Additional Sort:**
- Stage (order by journey sequence)
- Last Updated
- Created Date

### 7.5 Proposal Card Enhancements
**Current:** Basic information
**Required:** Rich card with visual progress

**Card Layout:**
- **Header:** Customer Name (Proposer Name) + Proposal Status label
- **Below header:** Proposal number | Last updated
- **Right side:** Visual progress icons (see 7.3)
- **Click card:** Navigate to proposal detail page

---

## 8. Analytics Module Enhancements

### 8.1 Additional KPI Cards
**Current:** 4 KPIs (New Policies, Total Premium, Active Proposals, New Customers)
**Required:** Same 4 (no change needed)

### 8.2 Goal-Based Tracker ⭐
**Current:** Not available
**Required:** Visual goal progress tracking

**Goals to Track:**
1. **Quarterly Premium Target**
   - Target: $250,000 (or configurable)
   - Actual: Sum of last 3 months' premium
   - Visual: Progress bar with percentage

2. **New Customer Acquisition**
   - Target: 200 new leads (or configurable)
   - Actual: Count of new leads in period
   - Visual: Progress bar with percentage

3. **Avg. Proposal Completion**
   - Metric: Average completion_percentage of all proposals
   - Visual: Gauge chart or progress bar

### 8.3 Additional Charts

#### 8.3.1 Product Mix (Pie Chart)
**Title:** "Sales by Category"
**Data:** Count or premium amount by product category
- Life Insurance
- Health Insurance
- General Insurance
- Group Insurance

**Interaction:** Click slice → Navigate to filtered view

#### 8.3.2 Conversion Funnel (Bar Chart)
**Title:** "Lead to Completed Journey"
**Stages:**
- Leads (total)
- Qualified Leads (contacted)
- Proposals Created
- Proposals Submitted
- Policies Issued

**Visual:** Horizontal bar chart showing drop-off at each stage

#### 8.3.3 Top Performing Products (Table/Bar)
**Title:** "Top Performing Products"
**Metrics:**
- Product Name
- Count of Policies Sold
- Total Premium Generated
- Sort by: Count or Premium (toggle)

**Interaction:** Click product → Navigate to product detail

### 8.4 Interactive Pivot
**Requirement:** When user clicks any chart or table
- Navigate to detailed view page with filtered data
- "Back" button returns to Analytics dashboard
- Preserve filter state on return

### 8.5 Mira Integration
**Split View:** When user clicks "Ask Mira" from Analytics
- Mira detects user is viewing sales performance
- Proactive prompt: "Do you want me to summarize your sales performance?"
- When user says yes → Mira explains the data:
  - Trends
  - Performance vs targets
  - Recommendations for improvement

---

## 9. Mira AI Deep Integration ⭐ MAJOR

### 9.1 Homepage Experience

#### 9.1.1 Full-Page Chat Interface
**Layout:**
- Mira symbol at center top
- Personalized greeting:
  - Morning: "Good morning, [Name]"
  - Night: "Hi night owl, [Name]"
- Introduction: "I am Mira, your AI insurance assistant to help with customers, analytics, tasks, and more."
- Quick action buttons (4 default):
  1. Customer Analytics → "Summarize the profile of my hot leads"
  2. Sales Performance → "What are my sale trends for this quarter"
  3. Pending Tasks → "Show me my pending tasks and upcoming appointments"
  4. Recommendations → "Recommend me my priorities"
- Chat bar at center bottom
- Upload icon (left of input)
- Audio icon (right of input, becomes send button when typing)

#### 9.1.2 Quick Action Examples

**Example 1: Customer Analytics**
- User clicks "Summarize the profile of my hot leads"
- Split view activates (30% chat, 70% customers page)
- Side menu collapses
- Mira response: "You have 3 hot leads now. 1. Alex - single, young white collar, interested in wealth accumulation for retirement, no existing coverage... 2. Sarah... 3. Michael... What would you like to proceed next?"
- Right panel: Customer list filtered by lead status = hot
- Behind the scenes: Mira agent detects intent → queries hot leads → summarizes → instructs FE to navigate to customer list with filters

**Example 2: Sales Performance**
- User clicks "What are my sale trends for this quarter"
- Split view activates
- Mira response: "You have closed sales with 3 leads and 1 existing customer this month. Total annual premium collected is $50k. You are on track to meet your target!"
- Right panel: Analytics page with YTD filter, graphs aligned with Mira's explanation
- Behind the scenes: Mira agent detects intent → queries YTD sales → summarizes → navigates to analytics with filters

**Example 3: Pending Tasks**
- User clicks "Show me my pending tasks and upcoming appointments"
- Split view activates
- Mira response: Prioritizes tasks/appointments for today, or if none, suggests this week's focus. Detects birthdays coming up.
- Right panel: Smart Plan page filtered by upcoming tasks/appointments
- Behind the scenes: Mira agent detects intent → queries tasks/appointments → summarizes and prioritizes → navigates to Smart Plan with filters

**Example 4: Recommendations**
- User clicks "Recommend me my priorities"
- Stays in full-page view (no split, intent unclear)
- Mira response: "You have 4 proposals in progress, 2 service requests in progress, 3 upcoming appointments. What would you like to focus?"
- After user clarifies intent → Mira determines if navigation needed

### 9.2 Split View Functionality

#### 9.2.1 Split View Layout
**Trigger:** Any quick action or "Ask Mira" button from module pages

**Layout:**
- Side menu: Collapsed automatically (if expanded)
- Left panel: Chat (30% width)
- Right panel: Module page (70% width)
- Side menu remains visible on far left (not covered)

#### 9.2.2 Chat Panel Controls
**Top Right Icons:**
1. **Full Page View:** Return to full-page chat (side menu still visible)
2. **Auto Navigation Toggle:**
   - ON: Mira navigates user to relevant screens automatically
   - OFF: Mira provides info, user navigates manually
3. **Close (X):** Close chat panel
   - Closes current chat session
   - To resume: Must search in Chat History page
   - Starting new chat from homepage creates new session

#### 9.2.3 Context-Aware Mira
**Per-Module Context:**
- Customers → Mira knows user is viewing customer list/detail
- Products → Mira knows user is viewing products
- Proposals → Mira knows user is viewing proposals
- Analytics → Mira knows user is viewing sales performance
- Smart Plan → Mira knows user is viewing tasks/appointments
- Visualizers → Mira knows user is viewing financial projections
- Servicing → Mira knows user is viewing service requests
- News → Mira knows user is viewing news/training

**Contextual Responses:**
- Mira's first message acknowledges context
- Example from Analytics: "Do you want me to summarize your sales performance?"
- Ready to answer questions specific to current module

### 9.3 Advanced Intent Detection

#### 9.3.1 Quick Quote Intent
**User Prompt:** "Generate a quick quote for SecureLife, male, age 30, non-smoker"

**Mira Process:**
1. Detect intent: User wants quick quote
2. Parse parameters: Product = SecureLife, Gender = Male, Age = 30, Smoker = No
3. Check product configuration: Is quick_quote allowed?
4. If allowed → Call product quotation calculation API
5. Return premium: "The premium for a 30 year old male non-smoker is around $100 per month. A fact finding is required for this product. Initiate the proposal flow if you are interested."
6. Navigate to quick quote display on right panel

**If product doesn't allow quick quote:**
- Mira: "SecureLife ILP does not offer quick quote. Please go through fact finding and financial planning to see the quotation."

#### 9.3.2 Create Lead Intent
**User Prompt:** "Add new lead John Tan, phone number 12344321"

**Use Case:** Especially useful with audio input when advisor is driving

**Mira Process:**
1. Detect intent: Create new lead
2. Parse parameters: Name = John Tan, Phone = 12344321
3. Navigate to "+New Lead" form on right panel
4. Pre-fill: Name = "John Tan", Phone = "12344321"
5. Mira: "Do you want to add this new lead?"
6. User confirms → Create lead
7. Navigate to customer detail page of newly created lead

#### 9.3.3 Bulk Lead Creation
**User Action:** Upload Excel file + prompt "Create leads for me"

**Mira Process:**
1. Detect intent: Bulk lead creation
2. Analyze Excel file structure
3. Mira: "10 leads are found in the file uploaded. Do you want me to proceed to create for you in customer module?"
4. User confirms
5. Create all leads in batch
6. Navigate to customer list sorted by last created
7. Mira: "10 leads has been created"

### 9.4 Conversation Memory & History

#### 9.4.1 Chat Sessions
**Session Rules:**
- New session: Start from homepage
- Close chat → Session ends
- Can't resume closed session from homepage
- Must search Chat History to resume

#### 9.4.2 Chat History Page
**Access:** Side menu → "All chats"

**Display:**
- List of recent chat sessions (scrollable)
- Show top 15 in side menu
- Each chat shows:
  - First message preview
  - Timestamp
  - Session ID
- Click to resume session (opens in split view)

### 9.5 Voice Input Support ⭐
**Current:** Not available
**Required:** Voice-to-text input

**Features:**
- Audio icon in chat input bar
- Click to start recording
- Real-time speech-to-text conversion
- Language support matches preferred language setting
- Show visual indicator during recording (pulsing icon)
- Click again to stop and send

**Use Case:** Hands-free operation while driving or in meetings

### 9.6 Boundaries & Guardrails
**Mira will decline:**
- Topics beyond system functionality
- Non-financial/non-insurance topics
- Inappropriate requests

**Response:** "That's beyond my role and responsibility as your insurance assistant. I'm here to help with customers, proposals, analytics, tasks, and insurance-related questions."

---

## 10. Multi-Language & Multi-Currency Support ⭐ MAJOR

### 10.1 Language Support
**Current:** English only
**Required:** 5 languages

**Supported Languages:**
1. English (default)
2. Mandarin (简体中文)
3. Malay (Bahasa Melayu)
4. Spanish (Español)
5. Tamil (தமிழ்)

### 10.2 Language Selection
**Location:** Profile Settings → User Preferences → Preferred Language

**Effect:**
- All system display wordings change to preferred language
- Mira responds in preferred language
- Emails/reports generated in preferred language
- Date/time formats adapt to language locale

### 10.3 Currency Support
**Current:** SGD only
**Required:** Multi-currency with auto-conversion

**Default:** SGD (Singapore Dollar)

**Applies To:**
- Income
- Expenses
- Assets
- Liabilities
- Existing insurance coverage amounts
- Premium amounts
- Budget figures
- Quotation amounts
- All financial projections in Visualizers

### 10.4 Currency Selection
**Location:** Profile Settings → User Preferences → Preferred Currency

**Dropdown Options:**
- SGD (Singapore Dollar)
- USD (US Dollar)
- MYR (Malaysian Ringgit)
- EUR (Euro)
- GBP (British Pound)
- Others as needed

### 10.5 Auto-Conversion Logic
**Scenario:** Product premium table is in different currency than preferred display currency

**Example:**
- Product premium calculated in USD
- User's preferred currency is SGD
- System auto-converts USD to SGD for display
- Use current exchange rate (updated daily)
- Show original currency in tooltip (hover)

**Formula:**
```
Display Amount = Base Amount × Exchange Rate
```

**UI Display:**
```
Premium: $150 SGD (≈ $110 USD)
```

### 10.6 Implementation Considerations

#### 10.6.1 Translation Management
- Use i18n library (e.g., react-i18next)
- JSON translation files per language
- Translation keys for all UI strings
- Admin portal to manage translations

#### 10.6.2 Exchange Rate Service
- Integrate exchange rate API (e.g., Open Exchange Rates)
- Update rates daily via scheduled job
- Cache rates in database
- Fallback to last known rate if API unavailable

#### 10.6.3 Database Design
- Store amounts in base currency (e.g., always USD)
- Convert on display based on user preference
- Store currency code with each amount
- Audit trail for exchange rates used

---

## 11. Profile Settings Enhancements

### 11.1 Current Profile Sections
**Existing:**
- Personal Information (non-editable, managed by admin)
- Security (can update password)

### 11.2 New Section: User Preferences ⭐
**Required:** Add new preferences section

**Fields:**
1. **Preferred Language**
   - Dropdown: English | Mandarin | Malay | Spanish | Tamil
   - Default: English
   - See Section 10 for details

2. **Preferred Currency**
   - Dropdown: SGD | USD | MYR | EUR | GBP | ...
   - Default: SGD
   - See Section 10 for details

**Save Button:** "Update Preferences"

**Effect:** Immediate upon save (no page reload required)

---

## 12. Technical Implementation Notes

### 12.1 New Database Tables Required

```sql
-- Entity customers
ALTER TABLE customers ADD COLUMN customer_type VARCHAR(20); -- 'Individual' | 'Entity'
ALTER TABLE customers ADD COLUMN company_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN business_registration_no VARCHAR(100);
ALTER TABLE customers ADD COLUMN industry VARCHAR(100);
ALTER TABLE customers ADD COLUMN keyman_details JSONB;
ALTER TABLE customers ADD COLUMN num_employees INT;
ALTER TABLE customers ADD COLUMN annual_revenue DECIMAL(15,2);
ALTER TABLE customers ADD COLUMN temperature VARCHAR(20); -- 'Cold' | 'Warm' | 'Hot'

-- Service requests
CREATE TABLE service_requests (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  service_type VARCHAR(100),
  status VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Journey milestones
CREATE TABLE customer_milestones (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  event_type VARCHAR(50), -- 'first_policy' | 'renewal' | 'claim' | 'life_event'
  event_title VARCHAR(255),
  event_description TEXT,
  event_date DATE,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP
);

-- Financial projections (for Visualizers)
CREATE TABLE financial_projections (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  projection_data JSONB, -- income, expenses, assets, liabilities over time
  life_events JSONB, -- array of life events with impacts
  scenarios JSONB, -- different insurance scenarios
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- News categories
ALTER TABLE broadcasts ADD COLUMN category VARCHAR(50); -- 'announcement' | 'training' | 'campaign'
ALTER TABLE broadcasts ADD COLUMN pinned BOOLEAN DEFAULT FALSE;

-- Task/Appointment transcripts and summaries
ALTER TABLE tasks ADD COLUMN transcripts JSONB; -- array of transcript objects
ALTER TABLE tasks ADD COLUMN mira_summary TEXT;
ALTER TABLE tasks ADD COLUMN mira_detected_intent JSONB;

-- User preferences
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'SGD';

-- Exchange rates
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY,
  base_currency VARCHAR(3),
  target_currency VARCHAR(3),
  rate DECIMAL(10,6),
  effective_date DATE,
  created_at TIMESTAMP
);
```

### 12.2 New React Components

**Major Components:**
```
/src/admin/components/
├── visualizers/
│   ├── SankeyDiagram.jsx
│   ├── WealthProjectionChart.jsx
│   ├── LifeEventSimulator.jsx
│   └── ScenarioComparison.jsx
├── timeline/
│   ├── OurJourneyTimeline.jsx
│   └── MilestoneCard.jsx
├── servicing/
│   ├── ServiceRequestForm.jsx
│   ├── ServiceRequestCard.jsx
│   └── ServiceRequestDetail.jsx
└── mira/
    ├── SplitViewChat.jsx
    ├── VoiceInput.jsx
    ├── IntentDetector.jsx
    └── ChatHistory.jsx
```

### 12.3 New API Endpoints

```javascript
// Entity customers
POST   /api/customers/entities
GET    /api/customers/:id/milestones
POST   /api/customers/:id/milestones

// Service requests
GET    /api/service-requests
POST   /api/service-requests
GET    /api/service-requests/:id
PATCH  /api/service-requests/:id
DELETE /api/service-requests/:id

// Visualizers
GET    /api/visualizers/projection/:customerId
POST   /api/visualizers/projection
PUT    /api/visualizers/projection/:id
POST   /api/visualizers/simulate-life-event

// Mira AI
POST   /api/mira/detect-intent
POST   /api/mira/analyze-transcript
POST   /api/mira/summarize-notes
GET    /api/mira/chat-history
POST   /api/mira/voice-to-text

// Multi-language
GET    /api/translations/:language
POST   /api/translations

// Exchange rates
GET    /api/exchange-rates
GET    /api/exchange-rates/convert?amount=100&from=USD&to=SGD
```

### 12.4 Edge Functions (Supabase) to Enhance

```
supabase/functions/
├── agent-chat/            # Enhanced with new intents
├── analyze-transcript/    # NEW: Transcript analysis
├── detect-intent/         # Enhanced with more intent types
├── generate-summary/      # Enhanced for tasks/appointments
├── calculate-projection/  # NEW: Financial projection calculations
└── convert-currency/      # NEW: Currency conversion
```

### 12.5 Third-Party Integrations

**Required:**
1. **Speech-to-Text API**
   - Google Cloud Speech-to-Text
   - Azure Speech Services
   - AWS Transcribe

2. **Exchange Rate API**
   - Open Exchange Rates (https://openexchangerates.org/)
   - Fixer.io
   - CurrencyLayer

3. **Calendar Integration**
   - Google Calendar API
   - Microsoft Graph API (Outlook)
   - Apple Calendar (CalDAV)

4. **Translation Service** (optional, for auto-translation)
   - Google Cloud Translation API
   - DeepL API

---

## 13. Migration Strategy

### 13.1 Phase 1: Foundation (Weeks 1-2)
**Focus:** Database changes and core infrastructure

**Tasks:**
- Add new database columns and tables
- Set up exchange rate service
- Implement i18n infrastructure
- Create base components for new modules

**Testing:** Unit tests for database migrations, API endpoints

### 13.2 Phase 2: Entity Customers & Servicing (Weeks 3-4)
**Focus:** Entity customer support and servicing module

**Tasks:**
- Implement entity customer CRUD
- Build servicing module UI and logic
- Add "Our Journey" timeline component
- Implement customer temperature calculation
- Add group insurance products

**Testing:** Integration tests for entity workflows

### 13.3 Phase 3: Smart Plan Enhancements (Weeks 5-6)
**Focus:** Transform ToDo into Smart Plan

**Tasks:**
- Add task/appointment detail tabs
- Implement Mira summary integration
- Build transcript upload and analysis
- Add birthday reminder system
- Integrate external calendars

**Testing:** E2E tests for task management workflows

### 13.4 Phase 4: Visualizers Module (Weeks 7-8)
**Focus:** Build new Visualizers module

**Tasks:**
- Implement NPC concept and data structure
- Build Sankey diagram component
- Create wealth projection chart
- Implement life event simulator
- Add scenario comparison

**Testing:** Visual regression tests, calculation accuracy tests

### 13.5 Phase 5: Mira AI Deep Integration (Weeks 9-10)
**Focus:** Enhanced AI features across all modules

**Tasks:**
- Implement split view chat
- Add voice input support
- Enhance intent detection (quick quote, create lead, bulk leads)
- Build chat history functionality
- Add context-aware prompts per module

**Testing:** AI integration tests, intent detection accuracy

### 13.6 Phase 6: News & Analytics (Weeks 11-12)
**Focus:** Rename Broadcast, enhance Analytics

**Tasks:**
- Rename Broadcast to News
- Add categorization and pinning
- Implement read status tracking
- Add goal-based tracker to Analytics
- Create additional charts (product mix, conversion funnel, top products)

**Testing:** UI/UX testing, data visualization accuracy

### 13.7 Phase 7: Multi-Language & Currency (Weeks 13-14)
**Focus:** Internationalization

**Tasks:**
- Add language selection to profile
- Translate all UI strings to 5 languages
- Implement currency selection
- Add auto-conversion logic
- Update all financial displays

**Testing:** Language switching tests, currency conversion accuracy

### 13.8 Phase 8: Proposals & Products (Weeks 15-16)
**Focus:** Entity proposal support and product enhancements

**Tasks:**
- Implement entity proposal flow
- Add visual progress indicators
- Support quick quote for products
- Add Group Insurance tab
- Implement quick application flow

**Testing:** E2E tests for proposal workflows (individual vs entity)

### 13.9 Phase 9: Polish & Performance (Weeks 17-18)
**Focus:** Optimization and refinement

**Tasks:**
- Performance optimization (lazy loading, caching)
- UI/UX polish based on feedback
- Accessibility improvements
- Mobile responsiveness
- Bug fixes

**Testing:** Performance testing, accessibility audit

### 13.10 Phase 10: User Acceptance & Launch (Weeks 19-20)
**Focus:** Final testing and deployment

**Tasks:**
- User acceptance testing (UAT)
- Training materials and documentation
- Data migration (if needed)
- Production deployment
- Post-launch monitoring

**Testing:** Full system UAT, smoke tests in production

---

## 14. Priority Matrix

### 14.1 Must-Have (P0) - Launch Blockers

| Feature | Complexity | Impact | Module |
|---------|-----------|--------|---------|
| Entity Customer Support | High | High | Customers |
| Smart Plan (rename + basic features) | Medium | High | Smart Plan |
| Servicing Module (basic) | Medium | High | Servicing |
| Mira Split View | Medium | High | Mira AI |
| Multi-language (English + 1) | Medium | High | System |

### 14.2 Should-Have (P1) - Post-Launch Priority

| Feature | Complexity | Impact | Module |
|---------|-----------|--------|---------|
| Visualizers Module | High | High | Visualizers |
| "Our Journey" Timeline | Medium | Medium | Customers |
| Customer Temperature | Low | Medium | Customers |
| News (rename + categories) | Medium | Medium | News |
| Voice Input | Medium | High | Mira AI |
| Entity Proposal Flow | High | High | Proposals |
| Goal-Based Tracker | Low | Medium | Analytics |

### 14.3 Nice-to-Have (P2) - Future Enhancements

| Feature | Complexity | Impact | Module |
|---------|-----------|--------|---------|
| Birthday Reminders | Low | Low | Smart Plan |
| External Calendar Sync | High | Medium | Smart Plan |
| Product Quick Quote | Medium | Medium | Products |
| Multi-currency | Medium | Medium | System |
| Additional Languages (3 more) | Low | Low | System |
| Advanced Analytics Charts | Low | Medium | Analytics |
| Gap Analysis Report | High | Medium | Customers |

---

## 15. Key Differences Summary Table

| Aspect | Current AdvisorHub | AdvisorHub V2 | Priority |
|--------|-------------------|---------------|----------|
| **Customer Types** | Individual only | Individual + Entity | P0 |
| **Customer Tracking** | Basic lead status | Temperature (Cold/Warm/Hot) | P1 |
| **Customer Journey** | No visualization | "Our Journey" Timeline | P1 |
| **Servicing** | Not available | Full servicing module | P0 |
| **ToDo Module** | Basic task management | Smart Plan with AI summaries | P0 |
| **Visualizers** | Not available | Financial projection tool | P1 |
| **Broadcast Module** | Basic broadcasts | News with categories & pinning | P1 |
| **Proposals** | Individual only | Individual + Entity flows | P1 |
| **Products** | 3 tabs | 4 tabs (+ Group Insurance) | P1 |
| **Analytics** | Basic KPIs | KPIs + Goals + More charts | P1 |
| **Mira AI** | Basic chat | Split view + Voice + Context-aware | P0-P1 |
| **Languages** | English only | 5 languages | P0-P2 |
| **Currency** | SGD only | Multi-currency with conversion | P2 |
| **Gap Analysis** | Not available | AI-powered gap assessment | P2 |
| **Transcripts** | Not available | Record, upload, analyze meetings | P1 |
| **Birthday Reminders** | Manual | Auto-generated tasks | P2 |
| **External Calendars** | No integration | Google/Outlook/Apple sync | P2 |
| **Quick Quote** | Not available | Product-level configuration | P1 |
| **Voice Input** | Not available | Voice-to-text for chat | P1 |

---

## 16. Success Metrics (Post-Implementation)

### 16.1 Adoption Metrics
- % of advisors using entity customer features
- % of advisors using Visualizers module
- % of advisors using voice input
- Average daily Mira interactions per user

### 16.2 Efficiency Metrics
- Time to create new lead (should decrease with voice input)
- Time to complete proposal (should decrease with AI summaries)
- Service request resolution time
- Customer response time improvement

### 16.3 Business Metrics
- Number of entity customers onboarded
- Group insurance proposals created
- Service requests processed per month
- Cross-sell/up-sell rate improvement (via gap analysis)

### 16.4 Quality Metrics
- Accuracy of Mira's intent detection (target: >90%)
- Customer satisfaction with visualizations (survey)
- Advisor satisfaction with Smart Plan (vs old ToDo)
- Reduction in manual data entry errors

---

## 17. Risks & Mitigation

### 17.1 Technical Risks

**Risk:** Complex AI integration may have bugs/inaccuracies
**Mitigation:**
- Extensive testing of intent detection
- Manual override options for all AI actions
- Clear user feedback when AI is unsure

**Risk:** External calendar sync may be unreliable
**Mitigation:**
- Implement robust error handling
- Allow manual sync
- Fallback to internal calendar only

**Risk:** Exchange rate API may be unavailable
**Mitigation:**
- Cache last known rates
- Daily batch updates with fallback
- Alert admin if rates are stale (>24 hours)

### 17.2 User Experience Risks

**Risk:** Split view may be confusing for some users
**Mitigation:**
- Add onboarding tutorial
- Clear controls to switch views
- Allow users to disable split view in preferences

**Risk:** Too many features may overwhelm users
**Mitigation:**
- Phased rollout with feature announcements
- Progressive disclosure (hide advanced features initially)
- Comprehensive training and documentation

### 17.3 Data Risks

**Risk:** Financial projection calculations may have errors
**Mitigation:**
- Thorough QA of calculation logic
- Show disclaimers (projections are estimates)
- Allow advisors to manually adjust

**Risk:** Translation quality may vary
**Mitigation:**
- Use professional translation services (not machine)
- Native speaker review for each language
- Allow users to switch back to English

---

## 18. Conclusion

AdvisorHub V2 represents a significant evolution of the platform, with **10 major enhancements** across all modules:

1. **Entity Customer Support** - Opens new B2B market segment
2. **Smart Plan** - AI-powered task management replacing basic ToDo
3. **Visualizers** - Innovative financial storytelling tool
4. **Servicing Module** - Comprehensive post-sale support
5. **News** - Enhanced communication with categorization
6. **Mira AI Deep Integration** - Context-aware assistance across all modules
7. **Multi-Language Support** - Serves diverse advisor base
8. **Multi-Currency Support** - Enables international operations
9. **Entity Proposal Flow** - Separate workflow for group insurance
10. **Enhanced Analytics** - Goal-tracking and deeper insights

**Recommended Approach:**
- Focus on P0 features for MVP (Phases 1-3)
- Launch with Entity support, Smart Plan basics, Servicing, and basic Mira enhancements
- Roll out P1 features post-launch (Phases 4-6)
- Gather user feedback and iterate
- Add P2 features based on demand (Phases 7-8)

**Total Estimated Effort:** 18-20 weeks with 2-3 developers
**MVP (P0 only):** 6-8 weeks with 2-3 developers

---

## Appendix A: Glossary

- **Entity Customer:** A company/organization purchasing group insurance (vs individual)
- **NPC:** Non-Player Character, a fictional representation of customer for scenario testing
- **Customer Temperature:** Dynamic lead scoring (Cold/Warm/Hot) based on engagement
- **Our Journey:** Timeline visualization of advisor-customer relationship milestones
- **Smart Plan:** AI-enhanced task and appointment management module (replaces ToDo)
- **Split View:** UI mode with chat panel (30%) and module page (70%) side-by-side
- **Quick Quote:** Instant premium calculation without full fact-finding
- **Intent Detection:** Mira's ability to understand user's goal from natural language
- **Sankey Diagram:** Flow visualization showing cashflow from income to expenses/savings

---

## Appendix B: Reference Screenshots

*(Note: Actual screenshots would be included here showing:)*
- Our Journey Timeline example
- Smart Plan task detail with Mira summary
- Visualizers Sankey diagram
- Split view layout
- News categorization
- Entity customer detail page
- Group insurance proposal flow

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Author:** Claude Code AI
**Review Status:** Draft - Pending stakeholder review
