/**
 * Comprehensive Error Handler
 * Standardized error responses and logging
 */

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  LLM_ERROR = "LLM_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",

  // Business logic errors
  INSUFFICIENT_CONFIDENCE = "INSUFFICIENT_CONFIDENCE",
  AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
  TOOL_NOT_FOUND = "TOOL_NOT_FOUND",
  EXECUTION_ERROR = "EXECUTION_ERROR",
}

export interface ErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

export class MiraError extends Error {
  constructor(
    public code: ErrorCode | string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown,
  ) {
    super(message);
    this.name = "MiraError";
  }

  toJSON(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  toResponse(requestId?: string): Response {
    const body = this.toJSON();
    if (requestId) {
      body.error.requestId = requestId;
    }

    return new Response(JSON.stringify(body), {
      status: this.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Error handler with logging and monitoring
 */
export class ErrorHandler {
  /**
   * Handle error and return appropriate response
   */
  static handleError(error: unknown, requestId?: string): Response {
    // Log error
    console.error("[ErrorHandler]", error);

    // If already a MiraError, return directly
    if (error instanceof MiraError) {
      return error.toResponse(requestId);
    }

    // Handle Zod validation errors
    if (error && typeof error === "object" && "issues" in error) {
      return new MiraError(
        ErrorCode.VALIDATION_ERROR,
        "Validation failed",
        400,
        (error as { issues: unknown[] }).issues,
      ).toResponse(requestId);
    }

    // Handle standard errors
    if (error instanceof Error) {
      // Detect specific error types
      if (error.message.includes("timeout")) {
        return new MiraError(ErrorCode.TIMEOUT, "Request timeout", 504).toResponse(requestId);
      }

      if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
        return new MiraError(ErrorCode.UNAUTHORIZED, "Authentication required", 401).toResponse(requestId);
      }

      if (error.message.includes("database") || error.message.includes("query")) {
        return new MiraError(ErrorCode.DATABASE_ERROR, "Database operation failed", 500, {
          originalError: error.message,
        }).toResponse(requestId);
      }

      // Generic error
      return new MiraError(ErrorCode.INTERNAL_ERROR, error.message, 500).toResponse(requestId);
    }

    // Unknown error type
    return new MiraError(ErrorCode.INTERNAL_ERROR, "An unexpected error occurred", 500, {
      error: String(error),
    }).toResponse(requestId);
  }

  /**
   * Wrap async handler with error handling
   */
  static wrapHandler(handler: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
    return async (req: Request): Promise<Response> => {
      const requestId = crypto.randomUUID();

      try {
        return await handler(req);
      } catch (error) {
        return ErrorHandler.handleError(error, requestId);
      }
    };
  }

  /**
   * Create error response with retry information
   */
  static createRetryableError(
    code: ErrorCode | string,
    message: string,
    retryAfter: number = 60,
  ): Response {
    const error = new MiraError(code, message, 503);
    const response = error.toResponse();

    // Add Retry-After header
    const headers = new Headers(response.headers);
    headers.set("Retry-After", retryAfter.toString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
}

/**
 * Circuit breaker for external services
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
  ) {}

  /**
   * Execute function with circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = "half-open";
        console.log("[CircuitBreaker] Attempting recovery (half-open)");
      } else {
        throw new MiraError(
          ErrorCode.SERVICE_UNAVAILABLE,
          "Service temporarily unavailable",
          503,
        );
      }
    }

    try {
      const result = await fn();

      // Success - reset if in half-open state
      if (this.state === "half-open") {
        this.reset();
        console.log("[CircuitBreaker] Service recovered (closed)");
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = "open";
      console.error(
        `[CircuitBreaker] Circuit opened after ${this.failures} failures`,
      );
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = "closed";
  }

  getState(): { state: string; failures: number } {
    return {
      state: this.state,
      failures: this.failures,
    };
  }
}
