/**
 * Real-Time Pattern Matching Engine
 * Integrates pattern detectors, learning, and confidence scoring
 */

import type { BehavioralContext, BehavioralPattern } from "./types";
import { PatternDetectorRegistry } from "./pattern-detectors";
import { PatternLibrary, PatternMatcher } from "./pattern-library";
import {
  PatternLearningService,
  PatternConfidenceAdjuster,
} from "./pattern-learning";

export interface PatternMatchResult {
  pattern: BehavioralPattern;
  adjustedConfidence: number;
  learningBoost: number;
  source: "detector" | "library" | "hybrid";
  metadata: {
    rawConfidence: number;
    learnedConfidence: number;
    successRate: number;
    triggers: string[];
  };
}

export interface PatternMatchingConfig {
  enableLearning: boolean;
  enableStreaming: boolean;
  minConfidence: number;
  maxPatterns: number;
  includeDetectors: boolean;
  includeLibrary: boolean;
}

const DEFAULT_CONFIG: PatternMatchingConfig = {
  enableLearning: true,
  enableStreaming: true,
  minConfidence: 0.65,
  maxPatterns: 5,
  includeDetectors: true,
  includeLibrary: true,
};

/**
 * Pattern Matching Engine
 * Unified real-time pattern detection and learning system
 */
export class PatternMatchingEngine {
  private static instance: PatternMatchingEngine;
  private config: PatternMatchingConfig;
  private learningService: PatternLearningService;
  private lastContext: BehavioralContext | null = null;
  private streamBuffer: BehavioralPattern[] = [];
  private processingTimer: NodeJS.Timeout | null = null;

  private constructor(config: Partial<PatternMatchingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.learningService = PatternLearningService.getInstance();

    if (this.config.enableStreaming) {
      this.startStreamProcessing();
    }
  }

  static getInstance(config?: Partial<PatternMatchingConfig>): PatternMatchingEngine {
    if (!PatternMatchingEngine.instance) {
      PatternMatchingEngine.instance = new PatternMatchingEngine(config);
    }
    return PatternMatchingEngine.instance;
  }

  /**
   * Main pattern matching method
   * Combines detector-based and library-based matching with learning
   */
  async matchPatterns(context: BehavioralContext): Promise<PatternMatchResult[]> {
    this.lastContext = context;
    const results: PatternMatchResult[] = [];

    // 1. Run pattern detectors (real-time algorithmic detection)
    if (this.config.includeDetectors) {
      const detectorResults = await this.runDetectors(context);
      results.push(...detectorResults);
    }

    // 2. Match against pattern library (template-based matching)
    if (this.config.includeLibrary) {
      const libraryResults = await this.matchLibraryPatterns(context);
      results.push(...libraryResults);
    }

    // 3. Apply learning adjustments to all patterns
    if (this.config.enableLearning) {
      await this.applyLearningAdjustments(results);
    }

    // 4. Filter by minimum confidence
    const filteredResults = results.filter(
      (r) => r.adjustedConfidence >= this.config.minConfidence
    );

    // 5. Sort by adjusted confidence and limit
    const sortedResults = filteredResults
      .sort((a, b) => b.adjustedConfidence - a.adjustedConfidence)
      .slice(0, this.config.maxPatterns);

    // 6. Buffer for streaming if enabled
    if (this.config.enableStreaming) {
      this.bufferPatterns(sortedResults.map((r) => r.pattern));
    }

    return sortedResults;
  }

