# AdvisorHub Feature Matrix

**Version:** 1.0
**Last Updated:** November 2025

This document provides a comprehensive overview of all features available in each module of the AdvisorHub system.

---

## Module Overview

| Module | Primary Function | User Type | Status |
|--------|------------------|-----------|--------|
| Dashboard (Home) | Performance monitoring & quick access | All Users | ✅ Active |
| Customer Management | Lead & client lifecycle management | Advisors | ✅ Active |
| New Business | Sales proposal workflow | Advisors | ✅ Active |
| Visualizer | Data visualization & charts | All Users | ✅ Active |
| Products | Product catalog & information | Advisors | ✅ Active |
| Analytics | Performance tracking & reporting | All Users | ✅ Active |
| To-Do & Calendar | Task & appointment management | All Users | ✅ Active |
| Broadcast | Company announcements | All Users | ✅ Active |
| Mira AI | Intelligent assistant | All Users | ✅ Active |
| Profile Settings | User preferences & security | All Users | ✅ Active |

---

## Dashboard (Home)

### Widgets & Cards

| Feature | Description | Customizable | Real-time |
|---------|-------------|--------------|-----------|
| **Sales Summary** | Total premium, policies, conversion | ✅ Yes | ✅ Yes |
| **Pipeline Overview** | Leads by stage visualization | ✅ Yes | ✅ Yes |
| **Recent Activities** | Latest customer interactions | ✅ Yes | ✅ Yes |
| **Upcoming Tasks** | Today's & overdue tasks | ✅ Yes | ✅ Yes |
| **Performance Trends** | Sales trend chart | ✅ Yes | ✅ Yes |
| **Quick Actions** | Shortcuts to common tasks | ✅ Yes | N/A |
| **New Leads** | Recently added prospects | ✅ Yes | ✅ Yes |
| **Active Proposals** | Proposals in progress | ✅ Yes | ✅ Yes |

### Actions Available

| Action | Description | Shortcut |
|--------|-------------|----------|
| Add New Lead | Create lead entry | `Ctrl+K` → "Add lead" |
| Start Proposal | Begin new business workflow | Click widget |
| Quick Quote | Fast quotation | Click widget |
| View Calendar | Open schedule | Click widget |
| Customize Dashboard | Arrange widgets | Settings icon |

---

## Customer Management

### Lead Management Features

| Feature | Description | Permissions | Notes |
|---------|-------------|-------------|-------|
| **Create Lead** | Add new prospect | All Advisors | Required: Name, Contact |
| **Search & Filter** | Find leads by criteria | All Advisors | Multi-field search |
| **Lead Scoring** | Automatic prioritization | All Advisors | AI-powered |
| **Status Tracking** | Pipeline stage management | All Advisors | 7 stages |
| **Lead Assignment** | Assign to advisors | Managers | Team feature |
| **Bulk Actions** | Update multiple leads | All Advisors | Export, status update |
| **Lead Source Tracking** | Track lead origin | All Advisors | 7 source types |
| **Convert to Customer** | Lead conversion | All Advisors | Creates customer record |
| **Duplicate Detection** | Identify duplicate entries | Automatic | AI-assisted |
| **Lead Notes** | Add interaction notes | All Advisors | Unlimited notes |

### Client Management Features

| Feature | Description | Permissions | Notes |
|---------|-------------|-------------|-------|
| **Client Search** | Find existing customers | All Advisors | Advanced filters |
| **Client Profile** | Comprehensive customer view | All Advisors | 4 tabs |
| **Portfolio View** | All customer policies | All Advisors | Real-time status |
| **Event Logging** | Track interactions | All Advisors | 4 event types |
| **Document Upload** | Attach files | All Advisors | 10MB per file |
| **Gap Analysis** | Coverage assessment | All Advisors | AI-powered |
| **Servicing Requests** | Policy changes | All Advisors | Workflow based |
| **Customer 360** | Complete customer view | All Advisors | Integrated data |
| **Family Linking** | Link related customers | All Advisors | Household view |
| **Communication Log** | All touchpoints | All Advisors | Searchable |

