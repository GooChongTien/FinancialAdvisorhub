# AdvisorHub Color System & Design Guidelines

## Executive Summary

This document defines the comprehensive color system and design rules for AdvisorHub, ensuring visual consistency across all modules. The system is inspired by top CRM platforms (Salesforce, HubSpot, Pipedrive) and fintech best practices, while maintaining the 360F brand identity.

---

## 🎨 Color Philosophy

### Core Principles

1. **Primary Blue for Trust & Professionalism** - Insurance and financial services require trust. Blue conveys reliability and professionalism.
2. **Semantic Colors with Purpose** - Every color has a meaning (success=green, warning=orange, error=red, info=yellow).
3. **Limited Palette, Maximum Impact** - Use 5-6 core colors to avoid visual chaos.
4. **White Space is Key** - Following Salesforce's approach, generous white space improves readability.
5. **Accessibility First** - All color combinations meet WCAG AA contrast requirements.

---

## 🎯 Color Hierarchy & Usage Rules

### 1. PRIMARY COLORS (Blue) - Brand & Interactive Elements

**When to use:**
- Primary action buttons (CTAs like "Save", "Submit", "Create")
- Navigation active states
- Links and interactive text
- Important UI highlights
- Data visualization primary series

**Color Scale:**
```
primary-50:  #EBF1FF  (Lightest - backgrounds, hover states)
primary-100: #D6E3FF  (Very light - badges, chips)
primary-200: #ADC7FF  (Light - borders, accents)
primary-300: #85ABFF  (Medium light)
primary-400: #5C8FFF  (Medium)
primary-500: #3373FF  ⭐ MAIN BRAND COLOR
primary-600: #0052E0  ⭐ PRIMARY BUTTONS & LINKS
primary-700: #003DAD  (Dark - hover states)
primary-800: #002979  (Very dark)
primary-900: #001446  (Darkest)
```

**Typography with Primary:**
- **Bold (700):** Section headers, card titles
- **Semibold (600):** Button text, important labels
- **Regular (400):** Body text, links

---

### 2. SEMANTIC COLORS - Status & Feedback

#### ✅ SUCCESS (Green) - Positive Actions & Financial Gains

**When to use:**
- Success messages
- Completed states
- Positive metrics (revenue, conversion rates)
- "Active" policy status
- Client badges

```
green-50:  #DDFAEB  (Success message backgrounds)
green-100: #BBF5D7  (Success badges)
green-500: #00A854  ⭐ MAIN SUCCESS COLOR
green-600: #008644  (Success buttons hover)
green-700: #006433  (Dark success text)
```

**Typography with Success:**
- **Semibold (600):** Success amounts, KPIs
- **Regular (400):** Success messages

---

#### ⚠️ WARNING (Orange) - Alerts & Pending States

**When to use:**
- Warning messages
- Pending/in-progress states
- Attention-needed indicators
- "Hot leads" badges
- Expiring policies

```
orange-50:  #FFF4E5  (Warning backgrounds)
orange-100: #FFE9CC  (Warning badges)
orange-500: #FF9100  ⭐ MAIN WARNING COLOR
orange-600: #E07400  (Warning buttons hover)
orange-700: #AD5700  (Dark warning text)
```

**Typography with Warning:**
- **Semibold (600):** Warning titles
- **Regular (400):** Warning messages

---

#### ❌ ERROR (Red) - Errors & Critical States

**When to use:**
- Error messages
- Failed states
- Destructive actions (delete)
- Critical alerts
- Overdue indicators

```
red-50:  #FFE5E7  (Error backgrounds)
red-100: #FFCCCF  (Error badges)
red-500: #F8333C  ⭐ MAIN ERROR COLOR
red-600: #DC0010  (Error buttons hover)
red-700: #A9000C  (Dark error text)
```

**Typography with Error:**
- **Semibold (600):** Error titles
- **Regular (400):** Error messages

---

#### ℹ️ INFO (Yellow) - Information & Neutral Alerts

**When to use:**
- Informational messages
- Tips and guidance
- Neutral notifications

