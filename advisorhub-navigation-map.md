# 🧭 ADVISORHUB — COMPLETE NAVIGATION MAP (v2.0)

> **Built from actual implementation analysis**
> Last updated: 2025-11-05
> Status: All 15 pages documented with navigation paths

---

## Navigation Overview

| **Current Screen / Module** | **Navigate From** | **Navigate To** | **Description / Key Interactions** |
|------------------------------|-------------------|-----------------|------------------------------------|
| **/login** | None, Logout, Unauthenticated access | `/register` (Register button)<br>`/` (on successful login) | User logs in using email & password. Includes "Forgot Password" flow (sends reset email). Recovery mode for password reset via email link. |
| **/register** | `/login` (Register link) | `/login` (after registration) | New advisor registration form. On success, returns to Login page. |
| **/` (Home/Dashboard) | `/login` (after auth)<br>Sidebar: Home icon<br>`/profile-settings` (Back button) | `/customers?action=new` (Add New Lead)<br>`/quick-quote` (Quick Quote button)<br>`/todo` (My Calendar button)<br>`/analytics` (View Details)<br>`/customers?relationship=lead&temperature=warm` (View All Hot Leads)<br>`/broadcast` (View All Broadcasts)<br>`/customers/detail?id={id}` (Click hot lead) | Personalized dashboard with:<br>- Greeting with current date/time<br>- Quick action buttons (New Lead, Quick Quote, Calendar)<br>- Reminders widget (upcoming appointments/tasks)<br>- Hot Leads widget (warm leads with last contact)<br>- Performance snapshot (policies, premium, commission)<br>- Broadcast feed (latest announcements) |
| **/customers** | Sidebar: Customer icon<br>`/` (Add New Lead, View All Hot Leads)<br>`/customers/detail` (Back from detail) | `/customers/detail?id={id}` (Click lead card)<br>`/customers/detail?id={newId}` (After creating lead) | Lead & Client list with:<br>- Search by name/email/contact<br>- Filters: relationship (lead/clients), temperature (hot/warm/cool), lastContacted (7/30/90/over90/never)<br>- Sort: lastContacted, name, nextAppointment<br>- "New Lead" button opens dialog<br>- Lead creation with "Save" or "Save & Schedule" options<br>- Cards show temperature indicator, last contact, next appointment |
| **/customers/detail** | `/customers` (Click lead)<br>`/` (Click hot lead) | `/customers` (Back button) | **Customer detail view with tabs:**<br><br>**Overview Tab (Always visible):**<br>- Personal info: name, email, contact, address, birthday<br>- Relationship status, lead source, temperature<br>- Lifecycle stage, preferred contact method<br>- Notes section<br>- Edit customer button<br><br>**Portfolio Tab (Clients only):**<br>- Active policies list<br>- Total coverage summary<br>- Policy cards with product, premium, status<br><br>**Servicing Tab (Clients only):**<br>- Service request options (claims, renewals, updates)<br>- Past service requests<br>- Track request status<br><br>**Gap & Opportunity Tab (Clients only):**<br>- Gap analysis vs recommended coverage<br>- Opportunity recommendations<br>- Generate shareable PDF report<br><br>**Query Params:** `?id={leadId}` (required)<br>**Tab Persistence:** Saves active tab to sessionStorage |
| **/new-business** | Sidebar: New Business icon | `/proposals/detail?id={id}` (Click proposal card)<br>`/proposals/detail?id={newId}` (Auto-create from `?action=new&leadId={id}`) | **Proposal pipeline management:**<br>- Lists all proposals with status indicators<br>- Filters: In Progress, Submitted, Approved, Rejected, All<br>- Cards show: customer name, stage, last updated, products<br>- Stage badges: Fact Finding, FNA, Recommendation, Quotation, Application<br><br>**Smart Redirect Logic:**<br>- If `?action=new&leadId={id}` is present:<br>  - Checks if lead has existing "In Progress" proposal<br>  - If exists → redirect to that proposal<br>  - If not → creates new proposal → redirect to it<br>- Enforces single in-progress proposal per lead |
| **/proposals/detail** | `/new-business` (Click proposal)<br>`/quote-summary` ("Start Full Proposal") | `/new-business` (Back button) | **Multi-stage proposal workflow:**<br><br>**Fact Finding Section:**<br>- Client personal info, dependents, marital status<br>- Risk profile assessment<br>- Customer Knowledge Assessment (CKA)<br>- Auto-save functionality<br><br>**Financial Planning (FNA) Section:**<br>- Income sources & amounts<br>- Monthly expenses breakdown<br>- Assets inventory<br>- Liabilities tracking<br>- Existing coverage analysis<br>- System computes: Net Worth, Monthly Affordability, Coverage Gaps<br><br>**Recommendation Section:**<br>- AI-driven product recommendations<br>- Manual product selection/adjustment<br>- Coverage amount recommendations<br>- Client confirmation required before proceeding<br><br>**Quotation Section:**<br>- Product illustration builder<br>- Premium estimates (monthly/annual)<br>- Compare up to 5 scenarios<br>- Benefit breakdowns<br>- Policy term selection<br><br>**Application Section (Locked until previous complete):**<br>- Multi-step application form<br>- Client verification<br>- Beneficiary designation<br>- Medical underwriting questions<br>- Payment method selection<br>- E-signature capture<br>- Terms & consent<br>- PDF generation & submission<br><br>**Query Params:**<br>- `?id={proposalId}` (required)<br>- `?e2e=1` (debug flag to unlock Application)<br><br>**Section Navigation:** Click section icons in header to scroll to that section |
| **/quick-quote** | Sidebar: Quick Quote icon<br>`/` (Quick Quote button) | `/quote-summary?productId=...&age=...&gender=...&smoker=...&sumAssured=...&policyTerm=...&monthly=...&annual=...&total=...` (Calculate Premium) | **Fast quotation tool:**<br>- Product catalog with filter by type (All, Term Life, Whole Life, Endowment, etc.)<br>- Product cards with image, name, description<br>- Click "Get Quote" opens calculator form:<br>  - Age input<br>  - Gender select<br>  - Smoker status<br>  - Sum Assured slider (RM 50k - 1M)<br>  - Policy Term slider (5-30 years)<br>  - Real-time premium calculation display<br>- "Calculate Premium" button navigates to summary<br>- "Back" returns to product selection |
| **/quote-summary** | `/quick-quote` (Calculate Premium) | `/quick-quote` (New Quick Quote)<br>`/proposals/detail?id={newId}` (Start Full Proposal) | **Quote summary & conversion page:**<br>- Displays calculated quote details<br>- Product information<br>- Coverage details (age, gender, smoker, sum assured, term)<br>- Premium breakdown (monthly, annual, total over term)<br>- Policy highlights & benefits<br><br>**Actions:**<br>- "New Quick Quote" → return to QuickQuote<br>- "Save Quote" → (alert: not implemented)<br>- "Share with Client" → (alert: not implemented)<br>- "Start Full Proposal" → creates new proposal with quote data → ProposalDetail<br><br>**Query Params (all required):**<br>`?productId=`, `?productName=`, `?productType=`, `?age=`, `?gender=`, `?smoker=`, `?sumAssured=`, `?policyTerm=`, `?monthly=`, `?annual=`, `?total=` |
| **/analytics** | Sidebar: Analytics icon<br>`/` (View Details in Performance widget) | No outbound navigation | **Performance dashboard:**<br>- Time range selector: 30D, 90D, YTD, 12M<br>- Key metrics cards:<br>  - Policies Incepted<br>  - Total Premium<br>  - Commission Earned<br>  - Conversion Rate<br>- Charts & visualizations:<br>  - Premium trend over time<br>  - Policy mix by product type<br>  - Commission breakdown<br>  - Funnel conversion stages<br>- Goal tracking (RP/SP targets)<br>- Period comparison (vs previous period)<br>- Export reports functionality<br><br>**Local State:** All filtering and time range selection |
| **/todo** | Sidebar: To Do icon<br>`/` (My Calendar button, View All Reminders) | No outbound navigation | **Calendar & Task Management:**<br><br>**View Modes:**<br>- List view (default)<br>- Calendar view (month/week/today)<br><br>**Features:**<br>- Create new event/task (dialog)<br>- Edit existing tasks (click to open dialog)<br>- Mark tasks complete/incomplete<br>- Drag & drop rescheduling (calendar view)<br>- Event filtering:<br>  - Event type (appointment, follow-up, renewal, internal, other)<br>  - Linked client (all/specific lead)<br>  - Time range (today, week, month, all)<br>- Toggle show birthdays (client birthdays auto-added)<br>- Toggle show completed tasks<br>- Export calendar (.ics download)<br><br>**Task Details:**<br>- Title, event type, description<br>- Date & time<br>- Linked lead/client<br>- Location (optional)<br>- Reminder settings<br><br>**Persistent Storage (sessionStorage/localStorage):**<br>- `advisorhub:todo-view-mode` - list/calendar<br>- `advisorhub:todo-filters` - active filters<br>- `advisorhub:task-completed-map` - completion status<br>- `advisorhub:todo-show-birthdays`<br>- `advisorhub:todo-show-completed` |
| **/broadcast** | Sidebar: Broadcast icon (with unread badge)<br>`/` (View All in Broadcast widget)<br>`/broadcast/detail` (Back from detail) | `/broadcast/detail?id={id}` (Click broadcast card or hover) | **Announcements & Communications:**<br>- Pinned broadcasts at top (yellow indicator)<br>- Category filter: All, Announcement, Training, Campaign<br>- Sort by: Most Recent (default)<br>- Broadcast cards show:<br>  - Title<br>  - Category badge<br>  - Published date<br>  - Excerpt/preview<br>  - Unread indicator (blue dot)<br>  - "Mark as read" button<br>- Click card → BroadcastDetail<br>- Hover shows "View" button<br><br>**Unread Tracking:**<br>- Uses sessionStorage: `advisorhub:broadcast-read:{id}`<br>- Unread count shown in sidebar badge<br>- Updates on read/mark as read<br><br>**Category Persistence:**<br>- sessionStorage: `advisorhub:broadcast-category` |
| **/broadcast/detail** | `/broadcast` (Click broadcast) | `/broadcast` (Back button) | **Full broadcast/announcement view:**<br>- Complete message content (HTML rendering)<br>- Metadata: published date, category, author<br>- Rich text formatting support<br>- Attachments/links (if present)<br>- Related broadcasts (if configured)<br><br>**Auto-mark as read on mount:**<br>- Updates sessionStorage<br>- Dispatches custom event `advisorhub:broadcast-read`<br>- Notifies parent Broadcast page to update unread count<br><br>**Query Params:** `?id={broadcastId}` (required) |
| **/policies/detail** | `/customers/detail` (Portfolio tab → Click policy)<br>Deep links from other modules | Browser back (via button) | **Policy detail view:**<br>- Policy number & status<br>- Product information<br>- Policyholder details<br>- Coverage details (sum assured, term, premium)<br>- Premium payment schedule<br>- Beneficiary information<br>- Policy documents (download links)<br>- Claim history (if any)<br>- Riders/add-ons<br>- Policy timeline/milestones<br><br>**Actions:**<br>- Print policy summary (browser print)<br>- Download policy documents (external links)<br>- View servicing options<br><br>**Query Params:** `?id={policyId}` (required) |
| **/profile-settings** | Sidebar: User dropdown → Profile Settings | `/` (Back arrow button) | **Advisor profile management:**<br><br>**Profile Information Tab:**<br>- Full name<br>- Email (read-only)<br>- Contact number<br>- Role/designation<br>- Agent code<br>- Profile photo upload<br>- Language preference<br>- Timezone<br><br>**Security Tab:**<br>- Change password (opens dialog)<br>  - Current password verification<br>  - New password (min 8 chars)<br>  - Confirm password<br>  - On success → logout → home<br>- Enable 2FA (opens setup dialog)<br>  - QR code for authenticator app<br>  - Verification code input<br>- Disable 2FA (confirmation dialog)<br><br>**Preferences Tab:**<br>- Notification settings (email, in-app)<br>- Calendar sync preferences<br>- Default view preferences<br>- Theme/appearance<br><br>**Back button → Home** |

---

## 🔄 Global Navigation Elements

### Sidebar Menu (Always visible on authenticated pages)
- **Home** → `/`
- **Customer** → `/customers`
- **New Business** → `/new-business`
- **Quick Quote** → `/quick-quote`
- **Analytics** → `/analytics`
- **To Do** → `/todo`
- **Broadcast** → `/broadcast` (with unread badge)

### User Dropdown Menu (Bottom of sidebar)
- **Profile Settings** → `/profile-settings`
- **Logout** → `/login` (clears session, hard refresh)

### Sidebar Collapse/Expand
- Toggle button (persists to localStorage: `advisorhub:sidebar-collapsed`)
- Collapses to icon-only view (74px) or full view (256px)

---

## 🔗 Cross-Module Links & Workflows

### Lead Creation & Management Flow
```
Home → "Add New Lead"
  → Customer (?action=new)
  → New Lead Dialog
  → "Save & Schedule"
  → CustomerDetail (?id=newLeadId)
