---
title: Mira Co-Pilot — Advisor User Guide
status: Ready for Week 8 launch review (2025‑11‑15)
audience: Licensed advisors using AdvisorHub in Singapore & Malaysia
---

## 1. Welcome

Mira Co‑Pilot is the AI workspace embedded inside AdvisorHub. It appears everywhere you work:

- **Command Mode** slides out from the right rail and gives you a full conversational canvas for research, drafting, and guided flows.
- **Co‑pilot Mode** sits inline on each module and offers proactive “next steps” without leaving the page.
- **Insight Mode** pins an ambient feed of nudges (follow-ups, performance shifts, system alerts) to the top nav.

### Why it matters

- Finish repetitive workflows ~40% faster by letting Mira navigate, prefill, and confirm screens on your behalf.
- Skip tab chaos—context (module, record, filters) is auto-shared so you can ask “What’s next for Jimmy Tan?” from wherever you already are.
- Receive proactive warnings (e.g., “8 warm leads went cold, want to nudge them?”) before KPIs slip.

### Requirements

- Supported browsers: latest Chrome, Edge, or Safari on desktop; mobile Safari/Chrome for quick reviews.
- Feature flag: `MIRA_COPILOT_ENABLED` must be turned on by your tenant admin.
- Recommended network: wired or Wi‑Fi with < 200 ms latency to ensure smooth streaming replies.

## 2. Interaction Modes

| Mode | Description | Ideal usage | Entry points |
|------|-------------|-------------|--------------|
| **Command** | Full-screen conversational assistant. Streams responses, shows action plans, and runs multi-step automations. | Research, quoting, complex customer journeys. | `Cmd/Ctrl + K`, floating “Ask Mira” button, or replying to Copilot suggestion. |
| **Co-pilot** | Inline suggestion panel tied to the page you are viewing. Surfaces 1-click actions Mira can execute immediately. | Quick follow-ups while working a list, prepping customer files, nudges after tasks. | Auto-opens after you complete a task, “Suggested next steps” pill on module pages. |
| **Insight** | Persistent feed of proactive alerts grouped by severity. | Staying informed throughout the day without running reports. | Bell/Insight icon in top nav, `Cmd/Ctrl + Shift + I`. |

### Using each mode

- **Open / close**: `Cmd/Ctrl + K` toggles Command mode; `Esc` closes the active panel and minimizes to Copilot.
- **Context sharing**: Mira automatically sends `module`, `page`, and `pageData` (selected record, filters, totals) so you can just ask “Show this customer’s tasks”.
- **What Mira can “see”**: Current module state, selected records, dashboard filters, and the last 5 messages from your conversation. Sensitive values (e.g., full NRIC) are masked before they leave your browser.

## 3. Getting Started Checklist

1. **Confirm access**: ask your admin or check Settings → Feature Flags → “Mira Co‑Pilot”. It should read “Enabled for tenant”.
2. **Sign in** to AdvisorHub and open any module (e.g., Customers).
3. **Launch Mira** with `Cmd/Ctrl + K` or click the floating action button in the lower-right corner.
4. **Send your first request**. Sample prompts:
   - “Draft a follow-up for Jamie Tan referencing yesterday’s meeting notes.”
   - “Create a new lead for Sarah Lim from my Q4 event list.”
   - “Summarize my performance vs goal this month.”
5. **Review planned actions**. Mira always explains the navigate/prefill/execute steps it intends to run. Click “Run Plan” or edit steps individually.

## 4. Core Workflows

### Customer follow-up
- **Prompt**: “Log a follow-up call for Alex Wong next Tuesday and draft the note.”
- **What happens**: Mira opens Customer 360 → pre-fills the task form with due date, contact channel, and summary → waits for your confirmation → submits and shows the success toast.
- **Tip**: Add tone guidance (“keep it casual”) so the suggested note matches your style.

### New Business quoting
- **Prompt**: “Generate a WealthPlus Saver quote for Jamie, 120k coverage, 20-year term.”
- **Execution**: Mira launches the quoting tool, fills in coverage/premium fields, and presents a confirmation dialog before submitting.
- **Data guardrails**: You’ll be prompted if mandatory context (DOB, smoker status) is missing; just supply it in the chat reply.

