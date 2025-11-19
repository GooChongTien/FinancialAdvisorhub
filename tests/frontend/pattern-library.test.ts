/**
 * Pattern Library Unit Tests
 * Tests for pattern templates and matching algorithms
 */

import { describe, it, expect } from "vitest";
import {
  PatternLibrary,
  PatternMatcher,
  SUCCESS_PATTERNS,
  STRUGGLE_PATTERNS,
  EXPLORATION_PATTERNS,
} from "@/lib/mira/pattern-library";

describe("Pattern Library", () => {
  describe("Pattern Templates", () => {
    it("should have success patterns defined", () => {
      expect(SUCCESS_PATTERNS.length).toBeGreaterThan(0);
      expect(SUCCESS_PATTERNS[0].category).toBe("success");
    });

    it("should have struggle patterns defined", () => {
      expect(STRUGGLE_PATTERNS.length).toBeGreaterThan(0);
      expect(STRUGGLE_PATTERNS[0].category).toMatch(/struggle|abandonment/);
    });

    it("should have exploration patterns defined", () => {
      expect(EXPLORATION_PATTERNS.length).toBeGreaterThan(0);
      expect(EXPLORATION_PATTERNS[0].category).toBe("exploration");
    });

    it("should have valid pattern structure", () => {
      const pattern = SUCCESS_PATTERNS[0];

      expect(pattern.id).toBeDefined();
      expect(pattern.name).toBeDefined();
      expect(pattern.category).toBeDefined();
      expect(pattern.description).toBeDefined();
      expect(pattern.triggers).toBeDefined();
      expect(pattern.indicators).toBeDefined();
      expect(pattern.suggestedActions).toBeDefined();
      expect(pattern.confidence_threshold).toBeGreaterThan(0);
      expect(pattern.confidence_threshold).toBeLessThanOrEqual(1);
    });

    it("should have weighted indicators", () => {
      const pattern = SUCCESS_PATTERNS[0];

      pattern.indicators.forEach((indicator) => {
        expect(indicator.type).toBeDefined();
        expect(indicator.weight).toBeGreaterThan(0);
        expect(indicator.weight).toBeLessThanOrEqual(1);
        expect(typeof indicator.required).toBe("boolean");
        expect(indicator.description).toBeDefined();
      });
    });

    it("should have prioritized suggested actions", () => {
      const pattern = STRUGGLE_PATTERNS[0];

      pattern.suggestedActions.forEach((action) => {
        expect(action.action).toBeDefined();
        expect(["high", "medium", "low"]).toContain(action.priority);
      });
    });
  });

  describe("PatternLibrary", () => {
    it("should return all patterns", () => {
      const allPatterns = PatternLibrary.getAllPatterns();

      expect(allPatterns.length).toBe(
        SUCCESS_PATTERNS.length + STRUGGLE_PATTERNS.length + EXPLORATION_PATTERNS.length
      );
    });

    it("should get patterns by category", () => {
      const successPatterns = PatternLibrary.getPatternsByCategory("success");
      const strugglePatterns = PatternLibrary.getPatternsByCategory("struggle");
      const explorationPatterns = PatternLibrary.getPatternsByCategory("exploration");

      expect(successPatterns.length).toBe(SUCCESS_PATTERNS.length);
      expect(strugglePatterns.every((p) => p.category === "struggle")).toBe(true);
      expect(explorationPatterns.length).toBe(EXPLORATION_PATTERNS.length);
    });

    it("should get pattern by ID", () => {
      const pattern = PatternLibrary.getPattern("proposal_success");

      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe("proposal_success");
      expect(pattern?.category).toBe("success");
    });

    it("should return undefined for non-existent pattern", () => {
      const pattern = PatternLibrary.getPattern("non_existent_pattern");

      expect(pattern).toBeUndefined();
    });

    it("should get success patterns", () => {
      const patterns = PatternLibrary.getSuccessPatterns();

      expect(patterns.length).toBe(SUCCESS_PATTERNS.length);
      expect(patterns.every((p) => p.category === "success")).toBe(true);
    });

    it("should get struggle patterns", () => {
      const patterns = PatternLibrary.getStrugglePatterns();

      expect(patterns.length).toBe(STRUGGLE_PATTERNS.length);
    });

    it("should get exploration patterns", () => {
      const patterns = PatternLibrary.getExplorationPatterns();

      expect(patterns.length).toBe(EXPLORATION_PATTERNS.length);
    });

    it("should get high priority patterns", () => {
      const patterns = PatternLibrary.getHighPriorityPatterns();

      expect(patterns.every((p) => p.category === "struggle" || p.category === "abandonment")).toBe(
        true
      );
    });

    it("should get suggested actions for pattern", () => {
      const actions = PatternLibrary.getSuggestedActions("form_abandonment");

      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].action).toBeDefined();
      expect(actions[0].priority).toBeDefined();
    });

    it("should filter suggested actions by condition", () => {
      const pattern = PatternLibrary.getPattern("form_abandonment");
      const allActions = pattern?.suggestedActions || [];
      const filteredActions = PatternLibrary.getSuggestedActions(
        "form_abandonment",
        "extended_time"
      );

      expect(filteredActions.length).toBeLessThanOrEqual(allActions.length);
    });

    it("should calculate pattern score correctly", () => {
      const indicators = [
        "customer_page_visited",
        "fact_finding_completed",
        "proposal_submitted",
      ];

      const score = PatternLibrary.calculatePatternScore("proposal_success", indicators);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it("should return 0 for missing required indicators", () => {
      // proposal_success requires customer_page_visited, fact_finding_completed, proposal_submitted
      const indicators = ["fna_calculated"]; // Only optional indicator

      const score = PatternLibrary.calculatePatternScore("proposal_success", indicators);

      expect(score).toBe(0);
    });

    it("should calculate full score for all indicators", () => {
      const pattern = PatternLibrary.getPattern("proposal_success");
      const allIndicators = pattern?.indicators.map((i) => i.type) || [];

      const score = PatternLibrary.calculatePatternScore("proposal_success", allIndicators);

      expect(score).toBe(1);
    });

    it("should register custom pattern", () => {
      const customPattern = {
        id: "custom_test_pattern",
        name: "Custom Test Pattern",
        category: "success" as const,
        description: "A custom pattern for testing",
        triggers: ["custom_trigger"],
        indicators: [
          {
            type: "custom_indicator",
            weight: 1.0,
            required: true,
            description: "Custom indicator",
          },
        ],
        suggestedActions: [
          {
            action: "custom_action",
            priority: "high" as const,
          },
        ],
        confidence_threshold: 0.8,
      };

      PatternLibrary.registerPattern(customPattern);

      const retrieved = PatternLibrary.getPattern("custom_test_pattern");
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe("Custom Test Pattern");
    });
  });

  describe("PatternMatcher", () => {
    it("should match patterns based on indicators", () => {
      const indicators = [
        "customer_page_visited",
        "fact_finding_completed",
        "fna_calculated", // Include optional indicator to meet 0.85 threshold
        "proposal_submitted",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].pattern).toBeDefined();
      expect(matches[0].score).toBeGreaterThan(0);
    });

    it("should sort matches by score", () => {
      const indicators = [
        "customer_page_visited",
        "fact_finding_completed",
        "fna_calculated",
        "proposal_submitted",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].score).toBeGreaterThanOrEqual(matches[i].score);
      }
    });

    it("should filter by confidence threshold", () => {
      const indicators = ["visiting_new_pages"]; // Low confidence indicator

      const matches = PatternMatcher.matchPatterns(indicators);

      // All matches should meet their confidence threshold
      matches.forEach((match) => {
        expect(match.score).toBeGreaterThanOrEqual(match.pattern.confidence_threshold);
      });
    });

    it("should match patterns by category", () => {
      const indicators = [
        "multiple_search_attempts",
        "varied_search_terms",
        "no_navigation_after_search",
      ];

      const matches = PatternMatcher.matchPatterns(indicators, "struggle");

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.every((m) => m.pattern.category === "struggle")).toBe(true);
    });

    it("should get best match", () => {
      const indicators = [
        "customer_page_visited",
        "fact_finding_completed",
        "fna_calculated",
        "proposal_submitted",
      ];

      const bestMatch = PatternMatcher.getBestMatch(indicators);

      expect(bestMatch).not.toBeNull();
      expect(bestMatch?.pattern.id).toBe("proposal_success");
      expect(bestMatch?.score).toBeGreaterThan(0.8);
    });

    it("should return null when no patterns match", () => {
      const indicators = ["random_indicator_xyz"];

      const bestMatch = PatternMatcher.getBestMatch(indicators);

      expect(bestMatch).toBeNull();
    });

    it("should match form abandonment pattern", () => {
      const indicators = [
        "form_fields_filled",
        "no_submission",
        "extended_time_on_form",
        "navigated_away",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      const formAbandonmentMatch = matches.find((m) => m.pattern.id === "form_abandonment");
      expect(formAbandonmentMatch).toBeDefined();
      expect(formAbandonmentMatch?.score).toBeGreaterThan(0.7);
    });

    it("should match search frustration pattern", () => {
      const indicators = [
        "multiple_search_attempts",
        "varied_search_terms",
        "no_navigation_after_search",
        "rapid_successive_searches",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      const searchFrustrationMatch = matches.find((m) => m.pattern.id === "search_frustration");
      expect(searchFrustrationMatch).toBeDefined();
      expect(searchFrustrationMatch?.score).toBeGreaterThan(0.7);
    });

    it("should match navigation confusion pattern", () => {
      const indicators = [
        "back_navigation_count",
        "page_revisits",
        "no_form_completion",
        "rapid_navigation",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      const navConfusionMatch = matches.find((m) => m.pattern.id === "navigation_confusion");
      expect(navConfusionMatch).toBeDefined();
    });

    it("should match analytics insight discovery", () => {
      const indicators = [
        "analytics_page_visited",
        "filters_applied",
        "sufficient_time_spent",
        "action_taken",
      ];

      const matches = PatternMatcher.matchPatterns(indicators);

      const analyticsMatch = matches.find((m) => m.pattern.id === "analytics_insight_discovery");
      expect(analyticsMatch).toBeDefined();
      expect(analyticsMatch?.score).toBeGreaterThan(0.7);
    });

    it("should handle partial indicator matches", () => {
      const indicators = ["customer_page_visited", "fact_finding_completed"];
      // Missing proposal_submitted (required)

      const matches = PatternMatcher.matchPatterns(indicators);

      // Should not match proposal_success because required indicator is missing
      const proposalMatch = matches.find((m) => m.pattern.id === "proposal_success");
      expect(proposalMatch).toBeUndefined();
    });

    it("should handle empty indicators", () => {
      const matches = PatternMatcher.matchPatterns([]);

      expect(matches.length).toBe(0);
    });

    it("should weight indicators correctly", () => {
      // proposal_success has different weights:
      // customer_page_visited: 0.2
      // fact_finding_completed: 0.3
      // fna_calculated: 0.2 (optional)
      // proposal_submitted: 0.3

      const requiredOnly = ["customer_page_visited", "fact_finding_completed", "proposal_submitted"];
      const withOptional = [
        "customer_page_visited",
        "fact_finding_completed",
        "fna_calculated",
        "proposal_submitted",
      ];

      const scoreRequired = PatternLibrary.calculatePatternScore("proposal_success", requiredOnly);
      const scoreWithOptional = PatternLibrary.calculatePatternScore(
        "proposal_success",
        withOptional
      );

      expect(scoreWithOptional).toBeGreaterThan(scoreRequired);
    });
  });
});
