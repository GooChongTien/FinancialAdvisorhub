# Technical Constraints & Design Guidelines
## Insurance Advisor Application

**Document Version:** 1.0  
**Last Updated:** October 27, 2025  
**Purpose:** Guide UI/UX designers on technical constraints and capabilities

---

## Document Overview

This document translates technical specifications into design constraints and opportunities. Designers should reference this when creating wireframes, mockups, and prototypes to ensure designs are technically feasible and optimized.

---

## 1. Architecture Overview

### Microservices Architecture
**What this means for design:**
- ✅ Different modules can have independent release cycles
- ✅ Better performance - services scale independently
- ✅ Each major module (Lead, Client, Proposal, etc.) is a separate service
- ⚠️ Page transitions between services may have slight latency (design for this)
- ⚠️ Shared state (like notifications) requires careful design

**Design Implications:**
- Use loading states for cross-service navigation
- Cache frequently accessed data on frontend
- Design for graceful degradation if one service is down

---

## 2. Frontend Technology & Capabilities

### Primary: React (Web Application)
**Capabilities:**
- ✅ Rich interactive components
- ✅ Single Page Application (smooth transitions)
- ✅ Real-time updates via WebSockets
- ✅ Complex form validations
- ✅ Responsive design (desktop, tablet, mobile web)

**Design Considerations:**
- Can support complex UI interactions (drag-and-drop, inline editing, etc.)
- Modal dialogs, slide-out panels, accordions all supported
- Charts, graphs, data visualizations fully supported
- Progressive loading for large datasets

### Secondary: Flutter (Mobile Application)
**Status:** TBD - Decision needed on scope

**Questions to resolve:**
1. Is Flutter app a native mobile app or just for mobile web?
2. Will mobile app have feature parity with web?
3. Which features are mobile-priority?

**Design Impact:**
- If native Flutter app → Design separate mobile flows
- If responsive web only → Design mobile-first responsive layouts
- If hybrid → Identify which features are mobile-optimized

**Recommendation:** Start with responsive React web, add native Flutter in Phase 2/3 if needed

---

## 3. Performance Constraints

### Page Load Time: ≤ 3 seconds
**What this means:**
- ⚠️ Cannot load massive datasets on initial page load
- ⚠️ Complex reports must use progressive loading
- ⚠️ Large lists require pagination or infinite scroll
- ✅ Lazy loading for images and documents
- ✅ Code splitting for faster initial load

**Design Guidelines:**

#### For List Views (Leads, Clients, Policies)
- **Show:** Maximum 50 items per page initially
- **Use:** Pagination or infinite scroll for more
- **Display:** Loading skeleton while fetching
- **Optimize:** Virtual scrolling for 100+ items

#### For Dashboards
- **Load:** Summary data first (1-2 seconds)
- **Defer:** Detailed charts/widgets (2-3 seconds)
- **Show:** "Loading..." state for each widget
- **Cache:** Dashboard data for 5-15 minutes

#### For Forms (Fact Finding, Application)
- **Break:** Long forms into sections/steps
- **Load:** Only current section data
- **Save:** Auto-save every 2 minutes
- **Validate:** Client-side first (instant), server-side on save

#### For Reports & Documents
- **Generate:** In background if >5 seconds
- **Show:** Progress indicator
- **Deliver:** Via download link or email
- **Preview:** Thumbnail or first page only

### Concurrent Users: Up to 1,000
**What this means:**
- ✅ System can handle 1,000 advisors simultaneously
- ⚠️ But spikes beyond this need pre-notification
- ✅ Auto-scaling kicks in for gradual growth

**Design Impact:**
- No specific limitations on multi-user features
- Can support real-time notifications
- Collaborative features possible (e.g., shared proposals)

---

## 4. Data & State Management

### Database: Azure MySQL (Primary) + Redis (Cache)
**What this means:**
- ✅ Relational data structure (tables, relationships)
- ✅ ACID compliance (data integrity guaranteed)
- ✅ Redis for fast temporary data and sessions
- ⚠️ Complex queries may take 1-2 seconds

**Design Guidelines:**