### Analytics insight review
- **Prompt**: “Show my monthly performance dashboard and highlight where I’m slipping.”
- **Outcome**: Mira navigates to Analytics → loads the “Monthly” tab → scrolls to KPIs → pins a summary message listing the red indicators. Click the “Explain variance” quick action to drill into funnel stages.

### To-do triage
- **Prompt**: “Surface tasks that are overdue and mark the easy wins complete.”
- **Automation**: Mira filters Tasks to `status=overdue`, shows you the list, then batches updates (with confirmation) for items you approve.

## 5. Inline Suggestions (Co-pilot)

- **How they’re generated**: Mira scores intents that align with your current module, filters, and recent actions. It returns high-confidence items (≥0.70) with prebuilt navigate/prefill plans.
- **Accept**: Click the suggestion tile to open the action card; hit “Run” to let Mira execute immediately.
- **Modify**: Expand the tile to tweak parameters (e.g., change the lead segment) before running.
- **Dismiss**: Use the ⋯ menu → “Not relevant”. Mira logs the dismissal and cools similar suggestions for 24 h.
- **Auto-execute**: Only “safe” actions (navigate, filter, draft) auto-run. Anything destructive—status changes, sends, deletes—always pauses for confirmation.

## 6. Insight Feed

- **Insight types**:
  - Performance trends (e.g., “You’re at 45% of YTD target, down 8% vs peers.”)
  - Follow-up nudges (“8 warm leads lack activity in 14 days.”)
  - System alerts (OpenAI degradations, tool outages).
- **Managing insights**: Click the CTA button (e.g., “View details”) to jump into the recommended screen. Dismiss items you’ve handled; snoozed items reappear the next morning.
- **Logging**: Each dismissal emits `mira.insight.dismissed` so product ops can tune thresholds. We only log intent metadata—never the free-form text you type.

## 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Toggle Command mode |
| `Cmd/Ctrl + Shift + C` | Jump straight to Co‑pilot suggestions |
| `Cmd/Ctrl + Shift + I` | Open Insight feed |
| `Cmd/Ctrl + Enter` | Send the current message |
| `Esc` | Close/Minimize the active Mira panel |
| `Cmd/Ctrl + Shift + M` | Cycle Command → Co‑pilot → Insight |

## 8. Frequently Asked Questions

**Where does Mira get its context?**  
From the active module (Customers, Broadcast, etc.), the selected record, and open filters. No external CRM data is pulled without your request.

**Can I undo an automated action?**  
Yes. Every action surfaces an “Undo” link in the success toast for 30 seconds. After that, use the standard module history to revert.

**How do I report a wrong suggestion?**  
Click the ⋯ menu → “Report issue”. It opens a short form that attaches the anonymized request payload and UI action plan.

**What data is logged for compliance?**  
We store timestamps, advisor ID, intent, selected agent, confidence tier, and action metadata. Conversation text stays in-region per MAS/BNM guidance.

## 9. Troubleshooting

| Symptom | What to try |
|---------|-------------|
| Mira doesn’t respond or spins | Check network connectivity, then reload the page. If the issue persists, see Runbook §3.2. |
| “Action blocked by guardrails” toast | The requested operation requires additional approvals (e.g., deleting contacts). Use the native module UI instead. |
| Missing feature flag | Contact your tenant admin to enable `MIRA_COPILOT_ENABLED` and module-specific flags (Customer, Broadcast, etc.). |
| Insight feed empty | Ensure you’re on a module with telemetry (Customers/Tasks). Dismissals cool similar insights for 24 h. |

Refer to `docs/runbooks/MIRA_AGENT_RUNBOOK.md` for deep-dive operations and escalation paths.

## 10. Release Notes & Support

- **Latest change log**: `docs/MIRA_AGENT_RELEASE_CHECKLIST.md` (Week 8 section).
- **Support channels**:
  - Slack: `#mira-copilot-support` (business hours) and `#ai-squad-oncall` (after hours).
  - Microsoft Teams: “Mira Co‑Pilot Advisors”.
- **Escalation**:
  1. AI Squad On-call (primary)
  2. Platform Engineering On-call (secondary)
  3. Product Manager – Mira (final)

Need a printable copy? Export this guide as PDF from your browser (`Cmd/Ctrl + P`) or grab the weekly digest from the Resources tab. Screenshot packs (GIF and static) live in `/public/assets/mira-user-guide/`.
