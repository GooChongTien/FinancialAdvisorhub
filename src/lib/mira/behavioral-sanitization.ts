import type { UserAction, BehavioralContext, NavigationEvent } from "./types";

const SENSITIVE_FIELD_PATTERNS = [
  "password",
  "passwd",
  "pwd",
  "nric",
  "ssn",
  "social",
  "income",
  "salary",
  "medical",
  "health",
  "diagnosis",
  "prescription",
  "credit",
  "card",
  "cvv",
  "pin",
  "account",
  "routing",
];

const MAX_BEHAVIORAL_CONTEXT_BYTES = 5000;
const MAX_ACTIONS_TO_SEND = 20;
const MAX_NAVIGATION_TO_SEND = 10;

/**
 * Check if a field name indicates sensitive data
 */
export function isSensitiveField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * Sanitize a single user action
 */
export function sanitizeUserAction(action: UserAction): UserAction {
  const sanitized: UserAction = {
    ...action,
    timestamp: action.timestamp,
    actionType: action.actionType,
    context: {},
  };

  // Sanitize element info
  if (action.elementId && !isSensitiveField(action.elementId)) {
    sanitized.elementId = action.elementId;
  }

  if (action.elementType) {
    sanitized.elementType = action.elementType;
  }

  if (action.elementLabel && !isSensitiveField(action.elementLabel)) {
    // Limit label length
    sanitized.elementLabel = action.elementLabel.substring(0, 100);
  }

  // Sanitize value
  if (action.value !== undefined) {
    if (action.elementId && isSensitiveField(action.elementId)) {
      sanitized.value = "[REDACTED]";
    } else if (typeof action.value === "object" && action.value !== null) {
      // Keep metadata but remove actual values
      sanitized.value = sanitizeObject(action.value);
    } else if (typeof action.value === "string") {
      // Limit string length
      sanitized.value = action.value.substring(0, 256);
    } else {
      sanitized.value = action.value;
    }
  }

  // Sanitize context
  if (action.context) {
    sanitized.context = sanitizeObject(action.context);
  }

  return sanitized;
}

/**
 * Sanitize an object, removing sensitive data
 */
function sanitizeObject(obj: unknown): Record<string, unknown> {
  if (typeof obj !== "object" || obj === null) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  const entries = Object.entries(obj as Record<string, unknown>);

  for (const [key, value] of entries) {
    // Skip sensitive keys
    if (isSensitiveField(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Sanitize values
    if (typeof value === "string") {
      sanitized[key] = value.substring(0, 256);
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === "object") {
      // Don't recurse deeply, just mark as object
      sanitized[key] = "[OBJECT]";
    }
  }

  return sanitized;
}

/**
 * Sanitize navigation events
 */
export function sanitizeNavigationEvent(event: NavigationEvent): NavigationEvent {
  return {
    ...event,
    // Remove query parameters from paths that might contain sensitive data
    fromPage: sanitizePath(event.fromPage),
    toPage: sanitizePath(event.toPage),
    module: event.module,
    trigger: event.trigger,
    timeSpent: Math.min(event.timeSpent, 3600000), // Cap at 1 hour
  };
}

/**
 * Sanitize a URL path by removing query parameters
 */
function sanitizePath(path: string): string {
  try {
    const url = new URL(path, window.location.origin);
    // Remove query parameters but keep pathname
    return url.pathname;
  } catch {
    // If not a valid URL, just return the path up to the query string
    return path.split("?")[0];
  }
}

/**
 * Sanitize behavioral context for sending to backend
 */
export function sanitizeBehavioralContext(
  context: BehavioralContext
): Partial<BehavioralContext> {
  const sanitized: Partial<BehavioralContext> = {
    currentPage: sanitizePath(context.currentPage),
    currentModule: context.currentModule,
    sessionId: context.sessionId,
    sessionStartTime: context.sessionStartTime,
    currentPageStartTime: context.currentPageStartTime,
  };

  // Sanitize and limit actions
  if (context.recentActions && context.recentActions.length > 0) {
    sanitized.recentActions = context.recentActions
      .slice(-MAX_ACTIONS_TO_SEND)
      .map(sanitizeUserAction);
  }

  // Sanitize and limit navigation history
  if (context.navigationHistory && context.navigationHistory.length > 0) {
    sanitized.navigationHistory = context.navigationHistory
      .slice(-MAX_NAVIGATION_TO_SEND)
      .map(sanitizeNavigationEvent);
  }

  // Include patterns if detected
  if (context.detectedPatterns && context.detectedPatterns.length > 0) {
    sanitized.detectedPatterns = context.detectedPatterns;
  }

  if (context.confidenceLevel !== undefined) {
    sanitized.confidenceLevel = context.confidenceLevel;
  }

  // Sanitize page data
  if (context.pageData && Object.keys(context.pageData).length > 0) {
    sanitized.pageData = sanitizeObject(context.pageData);
  }

  // Check size and trim if needed
  const size = estimateSize(sanitized);
  if (size > MAX_BEHAVIORAL_CONTEXT_BYTES) {
    // Remove page data first
    delete sanitized.pageData;

    // If still too large, reduce actions
    const newSize = estimateSize(sanitized);
    if (newSize > MAX_BEHAVIORAL_CONTEXT_BYTES && sanitized.recentActions) {
      const ratio = MAX_BEHAVIORAL_CONTEXT_BYTES / newSize;
      const maxActions = Math.floor((sanitized.recentActions.length || 0) * ratio);
      sanitized.recentActions = sanitized.recentActions.slice(-maxActions);
    }
  }

  return sanitized;
}

/**
 * Estimate size of an object in bytes
 */
function estimateSize(obj: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return 0;
  }
}

/**
 * Prepare behavioral context for API submission
 */
export function prepareBehavioralContextForAPI(
  context: BehavioralContext
): {
  context: Partial<BehavioralContext>;
  metadata: {
    originalActionsCount: number;
    sentActionsCount: number;
    originalNavigationCount: number;
    sentNavigationCount: number;
    estimatedBytes: number;
  };
} {
  const sanitized = sanitizeBehavioralContext(context);
  const metadata = {
    originalActionsCount: context.recentActions?.length || 0,
    sentActionsCount: sanitized.recentActions?.length || 0,
    originalNavigationCount: context.navigationHistory?.length || 0,
    sentNavigationCount: sanitized.navigationHistory?.length || 0,
    estimatedBytes: estimateSize(sanitized),
  };

  return {
    context: sanitized,
    metadata,
  };
}

/**
 * Redact sensitive data from error messages
 */
export function sanitizeErrorMessage(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message;

  // Remove potential sensitive data patterns
  let sanitized = message;

  // Remove email addresses
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[EMAIL]");

  // Remove phone numbers
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]");

  // Remove potential IDs that look like UUIDs
  sanitized = sanitized.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    "[ID]"
  );

  // Remove potential tokens
  sanitized = sanitized.replace(/bearer\s+[\w.-]+/gi, "bearer [TOKEN]");

  return sanitized;
}
