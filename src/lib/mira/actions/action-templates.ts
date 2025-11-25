/**
 * Mira Action Templates
 * Pre-defined action templates for common insurance advisor tasks
 */

import type { ActionTemplate, MiraAction, ActionParameter } from "./types";

/**
 * Customer Management Actions
 */
export const CUSTOMER_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "create_lead",
    name: "Create New Lead",
    description: "Create a new customer lead in the system",
    category: "customer",
    baseAction: {
      category: "customer",
      priority: "high",
      requiredPermission: "write",
      requiresConfirmation: false,
      undoable: true,
      icon: "user-plus",
      keyboard_shortcut: "ctrl+shift+l",
      tags: ["customer", "lead", "create"],
    },
    parameterTemplates: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Lead's full name",
      },
      {
        name: "contact_number",
        type: "string",
        required: true,
        description: "Primary contact number",
      },
      {
        name: "email",
        type: "string",
        required: false,
        description: "Email address",
      },
      {
        name: "lead_source",
        type: "string",
        required: false,
        defaultValue: "Referral",
        description: "Source of the lead",
        constraints: {
          enum: ["Referral", "Social Media", "Walk-in", "Cold Call", "Website", "Event", "Other"],
        },
      },
    ],
    variants: [
      {
        name: "Referral Lead",
        parameters: { lead_source: "Referral" },
      },
      {
        name: "Social Media Lead",
        parameters: { lead_source: "Social Media" },
      },
    ],
  },

  {
    id: "view_customer",
    name: "View Customer Details",
    description: "Navigate to customer detail page",
    category: "customer",
    baseAction: {
      category: "customer",
      priority: "medium",
      requiredPermission: "read",
      requiresConfirmation: false,
      undoable: false,
      icon: "user",
      keyboard_shortcut: "ctrl+shift+c",
      tags: ["customer", "view", "navigate"],
    },
    parameterTemplates: [
      {
        name: "customerId",
        type: "string",
        required: true,
        description: "Customer ID to view",
      },
    ],
  },

  {
    id: "update_customer",
    name: "Update Customer Information",
    description: "Update existing customer details",
    category: "customer",
    baseAction: {
      category: "customer",
      priority: "medium",
      requiredPermission: "write",
      requiresConfirmation: true,
      undoable: true,
      icon: "edit",
      tags: ["customer", "update", "edit"],
    },
    parameterTemplates: [
      {
        name: "customerId",
        type: "string",
        required: true,
        description: "Customer ID to update",
      },
      {
        name: "fields",
        type: "object",
        required: true,
        description: "Fields to update",
      },
    ],
  },
];

/**
 * Proposal Management Actions
 */
export const PROPOSAL_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "create_proposal",
    name: "Create New Proposal",
    description: "Create a new insurance proposal for a customer",
    category: "proposal",
    baseAction: {
      category: "proposal",
      priority: "high",
      requiredPermission: "write",
      requiresConfirmation: false,
      undoable: true,
      icon: "file-text",
      keyboard_shortcut: "ctrl+shift+p",
      tags: ["proposal", "create", "new-business"],
    },
    parameterTemplates: [
      {
        name: "customerId",
        type: "string",
        required: true,
        description: "Customer ID for the proposal",
      },
      {
        name: "productType",
        type: "string",
        required: false,
        description: "Type of insurance product",
        constraints: {
          enum: ["Life", "Health", "Investment", "General"],
        },
      },
      {
        name: "coverageAmount",
        type: "number",
        required: false,
        description: "Proposed coverage amount",
      },
    ],
  },

  {
    id: "navigate_to_proposal_form",
    name: "Go to Proposal Form",
    description: "Navigate to the proposal creation form",
    category: "proposal",
    baseAction: {
      category: "navigation",
      priority: "medium",
      requiredPermission: "write",
      requiresConfirmation: false,
      undoable: false,
      icon: "arrow-right",
      tags: ["proposal", "navigate", "form"],
    },
    parameterTemplates: [
      {
        name: "customerId",
        type: "string",
        required: false,
        description: "Pre-fill with customer ID",
      },
    ],
  },

  {
    id: "submit_proposal",
    name: "Submit Proposal",
    description: "Submit the current proposal for review",
    category: "proposal",
    baseAction: {
      category: "proposal",
      priority: "high",
      requiredPermission: "write",
      requiresConfirmation: true,
      undoable: false,
      icon: "send",
      tags: ["proposal", "submit"],
    },
    parameterTemplates: [
      {
        name: "proposalId",
        type: "string",
        required: true,
        description: "Proposal ID to submit",
      },
      {
        name: "notes",
        type: "string",
        required: false,
        description: "Additional notes",
      },
    ],
  },
];

