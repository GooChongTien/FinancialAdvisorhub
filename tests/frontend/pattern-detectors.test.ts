/**
 * Pattern Detectors Unit Tests
 * Tests for advanced pattern detection algorithms
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ProposalCreationDetector,
  FormStruggleDetector,
  AnalyticsExplorationDetector,
  SearchBehaviorDetector,
  TaskCompletionDetector,
  PatternDetectorRegistry,
} from "@/lib/mira/pattern-detectors";
import type { BehavioralContext } from "@/lib/mira/types";

describe("Pattern Detectors", () => {
  describe("ProposalCreationDetector", () => {
    const detector = new ProposalCreationDetector();

    it("should detect proposal creation workflow", () => {
      const context: BehavioralContext = {
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
          {
            timestamp: new Date(Date.now() - 30000),
            actionType: "input",
            elementId: "coverage-amount",
            elementType: "input",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.pattern.patternType).toBe("proposal_creation");
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.85);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("customer_page_visit");
      expect(triggerTypes).toContain("proposal_page_visit");
    });

    it("should not detect without customer page visit", () => {
      const context: BehavioralContext = {
        currentPage: "/new-business",
        currentModule: "new-business",
        pageData: {},
        navigationHistory: [
          {
            timestamp: new Date(Date.now() - 60000),
            fromPage: "/dashboard",
            toPage: "/new-business",
            module: "new-business",
            trigger: "click",
            timeSpent: 60000,
          },
        ],
        recentActions: [],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const result = detector.detect(context);

      expect(result).toBeNull();
    });

    it("should boost confidence with fact-finding completion", () => {
      const contextWithFactFinding: BehavioralContext = {
        currentPage: "/new-business",
        currentModule: "new-business",
        pageData: { factFindingComplete: true },
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
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const result = detector.detect(contextWithFactFinding);

      expect(result).not.toBeNull();
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.85);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("fact_finding_completed");
    });
  });

  describe("FormStruggleDetector", () => {
    const detector = new FormStruggleDetector();

    it("should detect high field interactions without submission", () => {
      const context: BehavioralContext = {
        currentPage: "/new-business",
        currentModule: "new-business",
        pageData: {},
        navigationHistory: [],
        recentActions: Array.from({ length: 15 }, (_, i) => ({
          timestamp: new Date(Date.now() - (15 - i) * 5000),
          actionType: "form_input" as const,
          elementId: `field-${i % 5}`,
          elementType: "input",
        })),
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.pattern.patternType).toBe("form_struggle");
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.70);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("high_interaction_count");
    });

    it("should detect field revisits", () => {
      const context: BehavioralContext = {
        currentPage: "/new-business",
        currentModule: "new-business",
        pageData: {},
        navigationHistory: [],
        recentActions: [
          { timestamp: new Date(), actionType: "form_input", elementId: "email", elementType: "input" },
          { timestamp: new Date(), actionType: "form_input", elementId: "email", elementType: "input" },
          { timestamp: new Date(), actionType: "form_input", elementId: "email", elementType: "input" },
          { timestamp: new Date(), actionType: "form_input", elementId: "phone", elementType: "input" },
          { timestamp: new Date(), actionType: "form_input", elementId: "phone", elementType: "input" },
          { timestamp: new Date(), actionType: "form_input", elementId: "phone", elementType: "input" },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("field_revisits");
    });

    it("should not detect when form is submitted", () => {
      const context: BehavioralContext = {
        currentPage: "/new-business",
        currentModule: "new-business",
        pageData: {},
        navigationHistory: [],
        recentActions: [
          ...Array.from({ length: 15 }, (_, i) => ({
            timestamp: new Date(Date.now() - (16 - i) * 5000),
            actionType: "input" as const,
            elementId: `field-${i}`,
            elementType: "input",
          })),
          {
            timestamp: new Date(Date.now() - 1000),
            actionType: "form_submit" as const,
            elementType: "button",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).toBeNull();
    });
  });

  describe("AnalyticsExplorationDetector", () => {
    const detector = new AnalyticsExplorationDetector();

    it("should detect analytics exploration pattern", () => {
      const context: BehavioralContext = {
        currentPage: "/analytics",
        currentModule: "analytics",
        pageData: {},
        navigationHistory: [
          {
            timestamp: new Date(Date.now() - 60000),
            fromPage: "/dashboard",
            toPage: "/analytics",
            module: "analytics",
            trigger: "click",
            timeSpent: 60000,
          },
        ],
        recentActions: [
          {
            timestamp: new Date(Date.now() - 45000),
            actionType: "click",
            elementId: "filter-date-range",
            elementType: "button",
          },
          {
            timestamp: new Date(Date.now() - 30000),
            actionType: "click",
            elementId: "filter-product",
            elementType: "select",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.pattern.patternType).toBe("analytics_exploration");
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.70);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("analytics_page_visited");
      expect(triggerTypes).toContain("sufficient_time_spent");
    });

    it("should boost confidence with filter application", () => {
      const context: BehavioralContext = {
        currentPage: "/analytics",
        currentModule: "analytics",
        pageData: {},
        navigationHistory: [
          {
            timestamp: new Date(Date.now() - 60000),
            fromPage: "/dashboard",
            toPage: "/analytics",
            module: "analytics",
            trigger: "click",
            timeSpent: 60000,
          },
        ],
        recentActions: [
          {
            timestamp: new Date(Date.now() - 45000),
            actionType: "click",
            elementId: "apply-filters",
            elementType: "button",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("filters_applied");
    });
  });

  describe("SearchBehaviorDetector", () => {
    const detector = new SearchBehaviorDetector();

    it("should detect multiple search attempts", () => {
      const context: BehavioralContext = {
        currentPage: "/customers",
        currentModule: "customers",
        pageData: {},
        navigationHistory: [],
        recentActions: [
          {
            timestamp: new Date(Date.now() - 60000),
            actionType: "search",
            elementId: "search-input",
            elementType: "input",
            value: "john",
          },
          {
            timestamp: new Date(Date.now() - 40000),
            actionType: "search",
            elementId: "search-input",
            elementType: "input",
            value: "john smith",
          },
          {
            timestamp: new Date(Date.now() - 20000),
            actionType: "search",
            elementId: "search-input",
            elementType: "input",
            value: "smith",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.pattern.patternType).toBe("search_behavior");
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.80);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("multiple_searches");
    });

    it("should not detect with successful search", () => {
      const context: BehavioralContext = {
        currentPage: "/customers",
        currentModule: "customers",
        pageData: {},
        navigationHistory: [
          {
            timestamp: new Date(Date.now() - 30000),
            fromPage: "/customers",
            toPage: "/customers/detail",
            module: "customers",
            trigger: "click",
            timeSpent: 30000,
          },
        ],
        recentActions: [
          {
            timestamp: new Date(Date.now() - 60000),
            actionType: "search",
            elementId: "search-input",
            elementType: "input",
            value: "john smith",
          },
          {
            timestamp: new Date(Date.now() - 35000),
            actionType: "click",
            elementId: "search-result-1",
            elementType: "button",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).toBeNull();
    });
  });

  describe("TaskCompletionDetector", () => {
    const detector = new TaskCompletionDetector();

    it("should detect task completion workflow", () => {
      const context: BehavioralContext = {
        currentPage: "/todo",
        currentModule: "todo",
        pageData: {},
        navigationHistory: [
          {
            timestamp: new Date(Date.now() - 120000),
            fromPage: "/dashboard",
            toPage: "/todo",
            module: "todo",
            trigger: "click",
            timeSpent: 120000,
          },
        ],
        recentActions: [
          {
            timestamp: new Date(Date.now() - 60000),
            actionType: "click",
            elementId: "task-checkbox",
            elementType: "input",
          },
          {
            timestamp: new Date(Date.now() - 30000),
            actionType: "click",
            elementId: "save-task",
            elementType: "button",
          },
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 120000),
      };

      const result = detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.pattern.patternType).toBe("task_completion");
      expect(result?.pattern.confidence).toBeGreaterThanOrEqual(0.85);
      const triggerTypes = result?.triggers.map(t => t.type) || [];
      expect(triggerTypes).toContain("todo_page_visited");
    });
  });

  describe("PatternDetectorRegistry", () => {
    beforeEach(() => {
      // Reset registry before each test
      PatternDetectorRegistry["detectors"] = [];
      PatternDetectorRegistry["initialized"] = false;
    });

    it("should register all default detectors", () => {
      const detectors = PatternDetectorRegistry.getAllDetectors();

      expect(detectors.length).toBeGreaterThanOrEqual(5);
      expect(detectors.find((d) => d.type === "proposal_creation")).toBeDefined();
      expect(detectors.find((d) => d.type === "form_struggle")).toBeDefined();
      expect(detectors.find((d) => d.type === "analytics_exploration")).toBeDefined();
      expect(detectors.find((d) => d.type === "search_behavior")).toBeDefined();
      expect(detectors.find((d) => d.type === "task_completion")).toBeDefined();
    });

    it("should get detectors by module", () => {
      const newBusinessDetectors = PatternDetectorRegistry.getDetectorsByModule("new-business");

      expect(newBusinessDetectors.length).toBeGreaterThan(0);
      expect(newBusinessDetectors.find((d) => d.type === "proposal_creation")).toBeDefined();
    });

    it("should get detectors by type", () => {
      const detector = PatternDetectorRegistry.getDetectorByType("form_struggle");

      expect(detector).toBeDefined();
      expect(detector?.name).toBe("Form Completion Struggle");
    });

    it("should detect patterns for behavioral context", () => {
      const context: BehavioralContext = {
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
        ],
        sessionId: "test-session",
        sessionStartTime: new Date(Date.now() - 300000),
        currentPageStartTime: new Date(Date.now() - 60000),
      };

      const results = PatternDetectorRegistry.detectPatterns(context);

      expect(results.length).toBeGreaterThan(0);
      expect(results.find((r) => r.pattern.patternType === "proposal_creation")).toBeDefined();
    });

    it("should allow custom detector registration", () => {
      const customDetector = {
        name: "Custom Pattern",
        type: "custom_pattern",
        minConfidence: 0.7,
        detect: () => null,
      };

      PatternDetectorRegistry.registerDetector(customDetector);

      const detector = PatternDetectorRegistry.getDetectorByType("custom_pattern");
      expect(detector).toBeDefined();
      expect(detector?.name).toBe("Custom Pattern");
    });
  });
});
