/**
 * Pattern Library
 * Catalog of successful customer journeys, anti-patterns, and failure points
 */

export interface PatternTemplate {
  id: string;
  name: string;
  category: "success" | "struggle" | "abandonment" | "exploration";
  description: string;
  triggers: string[];
  indicators: PatternIndicator[];
  suggestedActions: SuggestedAction[];
  confidence_threshold: number;
  timeWindow?: number; // milliseconds
  metadata?: Record<string, unknown>;
}

export interface PatternIndicator {
  type: string;
  weight: number;
  required: boolean;
  description: string;
}

export interface SuggestedAction {
  action: string;
  priority: "high" | "medium" | "low";
  condition?: string;
  uiAction?: Record<string, unknown>;
}

/**
 * ==========================================
 * SUCCESS PATTERNS
 * ==========================================
 */

export const SUCCESS_PATTERNS: PatternTemplate[] = [
  {
    id: "proposal_success",
    name: "Successful Proposal Creation",
    category: "success",
    description: "User successfully creates a proposal following best practices",
    triggers: [
      "customer_page_visit",
      "fact_finding_completion",
      "proposal_submission",
    ],
    indicators: [
      {
        type: "customer_page_visited",
        weight: 0.2,
        required: true,
        description: "User viewed customer details before creating proposal",
      },
      {
        type: "fact_finding_completed",
        weight: 0.3,
        required: true,
        description: "Completed fact-finding questionnaire",
      },
      {
        type: "fna_calculated",
        weight: 0.2,
        required: false,
        description: "Financial needs analysis performed",
      },
      {
        type: "proposal_submitted",
        weight: 0.3,
        required: true,
        description: "Proposal successfully submitted",
      },
    ],
    suggestedActions: [
      {
        action: "acknowledge_success",
        priority: "high",
        condition: "all_required_complete",
      },
      {
        action: "suggest_next_steps",
        priority: "medium",
        condition: "proposal_submitted",
      },
    ],
    confidence_threshold: 0.85,
    timeWindow: 1800000, // 30 minutes
  },

  {
    id: "efficient_search",
    name: "Efficient Information Discovery",
    category: "success",
    description: "User finds what they need quickly through search",
    triggers: ["search_action", "result_clicked", "task_completed"],
    indicators: [
      {
        type: "search_executed",
        weight: 0.3,
        required: true,
        description: "User performed a search",
      },
      {
        type: "result_interaction",
        weight: 0.3,
        required: true,
        description: "User clicked on a search result",
      },
      {
        type: "quick_navigation",
        weight: 0.2,
        required: false,
        description: "Fast navigation to target (< 30 seconds)",
      },
      {
        type: "no_repeat_searches",
        weight: 0.2,
        required: false,
        description: "No need to refine search",
      },
    ],
    suggestedActions: [
      {
        action: "track_search_success",
        priority: "low",
        condition: "result_clicked",
      },
    ],
    confidence_threshold: 0.75,
    timeWindow: 60000, // 1 minute
  },

  {
    id: "analytics_insight_discovery",
    name: "Analytics Insight Discovery",
    category: "success",
    description: "User successfully analyzes data and discovers insights",
    triggers: ["analytics_visit", "filter_applied", "export_action"],
    indicators: [
      {
        type: "analytics_page_visited",
        weight: 0.25,
        required: true,
        description: "Visited analytics dashboard",
      },
      {
        type: "filters_applied",
        weight: 0.25,
        required: false,
        description: "Applied filters to refine data",
      },
      {
        type: "sufficient_time_spent",
        weight: 0.25,
        required: true,
        description: "Spent adequate time analyzing (> 30s)",
      },
      {
        type: "action_taken",
        weight: 0.25,
        required: false,
        description: "Exported report or took action based on insights",
      },
    ],
    suggestedActions: [
      {
        action: "offer_advanced_analytics",
        priority: "medium",
        condition: "filters_applied",
      },
      {
        action: "suggest_related_reports",
        priority: "low",
        condition: "export_action",
      },
    ],
    confidence_threshold: 0.70,
    timeWindow: 300000, // 5 minutes
  },
];

/**
 * ==========================================
 * STRUGGLE / ANTI-PATTERNS
 * ==========================================
 */