/**
 * Analytics Actions
 */
export const ANALYTICS_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "apply_analytics_filter",
    name: "Apply Analytics Filter",
    description: "Apply filters to analytics dashboard",
    category: "analytics",
    baseAction: {
      category: "analytics",
      priority: "medium",
      requiredPermission: "read",
      requiresConfirmation: false,
      undoable: true,
      icon: "filter",
      tags: ["analytics", "filter"],
    },
    parameterTemplates: [
      {
        name: "dateRange",
        type: "object",
        required: false,
        description: "Date range filter",
      },
      {
        name: "productType",
        type: "string",
        required: false,
        description: "Filter by product type",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter by status",
      },
    ],
    variants: [
      {
        name: "This Month",
        parameters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            end: new Date(),
          },
        },
      },
      {
        name: "Last 30 Days",
        parameters: {
          dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
      },
    ],
  },

  {
    id: "export_analytics_report",
    name: "Export Analytics Report",
    description: "Export current analytics data to file",
    category: "analytics",
    baseAction: {
      category: "data",
      priority: "medium",
      requiredPermission: "read",
      requiresConfirmation: false,
      undoable: false,
      icon: "download",
      keyboard_shortcut: "ctrl+shift+e",
      tags: ["analytics", "export", "download"],
    },
    parameterTemplates: [
      {
        name: "format",
        type: "string",
        required: false,
        defaultValue: "csv",
        description: "Export format",
        constraints: {
          enum: ["csv", "excel", "pdf"],
        },
      },
      {
        name: "includeSummary",
        type: "boolean",
        required: false,
        defaultValue: true,
        description: "Include summary section",
      },
    ],
  },
];

/**
 * Todo/Task Management Actions
 */
export const TODO_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "create_task",
    name: "Create New Task",
    description: "Create a new task or reminder",
    category: "todo",
    baseAction: {
      category: "todo",
      priority: "medium",
      requiredPermission: "write",
      requiresConfirmation: false,
      undoable: true,
      icon: "check-square",
      keyboard_shortcut: "ctrl+shift+t",
      tags: ["todo", "task", "create"],
    },
    parameterTemplates: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Task title",
      },
      {
        name: "description",
        type: "string",
        required: false,
        description: "Task description",
      },
      {
        name: "dueDate",
        type: "date",
        required: false,
        description: "Due date",
      },
      {
        name: "priority",
        type: "string",
        required: false,
        defaultValue: "medium",
        description: "Task priority",
        constraints: {
          enum: ["low", "medium", "high", "urgent"],
        },
      },
      {
        name: "relatedCustomerId",
        type: "string",
        required: false,
        description: "Link to customer",
      },
    ],
    variants: [
      {
        name: "Follow-up Call",
        parameters: {
          title: "Follow-up call with customer",
          priority: "high",
        },
      },
      {
        name: "Send Proposal",
        parameters: {
          title: "Send proposal to customer",
          priority: "high",
        },
      },
    ],
  },

  {
    id: "complete_task",
    name: "Mark Task Complete",
    description: "Mark a task as completed",
    category: "todo",
    baseAction: {
      category: "todo",
      priority: "low",
      requiredPermission: "write",
      requiresConfirmation: false,
      undoable: true,
      icon: "check",
      tags: ["todo", "complete"],
    },
    parameterTemplates: [
      {
        name: "taskId",
        type: "string",
        required: true,
        description: "Task ID to complete",
      },
      {
        name: "notes",
        type: "string",
        required: false,
        description: "Completion notes",
      },
    ],
  },
];