```

### Quick Quote to Proposal Conversion Flow
```
Home/Sidebar → Quick Quote
  → Select Product
  → Enter Details
  → Calculate Premium
  → Quote Summary
  → "Start Full Proposal"
  → ProposalDetail (new proposal created)
```

### Proposal Creation from Lead Flow
```
Customer
  → CustomerDetail (?id=leadId)
  → "Create Proposal" button (future)
  → NewBusiness (?action=new&leadId={id})
  → Auto-creates proposal OR redirects to existing
  → ProposalDetail (?id=proposalId)
```

### Hot Lead Follow-up Flow
```
Home → Hot Leads Widget
  → Click lead card
  → CustomerDetail (?id=leadId)
  → View Overview tab
  → Schedule appointment
  → ToDo (with linked lead)
```

### Calendar & Reminder Flow
```
Home → Reminders Widget → "View All"
  → ToDo (list view)
  → Click task
  → Edit dialog
  → Update/Complete task
```

### Broadcast Notification Flow
```
Home → Broadcast Feed → "View All"
  → Broadcast (filtered by latest)
  → Click announcement
  → BroadcastDetail (?id={id})
  → Auto-mark as read
  → Back to Broadcast (unread count updated)
```

---

## 📊 Query Parameter Reference

| Page | Parameter | Type | Required | Description |
|------|-----------|------|----------|-------------|
| **CustomerDetail** | `id` | UUID | ✅ | Lead/Client ID |
| **Customer** | `action` | String | ❌ | `new` = open new lead dialog |
| **Customer** | `relationship` | String | ❌ | Filter: `lead`, `leads`, `clients` |
| **Customer** | `temperature` | String | ❌ | Filter: `hot`, `warm`, `cool` |
| **Customer** | `lastContacted` | String | ❌ | Filter: `7`, `30`, `90`, `over90`, `never` |
| **Customer** | `sort` | String | ❌ | Sort: `lastContacted`, `name`, `nextAppointment` |
| **NewBusiness** | `action` | String | ❌ | `new` = create new proposal |
| **NewBusiness** | `leadId` | UUID | ❌ | Link proposal to specific lead |
| **ProposalDetail** | `id` | UUID | ✅ | Proposal ID |
| **ProposalDetail** | `e2e` | String | ❌ | `1` = debug mode, unlocks Application section |
| **QuoteSummary** | `productId` | UUID | ✅ | Product ID |
| **QuoteSummary** | `productName` | String | ✅ | Product name |
| **QuoteSummary** | `productType` | String | ✅ | Product type |
| **QuoteSummary** | `age` | Number | ✅ | Customer age |
| **QuoteSummary** | `gender` | String | ✅ | `male` or `female` |
| **QuoteSummary** | `smoker` | String | ✅ | `yes` or `no` |
| **QuoteSummary** | `sumAssured` | Number | ✅ | Coverage amount (RM) |
| **QuoteSummary** | `policyTerm` | Number | ✅ | Policy term (years) |
| **QuoteSummary** | `monthly` | Number | ✅ | Monthly premium (RM) |
| **QuoteSummary** | `annual` | Number | ✅ | Annual premium (RM) |
| **QuoteSummary** | `total` | Number | ✅ | Total premium over term (RM) |
| **BroadcastDetail** | `id` | UUID | ✅ | Broadcast ID |
| **PolicyDetail** | `id` | UUID | ✅ | Policy ID |

---

## 💾 Local Storage Keys Reference

| Key | Storage Type | Purpose | Values |
|-----|--------------|---------|--------|
| `advisorhub:sidebar-collapsed` | localStorage | Sidebar collapse state | `"true"`, `"false"` |
| `advisorhub:customer-detail-tab:{leadId}` | sessionStorage | Active tab in CustomerDetail | `overview`, `portfolio`, `servicing`, `gap` |
| `advisorhub:broadcast-category` | sessionStorage | Selected broadcast category filter | `all`, `Announcement`, `Training`, `Campaign` |
| `advisorhub:broadcast-read:{broadcastId}` | sessionStorage | Mark broadcast as read | `"1"` |
| `advisorhub:todo-view-mode` | sessionStorage | ToDo view preference | `list`, `calendar` |
| `advisorhub:todo-filters` | sessionStorage | Active filters in ToDo | JSON object |
| `advisorhub:task-completed-map` | localStorage | Task completion status | JSON object |
| `advisorhub:todo-show-birthdays` | localStorage | Show birthdays in calendar | `"true"`, `"false"` |
| `advisorhub:todo-show-completed` | localStorage | Show completed tasks | `"true"`, `"false"` |
| `analyticsPrefs` | localStorage | Analytics time range preference | `30D`, `90D`, `YTD`, `12M` |

---

## 🔒 Authentication & Route Guards

### Protected Routes (Require Authentication)
All routes except `/login` and `/register` are protected by auth guard in `AdminLayout.jsx`:

```javascript
// Auth check on mount and route change
- If NOT authenticated AND NOT on /login or /register → redirect to /login
- If authenticated AND on /login or /register → redirect to /
```

### Logout Flow
```
User Dropdown → Logout
  → Calls adviseUAdminApi.auth.logout()
  → Clears React Query cache
  → Removes localStorage: analyticsPrefs
  → Navigate to /login (replace: true)
  → Hard refresh (window.location.reload)
