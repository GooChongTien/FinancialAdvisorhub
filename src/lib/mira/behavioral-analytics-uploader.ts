import supabase from "@/admin/api/supabaseClient.js";
import { sanitizeNavigationEvent, sanitizeUserAction } from "./behavioral-sanitization";
import type { BehavioralPattern, NavigationEvent, UserAction } from "./types";

const UPLOAD_BATCH_SIZE = 50;
const UPLOAD_INTERVAL_MS = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

interface BehavioralEventPayload {
  advisor_id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  page_context?: Record<string, unknown>;
}

interface UploadQueueItem {
  event: BehavioralEventPayload;
  retryCount: number;
  timestamp: number;
}

/**
 * BehavioralAnalyticsUploader - Handles batch upload of behavioral data to Supabase
 * Implements retry logic, rate limiting, and error handling
 */
export class BehavioralAnalyticsUploader {
  private static instance: BehavioralAnalyticsUploader;
  private uploadQueue: UploadQueueItem[] = [];
  private uploadTimer: NodeJS.Timeout | null = null;
  private isUploading = false;
  private isEnabled = true;
  private advisorId: string | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): BehavioralAnalyticsUploader {
    if (!BehavioralAnalyticsUploader.instance) {
      BehavioralAnalyticsUploader.instance = new BehavioralAnalyticsUploader();
    }
    return BehavioralAnalyticsUploader.instance;
  }

  /**
   * Initialize the uploader
   */
  private async initialize() {
    // Get current user
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      this.advisorId = user?.id || null;
    } catch (error) {
      console.warn("[BehavioralAnalyticsUploader] Failed to get user:", error);
    }

    // Start upload timer
    this.startUploadTimer();

    // Clean up on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  /**
   * Start periodic upload timer
   */
  private startUploadTimer() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }

    this.uploadTimer = setInterval(() => {
      if (this.uploadQueue.length > 0) {
        this.flush();
      }
    }, UPLOAD_INTERVAL_MS);
  }

  /**
   * Set advisor ID
   */
  setAdvisorId(advisorId: string | null) {
    this.advisorId = advisorId;
  }

  /**
   * Enable or disable uploads
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.uploadQueue = [];
    }
  }

  /**
   * Queue a user action for upload
   */
  queueUserAction(action: UserAction, sessionId: string, pageContext?: Record<string, unknown>) {
    if (!this.isEnabled || !this.advisorId) {
      return;
    }

    const sanitized = sanitizeUserAction(action);
    const event: BehavioralEventPayload = {
      advisor_id: this.advisorId,
      session_id: sessionId,
      event_type: action.actionType,
      event_data: {
        timestamp: sanitized.timestamp.toISOString(),
        elementId: sanitized.elementId,
        elementType: sanitized.elementType,
        elementLabel: sanitized.elementLabel,
        value: sanitized.value,
        context: sanitized.context,
      },
      page_context: pageContext,
    };

    this.addToQueue(event);
  }

  /**
   * Queue a navigation event for upload
   */
  queueNavigationEvent(
    event: NavigationEvent,
    sessionId: string,
    pageContext?: Record<string, unknown>
  ) {
    if (!this.isEnabled || !this.advisorId) {
      return;
    }

    const sanitized = sanitizeNavigationEvent(event);
    const payload: BehavioralEventPayload = {
      advisor_id: this.advisorId,
      session_id: sessionId,
      event_type: "navigation",
      event_data: {
        timestamp: sanitized.timestamp.toISOString(),
        fromPage: sanitized.fromPage,
        toPage: sanitized.toPage,
        module: sanitized.module,
        trigger: sanitized.trigger,
        timeSpent: sanitized.timeSpent,
      },
      page_context: pageContext,
    };

    this.addToQueue(payload);
  }

  /**
   * Queue a pattern detection event
   */
  queuePatternDetection(
    pattern: BehavioralPattern,
    sessionId: string,
    pageContext?: Record<string, unknown>
  ) {
    if (!this.isEnabled || !this.advisorId) {
      return;
    }

    const event: BehavioralEventPayload = {
      advisor_id: this.advisorId,
      session_id: sessionId,
      event_type: "pattern_detected",
      event_data: {
        timestamp: new Date().toISOString(),
        patternType: pattern.patternType,
        confidence: pattern.confidence,
        indicators: pattern.indicators,
        suggestedAction: pattern.suggestedAction,
      },
      page_context: pageContext,
    };

    this.addToQueue(event);
  }

  /**
   * Add event to upload queue
   */
  private addToQueue(event: BehavioralEventPayload) {
    this.uploadQueue.push({
      event,
      retryCount: 0,
      timestamp: Date.now(),
    });

    // If queue is full, flush immediately
    if (this.uploadQueue.length >= UPLOAD_BATCH_SIZE) {
      this.flush();
    }
  }

  /**
   * Flush all pending events to backend
   */
  async flush(): Promise<void> {
    if (this.isUploading || this.uploadQueue.length === 0 || !this.isEnabled) {
      return;
    }

    this.isUploading = true;

    try {
      // Take a batch from the queue
      const batch = this.uploadQueue.splice(0, UPLOAD_BATCH_SIZE);
      await this.uploadBatch(batch);
    } catch (error) {
      console.error("[BehavioralAnalyticsUploader] Flush failed:", error);
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Upload a batch of events
   */
  private async uploadBatch(batch: UploadQueueItem[]): Promise<void> {
    if (batch.length === 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("mira_behavioral_events")
        .insert(batch.map((item) => ({
          user_id: item.event.advisor_id,
          session_id: item.event.session_id,
          event_type: item.event.event_type,
          module: item.event.page_context?.module || 'unknown',
          page: item.event.page_context?.page || 'unknown',
          payload: item.event.event_data
        })));

      if (error) {
        console.error("[BehavioralAnalyticsUploader] Upload failed:", error);

        // Retry logic for failed items
        const retriableItems = batch.filter((item) => item.retryCount < MAX_RETRY_ATTEMPTS);

        if (retriableItems.length > 0) {
          console.warn(
            `[BehavioralAnalyticsUploader] Retrying ${retriableItems.length} items`
          );

          // Increment retry count and re-queue
          setTimeout(() => {
            retriableItems.forEach((item) => {
              this.uploadQueue.push({
                ...item,
                retryCount: item.retryCount + 1,
              });
            });
          }, RETRY_DELAY_MS);
        }
      } else {
        console.debug(
          `[BehavioralAnalyticsUploader] Successfully uploaded ${batch.length} events`
        );
      }
    } catch (error) {
      console.error("[BehavioralAnalyticsUploader] Upload error:", error);

      // Re-queue items for retry
      const retriableItems = batch.filter((item) => item.retryCount < MAX_RETRY_ATTEMPTS);
      if (retriableItems.length > 0) {
        setTimeout(() => {
          retriableItems.forEach((item) => {
            this.uploadQueue.push({
              ...item,
              retryCount: item.retryCount + 1,
            });
          });
        }, RETRY_DELAY_MS);
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    isUploading: boolean;
    isEnabled: boolean;
    hasAdvisorId: boolean;
  } {
    return {
      queueSize: this.uploadQueue.length,
      isUploading: this.isUploading,
      isEnabled: this.isEnabled,
      hasAdvisorId: !!this.advisorId,
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.uploadQueue = [];
  }

  /**
   * Destroy the uploader
   */
  destroy() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }

    this.flush();
    this.uploadQueue = [];
    this.isEnabled = false;
  }
}

// Export singleton instance
export const behavioralAnalyticsUploader = BehavioralAnalyticsUploader.getInstance();