```
yellow-50:  #FFF9E5  (Info backgrounds)
yellow-100: #FFF3CC  (Info badges)
yellow-500: #FFC300  ⭐ MAIN INFO COLOR
yellow-700: #AD8000  (Dark info text)
```

---

### 3. NEUTRAL/GRAY SCALE - Structure & Content

**Usage Rules:**

```
neutral-0:    #FFFFFF  (Page backgrounds, card backgrounds)
neutral-50:   #F4F5F5  (Secondary backgrounds, disabled states)
neutral-100:  #E8EAEC  (Hover backgrounds, dividers)
neutral-200:  #D2D5D9  (Borders, separators)
neutral-300:  #B5BAC0  (Disabled text)
neutral-500:  #7C858F  (Secondary text, labels)
neutral-700:  #4A515A  (Primary text)
neutral-900:  #202326  (Headings, emphasized text)
neutral-1000: #020303  (Maximum contrast text)
```

**Typography with Neutrals:**
- **Bold (700):** Page titles (neutral-900)
- **Semibold (600):** Section headers (neutral-700)
- **Regular (400):** Body text (neutral-700)
- **Light (300):** Secondary text (neutral-500)

---

### 4. ACCENT COLORS - Data Visualization & Special Elements

#### Cyan/Teal - Secondary Interactive Elements

**When to use:**
- Secondary CTAs
- Alternative data visualization
- Accent highlights
- Broadcast/announcement badges

```
cyan-50:  #E5F9FF  (Teal backgrounds)
cyan-100: #CCF3FF  (Teal badges)
cyan-500: #00C3FF  ⭐ MAIN CYAN COLOR
teal-600: #009FCC  (Hover states)
```

---

## 📊 Component-Specific Color Rules

### BUTTONS

| Button Type | Background | Text | Border | When to Use |
|-------------|-----------|------|--------|-------------|
| **Primary** | `primary-600` | `white` | none | Main actions (Save, Submit, Create) |
| **Secondary** | `slate-100` | `slate-900` | none | Secondary actions (Cancel, Back) |
| **Outline** | `transparent` | `slate-700` | `slate-200` | Tertiary actions (View, Edit) |
| **Ghost** | `transparent` | `slate-700` | none | Low-emphasis actions (links in cards) |
| **Destructive** | `red-600` | `white` | none | Delete, Remove actions |
| **Success** | `green-600` | `white` | none | Confirm, Approve actions |

**Font Weight:** Semibold (600) for all button text

---

### BADGES

| Badge Type | Background | Text | Border | When to Use |
|------------|-----------|------|--------|-------------|
| **Status: Not Initiated** | `slate-100` | `slate-700` | none | Initial lead state |
| **Status: Contacted** | `blue-100` | `blue-700` | none | Lead contacted |
| **Status: Proposal** | `yellow-100` | `yellow-700` | none | Proposal stage |
| **Client** | `green-100` | `green-700` | none | Converted client |
| **Hot Lead** | `orange-100` | `orange-700` | none | Priority leads |
| **Default** | `teal-100` | `teal-700` | none | General tags |
| **Outline** | `transparent` | `slate-700` | `slate-200` | Filters, removable tags |

**Font Weight:** Semibold (600) for all badge text

---

### CARDS

| Element | Color | When to Use |
|---------|-------|-------------|
| **Background** | `white` | All cards |
| **Border** | `slate-200` | Default border |
| **Shadow** | `shadow-lg` | Elevation |
| **Header Border** | `slate-100` | Separator between header and content |
| **Hover State** | `shadow-xl` | Interactive cards |

**Font Weights in Cards:**
- **Title:** Semibold (600) or Bold (700)
- **Body:** Regular (400)
- **Labels:** Semibold (600)

---

### INPUTS & FORMS

| Element | Color | State |
|---------|-------|-------|
| **Border** | `slate-200` | Default |
| **Border Focus** | `primary-500` | Focus |
| **Border Error** | `red-500` | Error |
| **Background** | `white` | Default |
| **Background Disabled** | `neutral-50` | Disabled |
| **Text** | `slate-900` | Default |
| **Placeholder** | `slate-400` | Placeholder |
| **Label** | `slate-500` | Default |