### Data Fields

| Category | Fields | Required | Editable |
|----------|--------|----------|----------|
| **Basic Info** | Name, Contact, Email | Name, Contact | ✅ Yes |
| **Demographics** | DOB, Gender, NRIC | - | ✅ Yes |
| **Lead Specific** | Source, Status, Created Date | Source | Status only |
| **Client Specific** | Customer Since, Total Premium | - | Auto |
| **Contact Preferences** | Preferred Method, Best Time | - | ✅ Yes |
| **Financial** | Income, Assets, Liabilities | - | ✅ Yes |
| **Insurance** | Existing Policies, Coverage | - | ✅ Yes |

---

## New Business Module

### Workflow Stages

| Stage | Features | Required Fields | AI Assistance |
|-------|----------|----------------|---------------|
| **1. Fact Finding** | Customer data collection | Personal, Financial | Auto-validation |
| **2. FNA** | Needs calculation | Income, Expenses, Goals | Coverage recommendation |
| **3. Recommendation** | Product suggestion | Customer profile | AI matching |
| **4. Quotation** | Premium calculation | Coverage, Term | Rate engine |
| **5. Application** | Submission | All mandatory fields | Document checklist |

### Fact Finding Categories

| Category | Information Collected | Fields | Optional |
|----------|----------------------|--------|----------|
| **Personal** | Demographics, ID | 8 fields | 3 optional |
| **Family** | Spouse, Dependents | 6 fields | All optional |
| **Financial** | Income, Assets, Debts | 10 fields | 4 optional |
| **Insurance** | Existing coverage | 5 fields | All optional |
| **Health** | Medical history | 7 fields | 3 optional |
| **Lifestyle** | Occupation, Hobbies | 4 fields | 2 optional |

### FNA Capabilities

| Feature | Description | Customizable | AI-Enhanced |
|---------|-------------|--------------|-------------|
| **Income Replacement** | Calculate income needs | ✅ Yes | ✅ Yes |
| **Debt Coverage** | Outstanding liabilities | ✅ Yes | ✅ Yes |
| **Education Fund** | Children's education | ✅ Yes | ✅ Yes |
| **Retirement Planning** | Future income needs | ✅ Yes | ✅ Yes |
| **Emergency Fund** | Short-term reserves | ✅ Yes | ✅ Yes |
| **Gap Analysis** | Coverage shortfall | Auto | ✅ Yes |
| **What-If Scenarios** | Adjust assumptions | ✅ Yes | ✅ Yes |

### Product Recommendation

| Feature | Description | AI-Powered | Manual Override |
|---------|-------------|------------|-----------------|
| **Auto Recommendation** | AI suggests products | ✅ Yes | ✅ Yes |
| **Confidence Score** | Recommendation certainty | ✅ Yes | Display only |
| **Multiple Options** | Alternative products | ✅ Yes | ✅ Yes |
| **Coverage Matching** | Match to needs | ✅ Yes | Auto |
| **Budget Consideration** | Affordable options | ✅ Yes | ✅ Yes |
| **Rider Suggestions** | Add-on coverage | ✅ Yes | ✅ Yes |

### Quotation Features

| Feature | Description | Export Format | Customizable |
|---------|-------------|---------------|--------------|
| **Premium Calculation** | Real-time rates | - | Parameters |
| **Payment Options** | Multiple frequencies | - | ✅ Yes |
| **Benefit Summary** | Coverage breakdown | PDF | Template |
| **Comparison View** | Side-by-side | PDF, Excel | ✅ Yes |
| **Illustration** | Policy projection | PDF | ✅ Yes |
| **Rider Pricing** | Add-on premiums | PDF | ✅ Yes |
| **Digital Sharing** | Email, link | Email, URL | ✅ Yes |

### Application Processing

