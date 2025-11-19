import type { ToolResult } from "./types.ts";
import { createServiceClient } from "./service-client.ts";

export interface ToolError {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
}

/**
 * Categorizes errors and determines if they're retryable
 */
export function categorizeError(error: unknown): ToolError {
  // PostgreSQL error
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as { code?: string; message?: string; details?: string };

    // Connection errors (retryable)
    if (pgError.code === "08000" || pgError.code === "08003" || pgError.code === "08006") {
      return {
        code: "database_connection_error",
        message: "Database connection failed. Please try again.",
        details: pgError,
        retryable: true,
      };
    }

    // Timeout errors (retryable)
    if (pgError.code === "57014") {
      return {
        code: "database_timeout",
        message: "Database query timed out. Please try again.",
        details: pgError,
        retryable: true,
      };
    }

    // Not found errors
    if (pgError.code === "PGRST116") {
      return {
        code: "not_found",
        message: "The requested resource was not found.",
        details: pgError,
        retryable: false,
      };
    }

    // Foreign key violations
    if (pgError.code === "23503") {
      return {
        code: "foreign_key_violation",
        message: "Referenced resource does not exist.",
        details: pgError,
        retryable: false,
      };
    }

    // Unique constraint violations
    if (pgError.code === "23505") {
      return {
        code: "unique_violation",
        message: "A record with this value already exists.",
        details: pgError,
        retryable: false,
      };
    }

    // Permission denied
    if (pgError.code === "42501") {
      return {
        code: "permission_denied",
        message: "Insufficient permissions to perform this operation.",
        details: pgError,
        retryable: false,
      };
    }

    return {
      code: "database_error",
      message: pgError.message || "Database operation failed.",
      details: pgError,
      retryable: false,
    };
  }

  // Network errors (retryable)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      code: "network_error",
      message: "Network request failed. Please check your connection and try again.",
      details: error,
      retryable: true,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      code: "unknown_error",
      message: error.message,
      details: error,
      retryable: false,
    };
  }

  return {
    code: "unknown_error",
    message: "An unknown error occurred.",
    details: error,
    retryable: false,
  };
}

/**
 * Logs tool errors to mira_events table for monitoring and debugging
 */
export async function logToolError(
  toolName: string,
  params: unknown,
  error: ToolError,
  advisorId?: string
): Promise<void> {
  try {
    const client = createServiceClient();
    await client.from("mira_events").insert({
      event_type: "mira.tool.error",
      advisor_id: advisorId,
      metadata: {
        tool_name: toolName,
        params,
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (loggingError) {
    // Don't throw if logging fails - just log to console
    console.error("Failed to log tool error:", loggingError);
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Delays execution for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async operation with exponential backoff retry for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let delayMs = finalConfig.initialDelayMs;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const categorized = categorizeError(error);

      // Don't retry if error is not retryable or this is the last attempt
      if (!categorized.retryable || attempt === finalConfig.maxAttempts) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await delay(Math.min(delayMs, finalConfig.maxDelayMs));
      delayMs *= finalConfig.backoffMultiplier;

      console.log(`Retrying operation (attempt ${attempt + 1}/${finalConfig.maxAttempts}) after ${delayMs}ms delay`);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Wraps a tool operation with error handling, logging, and retry logic
 */
export async function executeSafely<T>(
  toolName: string,
  operation: () => Promise<T>,
  params: unknown,
  advisorId?: string,
  retryConfig?: RetryConfig
): Promise<ToolResult<T>> {
  try {
    const result = await withRetry(operation, retryConfig);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const categorized = categorizeError(error);

    // Log the error for monitoring
    await logToolError(toolName, params, categorized, advisorId);

    return {
      success: false,
      error: {
        code: categorized.code,
        message: categorized.message,
        details: categorized.details,
      },
    };
  }
}
