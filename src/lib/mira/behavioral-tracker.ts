import type {
  UserAction,
  UserActionType,
  NavigationEvent,
  BehavioralContext,
  PrivacySettings,
  BehavioralPattern,
} from "./types";
import { patternMatchingEngine } from "./pattern-matching-engine";

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  trackingEnabled: true,
  trackClickEvents: true,
  trackFormInputs: true,
  trackNavigationTime: true,
  shareWithMira: true,
  dataRetentionDays: 30,
};

const MAX_ACTION_HISTORY = 50;
const MAX_NAVIGATION_HISTORY = 20;
const BATCH_INTERVAL_MS = 100;

/**
 * BehavioralTracker - Singleton service for tracking user behavior
 * Tracks clicks, navigation, form interactions, and other user actions
 * to build context for Mira's predictive intelligence
 */
export class BehavioralTracker {
  private static instance: BehavioralTracker;

  private history: NavigationEvent[] = [];
  private actions: UserAction[] = [];
  private currentPageStart: Date = new Date();
  private currentPage: string = window.location.pathname;
  private currentModule: string = "";
  private sessionId: string;
  private sessionStartTime: Date = new Date();
  private privacySettings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS;
  private actionQueue: UserAction[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, (context: BehavioralContext) => void> = new Map();
  private detectedPatterns: BehavioralPattern[] = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadPrivacySettings();
    this.initializeTracking();
  }

  static getInstance(): BehavioralTracker {
    if (!BehavioralTracker.instance) {
      BehavioralTracker.instance = new BehavioralTracker();
    }
    return BehavioralTracker.instance;
  }

  /**
   * Initialize event listeners for tracking
   */
  private initializeTracking() {
    if (!this.privacySettings.trackingEnabled) {
      return;
    }

    // Track clicks
    if (this.privacySettings.trackClickEvents) {
      document.addEventListener("click", this.handleClick.bind(this), true);
    }

    // Track form inputs
    if (this.privacySettings.trackFormInputs) {
      document.addEventListener("input", this.handleInput.bind(this), true);
      document.addEventListener("change", this.handleChange.bind(this), true);
      document.addEventListener("submit", this.handleSubmit.bind(this), true);
    }

    // Track navigation
    if (this.privacySettings.trackNavigationTime) {
      window.addEventListener("popstate", this.handleNavigation.bind(this));
      // Monitor URL changes for SPA navigation
      this.observeUrlChanges();
    }

    // Track page visibility
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load privacy settings from localStorage
   */
  private loadPrivacySettings() {
    try {
      const stored = localStorage.getItem("mira_privacy_settings");
      if (stored) {
        this.privacySettings = { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to load privacy settings:", error);
    }
  }

  /**
   * Update privacy settings
   */
  updatePrivacySettings(settings: Partial<PrivacySettings>) {
    this.privacySettings = { ...this.privacySettings, ...settings };
    try {
      localStorage.setItem("mira_privacy_settings", JSON.stringify(this.privacySettings));
    } catch (error) {
      console.warn("Failed to save privacy settings:", error);
    }

    // Reinitialize tracking if settings changed
    if (settings.trackingEnabled !== undefined) {
      if (settings.trackingEnabled) {
        this.initializeTracking();
      } else {
        this.cleanup();
      }
    }
  }

  /**
   * Get current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const action: UserAction = {
      timestamp: new Date(),
      actionType: "click",
      elementId: target.id,
      elementType: target.tagName.toLowerCase(),
      elementLabel: this.getElementLabel(target),
      context: this.extractContext(target),
    };

    this.trackAction(action);
  }

  /**
   * Handle input events
   */
  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const action: UserAction = {
      timestamp: new Date(),
      actionType: "form_input",
      elementId: target.id,
      elementType: target.type || "text",
      elementLabel: this.getElementLabel(target),
      value: this.sanitizeInputValue(target),
      context: this.extractContext(target),
    };

    this.trackAction(action);
  }

  /**
   * Handle change events
   */
  private handleChange(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const action: UserAction = {
      timestamp: new Date(),
      actionType: "form_input",
      elementId: target.id,
      elementType: target.tagName.toLowerCase(),
      elementLabel: this.getElementLabel(target),
      value: this.sanitizeInputValue(target),
      context: this.extractContext(target),
    };

    this.trackAction(action);
  }

  /**
   * Handle form submit events
   */
  private handleSubmit(event: Event) {
    const target = event.target as HTMLFormElement;
    const action: UserAction = {
      timestamp: new Date(),
      actionType: "form_submit",
      elementId: target.id,
      elementType: "form",
      elementLabel: this.getElementLabel(target),
      context: this.extractContext(target),
    };

    this.trackAction(action);
  }

  /**
   * Handle navigation events
   */
  private handleNavigation() {
    const newPath = window.location.pathname;
    if (newPath !== this.currentPage) {
      this.recordNavigation(newPath, "back");
    }
  }

  /**
   * Handle visibility change (tab switching)
   */
  private handleVisibilityChange() {
    if (!document.hidden) {
      // User came back to tab
      const action: UserAction = {
        timestamp: new Date(),
        actionType: "page_load",
        context: { event: "tab_visible" },
      };
      this.trackAction(action);
    }
  }

  /**
   * Observe URL changes for SPA navigation
   */
  private observeUrlChanges() {
    let lastUrl = window.location.href;
    const checkUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        const newPath = window.location.pathname;
        if (newPath !== this.currentPage) {
          this.recordNavigation(newPath, "direct");
        }
      }
    };

    // Check URL every 500ms
    setInterval(checkUrlChange, 500);
  }

