# 🧭 INSURANCE ADVISOR APP — NAVIGATION MAP (v1.0)

| **Current Screen / Module** | **Navigate From** | **Navigate To** | **Description / Key Interactions** |
|------------------------------|-------------------|-----------------|------------------------------------|
| **/login** | None | `/home`, `/register`, `/forgot-password` | User logs in using Advisor ID & Password. Successful login lands on Home. |
| **/register** | `/login` | `/login` | New advisor can register (optional; may be managed by admin). |
| **/forgot-password** | `/login` | `/login` | Advisor resets password via email verification. |
| **/home** | `/login` | `/profile`, `/customers`, `/new-business`, `/quick-quote`, `/analytics`, `/todo`, `/broadcast` | Personalized dashboard with greeting, quick links, reminders, hot leads, performance snapshot, and broadcast feed. |
| **/profile** | Top Nav Profile Card → `/home` | `/home` | View and manage profile info, 2FA, password, and preferences. |
| **/customers** | `/home`, Side Menu | `/customer/:id`, `/new-lead` | Lead & Client list. Supports search, filter, sort, and lead creation. |
| **/new-lead** | `/customers`, Quick Link | `/customers` | Capture new prospect info. “Save & Schedule Appointment” triggers `/todo/new` (linked). |
| **/customer/:id (Overview)** | `/customers`, `/hot-lead` | `/customer/:id/portfolio`, `/customer/:id/servicing`, `/customer/:id/gap`, `/todo/new`, `/new-business` | Client detail overview with tabs (Overview, Portfolio, Servicing, Gap). Can edit info, schedule appointments, or start Fact Find. |
| **/customer/:id/portfolio** | `/customer/:id (Overview)` | `/policy/:id` | Shows client’s active policies and total coverage summary. |
| **/policy/:id** | `/customer/:id/portfolio` | `/customer/:id/portfolio` | Shows policy details and downloadable documents. |
| **/customer/:id/servicing** | `/customer/:id (Overview)` | `/servicing/request`, `/servicing/track` | Shows available servicing options (claims, renewal, etc.) and past requests. |
| **/servicing/request** | `/customer/:id/servicing` | `/customer/:id/servicing` | Multi-step request form (information → upload → review → authorize). |
| **/servicing/track** | `/customer/:id/servicing` | `/customer/:id/servicing` | List of service requests with status and history. |
| **/customer/:id/gap** | `/customer/:id (Overview)` | `/customer/:id/gap/report` | Gap analysis comparing current vs recommended coverage. |
| **/customer/:id/gap/report** | `/customer/:id/gap` | `/customer/:id/gap` | Generates shareable PDF gap report. |
| **/new-business** | `/home`, `/customer/:id (Overview)`, `/quick-quote/convert` | `/fact-find`, `/fna`, `/recommendation`, `/quotation`, `/application` | Main proposal journey hub for advisors (Fact Find → FNA → Product → Quote → Application). |
| **/fact-find** | `/new-business`, `/customer/:id` | `/fna` | Capture client personal info, dependents, risk profile, and CKA. Supports auto-save. |
| **/fna** | `/fact-find` | `/recommendation` | Capture income, expenses, assets, liabilities, existing coverage. System computes net worth, affordability, and identifies gaps. |
| **/recommendation** | `/fna` | `/quotation` | AI-driven product recommendation, adjustable by advisor. Requires client confirmation before proceeding. |
| **/quotation** | `/recommendation`, `/quick-quote/convert` | `/application`, `/quotation/compare` | Build product illustration and premium estimates. Can compare multiple quotes. |
| **/quotation/compare** | `/quotation` | `/quotation` | Side-by-side quote comparison (max 5 scenarios). |
| **/application** | `/quotation` | `/application/submit` | Multi-step policy application: client info, beneficiary, underwriting, payment, consent. |
| **/application/submit** | `/application` | `/todo`, `/customers` | Final confirmation, signature capture, PDF generation, and submission. |
| **/quick-quote** | `/home`, Side Menu | `/quick-quote/result` | Fast quotation tool by Age, Gender, Coverage. |
| **/quick-quote/result** | `/quick-quote` | `/quick-quote`, `/new-business` | Displays instant estimate and option to convert to full proposal. |
| **/analytics** | `/home`, Side Menu | `/analytics/details`, `/analytics/insights` | Advisor’s performance dashboard with metrics and goal tracking. |
| **/analytics/details** | `/analytics` | `/analytics` | Deep-dive widgets: RP/SP goals, pending vs incepted, commission, comparison. |
| **/analytics/insights** | `/analytics` | `/analytics` | AI insights, shortfall alerts, and hotspot opportunities. |
| **/todo** | `/home`, Side Menu | `/todo/new`, `/calendar` | Calendar & Task Management (list and calendar view). |
| **/todo/new** | `/todo`, `/customer/:id`, `/new-lead` | `/todo` | Add new task or appointment. Linked to lead or client. |
| **/calendar** | `/todo` | `/todo` | Month/Week calendar view with drag-drop rescheduling and filtering. |
| **/broadcast** | `/home`, Side Menu | `/broadcast/:id` | Shows announcements, pinned messages, and categories. |
| **/broadcast/:id** | `/broadcast` | `/broadcast` | Full announcement details; marks as read. |

---

### 🔄 Notes
- **Global Navigation:** via top bar (Profile, Settings, Logout) and collapsible side menu (Home, Customers, New Business, Quick Quote, Analytics, To-Do, Broadcast).
- **Cross-links:**  
  - From Lead detail → Schedule Appointment → `/todo/new`  
  - From Fact Find → auto-link to Client record  
  - From Home widgets → deep-links into target modules (Hot Leads → Customer list filtered, Performance → Analytics, Reminder → To-Do)