#### Search Functionality
- **Expect:** 1-2 second delay for complex searches
- **Design:** Show "Searching..." indicator
- **Optimize:** Search-as-you-type after 3+ characters
- **Results:** Return top 50, paginate rest

#### Filters & Sorting
- **Apply:** Filters on backend (not just frontend)
- **Show:** "Applying filters..." state
- **Cache:** Recent filter combinations
- **Persist:** Filter state in URL for bookmarking

#### Real-time Updates
- **Use Redis:** For live notifications, counters
- **Update:** Dashboard stats every 5-15 minutes
- **Show:** "Last updated: 2 min ago" timestamps
- **Refresh:** Manual refresh button always available

### Optional: MongoDB (Document Store)
**Potential Use Cases:**
- Unstructured data (notes, documents, attachments)
- Audit logs (large volume, flexible schema)
- Temporary data (drafts, work-in-progress)

**Design Impact:**
- Can support flexible, schema-less data storage
- Good for documents that vary in structure
- May be faster for large text fields

### PII Microservice (Separate Database)
**CRITICAL CONSTRAINT:**

**What this means:**
- ⚠️ Personal Identifiable Information stored in separate system
- ⚠️ NRIC, full address, contact details go to PII service
- ⚠️ Potential latency when fetching/saving PII data
- ⚠️ May fail independently from main system

**PII Data Includes:**
- Full Name
- NRIC / National ID
- Date of Birth
- Full Address
- Contact Numbers
- Email Addresses
- Bank Account Details
- Credit Card Information
- Medical Information

**Design Requirements:**

1. **Loading States for PII**
   ```
   When loading client profile:
   - Load non-PII first (show immediately)
   - Show "Loading personal details..." for PII section
   - Display partial info if PII service is slow/down
   ```

2. **Graceful Degradation**
   ```
   If PII service unavailable:
   - Show: "Some personal details temporarily unavailable"
   - Allow: Continue working with non-PII data
   - Block: Cannot submit applications without PII
   ```

3. **Edit Permissions**
   ```
   - PII fields may have stricter edit rules
   - Show "Verified" badge on confirmed PII
   - Require re-authentication for PII edits
   ```

4. **Form Design**
   ```
   - Group PII fields together visually
   - Use secure input fields (no autocomplete for sensitive data)
   - Mask sensitive data by default (show last 4 digits)
   - "Click to reveal" for full NRIC, account numbers
   ```

5. **Error Handling**
   ```
   If PII save fails:
   - Save non-PII data successfully
   - Show clear error: "Personal details could not be saved"
   - Provide retry button
   - Don't lose user's entered data
   ```

---

## 5. Authentication & Authorization

### Multi-Provider Authentication
**Three Different Auth Systems:**

1. **Azure AD (Internal Staff/Back Office)**
   - Corporate login
   - SSO enabled
   - Stay logged in all day

2. **LBU IAM - Okta/MS Authenticator (Insurance Advisors)**
   - Multi-factor authentication
   - Session timeout: TBD (recommend 4-8 hours)
   - Re-authentication required for sensitive actions

3. **OTP (High-Risk Operations)**
   - Additional verification for:
     - Submitting applications
     - Large premium quotations
     - Changing payment details
     - Accessing sensitive client data

**Design Requirements:**

#### Login Experience
```
1. User lands on login page
2. Choose user type: "Staff" or "Advisor"
3. Staff → Azure AD SSO
   Advisor → LBU IAM login
4. If advisor → Prompt for 2FA (Okta/MS Authenticator)
5. Successful login → Redirect to dashboard
```

#### Session Management
```
- Show session timeout warning 5 minutes before expiry
- "Your session will expire in 5:00. Continue working?"
- Auto-save work before session expires
- Graceful redirect to login (preserve return URL)
```

#### OTP for High-Risk Actions
```
When user submits application:
1. Show: "For security, please verify your identity"
2. Send OTP to registered mobile
3. Input field: "Enter 6-digit code"
4. Verify → Proceed with submission
5. Failed → Allow retry (3 attempts max)
```

**Design Implications:**
- Design clear auth state indicators (logged in as...)
- Session timeout countdown in UI
- Secure action confirmation flows
- Remember to save work before OTP prompts