export const STRUGGLE_PATTERNS: PatternTemplate[] = [
  {
    id: "form_abandonment",
    name: "Form Abandonment",
    category: "abandonment",
    description: "User starts filling form but abandons before completion",
    triggers: ["form_interaction", "extended_time", "navigation_away"],
    indicators: [
      {
        type: "form_fields_filled",
        weight: 0.3,
        required: true,
        description: "User started filling the form",
      },
      {
        type: "no_submission",
        weight: 0.4,
        required: true,
        description: "Form was not submitted",
      },
      {
        type: "extended_time_on_form",
        weight: 0.2,
        required: false,
        description: "Spent more than 2 minutes on form",
      },
      {
        type: "navigated_away",
        weight: 0.1,
        required: false,
        description: "Navigated to different page without saving",
      },
    ],
    suggestedActions: [
      {
        action: "offer_save_draft",
        priority: "high",
        condition: "fields_filled && no_submission",
      },
      {
        action: "offer_form_help",
        priority: "high",
        condition: "extended_time",
      },
      {
        action: "suggest_auto_fill",
        priority: "medium",
        condition: "fields_filled > 3",
      },
    ],
    confidence_threshold: 0.75,
    timeWindow: 300000, // 5 minutes
  },

  {
    id: "search_frustration",
    name: "Unsuccessful Search Pattern",
    category: "struggle",
    description: "User repeatedly searches but doesn't find what they need",
    triggers: ["multiple_searches", "no_result_clicks", "search_refinement"],
    indicators: [
      {
        type: "multiple_search_attempts",
        weight: 0.35,
        required: true,
        description: "More than 3 searches in short time",
      },
      {
        type: "varied_search_terms",
        weight: 0.25,
        required: true,
        description: "Different search terms used",
      },
      {
        type: "no_navigation_after_search",
        weight: 0.25,
        required: true,
        description: "No clicks on search results",
      },
      {
        type: "rapid_successive_searches",
        weight: 0.15,
        required: false,
        description: "Searches less than 10 seconds apart",
      },
    ],
    suggestedActions: [
      {
        action: "offer_search_help",
        priority: "high",
        condition: "multiple_attempts && no_navigation",
      },
      {
        action: "suggest_alternative_navigation",
        priority: "high",
        condition: "varied_terms",
      },
      {
        action: "offer_guided_tour",
        priority: "medium",
        condition: "rapid_searches",
      },
    ],
    confidence_threshold: 0.70,
    timeWindow: 180000, // 3 minutes
  },

  {
    id: "navigation_confusion",
    name: "Navigation Confusion",
    category: "struggle",
    description: "User appears lost, repeatedly navigating back and forth",
    triggers: ["excessive_back_navigation", "page_revisits", "no_progress"],
    indicators: [
      {
        type: "back_navigation_count",
        weight: 0.35,
        required: true,
        description: "More than 3 back navigations",
      },
      {
        type: "page_revisits",
        weight: 0.30,
        required: true,
        description: "Visiting same pages multiple times",
      },
      {
        type: "no_form_completion",
        weight: 0.20,
        required: false,
        description: "No forms completed despite multiple page visits",
      },
      {
        type: "rapid_navigation",
        weight: 0.15,
        required: false,
        description: "Spending less than 5 seconds per page",
      },
    ],
    suggestedActions: [
      {
        action: "offer_navigation_help",
        priority: "high",
        condition: "back_count > 3",
      },
      {
        action: "show_breadcrumb_reminder",
        priority: "medium",
        condition: "page_revisits",
      },
      {
        action: "suggest_workflow_guide",
        priority: "high",
        condition: "no_progress && rapid_navigation",
      },
    ],
    confidence_threshold: 0.75,
    timeWindow: 240000, // 4 minutes
  },

  {
    id: "data_entry_struggle",
    name: "Data Entry Difficulty",
    category: "struggle",
    description: "User struggling with data entry, multiple corrections",
    triggers: ["field_revisits", "validation_errors", "slow_progress"],
    indicators: [
      {
        type: "high_field_interaction_count",
        weight: 0.30,
        required: true,
        description: "More than 20 field interactions",
      },
      {
        type: "field_revisits",
        weight: 0.25,
        required: true,
        description: "Changing same fields multiple times",
      },
      {
        type: "validation_errors",
        weight: 0.25,
        required: false,
        description: "Multiple validation errors",
      },
      {
        type: "extended_session",
        weight: 0.20,
        required: false,
        description: "Spending more than 5 minutes on form",
      },
    ],
    suggestedActions: [
      {
        action: "offer_field_help",
        priority: "high",
        condition: "field_revisits > 2",
      },
      {
        action: "show_validation_tips",
        priority: "high",
        condition: "validation_errors > 2",
      },
      {
        action: "suggest_data_import",
        priority: "medium",
        condition: "extended_session",
      },
    ],
    confidence_threshold: 0.70,
    timeWindow: 300000, // 5 minutes
  },
];

/**
 * ==========================================
 * EXPLORATION PATTERNS
 * ==========================================
 */

