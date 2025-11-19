import type {
  UserAction,
  NavigationEvent,
  BehavioralPattern,
  BehavioralContext
} from "./types";

/**
 * Advanced Pattern Detector Registry
 * Sophisticated algorithms for detecting user behavior patterns
 */

export interface PatternDetector {
  name: string;
  type: string;
  detect: (context: BehavioralContext) => PatternDetectionResult | null;
  minConfidence: number;
}

export interface PatternDetectionResult {
  pattern: BehavioralPattern;
  triggers: PatternTrigger[];
  metadata: Record<string, unknown>;
}

export interface PatternTrigger {
  type: string;
  timestamp: Date;
  data: unknown;
}

/**
 * ========================================
 * WORKFLOW PATTERN DETECTORS
 * ========================================
 */

/**
 * Detects: Customer → Proposal workflow
 * High confidence pattern for proposal creation intent
 */
export class ProposalCreationDetector implements PatternDetector {
  name = "Proposal Creation Workflow";
  type = "proposal_creation";
  minConfidence = 0.85;

  detect(context: BehavioralContext): PatternDetectionResult | null {
    const { navigationHistory, recentActions } = context;

    if (!navigationHistory || navigationHistory.length < 2) {
      return null;
    }

    const triggers: PatternTrigger[] = [];
    let confidence = 0;

    // Check for customer page visit
    const customerVisit = navigationHistory.find((nav) =>
      nav.toPage.includes("customer") || nav.toPage.includes("/customers/")
    );

    if (customerVisit) {
      confidence += 0.3;
      triggers.push({
        type: "customer_page_visit",
        timestamp: new Date(customerVisit.timestamp),
        data: { page: customerVisit.toPage },
      });
    }

    // Check for navigation to new business/proposal page
    const proposalNav = navigationHistory.find((nav) =>
      nav.toPage.includes("new-business") || nav.toPage.includes("proposal")
    );

    if (proposalNav) {
      confidence += 0.3;
      triggers.push({
        type: "proposal_page_visit",
        timestamp: new Date(proposalNav.timestamp),
        data: { page: proposalNav.toPage },
      });
    }

    // Check for customer → proposal navigation sequence
    const hasSequence = this.detectNavigationSequence(navigationHistory, [
      "customer",
      "new-business",
    ]);

    if (hasSequence) {
      confidence += 0.25;
      triggers.push({
        type: "workflow_sequence_detected",
        timestamp: new Date(),
        data: { sequence: ["customer", "new-business"] },
      });
    }

    // Check for form interactions on proposal page
    const proposalFormActions = recentActions?.filter(
      (action) =>
        action.actionType === "form_input" &&
        (action.context?.page?.includes("new-business") ||
          action.context?.page?.includes("proposal"))
    );

    if (proposalFormActions && proposalFormActions.length > 0) {
      confidence += 0.15;
      triggers.push({
        type: "proposal_form_interaction",
        timestamp: new Date(),
        data: { actionCount: proposalFormActions.length },
      });
    }

    if (confidence >= this.minConfidence) {
      return {
        pattern: {
          patternType: this.type,
          confidence,
          indicators: triggers.map((t) => t.type),
          suggestedAction: "offer_proposal_assistance",
        },
        triggers,
        metadata: {
          customerVisited: !!customerVisit,
          proposalPageActive: !!proposalNav,
          formInteractions: proposalFormActions?.length || 0,
        },
      };
    }

    return null;
  }

  private detectNavigationSequence(
    history: NavigationEvent[],
    sequence: string[]
  ): boolean {
    const pages = history.map((nav) => nav.toPage.toLowerCase());

    for (let i = 0; i <= pages.length - sequence.length; i++) {
      let match = true;
      for (let j = 0; j < sequence.length; j++) {
        if (!pages[i + j].includes(sequence[j].toLowerCase())) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }

    return false;
  }
}

/**
 * Detects: Form struggle / abandonment
 * Identifies when users are having difficulty completing forms
 */
export class FormStruggleDetector implements PatternDetector {
  name = "Form Completion Struggle";
  type = "form_struggle";
  minConfidence = 0.70;