---

## 6. Security & Compliance Constraints

### Compliance Standards
- ISO 27001 (Information Security)
- MAS TRM (Monetary Authority of Singapore Technology Risk Management)
- GDPR (General Data Protection Regulation)
- PDPA (Personal Data Protection Act - Singapore)

### Encryption
- **TLS 1.2:** All data in transit encrypted
- **AES-SHA256:** All data at rest encrypted

### Audit Trails (MANDATORY)
**Every action must be logged:**

**What must be audited:**
- User login/logout
- View client PII
- Create/edit leads and clients
- Generate quotations
- Submit applications
- Download documents
- Change permissions
- Export data
- Delete records
- Any PII access

**Design Requirements:**

1. **Consent & Acknowledgment**
   ```
   Before accessing sensitive data:
   - Show: "You are accessing client personal information"
   - Require: Checkbox acknowledgment
   - Log: Access timestamp and reason
   ```

2. **Purpose of Access**
   ```
   When viewing PII:
   - Prompt: "Why are you accessing this information?"
   - Options: "Client meeting", "Application processing", "Servicing request"
   - Save: Purpose with audit log
   ```

3. **Audit Trail Visibility**
   ```
   - Show "Last accessed by [Name] on [Date]" on client records
   - Activity log tab in client profile
   - Admin can view full audit history
   ```

4. **Data Retention Notices**
   ```
   - Show: "This information will be retained for 7 years"
   - GDPR: "Right to be forgotten" request button
   - PDPA: Consent withdrawal option
   ```

5. **Screen Watermarking (Optional but Recommended)**
   ```
   - Watermark: "Confidential - [Advisor Name] - [Timestamp]"
   - Subtle, doesn't interfere with readability
   - Prevents unauthorized screenshots
   ```

---

## 7. Data Privacy & Consent

### GDPR & PDPA Requirements

**User Consent Management:**
```
When collecting client data, must capture:
- What data is collected
- Why it's collected
- How it will be used
- Who will access it
- How long it will be stored
- Right to access/modify/delete
```

**Design Requirements:**

1. **Consent Collection (During Fact Finding)**
   ```
   Before starting fact finding:
   - Show privacy notice
   - List all data to be collected
   - Checkbox: "I consent to collection and use of my personal data"
   - Checkbox: "I consent to marketing communications" (optional)
   - Digital signature capture
   - "Download Privacy Notice" button
   ```

2. **Consent Withdrawal**
   ```
   In client profile:
   - "Data Privacy Settings" section
   - Show current consents
   - Button: "Withdraw Consent"
   - Warning: "This will limit services we can provide"
   - Confirmation dialog
   ```

3. **Data Subject Rights**
   ```
   Buttons in client profile:
   - "Download My Data" (GDPR Article 15)
   - "Request Data Correction" (GDPR Article 16)
   - "Request Data Deletion" (GDPR Article 17) - where applicable
   ```

4. **Privacy-First Design**
   ```
   - Minimize data collection (only what's necessary)
   - Show only relevant data to advisor (role-based)
   - Auto-expire unused data
   - Anonymize data in analytics/reports
   ```

---

## 8. Browser & Device Support

### Browser Compatibility (Minimum Required)
**Decision needed:** Create and sign off on detailed matrix

**Recommended Support:**
- ✅ Chrome 90+ (desktop & mobile)
- ✅ Firefox 88+
- ✅ Safari 14+ (desktop & mobile)
- ✅ Edge 90+
- ⚠️ IE 11 (if required by enterprise - requires polyfills)

**Design Implications:**
- Test designs in all supported browsers
- Avoid bleeding-edge CSS features without fallbacks
- Provide graceful degradation for older browsers

### Device Support
**Minimum Screen Sizes:**
- Desktop: 1366x768 (standard laptop)
- Tablet: 768x1024 (iPad, Android tablets)
- Mobile: 375x667 (iPhone SE, small Android phones)

**Responsive Breakpoints:**
```
Mobile:    < 768px
Tablet:    768px - 1024px
Desktop:   > 1024px
Wide:      > 1440px (optional optimization)
```