```

### Session Management
- Uses Supabase Auth
- Token stored in browser (Supabase handles)
- Auth state listener in AdminLayout
- Auto-redirect on auth state change

---

## 🎯 Navigation Completeness Verification

### ✅ All Pages Have Entry Points
- ✅ Login - Direct URL or logout
- ✅ Register - From login
- ✅ Home - Post-login, sidebar, multiple back buttons
- ✅ Customer - Sidebar, home widgets
- ✅ CustomerDetail - Customer list, home hot leads
- ✅ NewBusiness - Sidebar
- ✅ ProposalDetail - NewBusiness list, quote conversion
- ✅ QuickQuote - Sidebar, home button
- ✅ QuoteSummary - QuickQuote calculator
- ✅ Analytics - Sidebar, home button
- ✅ ToDo - Sidebar, home button
- ✅ Broadcast - Sidebar, home widget
- ✅ BroadcastDetail - Broadcast list
- ✅ PolicyDetail - CustomerDetail portfolio tab
- ✅ ProfileSettings - User dropdown

### ✅ All Pages Have Exit Points
- ✅ All detail pages have back buttons
- ✅ Sidebar accessible from all authenticated pages
- ✅ Conversion flows have clear next steps
- ✅ Dead-end pages (Analytics, ToDo) are self-contained modules

### ✅ End-to-End User Journeys
1. **Lead Acquisition → Proposal → Application** ✅
   - Home → Customer → CustomerDetail → NewBusiness → ProposalDetail (all stages)

2. **Quick Quote → Full Proposal** ✅
   - Home → QuickQuote → QuoteSummary → ProposalDetail

3. **Follow-up Management** ✅
   - Home (Reminders) → ToDo → Schedule task → Link to CustomerDetail

4. **Performance Tracking** ✅
   - Home (Performance widget) → Analytics → Detailed reports

5. **Communication** ✅
   - Home (Broadcast feed) → Broadcast → BroadcastDetail → Mark as read

---

## 📝 Implementation Notes

### Navigation Method: React Router v6
- Uses `useNavigate()` hook for programmatic navigation
- Uses `<Link>` components for declarative links
- Uses `createPageUrl()` helper for consistent URL generation

### State Persistence Strategy
- **sessionStorage**: Temporary UI state (tabs, filters, view modes)
- **localStorage**: User preferences (sidebar, completed tasks, display toggles)
- **React Query**: Server state caching (user, leads, broadcasts, proposals)

### Loading States & Error Handling
- All data-dependent pages use React Query with suspense
- Loading spinners during navigation
- Error boundaries for crash recovery
- Toast notifications for user feedback

---

**📌 Legend:**
- ✅ = Implemented & Verified
- ❌ = Required parameter
- 🔒 = Authentication required
- 🔗 = Cross-module link

---

**Document Version:** 2.0
**Date Generated:** 2025-11-05
**Pages Documented:** 15
**Routes Mapped:** 17
**Query Parameters:** 24
**Storage Keys:** 11
