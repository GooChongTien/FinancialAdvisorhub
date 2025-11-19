/**
 * Mira Action Suggestion Engine
 * Generates context-aware action suggestions based on behavioral patterns
 */

import type { BehavioralContext } from "../types";
import type { ActionSuggestion, MiraAction, ActionContext } from "./types";
import {
  getActionTemplate,
  createActionFromTemplate,
  ALL_ACTION_TEMPLATES,
} from "./action-templates";
import { patternMatchingEngine } from "../pattern-matching-engine";

/**
 * Action Suggestion Engine
 * Analyzes current context and suggests relevant actions
 */
export class ActionSuggestionEngine {
  private static instance: ActionSuggestionEngine;

  private constructor() {}

  static getInstance(): ActionSuggestionEngine {
    if (!ActionSuggestionEngine.instance) {
      ActionSuggestionEngine.instance = new ActionSuggestionEngine();
    }
    return ActionSuggestionEngine.instance;
  }

  /**
   * Get action suggestions based on behavioral context
   */
  async getSuggestions(
    behavioralContext: BehavioralContext,
    limit: number = 3
  ): Promise<ActionSuggestion[]> {
    const suggestions: ActionSuggestion[] = [];

    // 1. Get pattern-based suggestions
    const patternSuggestions = await this.getPatternBasedSuggestions(behavioralContext);
    suggestions.push(...patternSuggestions);

    // 2. Get context-based suggestions (page, module)
    const contextSuggestions = this.getContextBasedSuggestions(behavioralContext);
    suggestions.push(...contextSuggestions);

    // 3. Get workflow-based suggestions
    const workflowSuggestions = this.getWorkflowSuggestions(behavioralContext);
    suggestions.push(...workflowSuggestions);

    // 4. Sort by relevance and confidence
    const sortedSuggestions = suggestions.sort(
      (a, b) => b.relevanceScore * b.confidence - a.relevanceScore * a.confidence
    );

    // 5. Return top N suggestions
    return sortedSuggestions.slice(0, limit);
  }

  /**
   * Get suggestions based on detected patterns
   */
  private async getPatternBasedSuggestions(
    context: BehavioralContext
  ): Promise<ActionSuggestion[]> {
    const suggestions: ActionSuggestion[] = [];

    try {
      // Get pattern matches from the pattern matching engine
      const patternMatches = await patternMatchingEngine.matchPatterns(context);

      for (const match of patternMatches) {
        const patternActions = this.mapPatternToActions(match.pattern.patternType, context);

        for (const action of patternActions) {
          suggestions.push({
            action,
            confidence: match.adjustedConfidence,
            reason: `Detected pattern: ${match.pattern.patternName}`,
            trigger: this.determineTrigger(match.pattern.patternType),
            relevanceScore: match.adjustedConfidence * 0.9, // Slightly reduce for pattern-based
            triggerPattern: match.pattern.patternType,
          });
        }
      }
    } catch (error) {
      console.error("[ActionSuggestions] Pattern-based suggestions failed:", error);
    }

    return suggestions;
  }

  /**
   * Map detected patterns to suggested actions
   */
  private mapPatternToActions(patternType: string, context: BehavioralContext): MiraAction[] {
    const actions: MiraAction[] = [];

    switch (patternType) {
      case "proposal_creation":
        // User is in proposal flow, suggest completing the proposal
        actions.push(
          createActionFromTemplate("navigate_to_proposal_form")!,
          createActionFromTemplate("create_proposal")!
        );
        break;

      case "form_struggle":
      case "form_abandonment":
        // User struggling with form, offer help or save draft
        actions.push(
          createActionFromTemplate("create_task", {
            name: "Save Progress",
            description: "Save your current progress and return later",
          })!
        );
        break;

      case "search_behavior":
      case "search_frustration":
        // User having trouble finding something
        if (context.currentModule === "customers") {
          actions.push(
            createActionFromTemplate("create_lead", {
              name: "Create New Lead",
              description: "Can't find the customer? Create a new lead instead",
            })!
          );
        }
        break;

      case "analytics_exploration":
      case "analytics_insight_discovery":
        // User exploring analytics, suggest exporting data
        actions.push(
          createActionFromTemplate("export_analytics_report")!,
          createActionFromTemplate("apply_analytics_filter", {
            name: "Apply Common Filter",
            description: "Filter to this month's data",
          })!
        );
        break;

      case "task_completion":
        // User working on tasks
        actions.push(createActionFromTemplate("create_task")!);
        break;

      case "navigation_confusion":
        // User seems lost, offer navigation help
        const targetPage = this.suggestNavigationTarget(context);
        if (targetPage) {
          actions.push(
            createActionFromTemplate("navigate_to_page", {
              name: `Go to ${targetPage.label}`,
              description: "Navigate to a common destination",
            })!
          );
        }
        break;

      default:
        break;
    }

    return actions.filter((a) => a !== null);
  }

