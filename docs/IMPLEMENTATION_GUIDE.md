# AdvisorHub Color System Implementation Guide

This guide provides practical examples for implementing the color system consistently across the app.

## 📋 Table of Contents
1. [Updated Components](#updated-components)
2. [Button Examples](#button-examples)
3. [Badge Examples](#badge-examples)
4. [Common Patterns](#common-patterns)
5. [Page-Specific Updates](#page-specific-updates)

---

## Updated Components

### Button Component (button.jsx)

**Updated variant styles:**

```javascript
const variantStyles = {
  // Primary - Main CTAs (Save, Submit, Create, Confirm)
  default:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500",

  // Same as default for backwards compatibility
  filled:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500 capitalize",

  // Secondary - Secondary actions (Cancel, Back, View Details)
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400",

  // Outline - Tertiary actions, filters, less emphasis
  outline:
    "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-slate-300",

  // Ghost - Minimal emphasis, inline actions
  ghost:
    "hover:bg-slate-100 hover:text-slate-900 text-slate-700",

  // Link style
  link:
    "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",

  // Destructive - Delete, Remove, Critical actions
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-500",

  // Success - Approve, Accept, Confirm positive actions
  success:
    "bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-500",

  // Warning - Caution actions
  warning:
    "bg-orange-500 text-white hover:bg-orange-600 focus-visible:outline-orange-500",
};
```

### Badge Component (badge.jsx)

**Updated semantic variant styles:**

```javascript
const variants = {
  // Default - General purpose tags
  default: "bg-primary-100 text-primary-700",

  // Status badges
  status: {
    notInitiated: "bg-slate-100 text-slate-700",
    contacted: "bg-blue-100 text-blue-700",
    proposal: "bg-yellow-100 text-yellow-700",
  },

  // Relationship badges
  client: "bg-green-100 text-green-700",
  lead: "bg-slate-100 text-slate-700",

  // Priority badges
  hot: "bg-orange-100 text-orange-700",
  normal: "bg-slate-100 text-slate-700",

  // Secondary styles
  secondary: "bg-slate-100 text-slate-700",

  // Destructive
  destructive: "bg-red-100 text-red-700",

  // Outline
  outline: "border border-slate-200 text-slate-700",

  // Success
  success: "bg-green-100 text-green-700",

  // Warning
  warning: "bg-orange-100 text-orange-700",

  // Info
  info: "bg-yellow-100 text-yellow-700",
};
```

---

## Button Examples

### Primary Actions (Blue)
```jsx
// Save, Submit, Create buttons
<Button variant="default">Save Changes</Button>
<Button>Create Lead</Button>
<Button variant="filled">Submit Proposal</Button>
```

### Secondary Actions (Gray)
```jsx
// Cancel, Back, View buttons
<Button variant="secondary">Cancel</Button>
<Button variant="secondary">Back to List</Button>
<Button variant="secondary">View Details</Button>
```

### Outline Buttons (White with border)
```jsx
// Less emphasis actions
<Button variant="outline">Load More</Button>
<Button variant="outline">Filter</Button>
<Button variant="outline">Export</Button>
```

### Ghost Buttons (Transparent)
```jsx
// Minimal emphasis, inline actions
<Button variant="ghost">View All</Button>
<Button variant="ghost">Manage Tasks</Button>
<Button variant="ghost">See Details</Button>
```

### Destructive Actions (Red)
```jsx
// Delete, Remove actions
<Button variant="destructive">Delete Lead</Button>
<Button variant="destructive">Remove Policy</Button>
<Button variant="destructive">Cancel Subscription</Button>
```

### Success Actions (Green)
```jsx
// Approve, Confirm positive actions
<Button variant="success">Approve Proposal</Button>
<Button variant="success">Accept Application</Button>
<Button variant="success">Confirm Payment</Button>
```

### Warning Actions (Orange)
```jsx
// Caution actions
<Button variant="warning">Suspend Policy</Button>
<Button variant="warning">Mark as Overdue</Button>
```

---

## Badge Examples

### Status Badges
```jsx
// Lead status
<Badge className="bg-slate-100 text-slate-700">Not Initiated</Badge>
<Badge className="bg-blue-100 text-blue-700">Contacted</Badge>
<Badge className="bg-yellow-100 text-yellow-700">Proposal</Badge>
```

### Relationship Badges
```jsx
// Client/Lead badges
<Badge className="bg-green-100 text-green-700">Client</Badge>
<Badge className="bg-slate-100 text-slate-700">Lead</Badge>
```

### Priority Badges
```jsx
// Hot leads, urgent items
<Badge className="bg-orange-100 text-orange-700">Hot Lead</Badge>
<Badge className="bg-red-100 text-red-700">Urgent</Badge>
```

### Semantic Badges
```jsx
// Success, warning, error
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Expired</Badge>
```

---

## Common Patterns

### 1. Page Header with Primary Action
```jsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold text-slate-900">Customer Management</h1>
    <p className="mt-1 text-slate-500">Manage your leads and clients</p>
  </div>
  <Button className="bg-primary-600 shadow-lg hover:bg-primary-700">
    <Plus className="mr-2 h-4 w-4" />
    New Lead
  </Button>
</div>
```

### 2. Card with Badges
```jsx
<Card className="border-slate-200 shadow-lg">
  <CardHeader className="border-b border-slate-100">
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg font-semibold text-slate-900">
        Customer Name
      </CardTitle>
      <div className="flex gap-2">
        <Badge className="bg-blue-100 text-blue-700">Contacted</Badge>
        <Badge className="bg-green-100 text-green-700">Client</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent className="text-slate-700">
    Content here
  </CardContent>
</Card>
```

### 3. Form with Semantic Buttons
```jsx
<div className="flex gap-3 justify-end">
  <Button variant="secondary">Cancel</Button>
  <Button variant="default">Save</Button>
</div>
```

### 4. Filter Badge (Removable)
```jsx
<Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700">
  Status: Contacted
  <button
    type="button"
    onClick={removeFilter}
    className="ml-2 rounded-full p-0.5 text-primary-600 hover:bg-primary-100"
  >
    <X className="h-3 w-3" />
  </button>
</Badge>
```

### 5. Success/Error Messages
```jsx
// Success
<div className="rounded-lg bg-green-50 border border-green-200 p-4">
  <p className="font-semibold text-green-700">Success!</p>
  <p className="text-green-600">Your changes have been saved.</p>
</div>

// Error
<div className="rounded-lg bg-red-50 border border-red-200 p-4">
  <p className="font-semibold text-red-700">Error</p>
  <p className="text-red-600">Something went wrong. Please try again.</p>
</div>
```

### 6. KPI Card with Gradient
```jsx
<Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
  <CardContent className="pt-6">
    <div className="mb-4 flex items-center justify-between">
      <Users className="h-10 w-10 text-blue-600" />
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
        +12%
      </span>
    </div>
    <p className="mb-1 text-sm text-slate-600">Total Leads</p>
    <p className="text-3xl font-bold text-slate-900">247</p>
  </CardContent>
</Card>
```

---

## Page-Specific Updates

### Home.jsx Updates

#### Before (Inconsistent):
```jsx
// Mixed blue and teal colors
<Button variant="ghost" className="mt-4 w-full text-teal-600 hover:bg-teal-50">
  View All
</Button>
```

#### After (Consistent):
```jsx
// Consistent primary blue
<Button variant="ghost" className="mt-4 w-full text-primary-600 hover:bg-primary-50 hover:text-primary-700">
  View All <ChevronRight className="ml-1 h-4 w-4" />
</Button>
```

### Customer.jsx Updates

#### Filter Badges (Already Good):
```jsx
<Badge variant="outline" className="border-primary-200 bg-primary-50 text-primary-700">
  {filter.label}
  <button onClick={filter.onRemove} className="...">
    <X className="h-3 w-3" />
  </button>
</Badge>
```

#### Status Colors (Standardized):
```jsx
const getStatusColor = (status) => {
  const colors = {
    "Not Initiated": "bg-slate-100 text-slate-700",
    "Contacted": "bg-blue-100 text-blue-700",
    "Proposal": "bg-yellow-100 text-yellow-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
};
```

### Analytics.jsx Updates

#### KPI Cards (Standardized Gradients):
```jsx
// Blue for counts
<Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
  <Users className="h-10 w-10 text-blue-600" />
</Card>

// Green for positive metrics
<Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
  <Target className="h-10 w-10 text-green-600" />
</Card>

// Purple for revenue
<Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white shadow-lg">
  <DollarSign className="h-10 w-10 text-purple-600" />
</Card>

// Orange for activity
<Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white shadow-lg">
  <BarChart3 className="h-10 w-10 text-orange-600" />
</Card>
```

---

## Typography Examples

### Page Titles
```jsx
<h1 className="text-3xl font-bold text-slate-900">
  Customer Management
</h1>
```

### Section Headers
```jsx
<h2 className="text-xl font-semibold text-slate-900">
  Recent Activity
</h2>
```

### Card Titles
```jsx
<CardTitle className="text-lg font-semibold text-slate-900">
  Hot Leads
</CardTitle>
```

### Body Text
```jsx
<p className="text-slate-700">
  Regular body text content
</p>
```

### Secondary Text
```jsx
<p className="text-sm text-slate-500">
  Secondary descriptive text
</p>
```

### Form Labels
```jsx
<Label className="text-xs font-semibold uppercase text-slate-500">
  Field Name
</Label>
```

### Success Amount
```jsx
<p className="text-sm font-semibold text-foreground-success">
  $25,000
</p>
```

---

## Migration Checklist

### Phase 1: Core Components ✅
- [x] Document button variants
- [x] Document badge variants
- [ ] Update button.jsx with success/warning variants
- [ ] Update badge.jsx with semantic variants

### Phase 2: Home Page
- [ ] Replace teal colors with primary blue in "View All" buttons
- [ ] Ensure badge colors use standard palette
- [ ] Standardize gradient backgrounds

### Phase 3: Customer Page
- [ ] Verify filter badges use primary blue
- [ ] Confirm status badges use standard colors
- [ ] Check button variants are appropriate

### Phase 4: Analytics Page
- [ ] Standardize KPI card gradients
- [ ] Use consistent chart color palette
- [ ] Ensure growth indicators use green/red appropriately

### Phase 5: Other Pages
- [ ] NewBusiness.jsx - Form styling
- [ ] ProposalDetail.jsx - Status indicators
- [ ] PolicyDetail.jsx - Badge colors
- [ ] ToDo.jsx - Calendar styling

---

## Testing Guidelines

### Visual Consistency Checks:
1. **All primary CTAs are blue** (`primary-600`)
2. **All status badges follow the standard palette**
3. **Success/positive = green, Error/negative = red, Warning = orange**
4. **Ghost buttons use primary blue on hover**
5. **Typography weights are consistent** (Bold for titles, Semibold for labels)

### Accessibility Checks:
1. **Contrast ratios meet WCAG AA** (4.5:1 for normal text)
2. **Color is not the only indicator** (use icons + color)
3. **Focus states are visible** (outline on focus)

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