**Design Requirements:**
- Mobile-first design approach
- Touch-friendly targets (min 44x44px)
- Avoid hover-only interactions
- Test on physical devices, not just emulators

### Offline/PWA Decision
**Status:** Not currently in scope - decision needed

**Questions:**
1. Should advisors work offline during client meetings?
2. How critical is offline functionality?
3. Which features need offline access?

**If offline IS needed:**
- Design for "Offline Mode" indicator
- Show sync status
- Conflict resolution UI (if data changes while offline)
- Local data storage limits

**If offline NOT needed:**
- Design for "No connection" error states
- Ability to save draft locally
- Resume when connection restored

---

## 9. API & Integration Constraints

### API Architecture: REST
**Response Times:**
- Simple queries: 200-500ms
- Complex queries: 1-2 seconds
- Report generation: 5-30 seconds (background job)

**Design Guidelines:**
- Show loading states for all API calls
- Timeout after 30 seconds with error message
- Retry button for failed requests
- Cache frequently accessed data (5-15 min)

### Rate Limiting
**Login Throttling:**
- Max login attempts: 5 per 15 minutes
- Exceeded → Show: "Too many attempts. Try again in 15 minutes"
- Design: Clear countdown timer

**API Rate Limits:**
- 1,000 requests per hour per advisor (typical)
- Exceeded → Show: "Service temporarily limited. Please try again shortly"

---

## 10. File Handling

### Upload Requirements
**Supported Formats:**
- Documents: PDF, DOCX, DOC
- Images: JPG, JPEG, PNG, GIF
- Spreadsheets: XLSX, XLS, CSV (if needed)

**File Size Limits:**
- Maximum per file: 10 MB
- Maximum per application: 50 MB total
- Large files → Compress or split

**Design Requirements:**

1. **Upload Interface**
   ```
   - Drag & drop area
   - "Browse files" button
   - Show supported formats
   - Show size limits
   - Multiple file selection
   - Progress bar for each file
   ```

2. **File Preview**
   ```
   - Thumbnail for images
   - Document icon + filename for PDFs/docs
   - File size display
   - Delete button (before submission)
   - Download/view button (after upload)
   ```

3. **Error Handling**
   ```
   - File too large → "File exceeds 10 MB limit"
   - Wrong format → "Please upload PDF, DOCX, or image files"
   - Upload failed → Retry button
   - Virus detected → "File could not be uploaded for security reasons"
   ```

### Document Generation
**What system can generate:**
- Quotation illustrations (PDF)
- Application forms (PDF)
- Gap analysis reports (PDF)
- Client statements (PDF)

**Generation Times:**
- Simple documents: 2-5 seconds
- Complex reports: 10-30 seconds
- Large proposals: Up to 60 seconds

**Design Requirements:**
```
When user clicks "Generate Report":
1. Show modal: "Generating your report..."
2. Progress indicator (spinner or %)
3. Option to continue working (generate in background)
4. Notification when ready: "Your report is ready to download"
5. Download button + email option
```

---

## 11. Notification System

### Capabilities
- ✅ In-app notifications (real-time via WebSockets)
- ✅ Email notifications
- ✅ SMS notifications (for OTP and critical alerts)
- ⚠️ Push notifications (only if native mobile app)

### Design Requirements

**In-App Notifications:**
```
- Bell icon in top navigation
- Badge count for unread
- Dropdown panel with recent notifications
- Types: Info, Success, Warning, Error
- Action buttons (e.g., "View Application")
- Mark as read/unread
- Clear all option
```

**Notification Types:**
```
- Application submitted
- Application approved/rejected
- Client action required
- Appointment reminder (15 min, 1 day before)
- Task due soon
- System maintenance scheduled
- New broadcast message
- Performance milestone achieved
```

**Email Notifications:**
```
- User preference settings
- Choose notification types
- Frequency: Real-time, Daily digest, Weekly summary
- Unsubscribe option (except critical notifications)
```

---

## 12. Scalability & Availability

### SLA: 99.5% Availability
**What this means:**
- Maximum downtime: ~3.65 hours per month
- Scheduled maintenance windows (off-peak hours)
- System should handle graceful degradation