/**
 * Broadcast/Communication Actions
 */
export const BROADCAST_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "create_broadcast",
    name: "Create Broadcast Campaign",
    description: "Create a new broadcast message campaign",
    category: "news",
    baseAction: {
      category: "news",
      priority: "medium",
      requiredPermission: "write",
      requiresConfirmation: true,
      undoable: true,
      icon: "megaphone",
      tags: ["broadcast", "campaign", "communication"],
    },
    parameterTemplates: [
      {
        name: "title",
        type: "string",
        required: true,
        description: "Campaign title",
      },
      {
        name: "message",
        type: "string",
        required: true,
        description: "Message content",
      },
      {
        name: "audienceFilter",
        type: "object",
        required: false,
        description: "Target audience filters",
      },
      {
        name: "scheduledTime",
        type: "date",
        required: false,
        description: "When to send (optional, immediate if not set)",
      },
    ],
  },
];

/**
 * Navigation Actions
 */
export const NAVIGATION_ACTION_TEMPLATES: ActionTemplate[] = [
  {
    id: "navigate_to_page",
    name: "Navigate to Page",
    description: "Navigate to a specific page in the application",
    category: "navigation",
    baseAction: {
      category: "navigation",
      priority: "low",
      requiredPermission: "read",
      requiresConfirmation: false,
      undoable: false,
      icon: "arrow-right",
      tags: ["navigate", "go-to"],
    },
    parameterTemplates: [
      {
        name: "page",
        type: "string",
        required: true,
        description: "Page to navigate to",
        constraints: {
          enum: [
            "/dashboard",
            "/customers",
            "/new-business",
            "/analytics",
            "/smart-plan",
            "/news",
            "/broadcast",
            "/quick-quote",
          ],
        },
      },
      {
        name: "params",
        type: "object",
        required: false,
        description: "URL parameters",
      },
    ],
  },
];

/**
 * All action templates combined
 */
export const ALL_ACTION_TEMPLATES: ActionTemplate[] = [
  ...CUSTOMER_ACTION_TEMPLATES,
  ...PROPOSAL_ACTION_TEMPLATES,
  ...ANALYTICS_ACTION_TEMPLATES,
  ...TODO_ACTION_TEMPLATES,
  ...BROADCAST_ACTION_TEMPLATES,
  ...NAVIGATION_ACTION_TEMPLATES,
];

/**
 * Get action template by ID
 */
export function getActionTemplate(id: string): ActionTemplate | undefined {
  return ALL_ACTION_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get action templates by category
 */
export function getActionTemplatesByCategory(category: string): ActionTemplate[] {
  return ALL_ACTION_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Create action from template
 */
export function createActionFromTemplate(
  templateId: string,
  overrides: Partial<MiraAction> = {}
): MiraAction | null {
  const template = getActionTemplate(templateId);
  if (!template) return null;

  return {
    id: `${template.id}_${Date.now()}`,
    name: template.name,
    description: template.description,
    category: template.category,
    priority: template.baseAction.priority || "medium",
    requiredPermission: template.baseAction.requiredPermission || "read",
    requiresConfirmation: template.baseAction.requiresConfirmation ?? false,
    undoable: template.baseAction.undoable ?? false,
    icon: template.baseAction.icon,
    keyboard_shortcut: template.baseAction.keyboard_shortcut,
    parameters: template.parameterTemplates,
    tags: template.baseAction.tags,
    metadata: template.baseAction.metadata,
    ...overrides,
  };
}