  private readonly STRUGGLE_TIME_THRESHOLD = 120000; // 2 minutes
  private readonly HIGH_INTERACTION_THRESHOLD = 15;
  private readonly REVISIT_THRESHOLD = 3;

  detect(context: BehavioralContext): PatternDetectionResult | null {
    const { recentActions, currentPageStartTime } = context;

    if (!recentActions || recentActions.length === 0) {
      return null;
    }

    const now = Date.now();
    const pageStartMs = currentPageStartTime
      ? new Date(currentPageStartTime).getTime()
      : now;
    const timeOnPage = now - pageStartMs;

    const formActions = recentActions.filter(
      (a) => a.actionType === "form_input" || a.actionType === "form_submit"
    );

    if (formActions.length === 0) {
      return null;
    }

    const triggers: PatternTrigger[] = [];
    let confidence = 0;

    // 1. Extended time on form without submission
    const hasSubmission = formActions.some((a) => a.actionType === "form_submit");

    if (timeOnPage > this.STRUGGLE_TIME_THRESHOLD && !hasSubmission) {
      confidence += 0.35;
      triggers.push({
        type: "extended_time_no_submission",
        timestamp: new Date(),
        data: { timeMs: timeOnPage, hasSubmission },
      });
    }

    // 2. High number of form interactions
    if (formActions.length > this.HIGH_INTERACTION_THRESHOLD) {
      confidence += 0.25;
      triggers.push({
        type: "high_interaction_count",
        timestamp: new Date(),
        data: { count: formActions.length },
      });
    }

    // 3. Field revisits (changing same field multiple times)
    const fieldRevisits = this.detectFieldRevisits(formActions);

    if (fieldRevisits.length > 0) {
      confidence += 0.20;
      triggers.push({
        type: "field_revisits",
        timestamp: new Date(),
        data: { fields: fieldRevisits },
      });
    }

    // 4. Error indicators (if we track validation errors)
    const errorActions = formActions.filter(
      (a) => a.context?.error || a.context?.validation_failed
    );

    if (errorActions.length > 2) {
      confidence += 0.20;
      triggers.push({
        type: "validation_errors",
        timestamp: new Date(),
        data: { errorCount: errorActions.length },
      });
    }

    if (confidence >= this.minConfidence) {
      return {
        pattern: {
          patternType: this.type,
          confidence,
          indicators: triggers.map((t) => t.type),
          suggestedAction: "offer_form_help",
        },
        triggers,
        metadata: {
          timeOnPage,
          interactionCount: formActions.length,
          hasSubmission,
          revisitedFields: fieldRevisits.length,
        },
      };
    }

    return null;
  }

  private detectFieldRevisits(actions: UserAction[]): string[] {
    const fieldCounts = new Map<string, number>();

    actions.forEach((action) => {
      const fieldId = action.elementId || action.context?.fieldId;
      if (fieldId && typeof fieldId === "string") {
        fieldCounts.set(fieldId, (fieldCounts.get(fieldId) || 0) + 1);
      }
    });

    return Array.from(fieldCounts.entries())
      .filter(([, count]) => count >= this.REVISIT_THRESHOLD)
      .map(([fieldId]) => fieldId);
  }
}

/**
 * Detects: Analytics deep-dive pattern
 * User exploring data and seeking insights
 */
export class AnalyticsExplorationDetector implements PatternDetector {
  name = "Analytics Deep Dive";
  type = "analytics_exploration";
  minConfidence = 0.75;

  private readonly MIN_TIME_THRESHOLD = 30000; // 30 seconds
  private readonly MIN_VISITS = 2;

