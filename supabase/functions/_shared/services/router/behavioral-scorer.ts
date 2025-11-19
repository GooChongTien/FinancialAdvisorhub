import type { BehavioralContext, MiraModule } from "../types.ts";

/**
 * Calculate confidence boost based on behavioral context
 * Returns a value between 0 and 0.3 to boost intent confidence
 */
export function calculateBehavioralBoost(
  intent: string,
  topic: string,
  context?: BehavioralContext
): number {
  if (!context) {
    return 0;
  }

  let boost = 0;
  const reasons: string[] = [];

  // 1. Check if current module matches the topic
  if (context.currentModule && context.currentModule === topic) {
    boost += 0.15;
    reasons.push("module_match");
  }

  // 2. Check if recent navigation indicates relevant workflow
  if (context.navigationHistory && context.navigationHistory.length > 0) {
    const recentNav = context.navigationHistory.slice(-3);
    const navigationBoost = analyzeNavigationPattern(recentNav, topic, intent);
    boost += navigationBoost.boost;
    reasons.push(...navigationBoost.reasons);
  }

  // 3. Check detected patterns
  if (context.detectedPatterns && context.detectedPatterns.length > 0) {
    const patternBoost = analyzeDetectedPatterns(context.detectedPatterns, topic, intent);
    boost += patternBoost.boost;
    reasons.push(...patternBoost.reasons);
  }

  // 4. Check recent actions
  if (context.recentActions && context.recentActions.length > 0) {
    const actionBoost = analyzeRecentActions(context.recentActions, topic, intent);
    boost += actionBoost.boost;
    reasons.push(...actionBoost.reasons);
  }

  // 5. Use AI-detected user intent if available
  if (context.userIntent) {
    const intentBoost = matchUserIntent(context.userIntent, intent);
    boost += intentBoost.boost;
    reasons.push(...intentBoost.reasons);
  }

  // 6. Use confidence level from behavioral tracker
  if (typeof context.confidenceLevel === "number" && context.confidenceLevel > 0.7) {
    boost += 0.05;
    reasons.push("high_behavioral_confidence");
  }

  // Cap boost at 0.3 (30%)
  const cappedBoost = Math.min(boost, 0.3);

  return cappedBoost;
}

/**
 * Analyze navigation patterns for relevance to intent
 */
function analyzeNavigationPattern(
  navigationHistory: BehavioralContext["navigationHistory"],
  topic: string,
  intent: string
): { boost: number; reasons: string[] } {
  if (!navigationHistory || navigationHistory.length === 0) {
    return { boost: 0, reasons: [] };
  }

  let boost = 0;
  const reasons: string[] = [];

  // Check for proposal creation workflow
  if (topic === "new_business" && intent.includes("proposal")) {
    const hasCustomerPage = navigationHistory.some((nav) =>
      nav.fromPage.includes("customer")
    );
    if (hasCustomerPage) {
      boost += 0.1;
      reasons.push("proposal_workflow_detected");
    }
  }

  // Check for analytics review pattern
  if (topic === "analytics") {
    const analyticsVisits = navigationHistory.filter((nav) =>
      nav.toPage.includes("analytics")
    );
    if (analyticsVisits.length >= 2) {
      boost += 0.08;
      reasons.push("analytics_review_pattern");
    }
  }

  // Check for customer management workflow
  if (topic === "customer") {
    const customerPages = navigationHistory.filter(
      (nav) => nav.toPage.includes("customer") || nav.fromPage.includes("customer")
    );
    if (customerPages.length >= 2) {
      boost += 0.07;
      reasons.push("customer_workflow_pattern");
    }
  }

  return { boost, reasons };
}

/**
 * Analyze detected behavioral patterns
 */
function analyzeDetectedPatterns(
  patterns: string[],
  topic: string,
  intent: string
): { boost: number; reasons: string[] } {
  let boost = 0;
  const reasons: string[] = [];

  // Pattern: form_struggle
  if (patterns.includes("form_struggle")) {
    boost += 0.1;
    reasons.push("form_struggle_detected");

    // Extra boost if intent is related to help or assistance
    if (intent.includes("help") || intent.includes("assist")) {
      boost += 0.05;
      reasons.push("help_intent_with_struggle");
    }
  }

  // Pattern: search_behavior
  if (patterns.includes("search_behavior")) {
    boost += 0.08;
    reasons.push("search_behavior_detected");

    // Extra boost if intent is about searching or finding
    if (intent.includes("search") || intent.includes("find") || intent.includes("lookup")) {
      boost += 0.05;
      reasons.push("search_intent_match");
    }
  }

  // Pattern: proposal_creation
  if (patterns.includes("proposal_creation") && topic === "new_business") {
    boost += 0.12;
    reasons.push("proposal_creation_pattern");
  }

  // Pattern: analytics_review
  if (patterns.includes("analytics_review") && topic === "analytics") {
    boost += 0.1;
    reasons.push("analytics_review_pattern");
  }

  return { boost, reasons };
}

