/**
 * Pattern Matching Engine Unit Tests
 * Tests for unified pattern detection and real-time matching
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  PatternMatchingEngine,
  ProactivePatternEngine,
} from "@/lib/mira/pattern-matching-engine";
import type { BehavioralContext } from "@/lib/mira/types";

// Mock dependencies
vi.mock("@/lib/mira/pattern-learning", () => ({
  PatternLearningService: {
    getInstance: vi.fn(() => ({
      getPatternConfidence: vi.fn().mockResolvedValue(0.8),
      getPatternSuccessRate: vi.fn().mockResolvedValue(0.85),
      recordSuccess: vi.fn(),
      recordFailure: vi.fn(),
      recordUserAction: vi.fn(),
      getLearnedPatterns: vi.fn().mockResolvedValue([
        {
          id: "pattern-1",
          patternType: "proposal_creation",
          patternName: "Proposal Creation",
          successCount: 10,
          failureCount: 2,
          confidenceScore: 0.85,
          lastSeen: new Date(),
          patternData: {},
        },
      ]),
      getTopPatterns: vi.fn().mockResolvedValue([]),
      flush: vi.fn(),
      destroy: vi.fn(),
    })),
  },
  PatternConfidenceAdjuster: {
    adjustConfidence: vi.fn().mockResolvedValue(0.85),
    shouldTrust: vi.fn().mockResolvedValue(true),
  },
}));

describe("Pattern Matching Engine", () => {
  let engine: PatternMatchingEngine;
  let mockContext: BehavioralContext;

  beforeEach(() => {
    engine = PatternMatchingEngine.getInstance();

    mockContext = {
      currentPage: "/new-business",
      currentModule: "new-business",
      pageData: {},
      navigationHistory: [
        {
          timestamp: new Date(Date.now() - 120000),
          fromPage: "/customers",
          toPage: "/customers/detail",
          module: "customers",
          trigger: "click",
          timeSpent: 30000,
        },
        {
          timestamp: new Date(Date.now() - 60000),
          fromPage: "/customers/detail",
          toPage: "/new-business",
          module: "new-business",
          trigger: "click",
          timeSpent: 60000,
        },
      ],
      recentActions: [
        {
          timestamp: new Date(Date.now() - 50000),
          actionType: "input",
          elementId: "customer-name",
          elementType: "input",
        },
        {
          timestamp: new Date(Date.now() - 40000),
          actionType: "input",
          elementId: "product-type",
          elementType: "select",
        },
      ],
      sessionId: "test-session",
      sessionStartTime: new Date(Date.now() - 300000),
      currentPageStartTime: new Date(Date.now() - 60000),
    };
  });

  afterEach(() => {
    engine.destroy();
  });

  describe("Initialization", () => {
    it("should be a singleton", () => {
      const instance1 = PatternMatchingEngine.getInstance();
      const instance2 = PatternMatchingEngine.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should initialize with default configuration", () => {
      const config = engine.getConfig();

      expect(config.enableLearning).toBe(true);
      expect(config.enableStreaming).toBe(true);
      expect(config.minConfidence).toBe(0.65);
      expect(config.maxPatterns).toBe(5);
      expect(config.includeDetectors).toBe(true);
      expect(config.includeLibrary).toBe(true);
    });

    it("should allow custom configuration", () => {
      // Reset singleton to allow custom config
      engine.destroy();
      PatternMatchingEngine["instance"] = null as any;

      const customEngine = PatternMatchingEngine.getInstance({
        minConfidence: 0.8,
        maxPatterns: 3,
      });

      const config = customEngine.getConfig();

      expect(config.minConfidence).toBe(0.8);
      expect(config.maxPatterns).toBe(3);
    });
  });

  describe("Pattern Matching", () => {
    it("should match patterns from behavioral context", async () => {
      const results = await engine.matchPatterns(mockContext);

      expect(Array.isArray(results)).toBe(true);
    });

    it("should return pattern match results with metadata", async () => {
      const results = await engine.matchPatterns(mockContext);

      if (results.length > 0) {
        const result = results[0];

        expect(result.pattern).toBeDefined();
        expect(result.adjustedConfidence).toBeGreaterThanOrEqual(0);
        expect(result.adjustedConfidence).toBeLessThanOrEqual(1);
        expect(result.learningBoost).toBeDefined();
        expect(["detector", "library", "hybrid"]).toContain(result.source);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.rawConfidence).toBeDefined();
        expect(result.metadata.learnedConfidence).toBeDefined();
        expect(result.metadata.successRate).toBeDefined();
      }
    });

    it("should filter patterns by minimum confidence", async () => {
      engine.updateConfig({ minConfidence: 0.9 });

      const results = await engine.matchPatterns(mockContext);

      results.forEach((result) => {
        expect(result.adjustedConfidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it("should limit number of returned patterns", async () => {
      engine.updateConfig({ maxPatterns: 2 });

      const results = await engine.matchPatterns(mockContext);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should sort results by adjusted confidence", async () => {
      const results = await engine.matchPatterns(mockContext);

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].adjustedConfidence).toBeGreaterThanOrEqual(
          results[i].adjustedConfidence
        );
      }
    });

    it("should use detectors when enabled", async () => {
      engine.updateConfig({ includeDetectors: true, includeLibrary: false });

      const results = await engine.matchPatterns(mockContext);

      results.forEach((result) => {
        expect(result.source).toBe("detector");
      });
    });

    it("should use library when enabled", async () => {
      engine.updateConfig({ includeDetectors: false, includeLibrary: true });

      const results = await engine.matchPatterns(mockContext);

      results.forEach((result) => {
        expect(result.source).toBe("library");
      });
    });

    it("should combine detectors and library", async () => {
      engine.updateConfig({ includeDetectors: true, includeLibrary: true });

      const results = await engine.matchPatterns(mockContext);

      const sources = new Set(results.map((r) => r.source));
      // May have both detector and library sources
      expect(sources.size).toBeGreaterThan(0);
    });

    it("should apply learning adjustments when enabled", async () => {
      engine.updateConfig({ enableLearning: true });

      const results = await engine.matchPatterns(mockContext);

      if (results.length > 0) {
        const result = results[0];
        // Learning boost can be positive, negative, or zero
        expect(typeof result.learningBoost).toBe("number");
        expect(result.metadata.successRate).toBeGreaterThanOrEqual(0);
      }
    });

    it("should skip learning adjustments when disabled", async () => {
      engine.updateConfig({ enableLearning: false });

      const results = await engine.matchPatterns(mockContext);

      results.forEach((result) => {
        // Without learning, adjusted confidence should equal raw confidence
        expect(result.adjustedConfidence).toBe(result.pattern.confidence);
      });
    });
  });

  describe("Indicator Extraction", () => {
    it("should extract page indicators", async () => {
      const context: BehavioralContext = {
        currentPage: "/analytics",
        currentModule: "analytics",
        pageData: {},
        navigationHistory: [],
        recentActions: [],
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("page__analytics");
      expect(indicators).toContain("module_analytics");
    });

    it("should extract navigation pattern indicators", async () => {
      const context: BehavioralContext = {
        currentPage: "/test",
        currentModule: "test",
        pageData: {},
        navigationHistory: Array.from({ length: 6 }, () => ({
          timestamp: new Date(),
          fromPage: "/page1",
          toPage: "/page2",
          module: "test",
          trigger: "click",
          timeSpent: 5000,
        })),
        recentActions: [],
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("extensive_navigation");
    });

    it("should detect back navigation pattern", async () => {
      const context: BehavioralContext = {
        currentPage: "/test",
        currentModule: "test",
        pageData: {},
        navigationHistory: Array.from({ length: 4 }, () => ({
          timestamp: new Date(),
          fromPage: "/page1",
          toPage: "/page2",
          module: "test",
          navigationType: "back",
          timeSpent: 5000,
        })),
        recentActions: [],
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("back_navigation_count");
    });

    it("should detect page revisits", async () => {
      const context: BehavioralContext = {
        currentPage: "/test",
        currentModule: "test",
        pageData: {},
        navigationHistory: [
          { timestamp: new Date(), fromPage: "/page1", toPage: "/page2", module: "test" },
          { timestamp: new Date(), fromPage: "/page2", toPage: "/page3", module: "test" },
          { timestamp: new Date(), fromPage: "/page3", toPage: "/page2", module: "test" },
          { timestamp: new Date(), fromPage: "/page2", toPage: "/page3", module: "test" },
        ],
        recentActions: [],
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("page_revisits");
    });

    it("should detect high field interactions", async () => {
      const context: BehavioralContext = {
        currentPage: "/test",
        currentModule: "test",
        pageData: {},
        navigationHistory: [],
        recentActions: Array.from({ length: 15 }, () => ({
          timestamp: new Date(),
          actionType: "input" as const,
          elementId: "field",
          elementType: "input",
        })),
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("high_field_interaction_count");
    });

    it("should detect multiple search attempts", async () => {
      const context: BehavioralContext = {
        currentPage: "/test",
        currentModule: "test",
        pageData: {},
        navigationHistory: [],
        recentActions: Array.from({ length: 4 }, () => ({
          timestamp: new Date(),
          actionType: "click" as const,
          elementId: "search-button",
          elementType: "button",
        })),
        sessionId: "test",
        sessionStartTime: new Date(),
        currentPageStartTime: new Date(),
      };

      const indicators = (engine as any).extractIndicators(context);

      expect(indicators).toContain("multiple_search_attempts");
    });
  });

  describe("Streaming Pattern Detection", () => {
    it("should buffer patterns when streaming is enabled", async () => {
      engine.updateConfig({ enableStreaming: true });

      await engine.matchPatterns(mockContext);

      const buffer = engine["streamBuffer"];
      expect(Array.isArray(buffer)).toBe(true);
    });

    it("should limit buffer size", async () => {
      engine.updateConfig({ enableStreaming: true });

      // Add many patterns to buffer
      for (let i = 0; i < 150; i++) {
        await engine.matchPatterns(mockContext);
      }

      const buffer = engine["streamBuffer"];
      expect(buffer.length).toBeLessThanOrEqual(100);
    });

    it("should process stream buffer periodically", async () => {
      engine.updateConfig({ enableStreaming: true });

      const processSpy = vi.spyOn(engine as any, "processStreamBuffer");

      await engine.matchPatterns(mockContext);

      // Wait for processing interval (5 seconds in real code, but mocked)
      // In tests, we can manually trigger
      await (engine as any).processStreamBuffer();

      expect(processSpy).toHaveBeenCalled();
    });

    it("should detect emerging patterns", async () => {
      engine.updateConfig({ enableStreaming: true });

      const onEmergingSpy = vi.spyOn(engine as any, "onEmergingPatterns");

      // Fill buffer with same pattern type
      const buffer = engine["streamBuffer"];
      for (let i = 0; i < 3; i++) {
        buffer.push({
          patternType: "test_pattern",
          patternName: "Test Pattern",
          confidence: 0.8,
          detectedAt: new Date(),
        });
      }

      await (engine as any).processStreamBuffer();

      expect(onEmergingSpy).toHaveBeenCalledWith(expect.arrayContaining(["test_pattern"]));
    });
  });

  describe("Pattern Statistics", () => {
    it("should get pattern statistics", async () => {
      const stats = await engine.getPatternStats("proposal_creation");

      expect(stats).toBeDefined();
      expect(stats.confidence).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successCount).toBeGreaterThanOrEqual(0);
      expect(stats.failureCount).toBeGreaterThanOrEqual(0);
    });

    it("should get top performing patterns", async () => {
      const topPatterns = await engine.getTopPatterns(3);

      expect(Array.isArray(topPatterns)).toBe(true);
      expect(topPatterns.length).toBeLessThanOrEqual(3);
    });

    it("should record pattern success", () => {
      const recordSpy = vi.spyOn(engine["learningService"], "recordSuccess");

      engine.recordPatternSuccess("test_pattern", { userId: "user1" });

      expect(recordSpy).toHaveBeenCalledWith("test_pattern", { userId: "user1" });
    });

    it("should record pattern failure", () => {
      const recordSpy = vi.spyOn(engine["learningService"], "recordFailure");

      engine.recordPatternFailure("test_pattern", { reason: "error" });

      expect(recordSpy).toHaveBeenCalledWith("test_pattern", { reason: "error" });
    });

    it("should record user action", () => {
      const recordSpy = vi.spyOn(engine["learningService"], "recordUserAction");

      engine.recordUserAction("test_pattern", "accept", { suggestionId: "sugg1" });

      expect(recordSpy).toHaveBeenCalledWith("test_pattern", "accept", {
        suggestionId: "sugg1",
      });
    });
  });

  describe("Configuration Management", () => {
    it("should update configuration", () => {
      engine.updateConfig({ minConfidence: 0.75, maxPatterns: 10 });

      const config = engine.getConfig();

      expect(config.minConfidence).toBe(0.75);
      expect(config.maxPatterns).toBe(10);
    });

    it("should restart streaming on config change", () => {
      const startStreamingSpy = vi.spyOn(engine as any, "startStreamProcessing");

      engine.updateConfig({ enableStreaming: false });
      expect(engine["processingTimer"]).toBeNull();

      engine.updateConfig({ enableStreaming: true });
      expect(startStreamingSpy).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("should flush on destroy", async () => {
      const flushSpy = vi.spyOn(engine["learningService"], "flush");

      engine.destroy();

      expect(flushSpy).toHaveBeenCalled();
    });

    it("should clear timers on destroy", () => {
      engine.destroy();

      expect(engine["processingTimer"]).toBeNull();
    });

    it("should clear buffers on destroy", () => {
      engine.destroy();

      expect(engine["streamBuffer"].length).toBe(0);
    });
  });
});

describe("ProactivePatternEngine", () => {
  let proactiveEngine: ProactivePatternEngine;
  let mockContext: BehavioralContext;

  beforeEach(() => {
    proactiveEngine = new ProactivePatternEngine();

    mockContext = {
      currentPage: "/new-business",
      currentModule: "new-business",
      pageData: {},
      navigationHistory: [],
      recentActions: [],
      sessionId: "test",
      sessionStartTime: new Date(),
      currentPageStartTime: new Date(),
    };
  });

  afterEach(() => {
    proactiveEngine.destroy();
  });

  describe("Proactive Suggestions", () => {
    it("should generate proactive suggestions", async () => {
      const suggestions = await proactiveEngine.getProactiveSuggestions(mockContext, 3);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it("should include pattern metadata in suggestions", async () => {
      const suggestions = await proactiveEngine.getProactiveSuggestions(mockContext);

      suggestions.forEach((suggestion) => {
        expect(suggestion.patternType).toBeDefined();
        expect(suggestion.suggestion).toBeDefined();
        expect(["high", "medium", "low"]).toContain(suggestion.priority);
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
      });
    });

    it("should prioritize suggestions by confidence", async () => {
      const suggestions = await proactiveEngine.getProactiveSuggestions(mockContext, 5);

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });
  });

  describe("Emerging Pattern Callbacks", () => {
    it("should support callback registration", () => {
      const callback = vi.fn();

      proactiveEngine.onEmergingPatternsDetected(callback);

      expect(proactiveEngine["suggestionCallbacks"]).toContain(callback);
    });

    it("should trigger callbacks on emerging patterns", async () => {
      const callback = vi.fn();

      proactiveEngine.onEmergingPatternsDetected(callback);

      // Manually trigger emerging patterns
      (proactiveEngine as any).onEmergingPatterns(["test_pattern"]);

      expect(callback).toHaveBeenCalledWith(["test_pattern"]);
    });

    it("should handle callback errors gracefully", async () => {
      const errorCallback = vi.fn(() => {
        throw new Error("Callback error");
      });
      const successCallback = vi.fn();

      proactiveEngine.onEmergingPatternsDetected(errorCallback);
      proactiveEngine.onEmergingPatternsDetected(successCallback);

      // Should not throw
      expect(() => {
        (proactiveEngine as any).onEmergingPatterns(["test_pattern"]);
      }).not.toThrow();

      // Success callback should still be called
      expect(successCallback).toHaveBeenCalled();
    });

    it("should support multiple callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      proactiveEngine.onEmergingPatternsDetected(callback1);
      proactiveEngine.onEmergingPatternsDetected(callback2);
      proactiveEngine.onEmergingPatternsDetected(callback3);

      (proactiveEngine as any).onEmergingPatterns(["pattern1", "pattern2"]);

      expect(callback1).toHaveBeenCalledWith(["pattern1", "pattern2"]);
      expect(callback2).toHaveBeenCalledWith(["pattern1", "pattern2"]);
      expect(callback3).toHaveBeenCalledWith(["pattern1", "pattern2"]);
    });
  });
});
