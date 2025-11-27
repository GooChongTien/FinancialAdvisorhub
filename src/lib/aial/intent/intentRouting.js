/**
 * Intent-to-Route mapping configuration
 * Maps conversation intents to appropriate app routes
 */

import { createPageUrl } from "@/admin/utils";

/**
 * Intent routing configuration
 * Each intent maps to a route and optional parameters
 */
export const INTENT_ROUTE_MAP = {
  // Lead and customer intents
  "lead.enrichment": {
    route: "ProposalDetail",
    requiresParams: true,
    getParams: (intentResult) => {
      if (intentResult?.proposal?.id) {
        return `id=${intentResult.proposal.id}`;
      }
      return null;
    },
    fallbackRoute: "Customer",
  },
  "customer.search": {
    route: "Customer",
  },
  "customer.analysis": {
    route: "Customer",
  },
  "customer.temperature": {
    route: "Customer",
  },

  // Meeting and task intents
  "meeting.prep": {
    route: "SmartPlan",
  },
  "task.list": {
    route: "SmartPlan",
  },
  "todo.view": {
    route: "SmartPlan",
  },

  // Compliance and alerts
  "compliance.alert": {
    route: "SmartPlan",
  },

  // Analytics and performance
  "analytics.sales": {
    route: "Analytics",
  },
  "analytics.performance": {
    route: "Analytics",
  },
  "analytics.dashboard": {
    route: "Analytics",
  },

  // Smart plan and milestones
  "smartplan.view": {
    route: "SmartPlan",
  },
  "milestone.track": {
    route: "SmartPlan",
  },

  // Service requests
  "service.request": {
    route: "ServiceRequests",
  },
  "service.detail": {
    route: "ServiceRequestDetail",
    requiresParams: true,
  },

  // News and broadcasts
  "news.view": {
    route: "News",
  },
  "broadcast.view": {
    route: "News",
  },

  // Entity customers
  "entity.customer": {
    route: "EntityCustomers",
  },

  // Products
  "product.search": {
    route: "Product",
  },

  // Default/fallback
  "advisor.action.summary": {
    route: null, // Stay on current page
  },
};

/**
 * Detect intent from prompt keywords
 * @param {string} prompt - User's input prompt
 * @returns {string} - Detected intent name
 */
export function detectIntentFromPrompt(prompt) {
  if (!prompt) return "advisor.action.summary";

  const lc = prompt.toLowerCase();

  // Customer-related intents
  if (
    (lc.includes("customer") || lc.includes("client")) &&
    (lc.includes("top") || lc.includes("premium") || lc.includes("value"))
  ) {
    return "customer.analysis";
  }
  if (
    lc.includes("customer") &&
    (lc.includes("temperature") || lc.includes("hot") || lc.includes("cold"))
  ) {
    return "customer.temperature";
  }

  // Analytics intents
  if (
    (lc.includes("sales") || lc.includes("performance") || lc.includes("trend")) &&
    (lc.includes("quarter") || lc.includes("month") || lc.includes("year"))
  ) {
    return "analytics.sales";
  }
  if (lc.includes("analytic") || lc.includes("dashboard") || lc.includes("report")) {
    return "analytics.dashboard";
  }

  // Task and meeting intents
  if (
    lc.includes("task") ||
    lc.includes("todo") ||
    (lc.includes("pending") && lc.includes("appointment"))
  ) {
    return "task.list";
  }
  if (lc.includes("meeting") || lc.includes("appointment")) {
    return "meeting.prep";
  }

  // Smart plan intents
  if (lc.includes("smart plan") || lc.includes("milestone")) {
    return "smartplan.view";
  }

  // Service request intents
  if (lc.includes("service") && lc.includes("request")) {
    return "service.request";
  }

  // News intents
  if (lc.includes("news") || lc.includes("broadcast") || lc.includes("announcement")) {
    return "news.view";
  }

  // Entity customer intents
  if (lc.includes("entity") && lc.includes("customer")) {
    return "entity.customer";
  }

  // Product intents
  if (lc.includes("product") && (lc.includes("search") || lc.includes("find"))) {
    return "product.search";
  }

  // Recommendations
  if (lc.includes("recommend") || lc.includes("suggest") || lc.includes("insight")) {
    return "smartplan.view";
  }

  return "advisor.action.summary";
}

/**
 * Get route configuration for an intent
 * @param {string} intentName - Name of the intent
 * @returns {Object|null} - Route configuration or null
 */
export function getIntentRoute(intentName) {
  return INTENT_ROUTE_MAP[intentName] || null;
}

/**
 * Build navigation URL from intent and execution result
 * @param {string} intentName - Detected intent name
 * @param {Object} intentResult - Result from intent execution
 * @returns {string|null} - URL to navigate to, or null if no navigation needed
 */
export function buildNavigationUrl(intentName, intentResult = {}) {
  const routeConfig = getIntentRoute(intentName);

  if (!routeConfig) {
    return null;
  }

  // Check if route requires params
  if (routeConfig.requiresParams && routeConfig.getParams) {
    const params = routeConfig.getParams(intentResult);
    if (params) {
      return createPageUrl(`${routeConfig.route}?${params}`);
    }
    // Use fallback if params not available
    if (routeConfig.fallbackRoute) {
      return createPageUrl(routeConfig.fallbackRoute);
    }
    return null;
  }

  // Simple route without params
  if (routeConfig.route) {
    return createPageUrl(routeConfig.route);
  }

  return null;
}

/**
 * Determine if navigation should occur for an intent
 * @param {string} intentName - Name of the intent
 * @param {Object} intentResult - Result from intent execution
 * @returns {boolean} - Whether to navigate
 */
export function shouldNavigate(intentName, intentResult = {}) {
  const routeConfig = getIntentRoute(intentName);

  if (!routeConfig || !routeConfig.route) {
    return false;
  }

  // If intent execution failed, don't navigate
  if (
    intentResult?.status === "error" ||
    intentResult?.status === "skipped"
  ) {
    return false;
  }

  return true;
}

/**
 * Get starter prompt configuration with enhanced routing
 * @returns {Array} - Array of starter prompt configurations
 */
export function getStarterPrompts() {
  return [
    {
      key: "customerAnalysis",
      intent: "customer.analysis",
      route: "Customer",
      prompt: "Show me my top customers by premium value",
    },
    {
      key: "salesPerformance",
      intent: "analytics.sales",
      route: "Analytics",
      prompt: "What are my sales trends for this quarter?",
    },
    {
      key: "pendingTasks",
      intent: "task.list",
      route: "SmartPlan",
      prompt: "Show me my pending tasks and upcoming appointments",
    },
    {
      key: "recommendations",
      intent: "smartplan.view",
      route: "SmartPlan",
      prompt: "What recommendations do you have for me today?",
    },
  ];
}