**Font Weights for Forms:**
- **Labels:** Semibold (600), uppercase, text-xs
- **Input Text:** Regular (400)
- **Helper Text:** Regular (400), smaller size
- **Error Text:** Regular (400), red-600

---

### DATA VISUALIZATION

**Chart Color Palette (Use in Order):**
1. `#0ea5e9` (Sky Blue) - Primary data series
2. `#10b981` (Green) - Positive/growth data
3. `#8b5cf6` (Purple) - Revenue/premium data
4. `#f59e0b` (Amber) - Warning/attention data
5. `#ef4444` (Red) - Negative/decline data
6. `#6366f1` (Indigo) - Secondary data

**Best Practices:**
- Use max 6 colors in a single chart
- Maintain sufficient contrast between adjacent colors
- Use color + pattern for accessibility
- Reserve red/green for clear positive/negative indicators

---

## 📝 Typography System

### Font Family
```css
Primary: 'Open Sans', sans-serif
Display: 'Open Sans', sans-serif
```

### Font Weight Hierarchy

| Weight | Use Case | Examples |
|--------|----------|----------|
| **300 (Light)** | Large headings, display text | Hero sections |
| **400 (Regular)** | Body text, paragraphs, descriptions | Main content |
| **600 (Semibold)** | Subheadings, labels, button text, important data | Section headers, form labels |
| **700 (Bold)** | Page titles, card titles, emphasis | H1, H2 headings |

### When to Use Bold vs Semibold

**Use Bold (700) for:**
- Page main headings (H1)
- Section titles (H2)
- Card titles
- Data that needs maximum emphasis (large numbers in dashboards)

**Use Semibold (600) for:**
- Subheadings (H3, H4)
- Form labels
- Button text
- Badge text
- Table headers
- Important metric labels

**Use Regular (400) for:**
- Body text
- Descriptions
- Help text
- List items
- Table data

**Use Light (300) for:**
- Large display text where lightness creates elegance
- Secondary information in large font sizes

---

### Text Color Rules

| Content Type | Color | Font Weight |
|--------------|-------|-------------|
| **Page Title** | `neutral-900` | Bold (700) |
| **Section Header** | `slate-900` | Semibold (600) |
| **Body Text** | `slate-700` | Regular (400) |
| **Secondary Text** | `slate-500` | Regular (400) |
| **Disabled Text** | `slate-400` | Regular (400) |
| **Link** | `primary-600` | Regular (400) |
| **Link Hover** | `primary-700` | Regular (400) |
| **Success Text** | `green-700` | Semibold (600) for amounts, Regular for messages |
| **Error Text** | `red-600` | Regular (400) |
| **Warning Text** | `orange-700` | Regular (400) |

---

## 🎯 Module-Specific Guidelines

### Dashboard/Home Page
- **Background:** Gradient `from-slate-50 via-white to-slate-50`
- **Hero Section:** Gradient `from-primary-600 to-primary-500`
- **Quick Action Cards:** Light blue background `primary-50` with `primary-200` borders
- **Metrics:** Use semantic colors (green for positive, orange for neutral, blue for counts)
- **Card Backgrounds:** White with `shadow-lg`

### Customer List
- **Filters:** Primary blue highlights `primary-600`
- **Active Filter Badges:** `primary-50` background, `primary-700` text
- **Status Badges:** Follow status color rules (slate, blue, yellow)
- **Client Badge:** Always green (`green-100` bg, `green-700` text)
- **Search Highlights:** `primary-100` background, `primary-800` text, semibold

### Analytics Dashboard
- **KPI Cards:** Gradient backgrounds with matching icon colors
  - Leads: `from-blue-50 to-white`, blue-600 icon
  - Conversion: `from-green-50 to-white`, green-600 icon
  - Revenue: `from-purple-50 to-white`, purple-600 icon
  - Policies: `from-orange-50 to-white`, orange-600 icon
