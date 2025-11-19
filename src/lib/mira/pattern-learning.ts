/**
 * Pattern Learning Engine
 * Tracks pattern success/failure and continuously improves detection
 */

import type { BehavioralPattern } from "./types";
import supabase from "@/admin/api/supabaseClient.js";

export interface PatternFeedback {
  patternType: string;
  success: boolean;
  context: Record<string, unknown>;
  userAction?: string;
  timestamp: Date;
}

export interface LearnedPattern {
  id: string;
  patternType: string;
  patternName: string;
  successCount: number;
  failureCount: number;
  confidenceScore: number;
  lastSeen: Date;
  patternData: Record<string, unknown>;
}

/**
 * Pattern Learning Service
 * Manages feedback loops and pattern improvement
 */
export class PatternLearningService {
  private static instance: PatternLearningService;
  private feedbackQueue: PatternFeedback[] = [];
  private uploadTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startFeedbackUpload();
  }

  static getInstance(): PatternLearningService {
    if (!PatternLearningService.instance) {
      PatternLearningService.instance = new PatternLearningService();
    }
    return PatternLearningService.instance;
  }

  /**
   * Record pattern success
   */
  recordSuccess(patternType: string, context: Record<string, unknown> = {}): void {
    this.queueFeedback({
      patternType,
      success: true,
      context,
      timestamp: new Date(),
    });

    console.debug(`[PatternLearning] Success recorded for: ${patternType}`);
  }

  /**
   * Record pattern failure
   */
  recordFailure(patternType: string, context: Record<string, unknown> = {}): void {
    this.queueFeedback({
      patternType,
      success: false,
      context,
      timestamp: new Date(),
    });

    console.debug(`[PatternLearning] Failure recorded for: ${patternType}`);
  }

  /**
   * Record user action in response to pattern detection
   */
  recordUserAction(
    patternType: string,
    action: string,
    context: Record<string, unknown> = {}
  ): void {
    this.queueFeedback({
      patternType,
      success: action !== "dismiss" && action !== "ignore",
      context,
      userAction: action,
      timestamp: new Date(),
    });

    console.debug(
      `[PatternLearning] User action recorded: ${patternType} -> ${action}`
    );
  }

  /**
   * Queue feedback for upload
   */
  private queueFeedback(feedback: PatternFeedback): void {
    this.feedbackQueue.push(feedback);

    // Upload immediately if queue is large
    if (this.feedbackQueue.length >= 10) {
      this.uploadFeedback();
    }
  }

  /**
   * Start periodic feedback upload
   */
  private startFeedbackUpload(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }

    // Upload every 60 seconds
    this.uploadTimer = setInterval(() => {
      if (this.feedbackQueue.length > 0) {
        this.uploadFeedback();
      }
    }, 60000);
  }

  /**
   * Upload feedback to backend
   */
  private async uploadFeedback(): Promise<void> {
    if (this.feedbackQueue.length === 0) {
      return;
    }

    const batch = [...this.feedbackQueue];
    this.feedbackQueue = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn("[PatternLearning] No authenticated user, skipping upload");
        return;
      }

      // Update pattern success/failure counts in database
      for (const feedback of batch) {
        await this.updatePatternStats(feedback);
      }

      console.debug(`[PatternLearning] Uploaded ${batch.length} feedback items`);
    } catch (error) {
      console.error("[PatternLearning] Failed to upload feedback:", error);
      // Re-queue failed items
      this.feedbackQueue.unshift(...batch);
    }
  }

  /**
   * Update pattern statistics in database
   */
  private async updatePatternStats(feedback: PatternFeedback): Promise<void> {
    try {
      const { data: pattern, error: fetchError } = await supabase
        .from("mira_learned_patterns")
        .select("*")
        .eq("pattern_type", feedback.patternType)
        .single();

      if (fetchError) {
        console.warn(
          `[PatternLearning] Pattern not found: ${feedback.patternType}`,
          fetchError
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("mira_learned_patterns")
        .update({
          success_count: feedback.success
            ? (pattern.success_count || 0) + 1
            : pattern.success_count,
          failure_count: !feedback.success
            ? (pattern.failure_count || 0) + 1
            : pattern.failure_count,
          last_seen: new Date().toISOString(),
        })
        .eq("pattern_type", feedback.patternType);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      console.error(
        `[PatternLearning] Failed to update stats for ${feedback.patternType}:`,
        error
      );
    }
  }

  /**
   * Get learned patterns from database
   */
  async getLearnedPatterns(): Promise<LearnedPattern[]> {
    try {
      const { data, error } = await supabase
        .from("mira_learned_patterns")
        .select("*")
        .order("confidence_score", { ascending: false });

      if (error) {
        throw error;
      }

      return (
        data?.map((row) => ({
          id: row.id,
          patternType: row.pattern_type,
          patternName: row.pattern_name,
          successCount: row.success_count || 0,
          failureCount: row.failure_count || 0,
          confidenceScore: parseFloat(row.confidence_score) || 0,
          lastSeen: new Date(row.last_seen || row.created_at),
          patternData: row.pattern_data || {},
        })) || []
      );
    } catch (error) {
      console.error("[PatternLearning] Failed to fetch learned patterns:", error);
      return [];
    }
  }

  /**
   * Get pattern confidence score
   */
  async getPatternConfidence(patternType: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("mira_learned_patterns")
        .select("confidence_score")
        .eq("pattern_type", patternType)
        .single();

      if (error || !data) {
        return 0.5; // Default confidence
      }

      return parseFloat(data.confidence_score) || 0.5;
    } catch (error) {
      console.error(
        `[PatternLearning] Failed to get confidence for ${patternType}:`,
        error
      );
      return 0.5;
    }
  }

  /**
   * Get pattern success rate
   */
  async getPatternSuccessRate(patternType: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("mira_learned_patterns")
        .select("success_count, failure_count")
        .eq("pattern_type", patternType)
        .single();

      if (error || !data) {
        return 0;
      }

      const total = (data.success_count || 0) + (data.failure_count || 0);
      if (total === 0) return 0;

      return (data.success_count || 0) / total;
    } catch (error) {
      console.error(
        `[PatternLearning] Failed to get success rate for ${patternType}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Get top performing patterns
   */
  async getTopPatterns(limit: number = 5): Promise<LearnedPattern[]> {
    const patterns = await this.getLearnedPatterns();
    return patterns.slice(0, limit);
  }

  /**
   * Get patterns needing improvement
   */
  async getPatternsNeedingImprovement(threshold: number = 0.5): Promise<LearnedPattern[]> {
    const patterns = await this.getLearnedPatterns();
    return patterns.filter((p) => p.confidenceScore < threshold);
  }

  /**
   * Flush all queued feedback
   */
  async flush(): Promise<void> {
    if (this.feedbackQueue.length > 0) {
      await this.uploadFeedback();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }

    this.flush();
  }
}

/**
 * Pattern Confidence Adjuster
 * Dynamically adjusts pattern confidence based on success/failure
 */
export class PatternConfidenceAdjuster {
  /**
   * Adjust pattern confidence based on historical performance
   */
  static async adjustConfidence(
    pattern: BehavioralPattern,
    learningService: PatternLearningService
  ): Promise<number> {
    const learnedConfidence = await learningService.getPatternConfidence(
      pattern.patternType
    );
    const successRate = await learningService.getPatternSuccessRate(pattern.patternType);

    // Blend detected confidence with learned confidence
    // Weight: 60% detected, 40% learned
    const blendedConfidence = pattern.confidence * 0.6 + learnedConfidence * 0.4;

    // Adjust based on success rate
    // If success rate is high, boost confidence
    // If success rate is low, reduce confidence
    const successAdjustment = (successRate - 0.5) * 0.2; // -0.1 to +0.1

    const finalConfidence = Math.max(
      0,
      Math.min(1, blendedConfidence + successAdjustment)
    );

    return finalConfidence;
  }

  /**
   * Should we trust this pattern detection?
   */
  static async shouldTrust(
    pattern: BehavioralPattern,
    learningService: PatternLearningService,
    threshold: number = 0.7
  ): Promise<boolean> {
    const adjustedConfidence = await this.adjustConfidence(pattern, learningService);
    return adjustedConfidence >= threshold;
  }
}

// Export singleton instance
export const patternLearningService = PatternLearningService.getInstance();