  detect(context: BehavioralContext): PatternDetectionResult | null {
    const { navigationHistory, recentActions } = context;

    if (!navigationHistory || navigationHistory.length === 0) {
      return null;
    }

    const triggers: PatternTrigger[] = [];
    let confidence = 0;

    // 1. Multiple analytics page visits
    const analyticsVisits = navigationHistory.filter((nav) =>
      nav.toPage.includes("analytics")
    );

    if (analyticsVisits.length >= this.MIN_VISITS) {
      confidence += 0.35;
      triggers.push({
        type: "repeated_analytics_visits",
        timestamp: new Date(),
        data: { visitCount: analyticsVisits.length },
      });
    }

    // 2. Time spent on analytics
    const totalTimeOnAnalytics = analyticsVisits.reduce(
      (sum, nav) => sum + (nav.timeSpent || 0),
      0
    );

    if (totalTimeOnAnalytics > this.MIN_TIME_THRESHOLD) {
      confidence += 0.30;
      triggers.push({
        type: "extended_analytics_session",
        timestamp: new Date(),
        data: { totalTimeMs: totalTimeOnAnalytics },
      });
    }

    // 3. Filter/search actions on analytics page
    const analyticsActions = recentActions?.filter(
      (action) =>
        (action.actionType === "click" || action.actionType === "search") &&
        action.context?.page?.includes("analytics")
    );

    if (analyticsActions && analyticsActions.length > 3) {
      confidence += 0.20;
      triggers.push({
        type: "analytics_interaction",
        timestamp: new Date(),
        data: { actionCount: analyticsActions.length },
      });
    }

    // 4. Chart/report interactions
    const chartInteractions = recentActions?.filter(
      (action) =>
        action.elementType === "button" &&
        (action.elementLabel?.toLowerCase().includes("chart") ||
          action.elementLabel?.toLowerCase().includes("report") ||
          action.elementLabel?.toLowerCase().includes("export"))
    );

    if (chartInteractions && chartInteractions.length > 0) {
      confidence += 0.15;
      triggers.push({
        type: "chart_interactions",
        timestamp: new Date(),
        data: { count: chartInteractions.length },
      });
    }

    if (confidence >= this.minConfidence) {
      return {
        pattern: {
          patternType: this.type,
          confidence,
          indicators: triggers.map((t) => t.type),
          suggestedAction: "offer_insights",
        },
        triggers,
        metadata: {
          totalVisits: analyticsVisits.length,
          totalTime: totalTimeOnAnalytics,
          interactionCount: analyticsActions?.length || 0,
        },
      };
    }

    return null;
  }
}

/**
 * Detects: Search/discovery behavior
 * User actively searching for information
 */
export class SearchBehaviorDetector implements PatternDetector {
  name = "Active Search Behavior";
  type = "search_behavior";
  minConfidence = 0.70;

  private readonly MIN_SEARCHES = 3;
  private readonly SEARCH_TIME_WINDOW = 180000; // 3 minutes