  /**
   * Record a navigation event
   */
  recordNavigation(toPage: string, trigger: NavigationEvent["trigger"]) {
    const timeSpent = Date.now() - this.currentPageStart.getTime();
    const navigationEvent: NavigationEvent = {
      timestamp: new Date(),
      fromPage: this.currentPage,
      toPage,
      module: this.currentModule,
      trigger,
      timeSpent,
    };

    this.history.push(navigationEvent);
    if (this.history.length > MAX_NAVIGATION_HISTORY) {
      this.history.shift();
    }

    // Update current page
    this.currentPage = toPage;
    this.currentPageStart = new Date();

    // Trigger navigation action
    const action: UserAction = {
      timestamp: new Date(),
      actionType: "navigation",
      value: toPage,
      context: { trigger, timeSpent },
    };
    this.trackAction(action);

    // Upload navigation event if sharing is enabled
    if (this.privacySettings.shareWithMira) {
      this.uploadNavigationEvent(navigationEvent);
    }

    // Analyze patterns after navigation
    this.analyzePatterns();
  }

  /**
   * Upload navigation event to backend
   */
  private async uploadNavigationEvent(event: NavigationEvent) {
    try {
      const { behavioralAnalyticsUploader } = await import("./behavioral-analytics-uploader");
      behavioralAnalyticsUploader.queueNavigationEvent(event, this.sessionId, {
        module: this.currentModule,
        page: this.currentPage,
      });
    } catch (error) {
      console.error("Failed to upload navigation event:", error);
    }
  }

  /**
   * Update current module context
   */
  updateModule(module: string) {
    this.currentModule = module;
  }