export const EXPLORATION_PATTERNS: PatternTemplate[] = [
  {
    id: "feature_discovery",
    name: "Feature Discovery",
    category: "exploration",
    description: "User exploring new features or sections",
    triggers: ["new_page_visits", "tooltip_views", "menu_exploration"],
    indicators: [
      {
        type: "visiting_new_pages",
        weight: 0.35,
        required: true,
        description: "Visiting pages not previously accessed",
      },
      {
        type: "moderate_time_per_page",
        weight: 0.25,
        required: false,
        description: "Spending 10-60 seconds per page",
      },
      {
        type: "menu_interactions",
        weight: 0.20,
        required: false,
        description: "Frequent menu/navigation interactions",
      },
      {
        type: "help_content_views",
        weight: 0.20,
        required: false,
        description: "Viewing tooltips or help content",
      },
    ],
    suggestedActions: [
      {
        action: "offer_feature_tour",
        priority: "medium",
        condition: "new_pages > 3",
      },
      {
        action: "highlight_key_features",
        priority: "low",
        condition: "menu_interactions",
      },
    ],
    confidence_threshold: 0.65,
    timeWindow: 600000, // 10 minutes
  },

  {
    id: "comparison_shopping",
    name: "Product/Customer Comparison",
    category: "exploration",
    description: "User comparing multiple items side-by-side",
    triggers: ["rapid_navigation", "repeated_page_pattern", "list_interactions"],
    indicators: [
      {
        type: "rapid_navigation_between_items",
        weight: 0.30,
        required: true,
        description: "Quick switches between similar pages",
      },
      {
        type: "list_page_visits",
        weight: 0.25,
        required: true,
        description: "Frequent returns to list/overview page",
      },
      {
        type: "detail_page_pattern",
        weight: 0.25,
        required: false,
        description: "Viewing multiple detail pages in sequence",
      },
      {
        type: "no_immediate_action",
        weight: 0.20,
        required: false,
        description: "Researching before taking action",
      },
    ],
    suggestedActions: [
      {
        action: "offer_comparison_view",
        priority: "high",
        condition: "rapid_navigation && detail_pages > 2",
      },
      {
        action: "suggest_filters",
        priority: "medium",
        condition: "list_visits > 3",
      },
    ],
    confidence_threshold: 0.70,
    timeWindow: 180000, // 3 minutes
  },
];

/**
 * Pattern Library Registry
 */
export class PatternLibrary {
  private static allPatterns: PatternTemplate[] = [
    ...SUCCESS_PATTERNS,
    ...STRUGGLE_PATTERNS,
    ...EXPLORATION_PATTERNS,
  ];

  /**
   * Get all patterns
   */
  static getAllPatterns(): PatternTemplate[] {
    return [...this.allPatterns];
  }

  /**
   * Get patterns by category
   */
  static getPatternsByCategory(
    category: PatternTemplate["category"]
  ): PatternTemplate[] {
    return this.allPatterns.filter((p) => p.category === category);
  }

  /**
   * Get pattern by ID
   */
  static getPattern(id: string): PatternTemplate | undefined {
    return this.allPatterns.find((p) => p.id === id);
  }

  /**
   * Get success patterns
   */
  static getSuccessPatterns(): PatternTemplate[] {
    return SUCCESS_PATTERNS;
  }

  /**
   * Get struggle patterns
   */
  static getStrugglePatterns(): PatternTemplate[] {
    return STRUGGLE_PATTERNS;
  }

  /**
   * Get exploration patterns
   */
  static getExplorationPatterns(): PatternTemplate[] {
    return EXPLORATION_PATTERNS;
  }

  /**
   * Register a custom pattern
   */
  static registerPattern(pattern: PatternTemplate): void {
    this.allPatterns.push(pattern);
  }

  /**
   * Get suggested actions for a pattern
   */
  static getSuggestedActions(patternId: string, condition?: string): SuggestedAction[] {
    const pattern = this.getPattern(patternId);
    if (!pattern) return [];

    if (!condition) {
      return pattern.suggestedActions;
    }

    return pattern.suggestedActions.filter(
      (action) => !action.condition || action.condition === condition
    );
  }

  /**
   * Calculate pattern score based on indicators
   */
  static calculatePatternScore(
    patternId: string,
    detectedIndicators: string[]
  ): number {
    const pattern = this.getPattern(patternId);
    if (!pattern) return 0;

    // Check for missing required indicators first
    const missingRequired = pattern.indicators.some(
      (indicator) => indicator.required && !detectedIndicators.includes(indicator.type)
    );

    if (missingRequired) {
      return 0; // Missing required indicator = fail
    }

    let score = 0;
    let maxScore = 0;

    pattern.indicators.forEach((indicator) => {
      maxScore += indicator.weight;
      if (detectedIndicators.includes(indicator.type)) {
        score += indicator.weight;
      }
    });

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Get high-priority patterns (struggle and abandonment)
   */
  static getHighPriorityPatterns(): PatternTemplate[] {
    return this.allPatterns.filter(
      (p) => p.category === "struggle" || p.category === "abandonment"
    );
  }
}

/**
 * Pattern matching utilities
 */
export class PatternMatcher {
  /**
   * Match behavioral context against pattern library
   */
  static matchPatterns(
    indicators: string[],
    category?: PatternTemplate["category"]
  ): Array<{ pattern: PatternTemplate; score: number }> {
    const patterns = category
      ? PatternLibrary.getPatternsByCategory(category)
      : PatternLibrary.getAllPatterns();

    const matches = patterns.map((pattern) => ({
      pattern,
      score: PatternLibrary.calculatePatternScore(pattern.id, indicators),
    }));

    // Filter by confidence threshold and sort by score
    return matches
      .filter((m) => m.score >= m.pattern.confidence_threshold)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get best matching pattern
   */
  static getBestMatch(
    indicators: string[],
    category?: PatternTemplate["category"]
  ): { pattern: PatternTemplate; score: number } | null {
    const matches = this.matchPatterns(indicators, category);
    return matches[0] || null;
  }
}
