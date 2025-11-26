/**
 * Proactive Engine - Makes Mira Smart
 *
 * Detects user behavior patterns and generates proactive suggestions
 * to help users before they ask for help.
 *
 * Key Patterns Detected:
 * 1. Customer Detail Idle - User viewing customer for >10s
 * 2. Navigation Loop - User bouncing between same pages
 * 3. Form Struggle - User editing same field multiple times
 * 4. Search Pattern - User searching repeatedly
 * 5. Idle State - No activity for 30s
 */

import { behavioralTracker } from './behavioral-tracker';
import type { BehavioralContext } from './types';

export interface ProactiveSuggestion {
  id: string;
  message: string;
  promptText: string;
  triggerReason: string;
  relevanceScore: number;
  icon?: string;
  category: 'navigation' | 'data_entry' | 'insight' | 'shortcut';
}

interface TriggerRule {
  check: (context: BehavioralContext) => boolean;
  generate: (context: BehavioralContext) => ProactiveSuggestion | null;
  cooldown: number; // milliseconds before showing again
}

export class ProactiveEngine {
  private lastSuggestionTime: number = 0;
  private dismissedSuggestions: Map<string, number> = new Map(); // suggestionId -> timestamp
  private acceptedSuggestions: Set<string> = new Set();
  private minTimeBetweenSuggestions = 120000; // 2 minutes
  private dismissCooldown = 300000; // 5 minutes before showing dismissed suggestion again

  private rules: TriggerRule[] = [
    {
      check: (ctx) => this.detectCustomerDetailIdle(ctx),
      generate: (ctx) => this.generateCustomerDetailSuggestion(ctx),
      cooldown: 180000, // 3 minutes
    },
    {
      check: (ctx) => this.detectNavigationLoop(ctx),
      generate: (ctx) => this.generateNavigationLoopSuggestion(ctx),
      cooldown: 240000, // 4 minutes
    },
    {
      check: (ctx) => this.detectFormStruggle(ctx),
      generate: (ctx) => this.generateFormStruggleSuggestion(ctx),
      cooldown: 180000, // 3 minutes
    },
    {
      check: (ctx) => this.detectSearchPattern(ctx),
      generate: (ctx) => this.generateSearchSuggestion(ctx),
      cooldown: 300000, // 5 minutes
    },
    {
      check: (ctx) => this.detectIdleState(ctx),
      generate: (ctx) => this.generateIdleSuggestion(ctx),
      cooldown: 600000, // 10 minutes
    },
  ];

  /**
   * Main entry point - checks if we should show a suggestion
   */
  shouldShowSuggestion(): boolean {
    // Don't show if recently shown a suggestion
    if (Date.now() - this.lastSuggestionTime < this.minTimeBetweenSuggestions) {
      return false;
    }

    // Don't interrupt if user is actively typing
    if (this.isUserTyping()) {
      return false;
    }

    return true;
  }

  /**
   * Detect patterns and generate suggestion
   */
  detectPatterns(): ProactiveSuggestion | null {
    if (!this.shouldShowSuggestion()) {
      return null;
    }

    const context = behavioralTracker.getBehavioralContext();
    if (!context) {
      return null;
    }

    // Try each rule in priority order
    for (const rule of this.rules) {
      if (rule.check(context)) {
        const suggestion = rule.generate(context);

        if (suggestion) {
          // Check if this suggestion was recently dismissed
          const dismissedAt = this.dismissedSuggestions.get(suggestion.id);
          if (dismissedAt && Date.now() - dismissedAt < this.dismissCooldown) {
            continue; // Skip dismissed suggestions
          }

          this.lastSuggestionTime = Date.now();
          return suggestion;
        }
      }
    }

    return null;
  }

  /**
   * Mark suggestion as dismissed
   */
  dismissSuggestion(suggestionId: string): void {
    this.dismissedSuggestions.set(suggestionId, Date.now());

    // Cleanup old dismissals (older than 24 hours)
    const dayAgo = Date.now() - 86400000;
    for (const [id, timestamp] of this.dismissedSuggestions.entries()) {
      if (timestamp < dayAgo) {
        this.dismissedSuggestions.delete(id);
      }
    }
  }

  /**
   * Mark suggestion as accepted (user clicked it)
   */
  acceptSuggestion(suggestionId: string): void {
    this.acceptedSuggestions.add(suggestionId);
    // Remove from dismissed list if present
    this.dismissedSuggestions.delete(suggestionId);
  }

  /**
   * Get engagement metrics for analytics
   */
  getEngagementMetrics() {
    return {
      totalDismissed: this.dismissedSuggestions.size,
      totalAccepted: this.acceptedSuggestions.size,
      acceptanceRate: this.acceptedSuggestions.size /
        (this.acceptedSuggestions.size + this.dismissedSuggestions.size) || 0,
    };
  }

  // ============================================================================
  // Pattern Detection Methods
  // ============================================================================

  /**
   * Pattern 1: User on customer detail page for >10 seconds without interaction
   */
  private detectCustomerDetailIdle(context: BehavioralContext): boolean {
    const currentPage = context.currentPage || '';
    const timeOnPage = context.timeOnPage || 0;
    const recentActions = context.recentActions || [];

    // Check if on customer detail page
    const isCustomerDetail = currentPage.includes('/customers/detail') ||
                             currentPage.includes('/customer/');

    if (!isCustomerDetail) {
      return false;
    }

    // Check time on page (>10 seconds)
    if (timeOnPage < 10000) {
      return false;
    }

    // Check if user has been idle (few recent actions)
    const actionsInLast10Sec = recentActions.filter(
      (a: any) => Date.now() - a.timestamp < 10000
    );

    return actionsInLast10Sec.length < 3;
  }

