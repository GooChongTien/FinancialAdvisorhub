# i18n Translation Implementation Plan (Advisor Portal)

Target languages: English (source), Chinese (zh), Malay (ms), Tamil (ta), Hindi (hi), Spanish (es). Machine-translate ms/ta/hi/es from the English baseline; zh with tailored phrasing where needed.

## Global tasks
- [x] Ensure stored language preference wins over server/default (PreferencesContext + LanguageSwitcher)
- [ ] Verify language selector shows stored selection across routes
- [ ] Add shared/common keys for any new global UI patterns encountered

## Page-by-page localization (Advisor)
- [ ] Navigation + Advisor layout chrome (sidebar labels, badges, drawers, chats hover text) — wire to i18n keys and ensure selectors persist
- [ ] Home (done) — double-check prompts/buttons in all locales
- [ ] Customers list — confirm UI now uses i18n; extend translations to ms/ta/hi/es
- [x] Customer Detail (individual) — headings, tabs, cards, field labels, toasts
- [ ] Entity Customer Detail — headings, tabs, field labels, toasts
- [x] New Business — forms, cards, toasts, filters
- [x] Product — catalog/list, filters, buttons, tooltips
- [ ] Smart Plan + Smart Plan Detail — steps, metrics, buttons, toasts
- [ ] Service Requests list — already wired; verify all locales and toasts
- [ ] Service Request Detail — timeline, fields, buttons, toasts
- [ ] Proposals / Proposal Detail — stages, fields, toasts, actions
- [ ] Quote Summary — sections, labels, buttons, toasts
- [ ] Policy Detail — sections, labels, actions
- [ ] Analytics — charts, cards, filters
  - [x] Customers module
  - [x] Proposals module
  - [ ] Business Overview module
- [x] Servicing module
- [ ] News / Broadcast / Broadcast Detail — list headers, cards, buttons, metadata
- [ ] Scenario Visualizer — controls, charts, labels
- [ ] Profile Settings — fields, toasts, dialogs, validation messages
- [ ] Chat / All Chats / Mira Ops — headings, buttons, status text
- [ ] Admin pages (if in scope) — review separately after advisor completion
## Translation workflow per page
1) Identify hardcoded strings; replace with `t(...)` keys.
2) Add English keys to `src/lib/i18n/locales/en/translation.json` under a sensible namespace (e.g., `customers`, `profile`, `analytics`, `layout`).
3) Translate zh with best-fit phrasing; machine-translate ms/ta/hi/es from the English source (adjust obvious issues).
4) Sanity-check locale JSON validity (`py -c "import json; json.load(open(...))"`).
5) Smoke-check in browser: set `localStorage.i18nextLng` to target code, reload, and scan page.
6) Run i18n/unit tests when available (e.g., `npm run test:unit` or dedicated i18n suite).

## Validation checklist
- [ ] Locale files parse (json load) after edits
- [ ] Language selector persists choice across navigation
- [ ] Spot-check each page in zh and one additional locale (rotate ms/ta/hi/es)
- [ ] i18n/unit test suite passes
- [ ] No user-facing English stragglers on targeted pages