| Feature | Description | Required | Validation |
|---------|-------------|----------|------------|
| **Form Completion** | All application fields | ✅ Yes | Auto |
| **Document Upload** | Supporting docs | ✅ Yes | Format check |
| **Beneficiary Setup** | Nomination | ✅ Yes | Percentage check |
| **Medical Declaration** | Health questions | ✅ Yes | Flagging |
| **Payment Setup** | Auto-debit | ✅ Yes | Bank validation |
| **E-Signature** | Digital signing | ✅ Yes | Biometric |
| **Submission** | Send to underwriting | Auto | Completeness |
| **Status Tracking** | Application progress | Auto | Real-time |

---

## Visualizer Module

### Chart Types

| Chart Type | Use Case | Data Types | Interactive |
|------------|----------|------------|-------------|
| **Line Chart** | Trends over time | Time series | ✅ Yes |
| **Bar Chart** | Comparisons | Categorical | ✅ Yes |
| **Pie Chart** | Composition | Percentage | ✅ Yes |
| **Funnel Chart** | Pipeline stages | Sequential | ✅ Yes |
| **Scatter Plot** | Correlations | Numerical | ✅ Yes |
| **Heat Map** | Density patterns | Matrix data | ✅ Yes |
| **Gauge Chart** | KPI performance | Single metric | ✅ Yes |

### Visualization Categories

| Category | Available Charts | Customization | Export |
|----------|------------------|---------------|--------|
| **Sales Funnel** | Funnel, Bar | Colors, labels | PDF, PNG |
| **Performance Trends** | Line, Area | Time period | PDF, PNG |
| **Product Mix** | Pie, Bar | Grouping | PDF, PNG |
| **Customer Segmentation** | Pie, Bar, Scatter | Dimensions | PDF, PNG, Excel |
| **Geographic** | Map, Bar | Regions | PDF, PNG |
| **Time Analysis** | Line, Heat map | Granularity | PDF, PNG |

### Interactive Features

| Feature | Description | Available On |
|---------|-------------|--------------|
| **Drill Down** | Click to see details | All charts |
| **Zoom** | Focus on specific period | Time charts |
| **Filter** | Adjust visible data | All charts |
| **Hover Details** | Tooltip information | All charts |
| **Legend Toggle** | Show/hide series | Multi-series |
| **Export Data** | Download underlying data | All charts |

---

## Products Module

### Product Information

| Information Type | Details Included | Searchable | Comparable |
|------------------|------------------|------------|------------|
| **Basic Info** | Name, Category, Type | ✅ Yes | ✅ Yes |
| **Coverage** | Benefits, Sum assured, Term | ✅ Yes | ✅ Yes |
| **Eligibility** | Age, Health, Occupation | ✅ Yes | ✅ Yes |
| **Premium** | Rates, Payment options | ✅ Yes | ✅ Yes |
| **Riders** | Available add-ons | ✅ Yes | ✅ Yes |
| **Documents** | Brochures, Contracts | ✅ Yes | - |
| **Features** | Key highlights | ✅ Yes | ✅ Yes |
| **Exclusions** | What's not covered | ✅ Yes | ✅ Yes |

### Product Categories

| Category | Product Count | Typical Use | Age Range |
|----------|---------------|-------------|-----------|
| **Life Insurance** | 15+ products | Protection, Savings | 0-65 |
| **Health Insurance** | 10+ products | Medical expenses | 0-100 |
| **Critical Illness** | 8+ products | CI diagnosis | 18-65 |
| **Personal Accident** | 5+ products | Accidents | 1-70 |
| **Investment-Linked** | 12+ products | Investment + Protection | 1-65 |
| **Annuities** | 6+ products | Retirement income | 18-65 |

### Search & Filter Options

| Filter Type | Options | Multi-Select | Smart Search |
|-------------|---------|--------------|--------------|
| **Category** | 6 categories | ✅ Yes | - |
| **Coverage Amount** | Range slider | - | - |
| **Premium Range** | Min-Max | - | - |
| **Age Eligibility** | Customer age | - | Auto |
| **Payment Term** | 5, 10, 15, 20, Whole life | ✅ Yes | - |
| **Keywords** | Free text | - | ✅ Yes |

### Product Comparison

