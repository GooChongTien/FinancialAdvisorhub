/**
 * Contextual Prompts - Module-Specific First Prompts
 *
 * Defines intelligent first prompts based on:
 * - Current module (Customers, Products, Analytics, etc.)
 * - Page context (viewing specific customer, etc.)
 * - User role and permissions
 */

export interface ContextualPrompt {
  id: string;
  text: string;
  description: string;
  icon: string;
  category: 'quick_action' | 'insight' | 'navigation' | 'help';
}

export interface ModulePrompts {
  module: string;
  greeting: string;
  prompts: ContextualPrompt[];
}

/**
 * Get contextual prompts based on current module and page data
 */
export function getContextualPrompts(
  module: string,
  page: string,
  pageData?: Record<string, any>
): ModulePrompts {
  const moduleKey = module.toLowerCase();

  // Special case: If on a specific customer detail page
  if (page.includes('/customers/detail') && pageData?.customerName) {
    return getCustomerDetailPrompts(pageData.customerName, pageData);
  }

  // Module-specific prompts
  const promptMap: Record<string, ModulePrompts> = {
    home: {
      module: 'home',
      greeting: "Good to see you! What would you like to do today?",
      prompts: [
        {
          id: 'home-hot-leads',
          text: 'Show me my hot leads',
          description: 'View customers that need immediate follow-up',
          icon: '🔥',
          category: 'quick_action',
        },
        {
          id: 'home-pending-tasks',
          text: "What's on my agenda today?",
          description: 'See appointments and tasks for today',
          icon: '📅',
          category: 'insight',
        },
        {
          id: 'home-performance',
          text: 'How am I performing this month?',
          description: 'View your sales performance metrics',
          icon: '📊',
          category: 'insight',
        },
        {
          id: 'home-recommendations',
          text: 'Give me product recommendations',
          description: 'AI-powered product suggestions for your leads',
          icon: '✨',
          category: 'insight',
        },
      ],
    },

    customers: {
      module: 'customers',
      greeting: "Let's work on your customers. How can I help?",
      prompts: [
        {
          id: 'customers-top-by-premium',
          text: 'Show me top customers by premium value',
          description: 'Sort customers by total premium paid',
          icon: '💎',
          category: 'quick_action',
        },
        {
          id: 'customers-need-followup',
          text: 'Who needs follow-up this week?',
          description: 'Find customers with upcoming touchpoints',
          icon: '📞',
          category: 'insight',
        },
        {
          id: 'customers-renewals',
          text: 'Show upcoming policy renewals',
          description: 'View policies expiring in next 30 days',
          icon: '🔄',
          category: 'insight',
        },
        {
          id: 'customers-search',
          text: 'Find a customer by name or phone',
          description: 'Quick search for specific customer',
          icon: '🔍',
          category: 'quick_action',
        },
      ],
    },

    products: {
      module: 'products',
      greeting: "Exploring products? Let me help you find the right fit.",
      prompts: [
        {
          id: 'products-compare',
          text: 'Compare SecureLife vs WealthGuard',
          description: 'Side-by-side product comparison',
          icon: '⚖️',
          category: 'insight',
        },
        {
          id: 'products-best-for-age',
          text: "What's best for a 35-year-old?",
          description: 'Age-appropriate product recommendations',
          icon: '🎯',
          category: 'insight',
        },
        {
          id: 'products-top-sellers',
          text: 'Show me top-performing products',
          description: 'Products with highest sales this quarter',
          icon: '🏆',
          category: 'insight',
        },
        {
          id: 'products-new',
          text: 'What are the latest products?',
          description: 'View recently added products',
          icon: '🆕',
          category: 'navigation',
        },
      ],
    },

    analytics: {
      module: 'analytics',
      greeting: "Let's dive into your performance data.",
      prompts: [
        {
          id: 'analytics-this-quarter',
          text: 'How am I doing this quarter?',
          description: 'QTD sales, commissions, and targets',
          icon: '📈',
          category: 'insight',
        },
        {
          id: 'analytics-conversion',
          text: 'Show my conversion funnel',
          description: 'Leads → Proposals → Policies conversion rates',
          icon: '🔀',
          category: 'insight',
        },
        {
          id: 'analytics-trends',
          text: 'What are my monthly trends?',
          description: '12-month sales trend analysis',
          icon: '📉',
          category: 'insight',
        },
        {
          id: 'analytics-compare-team',
          text: 'How do I compare to my team?',
          description: 'Your performance vs team averages',
          icon: '🏅',
          category: 'insight',
        },
      ],
    },

    'smart-plan': {
      module: 'smart-plan',
      greeting: "Let's organize your day and priorities.",
      prompts: [
        {
          id: 'smartplan-urgent',
          text: "What's urgent today?",
          description: 'High-priority tasks due today',
          icon: '🚨',
          category: 'quick_action',
        },
        {
          id: 'smartplan-appointments',
          text: 'Show my appointments this week',
          description: 'Calendar view of upcoming meetings',
          icon: '📅',
          category: 'navigation',
        },
        {
          id: 'smartplan-create-task',
          text: 'Create a task for tomorrow',
          description: 'Add a new task with quick entry',
          icon: '➕',
          category: 'quick_action',
        },
        {
          id: 'smartplan-birthdays',
          text: 'Show upcoming customer birthdays',
          description: 'Birthdays in next 30 days',
          icon: '🎂',
          category: 'insight',
        },
      ],
    },

    visualizers: {
      module: 'visualizers',
      greeting: "Ready to visualize wealth scenarios?",
      prompts: [
        {
          id: 'viz-load-customer',
          text: 'Load a customer for visualization',
          description: 'Select customer to analyze',
          icon: '👤',
          category: 'quick_action',
        },
        {
          id: 'viz-add-life-event',
          text: 'Simulate a life event impact',
          description: 'Add marriage, house purchase, etc.',
          icon: '💍',
          category: 'quick_action',
        },
        {
          id: 'viz-compare-scenarios',
          text: 'Compare insured vs uninsured',
          description: 'Side-by-side scenario comparison',
          icon: '🔀',
          category: 'insight',
        },
        {
          id: 'viz-explain',
          text: 'Explain the projection methodology',
          description: 'How wealth projections are calculated',
          icon: '📚',
          category: 'help',
        },
      ],
    },

    news: {
      module: 'news',
      greeting: "Stay updated with the latest news and announcements.",
      prompts: [
        {
          id: 'news-unread',
          text: 'Show me unread announcements',
          description: 'Filter by unread status',
          icon: '📬',
          category: 'navigation',
        },
        {
          id: 'news-training',
          text: 'Show training materials',
          description: 'Filter by training category',
          icon: '🎓',
          category: 'navigation',
        },
        {
          id: 'news-campaigns',
          text: 'What campaigns are active?',
          description: 'View current sales campaigns',
          icon: '🎯',
          category: 'insight',
        },
        {
          id: 'news-search',
          text: 'Search news by keyword',
          description: 'Find specific announcements',
          icon: '🔍',
          category: 'quick_action',
        },
      ],
    },

    'new-business': {
      module: 'new-business',
      greeting: "Let's create a great proposal!",
      prompts: [
        {
          id: 'proposal-resume',
          text: 'Resume my last proposal',
          description: 'Continue working on in-progress proposal',
          icon: '📄',
          category: 'quick_action',
        },
        {
          id: 'proposal-prefill',
          text: 'Pre-fill with customer data',
          description: 'Auto-fill from selected customer',
          icon: '✨',
          category: 'quick_action',
        },
        {
          id: 'proposal-recommend-products',
          text: 'Recommend products for this customer',
          description: 'AI-powered product recommendations',
          icon: '🎯',
          category: 'insight',
        },
        {
          id: 'proposal-help',
          text: 'Guide me through fact-finding',
          description: 'Step-by-step proposal assistance',
          icon: '🧭',
          category: 'help',
        },
      ],
    },
  };

  return promptMap[moduleKey] || promptMap.home;
}

