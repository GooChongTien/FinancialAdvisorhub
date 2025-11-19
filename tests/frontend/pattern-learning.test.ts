/**
 * Pattern Learning Service Unit Tests
 * Tests for continuous learning and confidence adjustment
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PatternLearningService,
  PatternConfidenceAdjuster,
} from "@/lib/mira/pattern-learning";
import type { BehavioralPattern } from "@/lib/mira/types";

// Mock Supabase client
vi.mock("@/admin/api/supabaseClient.js", () => ({
  default: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "pattern-1",
          pattern_type: "proposal_creation",
          pattern_name: "Proposal Creation",
          success_count: 10,
          failure_count: 2,
          confidence_score: "0.85",
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          pattern_data: {},
        },
        error: null,
      }),
    })),
  },
}));

describe("Pattern Learning Service", () => {
  let learningService: PatternLearningService;

  beforeEach(() => {
    // Get fresh instance for each test
    learningService = PatternLearningService.getInstance();
    // Clear any queued feedback
    learningService["feedbackQueue"] = [];
  });

  describe("PatternLearningService", () => {
    it("should be a singleton", () => {
      const instance1 = PatternLearningService.getInstance();
      const instance2 = PatternLearningService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should record success", () => {
      learningService.recordSuccess("proposal_creation", { userId: "test-user" });

      const queue = learningService["feedbackQueue"];
      expect(queue.length).toBe(1);
      expect(queue[0].patternType).toBe("proposal_creation");
      expect(queue[0].success).toBe(true);
      expect(queue[0].context.userId).toBe("test-user");
    });

    it("should record failure", () => {
      learningService.recordFailure("form_struggle", { reason: "user-cancelled" });

      const queue = learningService["feedbackQueue"];
      expect(queue.length).toBe(1);
      expect(queue[0].patternType).toBe("form_struggle");
      expect(queue[0].success).toBe(false);
      expect(queue[0].context.reason).toBe("user-cancelled");
    });

    it("should record user action", () => {
      learningService.recordUserAction("search_behavior", "accept", {
        suggestionId: "sugg-1",
      });

      const queue = learningService["feedbackQueue"];
      expect(queue.length).toBe(1);
      expect(queue[0].patternType).toBe("search_behavior");
      expect(queue[0].userAction).toBe("accept");
      expect(queue[0].success).toBe(true); // accept is success
    });

    it("should treat dismiss as failure", () => {
      learningService.recordUserAction("analytics_exploration", "dismiss", {});

      const queue = learningService["feedbackQueue"];
      expect(queue[0].success).toBe(false);
    });

    it("should treat ignore as failure", () => {
      learningService.recordUserAction("task_completion", "ignore", {});

      const queue = learningService["feedbackQueue"];
      expect(queue[0].success).toBe(false);
    });

    it("should queue multiple feedback items", () => {
      learningService.recordSuccess("pattern1");
      learningService.recordSuccess("pattern2");
      learningService.recordFailure("pattern3");

      const queue = learningService["feedbackQueue"];
      expect(queue.length).toBe(3);
    });

    it("should trigger upload when queue reaches threshold", async () => {
      const uploadSpy = vi.spyOn(learningService as any, "uploadFeedback");

      // Queue 10 items (threshold)
      for (let i = 0; i < 10; i++) {
        learningService.recordSuccess(`pattern${i}`);
      }

      expect(uploadSpy).toHaveBeenCalled();
    });

    it("should get pattern confidence", async () => {
      const confidence = await learningService.getPatternConfidence("proposal_creation");

      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it("should return default confidence for unknown pattern", async () => {
      // Mock error for unknown pattern
      vi.spyOn(learningService as any, "getPatternConfidence").mockResolvedValueOnce(0.5);

      const confidence = await learningService.getPatternConfidence("unknown_pattern");

      expect(confidence).toBe(0.5);
    });

    it("should get pattern success rate", async () => {
      const successRate = await learningService.getPatternSuccessRate("proposal_creation");

      expect(successRate).toBeGreaterThanOrEqual(0);
      expect(successRate).toBeLessThanOrEqual(1);
    });

    it("should calculate success rate correctly", async () => {
      // Mock data: 10 successes, 2 failures
      // Success rate should be 10 / (10 + 2) = 0.833...

      const successRate = await learningService.getPatternSuccessRate("proposal_creation");

      expect(successRate).toBeCloseTo(0.833, 2);
    });

    it("should return 0 success rate for pattern with no data", async () => {
      // Mock error for pattern with no data
      vi.spyOn(learningService as any, "getPatternSuccessRate").mockResolvedValueOnce(0);

      const successRate = await learningService.getPatternSuccessRate("no_data_pattern");

      expect(successRate).toBe(0);
    });

    it("should get learned patterns", async () => {
      const patterns = await learningService.getLearnedPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      if (patterns.length > 0) {
        expect(patterns[0].id).toBeDefined();
        expect(patterns[0].patternType).toBeDefined();
        expect(patterns[0].patternName).toBeDefined();
        expect(patterns[0].confidenceScore).toBeGreaterThanOrEqual(0);
        expect(patterns[0].confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    it("should get top patterns", async () => {
      const topPatterns = await learningService.getTopPatterns(3);

      expect(Array.isArray(topPatterns)).toBe(true);
      expect(topPatterns.length).toBeLessThanOrEqual(3);

      // Should be sorted by confidence score (descending)
      for (let i = 1; i < topPatterns.length; i++) {
        expect(topPatterns[i - 1].confidenceScore).toBeGreaterThanOrEqual(
          topPatterns[i].confidenceScore
        );
      }
    });

    it("should get patterns needing improvement", async () => {
      const needsImprovement = await learningService.getPatternsNeedingImprovement(0.7);

      expect(Array.isArray(needsImprovement)).toBe(true);

      // All returned patterns should have confidence < 0.7
      needsImprovement.forEach((pattern) => {
        expect(pattern.confidenceScore).toBeLessThan(0.7);
      });
    });

    it("should flush queued feedback", async () => {
      learningService.recordSuccess("pattern1");
      learningService.recordSuccess("pattern2");

      await learningService.flush();

      const queue = learningService["feedbackQueue"];
      expect(queue.length).toBe(0);
    });

    it("should handle upload errors gracefully", async () => {
      // Mock upload error
      vi.spyOn(learningService as any, "updatePatternStats").mockRejectedValueOnce(
        new Error("Upload failed")
      );

      learningService.recordSuccess("pattern1");

      // Should not throw
      await expect(learningService.flush()).resolves.not.toThrow();
    });

    it("should destroy cleanly", () => {
      const timer = learningService["uploadTimer"];
      learningService.destroy();

      expect(learningService["uploadTimer"]).toBeNull();
    });
  });

  describe("PatternConfidenceAdjuster", () => {
    it("should adjust confidence with learning", async () => {
      const pattern: BehavioralPattern = {
        patternType: "proposal_creation",
        patternName: "Proposal Creation",
        confidence: 0.8,
        detectedAt: new Date(),
      };

      const adjustedConfidence = await PatternConfidenceAdjuster.adjustConfidence(
        pattern,
        learningService
      );

      expect(adjustedConfidence).toBeGreaterThanOrEqual(0);
      expect(adjustedConfidence).toBeLessThanOrEqual(1);
    });

    it("should blend detected and learned confidence (60/40)", async () => {
      const pattern: BehavioralPattern = {
        patternType: "proposal_creation",
        patternName: "Proposal Creation",
        confidence: 0.7, // Detected: 70%
        detectedAt: new Date(),
      };

      // Mock learned confidence: 90%
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.9);
      // Mock success rate: 80%
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.8);

      const adjustedConfidence = await PatternConfidenceAdjuster.adjustConfidence(
        pattern,
        learningService
      );

      // Expected:
      // Blended = 0.7 * 0.6 + 0.9 * 0.4 = 0.42 + 0.36 = 0.78
      // Success adjustment = (0.8 - 0.5) * 0.2 = 0.3 * 0.2 = 0.06
      // Final = 0.78 + 0.06 = 0.84

      expect(adjustedConfidence).toBeCloseTo(0.84, 2);
    });

    it("should boost confidence for high success rate", async () => {
      const pattern: BehavioralPattern = {
        patternType: "test_pattern",
        patternName: "Test Pattern",
        confidence: 0.7,
        detectedAt: new Date(),
      };

      // Mock high success rate
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.7);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(1.0);

      const adjustedConfidence = await PatternConfidenceAdjuster.adjustConfidence(
        pattern,
        learningService
      );

      // Should be boosted due to high success rate
      expect(adjustedConfidence).toBeGreaterThan(0.7);
    });

    it("should reduce confidence for low success rate", async () => {
      const pattern: BehavioralPattern = {
        patternType: "test_pattern",
        patternName: "Test Pattern",
        confidence: 0.7,
        detectedAt: new Date(),
      };

      // Mock low success rate
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.7);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.0);

      const adjustedConfidence = await PatternConfidenceAdjuster.adjustConfidence(
        pattern,
        learningService
      );

      // Should be reduced due to low success rate
      expect(adjustedConfidence).toBeLessThan(0.7);
    });

    it("should clamp confidence to 0-1 range", async () => {
      const highPattern: BehavioralPattern = {
        patternType: "high_pattern",
        patternName: "High Pattern",
        confidence: 0.95,
        detectedAt: new Date(),
      };

      const lowPattern: BehavioralPattern = {
        patternType: "low_pattern",
        patternName: "Low Pattern",
        confidence: 0.05,
        detectedAt: new Date(),
      };

      // Mock very high learned confidence and success rate
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.99);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(1.0);

      const adjustedHigh = await PatternConfidenceAdjuster.adjustConfidence(
        highPattern,
        learningService
      );

      // Should be clamped to 1.0
      expect(adjustedHigh).toBeLessThanOrEqual(1.0);

      // Mock very low learned confidence and success rate
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.01);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.0);

      const adjustedLow = await PatternConfidenceAdjuster.adjustConfidence(
        lowPattern,
        learningService
      );

      // Should be clamped to 0.0
      expect(adjustedLow).toBeGreaterThanOrEqual(0.0);
    });

    it("should determine if pattern should be trusted", async () => {
      const highConfidencePattern: BehavioralPattern = {
        patternType: "high_pattern",
        patternName: "High Confidence Pattern",
        confidence: 0.9,
        detectedAt: new Date(),
      };

      // Mock high learned confidence
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.9);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.9);

      const shouldTrust = await PatternConfidenceAdjuster.shouldTrust(
        highConfidencePattern,
        learningService,
        0.7
      );

      expect(shouldTrust).toBe(true);
    });

    it("should not trust low confidence patterns", async () => {
      const lowConfidencePattern: BehavioralPattern = {
        patternType: "low_pattern",
        patternName: "Low Confidence Pattern",
        confidence: 0.4,
        detectedAt: new Date(),
      };

      // Mock low learned confidence
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.4);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.3);

      const shouldTrust = await PatternConfidenceAdjuster.shouldTrust(
        lowConfidencePattern,
        learningService,
        0.7
      );

      expect(shouldTrust).toBe(false);
    });

    it("should respect custom trust threshold", async () => {
      const pattern: BehavioralPattern = {
        patternType: "test_pattern",
        patternName: "Test Pattern",
        confidence: 0.75,
        detectedAt: new Date(),
      };

      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.75);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.75);

      const shouldTrustHigh = await PatternConfidenceAdjuster.shouldTrust(
        pattern,
        learningService,
        0.9
      );

      const shouldTrustLow = await PatternConfidenceAdjuster.shouldTrust(
        pattern,
        learningService,
        0.5
      );

      expect(shouldTrustHigh).toBe(false); // Below 0.9 threshold
      expect(shouldTrustLow).toBe(true); // Above 0.5 threshold
    });

    it("should handle default confidence for unknown patterns", async () => {
      const unknownPattern: BehavioralPattern = {
        patternType: "unknown_pattern",
        patternName: "Unknown Pattern",
        confidence: 0.6,
        detectedAt: new Date(),
      };

      // Mock default confidence (0.5)
      vi.spyOn(learningService, "getPatternConfidence").mockResolvedValueOnce(0.5);
      vi.spyOn(learningService, "getPatternSuccessRate").mockResolvedValueOnce(0.0);

      const adjustedConfidence = await PatternConfidenceAdjuster.adjustConfidence(
        unknownPattern,
        learningService
      );

      // Should still calculate blend with default 0.5
      // Blend = 0.6 * 0.6 + 0.5 * 0.4 = 0.36 + 0.2 = 0.56
      // Success adjustment = (0.0 - 0.5) * 0.2 = -0.1
      // Final = 0.56 - 0.1 = 0.46

      expect(adjustedConfidence).toBeCloseTo(0.46, 2);
    });
  });
});