| Feature | Max Products | Criteria | Export |
|---------|--------------|----------|--------|
| **Side-by-Side** | 4 products | All attributes | PDF |
| **Highlight Differences** | Auto | Key features | PDF |
| **Premium Comparison** | By age | Multiple ages | PDF, Excel |
| **Coverage Comparison** | Benefits | Side-by-side | PDF |

### Quick Quote

| Feature | Description | Instant | Saved |
|---------|-------------|---------|-------|
| **Age-Based** | Premium by age | ✅ Yes | ✅ Yes |
| **Coverage Entry** | Input sum assured | ✅ Yes | ✅ Yes |
| **Payment Frequency** | Monthly, Quarterly, Annual | ✅ Yes | ✅ Yes |
| **Rider Add-on** | Include riders | ✅ Yes | ✅ Yes |
| **Save Quote** | Store for later | - | ✅ Yes |
| **Share Quote** | Email to customer | - | ✅ Yes |

---

## Analytics Module

### Performance Metrics

| Metric Category | KPIs Available | Real-time | Historical |
|-----------------|----------------|-----------|------------|
| **Sales** | Premium, Policies, Growth | ✅ Yes | ✅ Yes |
| **Pipeline** | Conversion, Stage duration | ✅ Yes | ✅ Yes |
| **Activity** | Meetings, Calls, Emails | ✅ Yes | ✅ Yes |
| **Productivity** | Tasks completed, Proposals | ✅ Yes | ✅ Yes |
| **Customer** | Retention, Cross-sell, LTV | ✅ Yes | ✅ Yes |
| **Product** | Mix, Popularity, Trends | ✅ Yes | ✅ Yes |

### Report Types

| Report | Description | Frequency | Export |
|--------|-------------|-----------|--------|
| **Sales Performance** | Comprehensive sales metrics | On-demand | PDF, Excel |
| **Pipeline Analysis** | Funnel breakdown | On-demand | PDF, Excel |
| **Activity Report** | Daily activities log | Daily, Weekly | PDF, Excel |
| **Customer Analytics** | Customer insights | On-demand | PDF, Excel |
| **Product Performance** | Product sales analysis | Monthly | PDF, Excel |
| **Goal Progress** | Target achievement | Real-time | PDF |

### Goal Tracking

| Feature | Description | Types | Alerts |
|---------|-------------|-------|--------|
| **Set Goals** | Define targets | Premium, Policies, Conversion | ✅ Yes |
| **Track Progress** | Monitor achievement | Visual progress bar | ✅ Yes |
| **Multiple Goals** | Track several simultaneously | Unlimited | ✅ Yes |
| **Historical** | Past performance | All past goals | - |
| **Forecasting** | Predict achievement | AI-based | ✅ Yes |

### Custom Analytics

| Feature | Description | Save | Share |
|---------|-------------|------|-------|
| **Custom Dashboard** | Build your own | ✅ Yes | ✅ Yes |
| **Widget Library** | Pre-built components | - | - |
| **Scheduled Reports** | Automated delivery | ✅ Yes | ✅ Yes |
| **Data Export** | Raw data download | - | CSV, Excel |

---

## To-Do & Calendar

### Task Management

| Feature | Description | Priority Levels | Reminders |
|---------|-------------|-----------------|-----------|
| **Create Task** | Add new task | High, Medium, Low | ✅ Yes |
| **Due Dates** | Set deadlines | Date & Time | ✅ Yes |
| **Categories** | Task types | 5 categories | - |
| **Customer Link** | Associate with customer | Optional | - |
| **Recurring Tasks** | Repeat tasks | Daily, Weekly, Monthly | ✅ Yes |
| **Subtasks** | Break down tasks | Unlimited | ✅ Yes |
| **Status** | Pending, In Progress, Done | 3 statuses | - |
| **Attachments** | Add files | 10MB limit | - |

### Calendar Features

| Feature | Description | Views | Sync |
|---------|-------------|-------|------|
| **Month View** | Full month overview | Month | ✅ Yes |
| **Week View** | Detailed week | Week | ✅ Yes |
| **Day View** | Daily agenda | Day | ✅ Yes |
| **Event Types** | Meeting, Call, Appointment | 4 types | ✅ Yes |
| **Location** | Physical or virtual | Free text | - |
| **Attendees** | Add participants | Multiple | ✅ Yes |
| **Google Calendar Sync** | Two-way sync | All | ✅ Yes |
| **Outlook Sync** | Two-way sync | All | ✅ Yes |