  detect(context: BehavioralContext): PatternDetectionResult | null {
    const { recentActions } = context;

    if (!recentActions || recentActions.length === 0) {
      return null;
    }

    const now = Date.now();
    const triggers: PatternTrigger[] = [];
    let confidence = 0;

    // Identify search actions
    const searchActions = recentActions.filter(
      (action) =>
        action.actionType === "search" ||
        (action.actionType === "form_input" &&
          (action.elementId?.toLowerCase().includes("search") ||
            action.elementType?.toLowerCase().includes("search")))
    );

    // Filter to recent searches within time window
    const recentSearches = searchActions.filter(
      (action) => now - new Date(action.timestamp).getTime() < this.SEARCH_TIME_WINDOW
    );

    if (recentSearches.length < this.MIN_SEARCHES) {
      return null;
    }

    // 1. Multiple search attempts
    confidence += 0.40;
    triggers.push({
      type: "multiple_searches",
      timestamp: new Date(),
      data: { count: recentSearches.length },
    });

    // 2. Varied search terms (if we track values)
    const searchTerms = this.extractSearchTerms(recentSearches);

    if (searchTerms.length > 1) {
      confidence += 0.20;
      triggers.push({
        type: "varied_queries",
        timestamp: new Date(),
        data: { uniqueTerms: searchTerms.length },
      });
    }

    // 3. Quick successive searches (frustration indicator)
    const hasQuickSearches = this.detectQuickSuccessiveSearches(recentSearches);

    if (hasQuickSearches) {
      confidence += 0.15;
      triggers.push({
        type: "rapid_searches",
        timestamp: new Date(),
        data: { indicatesFrustration: true },
      });
    }

    // 4. No navigation after searches (not finding what they need)
    const navigationAfterSearch = context.navigationHistory?.filter(
      (nav) =>
        recentSearches.some(
          (search) =>
            new Date(nav.timestamp).getTime() > new Date(search.timestamp).getTime()
        )
    );

    if (!navigationAfterSearch || navigationAfterSearch.length === 0) {
      confidence += 0.10;
      triggers.push({
        type: "no_navigation_after_search",
        timestamp: new Date(),
        data: { indicatesUnsuccessfulSearch: true },
      });
    }

    if (confidence >= this.minConfidence) {
      return {
        pattern: {
          patternType: this.type,
          confidence,
          indicators: triggers.map((t) => t.type),
          suggestedAction: "offer_search_help",
        },
        triggers,
        metadata: {
          searchCount: recentSearches.length,
          uniqueTerms: searchTerms.length,
          timeWindowMs: this.SEARCH_TIME_WINDOW,
        },
      };
    }

    return null;
  }

  private extractSearchTerms(actions: UserAction[]): string[] {
    const terms = new Set<string>();

    actions.forEach((action) => {
      // We don't actually store search values for privacy
      // This would extract them if we did
      if (action.value && typeof action.value === "object") {
        const val = action.value as Record<string, unknown>;
        if (val.hasValue) {
          // Placeholder - we just count unique searches
          terms.add(`search_${action.timestamp}`);
        }
      }
    });

    return Array.from(terms);
  }

  private detectQuickSuccessiveSearches(actions: UserAction[]): boolean {
    if (actions.length < 2) return false;

    for (let i = 1; i < actions.length; i++) {
      const timeDiff =
        new Date(actions[i].timestamp).getTime() -
        new Date(actions[i - 1].timestamp).getTime();

      if (timeDiff < 5000) {
        // Less than 5 seconds between searches
        return true;
      }
    }

    return false;
  }
}

/**
 * Detects: Task completion flow
 * User working through a multi-step process successfully
 */
export class TaskCompletionDetector implements PatternDetector {
  name = "Task Completion Flow";
  type = "task_completion";
  minConfidence = 0.80;

  detect(context: BehavioralContext): PatternDetectionResult | null {
    const { navigationHistory, recentActions } = context;

    if (!navigationHistory || !recentActions) {
      return null;
    }

    const triggers: PatternTrigger[] = [];
    let confidence = 0;

    // 1. Form submission detected
    const formSubmissions = recentActions.filter(
      (a) => a.actionType === "form_submit"
    );

    if (formSubmissions.length > 0) {
      confidence += 0.40;
      triggers.push({
        type: "form_submitted",
        timestamp: new Date(),
        data: { count: formSubmissions.length },
      });
    }

    // 2. Sequential navigation through workflow
    const hasWorkflowProgression = this.detectWorkflowProgression(navigationHistory);

    if (hasWorkflowProgression) {
      confidence += 0.30;
      triggers.push({
        type: "workflow_progression",
        timestamp: new Date(),
        data: { detected: true },
      });
    }

    // 3. Reasonable time spent (not rushed, not stuck)
    const avgTimePerPage = this.calculateAverageTimePerPage(navigationHistory);

    if (avgTimePerPage > 10000 && avgTimePerPage < 120000) {
      // 10s to 2min
      confidence += 0.20;
      triggers.push({
        type: "appropriate_pacing",
        timestamp: new Date(),
        data: { avgTimeMs: avgTimePerPage },
      });
    }

    // 4. Minimal back navigation (not confused)
    const backNavCount = navigationHistory.filter((nav) => nav.trigger === "back").length;

    if (backNavCount === 0) {
      confidence += 0.10;
      triggers.push({
        type: "confident_navigation",
        timestamp: new Date(),
        data: { backNavCount: 0 },
      });
    }

    if (confidence >= this.minConfidence) {
      return {
        pattern: {
          patternType: this.type,
          confidence,
          indicators: triggers.map((t) => t.type),
          suggestedAction: "acknowledge_success",
        },
        triggers,
        metadata: {
          formsSubmitted: formSubmissions.length,
          avgTimePerPage,
          backNavigations: backNavCount,
        },
      };
    }

    return null;
  }