  /**
   * Get suggestions based on current page/module context
   */
  private getContextBasedSuggestions(context: BehavioralContext): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];

    const module = context.currentModule;
    const page = context.currentPage;

    // Customer module suggestions
    if (module === "customers") {
      if (page.includes("/customers") && !page.includes("/detail")) {
        // On customer list page
        suggestions.push({
          action: createActionFromTemplate("create_lead")!,
          confidence: 0.7,
          reason: "Common action on customer list page",
          trigger: "immediate",
          relevanceScore: 0.75,
        });
      } else if (page.includes("/detail") && context.pageData?.customerId) {
        // On customer detail page
        suggestions.push({
          action: createActionFromTemplate("create_proposal", {
            name: "Create Proposal for this Customer",
          })!,
          confidence: 0.8,
          reason: "Natural next step after viewing customer",
          trigger: "after_delay",
          delay: 5000,
          relevanceScore: 0.85,
          suggestedParameters: {
            customerId: context.pageData.customerId,
          },
        });

        suggestions.push({
          action: createActionFromTemplate("create_task", {
            name: "Create Follow-up Task",
          })!,
          confidence: 0.7,
          reason: "Common action after customer review",
          trigger: "after_delay",
          delay: 10000,
          relevanceScore: 0.7,
          suggestedParameters: {
            relatedCustomerId: context.pageData.customerId,
          },
        });
      }
    }

    // Analytics module suggestions
    if (module === "analytics") {
      suggestions.push({
        action: createActionFromTemplate("export_analytics_report")!,
        confidence: 0.75,
        reason: "Users often export analytics data",
        trigger: "on_idle",
        relevanceScore: 0.7,
      });

      if (!context.pageData?.filtersApplied) {
        suggestions.push({
          action: createActionFromTemplate("apply_analytics_filter")!,
          confidence: 0.6,
          reason: "No filters applied yet",
          trigger: "immediate",
          relevanceScore: 0.65,
        });
      }
    }

    // New business / proposal module
    if (module === "new-business") {
      suggestions.push({
        action: createActionFromTemplate("submit_proposal")!,
        confidence: 0.7,
        reason: "Complete the proposal workflow",
        trigger: "after_delay",
        delay: 30000, // After 30 seconds on page
        relevanceScore: 0.75,
      });
    }

    // Todo module
    if (module === "todo") {
      suggestions.push({
        action: createActionFromTemplate("create_task")!,
        confidence: 0.75,
        reason: "Common action on todo page",
        trigger: "immediate",
        relevanceScore: 0.8,
      });
    }

    // Broadcast module
    if (module === "broadcast") {
      suggestions.push({
        action: createActionFromTemplate("create_broadcast")!,
        confidence: 0.8,
        reason: "Primary action for broadcast page",
        trigger: "immediate",
        relevanceScore: 0.85,
      });
    }

    return suggestions;
  }

  /**
   * Get workflow-based suggestions
   */
  private getWorkflowSuggestions(context: BehavioralContext): ActionSuggestion[] {
    const suggestions: ActionSuggestion[] = [];

    // Detect common workflows from navigation history
    const navHistory = context.navigationHistory || [];

    // Workflow: Customer → New Business (Proposal creation flow)
    const hasCustomerView = navHistory.some((n) => n.toPage.includes("/customers"));
    const onNewBusiness = context.currentPage.includes("/new-business");

    if (hasCustomerView && onNewBusiness) {
      suggestions.push({
        action: createActionFromTemplate("create_proposal")!,
        confidence: 0.85,
        reason: "Following customer-to-proposal workflow",
        trigger: "immediate",
        relevanceScore: 0.9,
      });
    }

    // Workflow: Analytics → Export (Analysis complete, export data)
    const onAnalytics = context.currentModule === "analytics";
    const analyticsTimeSpent =
      context.currentPageStartTime &&
      Date.now() - context.currentPageStartTime.getTime() > 60000; // >1 min

    if (onAnalytics && analyticsTimeSpent) {
      suggestions.push({
        action: createActionFromTemplate("export_analytics_report")!,
        confidence: 0.75,
        reason: "Spent time analyzing, likely ready to export",
        trigger: "on_idle",
        relevanceScore: 0.8,
      });
    }

    return suggestions;
  }

  /**
   * Determine trigger timing for pattern-based suggestions
   */
  private determineTrigger(
    patternType: string
  ): "immediate" | "after_delay" | "on_idle" | "on_pattern" {
    // Struggle patterns should trigger immediately
    if (
      patternType.includes("struggle") ||
      patternType.includes("frustration") ||
      patternType.includes("confusion") ||
      patternType.includes("abandonment")
    ) {
      return "immediate";
    }

    // Success patterns can wait for idle
    if (patternType.includes("success") || patternType.includes("completion")) {
      return "on_idle";
    }

    // Exploration patterns can wait
    if (patternType.includes("exploration") || patternType.includes("discovery")) {
      return "after_delay";
    }

    return "on_pattern";
  }

  /**
   * Suggest navigation target for confused users
   */
  private suggestNavigationTarget(
    context: BehavioralContext
  ): { page: string; label: string } | null {
    // Suggest going to dashboard if lost
    if (context.currentPage !== "/dashboard") {
      return { page: "/dashboard", label: "Dashboard" };
    }

    // Suggest customers page if on dashboard
    return { page: "/customers", label: "Customers" };
  }

  /**
   * Get quick actions (always available)
   */
  getQuickActions(currentModule: string): ActionSuggestion[] {
    const quickActions: ActionSuggestion[] = [];

    // Universal quick actions
    quickActions.push({
      action: createActionFromTemplate("create_task")!,
      confidence: 1.0,
      reason: "Quick access to task creation",
      trigger: "immediate",
      relevanceScore: 0.6,
    });

    // Module-specific quick actions
    switch (currentModule) {
      case "customers":
        quickActions.push({
          action: createActionFromTemplate("create_lead")!,
          confidence: 1.0,
          reason: "Quick customer creation",
          trigger: "immediate",
          relevanceScore: 0.9,
        });
        break;

      case "analytics":
        quickActions.push({
          action: createActionFromTemplate("export_analytics_report")!,
          confidence: 1.0,
          reason: "Quick export",
          trigger: "immediate",
          relevanceScore: 0.8,
        });
        break;

      default:
        break;
    }

    return quickActions;
  }
}

// Export singleton instance
export const actionSuggestionEngine = ActionSuggestionEngine.getInstance();