  /**
   * Track a user action
   */
  private trackAction(action: UserAction) {
    if (!this.privacySettings.trackingEnabled) {
      return;
    }

    this.actionQueue.push(action);

    // Batch process actions
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
        this.batchTimer = null;
      }, BATCH_INTERVAL_MS);
    }
  }

  /**
   * Process a batch of actions
   */
  private processBatch() {
    if (this.actionQueue.length === 0) {
      return;
    }

    const actions = [...this.actionQueue];
    this.actionQueue = [];

    // Add to action history
    this.actions.push(...actions);
    if (this.actions.length > MAX_ACTION_HISTORY) {
      this.actions = this.actions.slice(-MAX_ACTION_HISTORY);
    }

    // Analyze patterns
    this.analyzePatterns();

    // Notify listeners
    this.notifyListeners();

    // Send to backend if enabled
    if (this.privacySettings.shareWithMira) {
      this.uploadToBackend(actions);
    }
  }

  /**
   * Analyze behavioral patterns using advanced pattern detectors
   */
  private async analyzePatterns() {
    // Get current behavioral context
    const context = this.getBehavioralContext();

    // Use advanced pattern detector registry
    const detectedResults = await this.runAdvancedPatternDetection(context);

    // Convert detection results to behavioral patterns
    this.detectedPatterns = detectedResults.map((result) => result.pattern);

    // Log detected patterns
    if (this.detectedPatterns.length > 0) {
      console.debug(
        "[BehavioralTracker] Patterns detected:",
        this.detectedPatterns.map((p) => `${p.patternType} (${(p.confidence * 100).toFixed(0)}%)`)
      );

      // Upload pattern detection events
      this.uploadPatternDetections(detectedResults);
    }
  }

  /**
   * Run advanced pattern detection using PatternMatchingEngine
   */
  private async runAdvancedPatternDetection(context: BehavioralContext) {
    try {
      // Use the new PatternMatchingEngine for unified pattern detection
      const matchResults = await patternMatchingEngine.matchPatterns(context);

      // Convert match results to legacy format for backward compatibility
      const results = matchResults.map((match) => ({
        pattern: match.pattern,
        triggers: match.metadata.triggers,
        metadata: {
          adjustedConfidence: match.adjustedConfidence,
          learningBoost: match.learningBoost,
          source: match.source,
          successRate: match.metadata.successRate,
        },
      }));

      return results;
    } catch (error) {
      console.error("[BehavioralTracker] Pattern detection error:", error);
      return [];
    }
  }

  /**
   * Upload pattern detection events
   */
  private async uploadPatternDetections(results: any[]) {
    if (!this.privacySettings.shareWithMira) {
      return;
    }

    try {
      const { behavioralAnalyticsUploader } = await import("./behavioral-analytics-uploader");

      results.forEach((result) => {
        behavioralAnalyticsUploader.queuePatternDetection(
          result.pattern,
          this.sessionId,
          {
            module: this.currentModule,
            page: this.currentPage,
            metadata: result.metadata,
          }
        );
      });
    } catch (error) {
      console.error("[BehavioralTracker] Failed to upload pattern detections:", error);
    }
  }

  /**
   * Detect form struggle pattern
   */
  private detectFormStruggle(): { confidence: number; indicators: string[] } | null {
    const formActions = this.actions.filter(
      (a) => a.actionType === "form_input" && Date.now() - a.timestamp.getTime() < 120000
    );

    if (formActions.length < 10) {
      return null;
    }

    const hasSubmission = this.actions.some(
      (a) => a.actionType === "form_submit" && Date.now() - a.timestamp.getTime() < 120000
    );

    if (!hasSubmission && formActions.length > 15) {
      const indicators = ["high_field_interactions", "no_submission", "extended_time"];
      return { confidence: 0.85, indicators };
    }

    // Check for field revisits
    const fieldCounts = new Map<string, number>();
    formActions.forEach((action) => {
      if (action.elementId) {
        fieldCounts.set(action.elementId, (fieldCounts.get(action.elementId) || 0) + 1);
      }
    });

    const revisitedFields = Array.from(fieldCounts.entries()).filter(([, count]) => count > 3);
    if (revisitedFields.length > 2) {
      return {
        confidence: 0.75,
        indicators: ["field_revisits", ...revisitedFields.map(([field]) => `revisited:${field}`)],
      };
    }

    return null;
  }

  /**
   * Detect search pattern
   */
  private detectSearchPattern(): { confidence: number; indicators: string[] } | null {
    const searchActions = this.actions.filter(
      (a) =>
        (a.actionType === "form_input" &&
          (a.elementId?.includes("search") || a.elementType?.includes("search"))) ||
        a.actionType === "search"
    );

    if (searchActions.length >= 3) {
      return {
        confidence: 0.8,
        indicators: ["multiple_searches", `count:${searchActions.length}`],
      };
    }

    return null;
  }

  /**
   * Detect proposal creation pattern
   */
  private detectProposalCreation(): { confidence: number; indicators: string[] } | null {
    const relevantPages = this.history.filter(
      (nav) =>
        nav.toPage.includes("customer") ||
        nav.toPage.includes("new-business") ||
        nav.toPage.includes("proposal")
    );

    if (relevantPages.length >= 2) {
      const lastNav = relevantPages[relevantPages.length - 1];
      if (lastNav && lastNav.toPage.includes("new-business")) {
        return {
          confidence: 0.9,
          indicators: ["customer_to_proposal_flow", `pages:${relevantPages.length}`],
        };
      }
    }

    return null;
  }

  /**
   * Detect analytics review pattern
   */
  private detectAnalyticsReview(): { confidence: number; indicators: string[] } | null {
    const analyticsVisits = this.history.filter((nav) => nav.toPage.includes("analytics"));

    if (analyticsVisits.length >= 2) {
      const totalTime = analyticsVisits.reduce((sum, nav) => sum + nav.timeSpent, 0);
      if (totalTime > 30000) {
        // 30 seconds+
        return {
          confidence: 0.85,
          indicators: ["repeated_analytics_visits", `time:${Math.round(totalTime / 1000)}s`],
        };
      }
    }

    return null;
  }

  /**
   * Get current behavioral context
   */
  getBehavioralContext(): BehavioralContext {
    return {
      currentPage: this.currentPage,
      currentModule: this.currentModule,
      pageData: {},
      navigationHistory: [...this.history],
      recentActions: [...this.actions],
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      currentPageStartTime: this.currentPageStart,
      detectedPatterns: this.detectedPatterns.map((p) => p.patternType),
      confidenceLevel: Math.max(...this.detectedPatterns.map((p) => p.confidence), 0),
    };
  }

  /**
   * Subscribe to context changes
   */
  subscribe(id: string, callback: (context: BehavioralContext) => void) {
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  /**
   * Notify all listeners of context changes
   */
  private notifyListeners() {
    const context = this.getBehavioralContext();
    this.listeners.forEach((callback) => {
      try {
        callback(context);
      } catch (error) {
        console.error("Error in behavioral context listener:", error);
      }
    });
  }

  /**
   * Upload actions to backend
   */
  private async uploadToBackend(actions: UserAction[]) {
    try {
      // Import uploader dynamically to avoid circular dependencies
      const { behavioralAnalyticsUploader } = await import("./behavioral-analytics-uploader");

      // Queue each action for upload
      actions.forEach((action) => {
        behavioralAnalyticsUploader.queueUserAction(action, this.sessionId, {
          module: this.currentModule,
          page: this.currentPage,
        });
      });

      console.debug("[BehavioralTracker] Queued actions for upload:", actions.length);
    } catch (error) {
      console.error("Failed to upload behavioral data:", error);
    }
  }

  /**
   * Extract element label
   */
  private getElementLabel(element: HTMLElement): string | undefined {
    // Try aria-label
    if (element.getAttribute("aria-label")) {
      return element.getAttribute("aria-label") || undefined;
    }

    // Try text content for buttons/links
    if (element.tagName === "BUTTON" || element.tagName === "A") {
      return element.textContent?.trim().substring(0, 50) || undefined;
    }

    // Try associated label
    if (element instanceof HTMLInputElement && element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      return label?.textContent?.trim() || undefined;
    }

    return undefined;
  }

  /**
   * Extract context from element
   */
  private extractContext(element: HTMLElement): Record<string, unknown> {
    const context: Record<string, unknown> = {};

    // Get data attributes
    Array.from(element.attributes)
      .filter((attr) => attr.name.startsWith("data-"))
      .forEach((attr) => {
        context[attr.name] = attr.value;
      });

    // Get parent form if applicable
    const form = element.closest("form");
    if (form) {
      context.formId = form.id;
      context.formName = form.getAttribute("name");
    }

    return context;
  }

  /**
   * Sanitize input value for privacy
   */
  private sanitizeInputValue(element: HTMLInputElement | HTMLSelectElement): unknown {
    const sensitiveFields = ["password", "nric", "ssn", "income", "medical", "health"];
    const name = element.name?.toLowerCase() || "";
    const id = element.id?.toLowerCase() || "";

    // Check if field is sensitive
    const isSensitive = sensitiveFields.some((field) => name.includes(field) || id.includes(field));

    if (isSensitive) {
      return {
        type: "redacted",
        hasValue: !!(element as HTMLInputElement).value,
        valueLength: (element as HTMLInputElement).value?.length || 0,
      };
    }

    // For non-sensitive fields, track value length only
    if (element instanceof HTMLInputElement && element.type === "text") {
      return {
        valueLength: element.value?.length || 0,
        hasValue: !!element.value,
      };
    }

    if (element instanceof HTMLSelectElement) {
      return {
        selectedIndex: element.selectedIndex,
        hasValue: !!element.value,
      };
    }

    return undefined;
  }

  /**
   * Clear all tracked data
   */
  clearData() {
    this.history = [];
    this.actions = [];
    this.actionQueue = [];
    this.detectedPatterns = [];
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.notifyListeners();
  }

  /**
   * Export data for user
   */
  exportData(): {
    sessionId: string;
    sessionStartTime: Date;
    navigationHistory: NavigationEvent[];
    actions: UserAction[];
    patterns: BehavioralPattern[];
  } {
    return {
      sessionId: this.sessionId,
      sessionStartTime: this.sessionStartTime,
      navigationHistory: [...this.history],
      actions: [...this.actions],
      patterns: [...this.detectedPatterns],
    };
  }

  /**
   * Cleanup event listeners
   */
  private cleanup() {
    document.removeEventListener("click", this.handleClick.bind(this), true);
    document.removeEventListener("input", this.handleInput.bind(this), true);
    document.removeEventListener("change", this.handleChange.bind(this), true);
    document.removeEventListener("submit", this.handleSubmit.bind(this), true);
    window.removeEventListener("popstate", this.handleNavigation.bind(this));
    document.removeEventListener("visibilitychange", this.handleVisibilityChange.bind(this));

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Record pattern success for learning
   * Forwards to PatternMatchingEngine for continuous improvement
   */
  recordPatternSuccess(patternType: string, context: Record<string, unknown> = {}) {
    patternMatchingEngine.recordPatternSuccess(patternType, {
      ...context,
      module: this.currentModule,
      page: this.currentPage,
      sessionId: this.sessionId,
    });
    console.debug(`[BehavioralTracker] Pattern success recorded: ${patternType}`);
  }

  /**
   * Record pattern failure for learning
   * Forwards to PatternMatchingEngine for continuous improvement
   */
  recordPatternFailure(patternType: string, context: Record<string, unknown> = {}) {
    patternMatchingEngine.recordPatternFailure(patternType, {
      ...context,
      module: this.currentModule,
      page: this.currentPage,
      sessionId: this.sessionId,
    });
    console.debug(`[BehavioralTracker] Pattern failure recorded: ${patternType}`);
  }

  /**
   * Record user action in response to pattern detection
   * Tracks how users respond to proactive suggestions
   */
  recordUserActionOnPattern(
    patternType: string,
    action: "accept" | "dismiss" | "ignore" | "modify",
    context: Record<string, unknown> = {}
  ) {
    patternMatchingEngine.recordUserAction(patternType, action, {
      ...context,
      module: this.currentModule,
      page: this.currentPage,
      sessionId: this.sessionId,
    });
    console.debug(
      `[BehavioralTracker] User action on pattern ${patternType}: ${action}`
    );
  }

  /**
   * Get pattern statistics
   * Retrieves learning metrics for a specific pattern
   */
  async getPatternStats(patternType: string): Promise<{
    confidence: number;
    successRate: number;
    successCount: number;
    failureCount: number;
  }> {
    return await patternMatchingEngine.getPatternStats(patternType);
  }

  /**
   * Get top performing patterns
   * Retrieves patterns with highest success rates
   */
  async getTopPatterns(limit: number = 5) {
    return await patternMatchingEngine.getTopPatterns(limit);
  }

  /**
   * Destroy the tracker
   */
  destroy() {
    this.cleanup();
    this.clearData();
    this.listeners.clear();

    // Flush any pending pattern learning data
    patternMatchingEngine.flush();
  }
}

// Export singleton instance
export const behavioralTracker = BehavioralTracker.getInstance();