/**
 * Analyze recent actions for relevance
 */
function analyzeRecentActions(
  actions: BehavioralContext["recentActions"],
  topic: string,
  intent: string
): { boost: number; reasons: string[] } {
  if (!actions || actions.length === 0) {
    return { boost: 0, reasons: [] };
  }

  let boost = 0;
  const reasons: string[] = [];

  // Check for form interactions
  const formActions = actions.filter((a) => a.actionType === "form_input");
  if (formActions.length > 5) {
    boost += 0.05;
    reasons.push("active_form_interaction");
  }

  // Check for search actions
  const searchActions = actions.filter(
    (a) =>
      a.actionType === "search" ||
      (a.actionType === "form_input" &&
        (a.elementId?.includes("search") || a.elementType?.includes("search")))
  );
  if (searchActions.length > 0) {
    boost += 0.06;
    reasons.push("search_action_detected");

    if (intent.includes("search") || intent.includes("find")) {
      boost += 0.04;
      reasons.push("search_intent_alignment");
    }
  }

  // Check for clicks on specific UI elements
  const clicks = actions.filter((a) => a.actionType === "click");
  if (clicks.length > 0) {
    const relevantClicks = clicks.filter((click) => {
      const label = (click.elementLabel || "").toLowerCase();
      const elementId = (click.elementId || "").toLowerCase();

      // Check if click is related to the topic
      return (
        label.includes(topic) ||
        elementId.includes(topic) ||
        label.includes(intent.split("__")[0]) ||
        elementId.includes(intent.split("__")[0])
      );
    });

    if (relevantClicks.length > 0) {
      boost += 0.07;
      reasons.push("relevant_click_detected");
    }
  }

  return { boost, reasons };
}

/**
 * Match AI-detected user intent with candidate intent
 */
function matchUserIntent(
  userIntent: string,
  candidateIntent: string
): { boost: number; reasons: string[] } {
  const normalizedUserIntent = userIntent.toLowerCase();
  const normalizedCandidateIntent = candidateIntent.toLowerCase();

  // Direct match
  if (normalizedUserIntent === normalizedCandidateIntent) {
    return { boost: 0.15, reasons: ["exact_intent_match"] };
  }

  // Partial match
  if (
    normalizedUserIntent.includes(normalizedCandidateIntent) ||
    normalizedCandidateIntent.includes(normalizedUserIntent)
  ) {
    return { boost: 0.1, reasons: ["partial_intent_match"] };
  }

  // Keyword match
  const userKeywords = normalizedUserIntent.split(/[_\s]+/);
  const candidateKeywords = normalizedCandidateIntent.split(/[_\s]+/);

  const matchingKeywords = userKeywords.filter((keyword) =>
    candidateKeywords.includes(keyword)
  );

  if (matchingKeywords.length >= 2) {
    return { boost: 0.08, reasons: ["intent_keyword_match"] };
  }

  if (matchingKeywords.length === 1) {
    return { boost: 0.04, reasons: ["single_intent_keyword_match"] };
  }

  return { boost: 0, reasons: [] };
}

/**
 * Get behavioral insights summary
 */
export function getBehavioralInsights(context?: BehavioralContext): {
  hasData: boolean;
  patternCount: number;
  actionCount: number;
  navigationCount: number;
  sessionDuration: number;
  patterns: string[];
} {
  if (!context) {
    return {
      hasData: false,
      patternCount: 0,
      actionCount: 0,
      navigationCount: 0,
      sessionDuration: 0,
      patterns: [],
    };
  }

  const sessionStart = context.sessionStartTime
    ? new Date(context.sessionStartTime).getTime()
    : Date.now();
  const sessionDuration = Date.now() - sessionStart;

  return {
    hasData: true,
    patternCount: context.detectedPatterns?.length || 0,
    actionCount: context.recentActions?.length || 0,
    navigationCount: context.navigationHistory?.length || 0,
    sessionDuration,
    patterns: context.detectedPatterns || [],
  };
}