- **Charts:** Use 6-color palette consistently
- **Growth Indicators:** Green up arrows, red down arrows

### Forms & Proposal Workflow
- **Section Headers:** `slate-900`, semibold (600)
- **Required Fields:** Red asterisk `red-500`
- **Progress Indicators:** Primary blue `primary-600`
- **Success States:** Green checkmarks `green-500`
- **Validation Errors:** Red borders and text `red-500`

---

## ✨ Consistency Checklist

### Before Adding Color, Ask:

1. **Does this color have semantic meaning?**
   - ✅ Green for success/revenue
   - ✅ Red for errors/destructive actions
   - ❌ Random colors for decoration

2. **Am I using the established palette?**
   - ✅ Using defined shades (50, 100, 500, 600, 700)
   - ❌ Creating custom shades

3. **Is the text weight appropriate?**
   - ✅ Bold for titles, semibold for labels, regular for body
   - ❌ Bold for everything

4. **Does it maintain hierarchy?**
   - ✅ Primary actions in primary-600
   - ✅ Secondary actions in neutral tones
   - ❌ All buttons in different bright colors

5. **Is there enough contrast?**
   - ✅ Dark text on light backgrounds
   - ❌ Gray on light gray

---

## 🚀 Quick Reference: Common Patterns

### Primary Action Button
```jsx
<Button className="bg-primary-600 text-white font-semibold hover:bg-primary-700">
  Save
</Button>
```

### Status Badge
```jsx
// Not Initiated
<Badge className="bg-slate-100 text-slate-700 font-semibold">Not Initiated</Badge>

// Contacted
<Badge className="bg-blue-100 text-blue-700 font-semibold">Contacted</Badge>

// Proposal
<Badge className="bg-yellow-100 text-yellow-700 font-semibold">Proposal</Badge>

// Client
<Badge className="bg-green-100 text-green-700 font-semibold">Client</Badge>
```

### Card with Header
```jsx
<Card className="border-slate-200 shadow-lg">
  <CardHeader className="border-b border-slate-100">
    <CardTitle className="text-lg font-semibold text-slate-900">
      Title Here
    </CardTitle>
  </CardHeader>
  <CardContent className="text-slate-700">
    Content here
  </CardContent>
</Card>
```

### Form Label
```jsx
<Label className="text-xs font-semibold uppercase text-slate-500">
  Field Name
</Label>
```

### Success Message
```jsx
<div className="rounded-lg bg-green-50 border border-green-200 p-4">
  <p className="text-green-700 font-semibold">Success!</p>
  <p className="text-green-600">Your changes have been saved.</p>
</div>
```

---

## 📋 Migration Checklist

### Phase 1: Update Core Components
- [ ] Update button.jsx with standardized variants
- [ ] Update badge.jsx with semantic color variants
- [ ] Ensure card.jsx uses consistent borders and shadows
- [ ] Review input.jsx for consistent border colors

### Phase 2: Update Pages
- [ ] Home.jsx - Standardize button and badge colors
- [ ] Customer.jsx - Fix filter badges to primary blue
- [ ] Analytics.jsx - Standardize KPI card colors
- [ ] NewBusiness.jsx - Ensure consistent form styling

### Phase 3: Review & Refine
- [ ] Audit all pages for color consistency
- [ ] Check typography weights across modules
- [ ] Test accessibility (contrast ratios)
- [ ] Document any exceptions

---

## 🎓 Learning from Top CRMs

### From Salesforce
- **Limited color palette** (blue, green, navy)
- **Generous white space**
- **Clean, professional appearance**

### From HubSpot
- **Bright, motivating colors**
- **Color-coded urgency** (red for overdue)
- **Clean UI with quick value**

### From Pipedrive
- **Approachable, colorful dashboard**
- **Visual hierarchy** through color
- **Immediate information clarity**

### Applied to AdvisorHub
- Primary blue for trust and professionalism
- Semantic colors for clear meaning
- White space for clarity
- Consistent color usage across modules
- Motivating design with clear visual hierarchy

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
**Maintainer:** AdvisorHub Design Team