  private generateCustomerDetailSuggestion(context: BehavioralContext): ProactiveSuggestion {
    const pageData = context.pageData || {};
    const customerName = pageData.customerName || 'this customer';

    return {
      id: 'customer-detail-idle',
      message: `Looking at ${customerName}? I can help with:`,
      promptText: `Show me ${customerName}'s policy portfolio and upcoming renewals`,
      triggerReason: 'Customer detail page idle',
      relevanceScore: 0.85,
      icon: '👤',
      category: 'insight',
    };
  }

  /**
   * Pattern 2: User navigating back and forth between same 2-3 pages
   */
  private detectNavigationLoop(context: BehavioralContext): boolean {
    const history = context.navigationHistory || [];

    if (history.length < 4) {
      return false;
    }

    // Get last 4 navigations
    const recent = history.slice(-4);
    const uniquePages = new Set(recent.map((h: any) => h.toPage));

    // If only 2 unique pages in last 4 navigations, it's a loop
    return uniquePages.size <= 2;
  }

  private generateNavigationLoopSuggestion(context: BehavioralContext): ProactiveSuggestion {
    return {
      id: 'navigation-loop',
      message: "Seems like you're searching for something. Ask me instead!",
      promptText: "Help me find...",
      triggerReason: 'Navigation loop detected',
      relevanceScore: 0.75,
      icon: '🔍',
      category: 'shortcut',
    };
  }

  /**
   * Pattern 3: User struggling with form (many edits, same fields)
   */
  private detectFormStruggle(context: BehavioralContext): boolean {
    const recentActions = context.recentActions || [];

    // Get form interactions in last 2 minutes
    const formActions = recentActions.filter(
      (a: any) => a.actionType === 'form_input' &&
                  Date.now() - a.timestamp < 120000
    );

    if (formActions.length < 10) {
      return false;
    }

    // Check if user is editing same fields repeatedly
    const fieldCounts = new Map<string, number>();
    formActions.forEach((action: any) => {
      const field = action.elementId || 'unknown';
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    });

    // If any field edited 3+ times, it's a struggle
    for (const count of fieldCounts.values()) {
      if (count >= 3) {
        return true;
      }
    }

    return false;
  }

  private generateFormStruggleSuggestion(context: BehavioralContext): ProactiveSuggestion {
    const currentPage = context.currentPage || '';

    let helpText = "Pre-fill this form with customer data";
    if (currentPage.includes('new-business')) {
      helpText = "Help me complete this proposal form";
    } else if (currentPage.includes('customer')) {
      helpText = "Fill customer details automatically";
    }

    return {
      id: 'form-struggle',
      message: "Need help filling this form? I can assist.",
      promptText: helpText,
      triggerReason: 'Form completion struggle',
      relevanceScore: 0.80,
      icon: '📝',
      category: 'data_entry',
    };
  }

  /**
   * Pattern 4: User searching repeatedly
   */
  private detectSearchPattern(context: BehavioralContext): boolean {
    const recentActions = context.recentActions || [];

    // Get search actions in last 2 minutes
    const searchActions = recentActions.filter(
      (a: any) => a.actionType === 'search' &&
                  Date.now() - a.timestamp < 120000
    );

    // If 3+ searches in 2 minutes, suggest asking Mira
    return searchActions.length >= 3;
  }

  private generateSearchSuggestion(context: BehavioralContext): ProactiveSuggestion {
    return {
      id: 'search-pattern',
      message: "Can't find what you're looking for? Ask me!",
      promptText: "Help me find a customer or policy",
      triggerReason: 'Repeated search pattern',
      relevanceScore: 0.78,
      icon: '🔎',
      category: 'shortcut',
    };
  }

  /**
   * Pattern 5: User idle for 30+ seconds on a page
   */
  private detectIdleState(context: BehavioralContext): boolean {
    const recentActions = context.recentActions || [];

    if (recentActions.length === 0) {
      return false;
    }

    const lastAction = recentActions[0];
    const timeSinceLastAction = Date.now() - lastAction.timestamp;

    // Idle for 30+ seconds
    return timeSinceLastAction > 30000;
  }

  private generateIdleSuggestion(context: BehavioralContext): ProactiveSuggestion {
    const module = context.module || 'home';

    const contextualPrompts: Record<string, string> = {
      customers: "Show me my hot leads that need follow-up",
      analytics: "What are my top performing products this month?",
      'smart-plan': "What's urgent on my Smart Plan today?",
      products: "Which products are best for millennials?",
      home: "Show me an overview of my day",
    };

    const promptText = contextualPrompts[module] || "What can you help me with?";

    return {
      id: 'idle-state',
      message: "Taking a break? Here's something you might want to know:",
      promptText,
      triggerReason: 'User idle state',
      relevanceScore: 0.60,
      icon: '💡',
      category: 'insight',
    };
  }

  /**
   * Check if user is currently typing
   */
  private isUserTyping(): boolean {
    const context = behavioralTracker.getBehavioralContext();
    if (!context) {
      return false;
    }

    const lastAction = context.recentActions?.[0];
    if (!lastAction) {
      return false;
    }

    // User typed within last 2 seconds
    return (
      lastAction.actionType === 'form_input' &&
      Date.now() - lastAction.timestamp < 2000
    );
  }
}

// Singleton instance
export const proactiveEngine = new ProactiveEngine();