  private detectWorkflowProgression(history: NavigationEvent[]): boolean {
    // Simple heuristic: forward navigation without loops
    if (history.length < 2) return false;

    const forwardNav = history.filter(
      (nav) => nav.trigger === "click" || nav.trigger === "direct"
    );

    return forwardNav.length >= 2;
  }

  private calculateAverageTimePerPage(history: NavigationEvent[]): number {
    if (history.length === 0) return 0;

    const totalTime = history.reduce((sum, nav) => sum + (nav.timeSpent || 0), 0);
    return totalTime / history.length;
  }
}

/**
 * Pattern Detector Registry
 * Central registry of all pattern detectors
 */
export class PatternDetectorRegistry {
  private static detectors: PatternDetector[] = [];
  private static initialized = false;

  /**
   * Initialize default detectors
   */
  private static initialize(): void {
    if (this.initialized) return;

    this.detectors = [
      new ProposalCreationDetector(),
      new FormStruggleDetector(),
      new AnalyticsExplorationDetector(),
      new SearchBehaviorDetector(),
      new TaskCompletionDetector(),
    ];

    this.initialized = true;
  }

  /**
   * Run all pattern detectors on the given context
   */
  static detectPatterns(context: BehavioralContext): PatternDetectionResult[] {
    this.initialize();
    const results: PatternDetectionResult[] = [];

    for (const detector of this.detectors) {
      try {
        const result = detector.detect(context);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`[PatternDetector] Error in ${detector.name}:`, error);
      }
    }

    // Sort by confidence (highest first)
    return results.sort((a, b) => b.pattern.confidence - a.pattern.confidence);
  }

  /**
   * Alias for detectPatterns (backward compatibility)
   */
  static detectAll(context: BehavioralContext): PatternDetectionResult[] {
    return this.detectPatterns(context);
  }

  /**
   * Get a specific detector by type
   */
  static getDetectorByType(type: string): PatternDetector | undefined {
    this.initialize();
    return this.detectors.find((d) => d.type === type);
  }

  /**
   * Alias for getDetectorByType (backward compatibility)
   */
  static getDetector(type: string): PatternDetector | undefined {
    return this.getDetectorByType(type);
  }

  /**
   * Get detectors by module
   */
  static getDetectorsByModule(module: string): PatternDetector[] {
    this.initialize();
    return this.detectors.filter((d) => {
      // Check if detector is applicable to this module
      // For now, we'll check based on detector type/name patterns
      if (module === "new-business" && d.type.includes("proposal")) return true;
      if (module === "analytics" && d.type.includes("analytics")) return true;
      if (module === "todo" && d.type.includes("task")) return true;
      if (module === "customers" && d.type.includes("search")) return true;
      if (d.type.includes("form")) return true; // Form struggle applies to all modules
      return false;
    });
  }

  /**
   * Register a custom detector
   */
  static registerDetector(detector: PatternDetector): void {
    this.initialize();
    this.detectors.push(detector);
  }

  /**
   * Get all registered detectors
   */
  static getAllDetectors(): PatternDetector[] {
    this.initialize();
    return [...this.detectors];
  }
}