/**
 * Get prompts for customer detail page
 */
function getCustomerDetailPrompts(
  customerName: string,
  pageData: Record<string, any>
): ModulePrompts {
  return {
    module: 'customer-detail',
    greeting: `You're viewing ${customerName}. How can I help?`,
    prompts: [
      {
        id: 'customer-portfolio',
        text: `Show ${customerName}'s policy portfolio`,
        description: 'View all active policies and coverage',
        icon: '📋',
        category: 'quick_action',
      },
      {
        id: 'customer-history',
        text: 'Show interaction history',
        description: 'Past appointments, calls, and notes',
        icon: '📜',
        category: 'insight',
      },
      {
        id: 'customer-new-proposal',
        text: 'Create a new proposal',
        description: `Start proposal for ${customerName}`,
        icon: '➕',
        category: 'quick_action',
      },
      {
        id: 'customer-service-request',
        text: 'Create a service request',
        description: 'Start policy servicing task',
        icon: '🛠️',
        category: 'quick_action',
      },
    ],
  };
}

/**
 * Get quick prompts for empty chat state
 */
export function getQuickStartPrompts(): ContextualPrompt[] {
  return [
    {
      id: 'quick-hot-leads',
      text: 'Show me my hot leads',
      description: 'Customers needing immediate attention',
      icon: '🔥',
      category: 'quick_action',
    },
    {
      id: 'quick-performance',
      text: 'How am I performing this quarter?',
      description: 'QTD sales and commission summary',
      icon: '📊',
      category: 'insight',
    },
    {
      id: 'quick-tasks-today',
      text: "What's on my agenda today?",
      description: 'Tasks and appointments for today',
      icon: '📅',
      category: 'quick_action',
    },
    {
      id: 'quick-product-compare',
      text: 'Compare SecureLife plans',
      description: 'Side-by-side product comparison',
      icon: '⚖️',
      category: 'insight',
    },
  ];
}
