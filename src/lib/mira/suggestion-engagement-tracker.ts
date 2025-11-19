/**
 * Suggestion Engagement Tracker
 * Tracks user interactions with Mira's suggestions for learning and improvement
 */

import type { ActionSuggestion } from "./actions/types";
import type { BehavioralContext } from "./types";

/**
 * Engagement event types
 */
export type EngagementEventType =
  | "suggestion_shown"
  | "suggestion_accepted"
  | "suggestion_dismissed"
  | "suggestion_ignored"
  | "suggestion_helpful"
  | "suggestion_not_helpful";

/**
 * Engagement event
 */
export interface EngagementEvent {
  id: string;
  timestamp: Date;
  eventType: EngagementEventType;
  suggestion: ActionSuggestion;
  context: BehavioralContext;
  metadata?: {
    timeToInteraction?: number; // ms from shown to interaction
    dismissReason?: string;
    helpfulnessScore?: number;
    source?: "inline" | "toast" | "command_palette";
  };
}

/**
 * Engagement statistics
 */
export interface EngagementStats {
  totalShown: number;
  totalAccepted: number;
  totalDismissed: number;
  totalIgnored: number;
  acceptanceRate: number;
  dismissalRate: number;
  ignoreRate: number;
  avgTimeToInteraction: number;
  avgHelpfulnessScore: number;
  topAcceptedPatterns: Array<{ pattern: string; count: number }>;
  topDismissedPatterns: Array<{ pattern: string; count: number }>;
}

/**
 * Suggestion Engagement Tracker
 * Tracks how users interact with suggestions for learning and optimization
 */
export class SuggestionEngagementTracker {
  private static instance: SuggestionEngagementTracker;
  private events: EngagementEvent[] = [];
  private activeTimers: Map<string, number> = new Map(); // Tracks time for shown suggestions
  private config = {
    maxEvents: 1000, // Keep last 1000 events in memory
    ignoreThresholdMs: 30000, // Consider suggestion ignored after 30 seconds
    uploadBatchSize: 50,
    uploadIntervalMs: 60000, // Upload every minute
  };