  /**
   * Run all registered pattern detectors
   */
  private async runDetectors(context: BehavioralContext): Promise<PatternMatchResult[]> {
    const detectors = PatternDetectorRegistry.getAllDetectors();
    const results: PatternMatchResult[] = [];

    for (const detector of detectors) {
      try {
        const detectionResult = detector.detect(context);
        if (detectionResult && detectionResult.pattern) {
          const pattern = detectionResult.pattern;

          // Apply learning confidence adjustment
          const adjustedConfidence = this.config.enableLearning
            ? await PatternConfidenceAdjuster.adjustConfidence(
                pattern,
                this.learningService
              )
            : pattern.confidence;

          results.push({
            pattern,
            adjustedConfidence,
            learningBoost: adjustedConfidence - pattern.confidence,
            source: "detector",
            metadata: {
              rawConfidence: pattern.confidence,
              learnedConfidence: await this.learningService.getPatternConfidence(
                pattern.patternType
              ),
              successRate: await this.learningService.getPatternSuccessRate(
                pattern.patternType
              ),
              triggers: detectionResult.triggers || [],
            },
          });
        }
      } catch (error) {
        console.error(
          `[PatternMatching] Detector ${detector.name} failed:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * Match against pattern library templates
   */
  private async matchLibraryPatterns(
    context: BehavioralContext
  ): Promise<PatternMatchResult[]> {
    // Extract indicators from behavioral context
    const indicators = this.extractIndicators(context);

    // Use PatternMatcher to find matching templates
    const matches = PatternMatcher.matchPatterns(indicators);

    const results: PatternMatchResult[] = [];

    for (const match of matches) {
      // Convert template match to BehavioralPattern
      const pattern: BehavioralPattern = {
        patternType: match.pattern.id,
        patternName: match.pattern.name,
        confidence: match.score,
        detectedAt: new Date(),
        triggers: match.pattern.triggers,
        suggestedActions: match.pattern.suggestedActions.map((a) => a.action),
        metadata: {
          category: match.pattern.category,
          templateId: match.pattern.id,
        },
      };

      // Apply learning confidence adjustment
      const adjustedConfidence = this.config.enableLearning
        ? await PatternConfidenceAdjuster.adjustConfidence(
            pattern,
            this.learningService
          )
        : pattern.confidence;

      results.push({
        pattern,
        adjustedConfidence,
        learningBoost: adjustedConfidence - pattern.confidence,
        source: "library",
        metadata: {
          rawConfidence: pattern.confidence,
          learnedConfidence: await this.learningService.getPatternConfidence(
            pattern.patternType
          ),
          successRate: await this.learningService.getPatternSuccessRate(
            pattern.patternType
          ),
          triggers: pattern.triggers || [],
        },
      });
    }

    return results;
  }

  /**
   * Extract indicators from behavioral context for library matching
   */
  private extractIndicators(context: BehavioralContext): string[] {
    const indicators: string[] = [];

    // Current page indicator
    if (context.currentPage) {
      indicators.push(`page_${context.currentPage.replace(/\//g, "_")}`);
    }

    // Module indicator
    if (context.currentModule) {
      indicators.push(`module_${context.currentModule}`);
    }

    // Navigation patterns
    if (context.navigationHistory) {
      if (context.navigationHistory.length > 5) {
        indicators.push("extensive_navigation");
      }

      // Check for back navigation
      const backCount = context.navigationHistory.filter(
        (n) => n.navigationType === "back"
      ).length;
      if (backCount > 3) {
        indicators.push("back_navigation_count");
      }

      // Check for page revisits
      const pages = context.navigationHistory.map((n) => n.toPage);
      const uniquePages = new Set(pages);
      if (pages.length > uniquePages.size * 1.5) {
        indicators.push("page_revisits");
      }
    }

    // Action patterns
    if (context.recentActions) {
      const formInteractions = context.recentActions.filter(
        (a) => a.actionType === "input" || a.actionType === "focus"
      );
      if (formInteractions.length > 10) {
        indicators.push("high_field_interaction_count");
      }

      const searches = context.recentActions.filter((a) =>
        a.elementId?.includes("search")
      );
      if (searches.length > 3) {
        indicators.push("multiple_search_attempts");
      }
    }

    // Detected patterns from context
    if (context.detectedPatterns) {
      indicators.push(...context.detectedPatterns);
    }

    return indicators;
  }

  /**
   * Apply learning adjustments to all pattern results
   */
  private async applyLearningAdjustments(
    results: PatternMatchResult[]
  ): Promise<void> {
    for (const result of results) {
      const successRate = await this.learningService.getPatternSuccessRate(
        result.pattern.patternType
      );

      // Store success rate in metadata
      result.metadata.successRate = successRate;

      // Additional boost for high-performing patterns
      if (successRate > 0.8) {
        result.adjustedConfidence = Math.min(
          1.0,
          result.adjustedConfidence + 0.05
        );
        result.learningBoost += 0.05;
      }

      // Penalty for low-performing patterns
      if (successRate < 0.3) {
        result.adjustedConfidence = Math.max(
          0,
          result.adjustedConfidence - 0.05
        );
        result.learningBoost -= 0.05;
      }
    }
  }

  /**
   * Streaming pattern detection
   * Buffers patterns and processes them in batches
   */
  private bufferPatterns(patterns: BehavioralPattern[]): void {
    this.streamBuffer.push(...patterns);

    // Keep buffer size manageable
    if (this.streamBuffer.length > 100) {
      this.streamBuffer = this.streamBuffer.slice(-50);
    }
  }

  /**
   * Start streaming pattern processing
   */
  private startStreamProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }

    // Process stream buffer every 5 seconds
    this.processingTimer = setInterval(() => {
      if (this.streamBuffer.length > 0) {
        this.processStreamBuffer();
      }
    }, 5000);
  }

  /**
   * Process buffered patterns for streaming analytics
   */
  private async processStreamBuffer(): Promise<void> {
    if (this.streamBuffer.length === 0) return;

    const patterns = [...this.streamBuffer];
    this.streamBuffer = [];

    // Analyze pattern trends
    const patternCounts = new Map<string, number>();
    for (const pattern of patterns) {
      const count = patternCounts.get(pattern.patternType) || 0;
      patternCounts.set(pattern.patternType, count + 1);
    }

    // Identify emerging patterns (patterns appearing frequently)
    const emergingPatterns = Array.from(patternCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([patternType]) => patternType);

    if (emergingPatterns.length > 0) {
      console.debug(
        "[PatternMatching] Emerging patterns detected:",
        emergingPatterns
      );

      // Could trigger proactive suggestions here
      this.onEmergingPatterns(emergingPatterns);
    }
  }

  /**
   * Handle emerging patterns
   * Override this method to implement custom behavior
   */
  protected onEmergingPatterns(patternTypes: string[]): void {
    // Default implementation: log to console
    console.debug(
      `[PatternMatching] ${patternTypes.length} emerging pattern(s):`,
      patternTypes
    );
  }

  /**
   * Record pattern success for learning
   */
  recordPatternSuccess(
    patternType: string,
    context: Record<string, unknown> = {}
  ): void {
    this.learningService.recordSuccess(patternType, context);
  }

  /**
   * Record pattern failure for learning
   */
  recordPatternFailure(
    patternType: string,
    context: Record<string, unknown> = {}
  ): void {
    this.learningService.recordFailure(patternType, context);
  }

  /**
   * Record user action in response to pattern detection
   */
  recordUserAction(
    patternType: string,
    action: string,
    context: Record<string, unknown> = {}
  ): void {
    this.learningService.recordUserAction(patternType, action, context);
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(patternType: string): Promise<{
    confidence: number;
    successRate: number;
    successCount: number;
    failureCount: number;
  }> {
    const patterns = await this.learningService.getLearnedPatterns();
    const pattern = patterns.find((p) => p.patternType === patternType);

    if (!pattern) {
      return {
        confidence: 0.5,
        successRate: 0,
        successCount: 0,
        failureCount: 0,
      };
    }

    const total = pattern.successCount + pattern.failureCount;
    const successRate = total > 0 ? pattern.successCount / total : 0;

    return {
      confidence: pattern.confidenceScore,
      successRate,
      successCount: pattern.successCount,
      failureCount: pattern.failureCount,
    };
  }

  /**
   * Get top performing patterns
   */
  async getTopPatterns(limit: number = 5): Promise<PatternMatchResult[]> {
    const learnedPatterns = await this.learningService.getTopPatterns(limit);

    if (!this.lastContext) {
      return [];
    }

    const results: PatternMatchResult[] = learnedPatterns.map((learned) => {
      const total = learned.successCount + learned.failureCount;
      const successRate = total > 0 ? learned.successCount / total : 0;

      const pattern: BehavioralPattern = {
        patternType: learned.patternType,
        patternName: learned.patternName,
        confidence: learned.confidenceScore,
        detectedAt: learned.lastSeen,
        metadata: {
          successCount: learned.successCount,
          failureCount: learned.failureCount,
        },
      };

      return {
        pattern,
        adjustedConfidence: learned.confidenceScore,
        learningBoost: 0,
        source: "library",
        metadata: {
          rawConfidence: learned.confidenceScore,
          learnedConfidence: learned.confidenceScore,
          successRate,
          triggers: [],
        },
      };
    });

    return results;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PatternMatchingConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart streaming if config changed
    if (config.enableStreaming !== undefined) {
      if (config.enableStreaming) {
        this.startStreamProcessing();
      } else if (this.processingTimer) {
        clearInterval(this.processingTimer);
        this.processingTimer = null;
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PatternMatchingConfig {
    return { ...this.config };
  }

  /**
   * Flush learning service feedback
   */
  async flush(): Promise<void> {
    await this.learningService.flush();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    // Flush pending data before destroying
    this.learningService.flush();
    this.learningService.destroy();
    this.streamBuffer = [];
    this.lastContext = null;
  }
}

/**
 * Specialized Pattern Matching Engine with proactive suggestions
 */
export class ProactivePatternEngine extends PatternMatchingEngine {
  private suggestionCallbacks: Array<(patterns: string[]) => void> = [];

  /**
   * Subscribe to emerging pattern notifications
   */
  onEmergingPatternsDetected(callback: (patterns: string[]) => void): void {
    this.suggestionCallbacks.push(callback);
  }

  /**
   * Override to trigger callbacks
   */
  protected onEmergingPatterns(patternTypes: string[]): void {
    super.onEmergingPatterns(patternTypes);

    // Notify all subscribers
    for (const callback of this.suggestionCallbacks) {
      try {
        callback(patternTypes);
      } catch (error) {
        console.error("[ProactivePatternEngine] Callback error:", error);
      }
    }
  }

  /**
   * Get proactive suggestions based on current context
   */
  async getProactiveSuggestions(
    context: BehavioralContext,
    limit: number = 3
  ): Promise<
    Array<{
      patternType: string;
      suggestion: string;
      priority: "high" | "medium" | "low";
      confidence: number;
    }>
  > {
    const matches = await this.matchPatterns(context);

    const suggestions = matches
      .filter((m) => m.pattern.suggestedActions && m.pattern.suggestedActions.length > 0)
      .slice(0, limit)
      .map((match) => {
        // Get suggested action from library if available
        const template = PatternLibrary.getPattern(match.pattern.patternType);
        const suggestedAction = template?.suggestedActions[0];

        return {
          patternType: match.pattern.patternType,
          suggestion: match.pattern.suggestedActions?.[0] || "No suggestion available",
          priority: (suggestedAction?.priority || "medium") as "high" | "medium" | "low",
          confidence: match.adjustedConfidence,
        };
      });

    return suggestions;
  }
}

// Export singleton instance
export const patternMatchingEngine = PatternMatchingEngine.getInstance();
export const proactivePatternEngine = new ProactivePatternEngine();