### Reminder Settings

| Timing | Available | Notification Type | Customizable |
|--------|-----------|-------------------|--------------|
| **15 minutes** | ✅ Yes | Email, In-app, Push | ✅ Yes |
| **1 hour** | ✅ Yes | Email, In-app, Push | ✅ Yes |
| **1 day** | ✅ Yes | Email, In-app, Push | ✅ Yes |
| **Custom** | ✅ Yes | Email, In-app, Push | ✅ Yes |

---

## Broadcast Module

### Message Features

| Feature | Description | Rich Content | Attachments |
|---------|-------------|--------------|-------------|
| **Read Messages** | View announcements | ✅ Yes | ✅ Yes |
| **Categories** | Message types | 6 types | - |
| **Search** | Find messages | Subject & Content | - |
| **Filter** | By category, date | Multiple filters | - |
| **Star/Favorite** | Mark important | Personal | - |
| **Mark Read** | Track reading status | Auto/Manual | - |

### Message Types

| Type | Purpose | Frequency | Priority |
|------|---------|-----------|----------|
| **Company News** | General updates | Weekly | Normal |
| **Policy Updates** | Procedure changes | As needed | High |
| **Product Launches** | New products | Monthly | High |
| **Training** | Learning content | Bi-weekly | Normal |
| **System Updates** | Platform changes | As needed | High |
| **Urgent** | Time-sensitive | Rare | Critical |

### Notifications

| Notification Type | Timing | Customizable | Disable |
|-------------------|--------|--------------|---------|
| **Email** | Immediate | ✅ Yes | ✅ Yes |
| **In-app Badge** | Real-time | - | ✅ Yes |
| **Desktop Push** | Immediate | ✅ Yes | ✅ Yes |
| **Mobile Push** | Immediate | ✅ Yes | ✅ Yes |

---

## Mira AI Assistant

### Capabilities

| Capability | Description | Accuracy | Context-Aware |
|------------|-------------|----------|---------------|
| **Navigation** | Go to pages/records | 95%+ | ✅ Yes |
| **Data Query** | Retrieve information | 90%+ | ✅ Yes |
| **Analysis** | Insights & trends | 85%+ | ✅ Yes |
| **Action Execution** | Perform tasks | 90%+ | ✅ Yes |
| **Recommendations** | Suggestions | 85%+ | ✅ Yes |
| **Learning** | System help | 95%+ | ✅ Yes |

### Interaction Modes

| Mode | Purpose | Best For | AI Level |
|------|---------|----------|----------|
| **Command** | Quick tasks | Navigation, lookups | Basic |
| **Copilot** | Guided workflows | Complex processes | Advanced |
| **Insight** | Strategic thinking | Analysis, planning | Expert |

### Supported Actions

| Action Type | Examples | Confirmation | Undo |
|-------------|----------|--------------|------|
| **Navigation** | "Open customers", "Go to analytics" | No | - |
| **Search** | "Find John Smith", "Show leads" | No | - |
| **Create** | "Add new lead", "Create task" | ✅ Yes | ✅ Yes |
| **Update** | "Change status", "Update premium" | ✅ Yes | ✅ Yes |
| **Delete** | "Remove task", "Delete lead" | ✅ Yes | Limited |
| **Export** | "Download report", "Export data" | ✅ Yes | - |

### Natural Language Understanding

| Feature | Support Level | Examples |
|---------|---------------|----------|
| **Synonyms** | ✅ High | "customers" = "clients" = "people" |
| **Variations** | ✅ High | "show" = "display" = "list" = "get" |
| **Context** | ✅ High | Follow-up questions use previous context |
| **Abbreviations** | ✅ Medium | "Q1" = "Quarter 1", "YTD" = "Year to Date" |
| **Typos** | ✅ Medium | Tolerates minor spelling errors |
| **Multilingual** | 🔄 Coming | English primary, others planned |