### Concurrent Users: 1,000+
**With pre-notification for spikes:**
- Regular capacity: 1,000 concurrent advisors
- Peak events (e.g., campaign launches): Request scaling in advance

**Design for Scale:**

1. **Prevent System Overload**
   ```
   - Pagination on all lists (max 50 per page)
   - Lazy loading for images/data
   - Client-side caching (reduce repeated API calls)
   - Debounce search inputs (wait 300ms before searching)
   ```

2. **Graceful Degradation**
   ```
   If system is under heavy load:
   - Show: "System is experiencing high traffic"
   - Disable: Non-essential features temporarily
   - Prioritize: Core features (quotation, application)
   - Queue: Report generation for later
   ```

3. **Maintenance Mode**
   ```
   During scheduled maintenance:
   - Show: "System maintenance in progress"
   - Display: Expected completion time
   - Allow: Read-only access (if possible)
   - Prevent: New application submissions
   ```

---

## 13. Azure Services Integration

### Azure Services in Use
- **AKS (Kubernetes):** Container orchestration
- **API Management:** API gateway
- **Key Vault:** Secrets and certificates
- **Storage:** File and document storage
- **MySQL:** Primary database
- **Redis:** Caching layer
- **Monitor:** Logging and monitoring
- **Firewall + DDoS:** Security

**Design Impact:**
- All services highly available
- Automatic failover (minimal user impact)
- Global CDN for static assets (faster loads)
- Multi-region deployment (if needed)

---

## 14. Multi-Environment Setup

### Environments
1. **Development (Dev)**
   - For developers to test
   - Fake/anonymized data
   - Frequent deployments

2. **Staging (UAT)**
   - For user acceptance testing
   - Production-like data (anonymized)
   - Weekly deployments

3. **Production (Prod)**
   - Live system for advisors
   - Real client data
   - Controlled deployments

**Design Implications:**
- Environment indicator in UI (Dev/UAT only)
- Watermark for non-production environments
- Cannot accidentally submit real applications in UAT

---

## 15. Error Handling & User Feedback

### Error Types & Messages

**Validation Errors (Client-Side)**
```
- Instant feedback (no server call)
- Red border on field
- Error message below field
- Example: "Please enter a valid email address"
```

**Business Logic Errors (Server-Side)**
```
- After form submission
- Show in error summary at top
- Highlight relevant fields
- Example: "Proposal amount exceeds client's affordability"
```

**System Errors (Technical Issues)**
```
- Friendly message (no technical jargon)
- Example: "Something went wrong. Please try again or contact support."
- Error code for support reference
- Option to retry or go back
```

**Network Errors**
```
- Detect offline/network issues
- Show: "Connection lost. Retrying..."
- Auto-retry 3 times
- Manual retry button
```

### Success Feedback
```
- Toast notification (auto-dismiss in 5s)
- Green checkmark icon
- Example: "Lead created successfully"
- Link to view/edit what was created
```

---

## 16. Accessibility (A11y) Requirements

### WCAG 2.1 Level AA Compliance
**Recommended Target:**

**Keyboard Navigation:**
- ✅ All interactive elements accessible via Tab
- ✅ Visible focus indicators
- ✅ Skip to main content link
- ✅ Shortcut keys for common actions

**Screen Reader Support:**
- ✅ Semantic HTML (headings, labels, ARIA)
- ✅ Alt text for images
- ✅ Form labels properly associated
- ✅ Status messages announced

**Color & Contrast:**
- ✅ Minimum contrast ratio 4.5:1 for text
- ✅ Don't rely on color alone for information
- ✅ Colorblind-friendly palette

**Responsive Text:**
- ✅ Text resizable up to 200%
- ✅ No horizontal scrolling at 200% zoom
- ✅ Minimum font size: 14px (body text)

---

## 17. Localization & Internationalization

### Current Scope
**Primary Language:** English
**Location:** Singapore

### Future-Proofing
**Design for potential expansion:**
- Use language keys, not hardcoded text
- Allow space for text expansion (German is 30% longer than English)
- Date/time formats: Use local format
- Currency: Display with symbol (S$, $, etc.)
- Number formatting: 1,000.00 (US) vs 1.000,00 (EU)