  private uploadTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startUploadTimer();
  }

  static getInstance(): SuggestionEngagementTracker {
    if (!SuggestionEngagementTracker.instance) {
      SuggestionEngagementTracker.instance = new SuggestionEngagementTracker();
    }
    return SuggestionEngagementTracker.instance;
  }

  /**
   * Track suggestion shown to user
   */
  trackShown(
    suggestion: ActionSuggestion,
    context: BehavioralContext,
    source: "inline" | "toast" | "command_palette" = "inline"
  ): string {
    const eventId = this.generateEventId();

    const event: EngagementEvent = {
      id: eventId,
      timestamp: new Date(),
      eventType: "suggestion_shown",
      suggestion,
      context,
      metadata: {
        source,
      },
    };

    this.recordEvent(event);

    // Start timer to track ignore scenario
    const timer = window.setTimeout(() => {
      this.trackIgnored(eventId, suggestion, context);
    }, this.config.ignoreThresholdMs);

    this.activeTimers.set(eventId, timer);

    return eventId;
  }

  /**
   * Track suggestion accepted by user
   */
  trackAccepted(
    eventId: string,
    suggestion: ActionSuggestion,
    context: BehavioralContext,
    source?: "inline" | "toast" | "command_palette"
  ): void {
    this.clearTimer(eventId);

    const shownEvent = this.events.find(
      (e) => e.id === eventId && e.eventType === "suggestion_shown"
    );

    const timeToInteraction = shownEvent
      ? Date.now() - shownEvent.timestamp.getTime()
      : undefined;

    const event: EngagementEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: "suggestion_accepted",
      suggestion,
      context,
      metadata: {
        timeToInteraction,
        source,
      },
    };

    this.recordEvent(event);
  }

  /**
   * Track suggestion dismissed by user
   */
  trackDismissed(
    eventId: string,
    suggestion: ActionSuggestion,
    context: BehavioralContext,
    reason?: string,
    source?: "inline" | "toast" | "command_palette"
  ): void {
    this.clearTimer(eventId);

    const shownEvent = this.events.find(
      (e) => e.id === eventId && e.eventType === "suggestion_shown"
    );

    const timeToInteraction = shownEvent
      ? Date.now() - shownEvent.timestamp.getTime()
      : undefined;

    const event: EngagementEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: "suggestion_dismissed",
      suggestion,
      context,
      metadata: {
        timeToInteraction,
        dismissReason: reason,
        source,
      },
    };

    this.recordEvent(event);
  }

  /**
   * Track suggestion ignored (no interaction after threshold)
   */
  private trackIgnored(
    eventId: string,
    suggestion: ActionSuggestion,
    context: BehavioralContext
  ): void {
    // Check if user already interacted
    const hasInteraction = this.events.some(
      (e) =>
        e.id !== eventId &&
        (e.eventType === "suggestion_accepted" ||
          e.eventType === "suggestion_dismissed") &&
        e.suggestion.action.id === suggestion.action.id
    );

    if (hasInteraction) {
      return; // User already interacted, don't mark as ignored
    }

    const event: EngagementEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: "suggestion_ignored",
      suggestion,
      context,
      metadata: {
        timeToInteraction: this.config.ignoreThresholdMs,
      },
    };

    this.recordEvent(event);
  }

  /**
   * Track user feedback on suggestion helpfulness
   */
  trackHelpfulness(
    suggestion: ActionSuggestion,
    context: BehavioralContext,
    helpful: boolean,
    score?: number
  ): void {
    const event: EngagementEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: helpful ? "suggestion_helpful" : "suggestion_not_helpful",
      suggestion,
      context,
      metadata: {
        helpfulnessScore: score,
      },
    };

    this.recordEvent(event);
  }

  /**
   * Get engagement statistics
   */
  getStats(): EngagementStats {
    const shown = this.events.filter((e) => e.eventType === "suggestion_shown");
    const accepted = this.events.filter((e) => e.eventType === "suggestion_accepted");
    const dismissed = this.events.filter((e) => e.eventType === "suggestion_dismissed");
    const ignored = this.events.filter((e) => e.eventType === "suggestion_ignored");

    const total = shown.length || 1; // Avoid division by zero

    // Calculate average time to interaction
    const interactionEvents = [
      ...accepted,
      ...dismissed,
    ].filter((e) => e.metadata?.timeToInteraction);

    const avgTimeToInteraction =
      interactionEvents.length > 0
        ? interactionEvents.reduce(
            (sum, e) => sum + (e.metadata?.timeToInteraction || 0),
            0
          ) / interactionEvents.length
        : 0;

    // Calculate average helpfulness score
    const helpfulEvents = this.events.filter(
      (e) =>
        (e.eventType === "suggestion_helpful" ||
          e.eventType === "suggestion_not_helpful") &&
        e.metadata?.helpfulnessScore !== undefined
    );

    const avgHelpfulnessScore =
      helpfulEvents.length > 0
        ? helpfulEvents.reduce(
            (sum, e) => sum + (e.metadata?.helpfulnessScore || 0),
            0
          ) / helpfulEvents.length
        : 0;

    // Get top patterns
    const acceptedPatterns = this.aggregateByPattern(accepted);
    const dismissedPatterns = this.aggregateByPattern(dismissed);

    return {
      totalShown: shown.length,
      totalAccepted: accepted.length,
      totalDismissed: dismissed.length,
      totalIgnored: ignored.length,
      acceptanceRate: (accepted.length / total) * 100,
      dismissalRate: (dismissed.length / total) * 100,
      ignoreRate: (ignored.length / total) * 100,
      avgTimeToInteraction,
      avgHelpfulnessScore,
      topAcceptedPatterns: acceptedPatterns.slice(0, 5),
      topDismissedPatterns: dismissedPatterns.slice(0, 5),
    };
  }

  /**
   * Get events by suggestion type
   */
  getEventsBySuggestionType(actionId: string): EngagementEvent[] {
    return this.events.filter((e) => e.suggestion.action.id.startsWith(actionId));
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 20): EngagementEvent[] {
    return [...this.events].reverse().slice(0, limit);
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
  }

  /**
   * Record engagement event
   */
  private recordEvent(event: EngagementEvent): void {
    this.events.push(event);

    // Trim old events if exceeding max
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    console.debug(`[EngagementTracker] ${event.eventType}:`, event.suggestion.action.name);
  }

  /**
   * Clear timer for event
   */
  private clearTimer(eventId: string): void {
    const timer = this.activeTimers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(eventId);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Aggregate events by trigger pattern
   */
  private aggregateByPattern(
    events: EngagementEvent[]
  ): Array<{ pattern: string; count: number }> {
    const counts = new Map<string, number>();

    events.forEach((event) => {
      const pattern = event.suggestion.triggerPattern || "unknown";
      counts.set(pattern, (counts.get(pattern) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Start upload timer
   */
  private startUploadTimer(): void {
    this.uploadTimer = setInterval(() => {
      this.uploadEvents();
    }, this.config.uploadIntervalMs);
  }

  /**
   * Upload events to backend
   */
  private async uploadEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const eventsToUpload = this.events.slice(-this.config.uploadBatchSize);

      // TODO: Implement actual upload to backend
      console.debug(
        `[EngagementTracker] Would upload ${eventsToUpload.length} events`
      );

      // For now, just log stats
      const stats = this.getStats();
      console.debug("[EngagementTracker] Stats:", stats);
    } catch (error) {
      console.error("[EngagementTracker] Upload failed:", error);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
  }
}

// Export singleton instance
export const suggestionEngagementTracker = SuggestionEngagementTracker.getInstance();