---

## Profile Settings

### Security Features

| Feature | Description | Required | 2FA Support |
|---------|-------------|----------|-------------|
| **Password Change** | Update password | ✅ Yes | - |
| **2FA Setup** | Two-factor auth | Optional | ✅ Yes |
| **Session Management** | Active devices | - | - |
| **Login History** | Past logins | - | - |
| **Password Requirements** | Strong password | ✅ Yes | - |

### Preferences

| Setting Type | Options | Default | Sync |
|--------------|---------|---------|------|
| **Theme** | Light, Dark (coming) | Light | ✅ Yes |
| **Language** | EN, ZH, MS, TA | EN | ✅ Yes |
| **Date Format** | DD/MM/YYYY, MM/DD/YYYY | DD/MM/YYYY | ✅ Yes |
| **Time Format** | 12h, 24h | 12h | ✅ Yes |
| **Timezone** | Auto/Manual | Auto | ✅ Yes |

### Notification Settings

| Channel | Configurable | Quiet Hours | Granular Control |
|---------|--------------|-------------|------------------|
| **Email** | ✅ Yes | ✅ Yes | By type |
| **In-app** | ✅ Yes | ✅ Yes | By type |
| **Push** | ✅ Yes | ✅ Yes | By type |
| **SMS** | ✅ Yes | ✅ Yes | Critical only |

---

## Feature Availability by User Role

| Feature | Advisor | Manager | Admin | Read-Only |
|---------|---------|---------|-------|-----------|
| **View Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Manage Own Leads** | ✅ | ✅ | ✅ | ❌ |
| **View All Leads** | ❌ | ✅ | ✅ | ✅ |
| **Create Proposals** | ✅ | ✅ | ✅ | ❌ |
| **Submit Applications** | ✅ | ✅ | ✅ | ❌ |
| **View Analytics** | Own | Team | All | All |
| **Manage Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Access Products** | ✅ | ✅ | ✅ | ✅ |
| **Use Mira** | ✅ | ✅ | ✅ | ✅ |
| **User Management** | ❌ | Limited | ✅ | ❌ |
| **System Settings** | ❌ | ❌ | ✅ | ❌ |

---

## Mobile Features

| Feature | Web | iOS App | Android App | Notes |
|---------|-----|---------|-------------|-------|
| **Dashboard** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Customer List** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Customer Details** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Create Lead** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Tasks** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Calendar** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Mira Chat** | ✅ | 🔄 Coming | 🔄 Coming | Responsive web |
| **Offline Mode** | ❌ | 🔄 Coming | 🔄 Coming | Native apps |

**Legend:**
- ✅ Available
- 🔄 Coming Soon
- ❌ Not Available

---

## Integration Capabilities

| Integration | Status | Method | Sync Direction |
|-------------|--------|--------|----------------|
| **Google Calendar** | ✅ Active | OAuth | Two-way |
| **Outlook Calendar** | ✅ Active | OAuth | Two-way |
| **Email (SMTP)** | ✅ Active | SMTP | One-way |
| **WhatsApp** | 🔄 Planned | API | One-way |
| **Telegram** | 🔄 Planned | Bot | Two-way |
| **CRM Systems** | 🔄 Planned | API | Two-way |
| **Payment Gateway** | 🔄 Planned | API | One-way |

---

## Performance & Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| **Max Leads** | Unlimited | No hard limit |
| **Max Customers** | Unlimited | No hard limit |
| **Max Tasks** | 10,000 active | Archive old tasks |
| **File Upload Size** | 10 MB | Per file |
| **Total Storage** | 100 GB | Per user |
| **Concurrent Users** | Unlimited | Shared tenant |
| **API Rate Limit** | 1000/hour | Per user |
| **Search Results** | 100 | Use filters |
| **Export Records** | 10,000 | Per export |

---

**Last Updated:** November 2025
**Version:** 1.0

*For detailed usage instructions, see the [System User Guide](./ADVISORHUB_USER_GUIDE.md)*