### Date/Time Display
```
Format: DD MMM YYYY, HH:MM
Example: 27 Oct 2025, 14:30

Relative time for recent events:
- Just now
- 2 minutes ago
- 1 hour ago
- Today at 14:30
- Yesterday at 14:30
- 27 Oct 2025
```

---

## Key Decisions Still Needed

### HIGH PRIORITY (Needed Before Design Starts)
1. **Flutter App Scope**
   - [ ] Is this a native mobile app?
   - [ ] Feature parity with web?
   - [ ] Mobile-first features to identify?
   - **Impact:** Determines if we design separate mobile flows

2. **Backend Framework Selection**
   - [ ] Node/NestJS vs Java/Spring vs .NET Core?
   - [ ] One for all services or different per service?
   - **Impact:** Affects API response times and capabilities

3. **PII Microservice Confirmation**
   - [ ] Confirm integration details
   - [ ] Latency expectations
   - [ ] Fallback procedures
   - **Impact:** Critical for form design and data flow

4. **Browser Support Matrix**
   - [ ] Create detailed browser/version matrix
   - [ ] IE 11 support required?
   - [ ] Mobile browser minimum versions?
   - **Impact:** Determines CSS/JS features available

5. **Offline/PWA Decision**
   - [ ] Offline functionality needed?
   - [ ] Which features must work offline?
   - [ ] Data sync strategy?
   - **Impact:** Major UX design difference

### MEDIUM PRIORITY (Needed During Design Phase)
6. **Session Timeout Duration**
   - [ ] How long before advisor auto-logged out?
   - [ ] Warning period?
   - **Impact:** Affects save/auto-save strategy

7. **Multi-Language Support Timeline**
   - [ ] Just English for MVP?
   - [ ] Additional languages in Phase 2/3?
   - **Impact:** Design system flexibility

8. **Notification Preferences**
   - [ ] What notifications are mandatory?
   - [ ] What can advisors customize?
   - **Impact:** Settings page design

9. **Report Generation Limits**
   - [ ] Maximum report size?
   - [ ] Concurrent report generation limit?
   - **Impact:** UX for large reports

10. **Data Retention Policies**
    - [ ] How long is data kept?
    - [ ] What triggers deletion?
    - **Impact:** "Right to be forgotten" workflow

### LOW PRIORITY (Can Decide During Development)
11. **Analytics Integration**
    - [ ] Google Analytics, Azure Monitor, both?
    - [ ] What events to track?

12. **Feature Flags**
    - [ ] System for gradual rollout?
    - [ ] A/B testing capabilities?

13. **Branding & Theming**
    - [ ] Support for white-label/multi-tenant?
    - [ ] Customizable themes?

---

## Summary for Designers

### ✅ You CAN Design For:
- Rich, interactive React components
- Real-time updates and notifications
- Complex forms with validation
- Data visualizations and charts
- Drag-and-drop interactions
- File uploads and document generation
- Multi-step workflows
- Responsive layouts (desktop, tablet, mobile)
- Accessibility features

### ⚠️ Design with Constraints:
- Page loads must be ≤ 3 seconds (use progressive loading)
- PII data may load separately (design loading states)
- Some operations require OTP (design verification flows)
- Audit trails required (design consent/acknowledgment)
- Lists paginated at 50 items (design pagination/infinite scroll)
- Large reports generate in background (design async notifications)

### ❌ Avoid or Confirm First:
- Offline functionality (decision pending)
- Real-time collaboration (not in current scope)
- Video/audio calls (not in scope)
- Complex animations (may affect performance)
- Hover-only interactions (mobile users can't hover)
- Very large file uploads >10 MB (compression needed)

---

## Next Steps for Designers

1. **Review this document thoroughly**
2. **Ask questions about unclear constraints**
3. **Request decisions on pending items**
4. **Create design system aligned with constraints**
5. **Prototype with performance in mind**
6. **Test designs on target devices/browsers**

---

**Document Status:** Ready for Design Handoff  
**Questions?** Contact Technical Lead or Product Manager
