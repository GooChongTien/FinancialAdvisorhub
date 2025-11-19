import { describe, it, expect, beforeEach, vi } from "vitest";
import { categorizeError, executeSafely, withRetry } from "../../supabase/functions/_shared/services/tools/error-handling";

describe("Error Handling Utilities", () => {
  describe("categorizeError", () => {
    it("should categorize PostgreSQL connection errors as retryable", () => {
      const error = { code: "08000", message: "Connection failed" };
      const result = categorizeError(error);

      expect(result.code).toBe("database_connection_error");
      expect(result.retryable).toBe(true);
      expect(result.message).toContain("connection failed");
    });

    it("should categorize timeout errors as retryable", () => {
      const error = { code: "57014", message: "Query timeout" };
      const result = categorizeError(error);

      expect(result.code).toBe("database_timeout");
      expect(result.retryable).toBe(true);
    });

    it("should categorize not found errors as non-retryable", () => {
      const error = { code: "PGRST116", message: "Not found" };
      const result = categorizeError(error);

      expect(result.code).toBe("not_found");
      expect(result.retryable).toBe(false);
    });

    it("should categorize foreign key violations as non-retryable", () => {
      const error = { code: "23503", message: "Foreign key violation" };
      const result = categorizeError(error);

      expect(result.code).toBe("foreign_key_violation");
      expect(result.retryable).toBe(false);
    });

    it("should categorize unique constraint violations as non-retryable", () => {
      const error = { code: "23505", message: "Unique violation" };
      const result = categorizeError(error);

      expect(result.code).toBe("unique_violation");
      expect(result.retryable).toBe(false);
    });

    it("should categorize permission denied errors as non-retryable", () => {
      const error = { code: "42501", message: "Permission denied" };
      const result = categorizeError(error);

      expect(result.code).toBe("permission_denied");
      expect(result.retryable).toBe(false);
    });

    it("should categorize network errors as retryable", () => {
      const error = new TypeError("fetch failed");
      const result = categorizeError(error);

      expect(result.code).toBe("network_error");
      expect(result.retryable).toBe(true);
    });

    it("should handle generic Error objects", () => {
      const error = new Error("Something went wrong");
      const result = categorizeError(error);

      expect(result.code).toBe("unknown_error");
      expect(result.message).toBe("Something went wrong");
      expect(result.retryable).toBe(false);
    });

    it("should handle unknown error types", () => {
      const error = "string error";
      const result = categorizeError(error);

      expect(result.code).toBe("unknown_error");
      expect(result.retryable).toBe(false);
    });
  });

  describe("withRetry", () => {
    it("should succeed on first attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const result = await withRetry(operation);

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce({ code: "08000", message: "Connection failed" })
        .mockResolvedValue("success");

      const result = await withRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = vi.fn().mockRejectedValue({
        code: "23503",
        message: "Foreign key violation",
      });

      await expect(
        withRetry(operation, {
          maxAttempts: 3,
          initialDelayMs: 10,
        })
      ).rejects.toMatchObject({
        code: "23503",
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should respect maxAttempts limit", async () => {
      const operation = vi.fn().mockRejectedValue({
        code: "08000",
        message: "Connection failed",
      });

      await expect(
        withRetry(operation, {
          maxAttempts: 3,
          initialDelayMs: 10,
        })
      ).rejects.toMatchObject({
        code: "08000",
      });

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should apply exponential backoff", async () => {
      const startTime = Date.now();
      const operation = vi.fn().mockRejectedValue({
        code: "57014",
        message: "Timeout",
      });

      await expect(
        withRetry(operation, {
          maxAttempts: 3,
          initialDelayMs: 50,
          backoffMultiplier: 2,
        })
      ).rejects.toMatchObject({
        code: "57014",
      });

      const elapsedTime = Date.now() - startTime;
      // Should wait at least 50ms + 100ms = 150ms
      expect(elapsedTime).toBeGreaterThanOrEqual(150);
    });
  });

  describe("executeSafely", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return success result on successful operation", async () => {
      const operation = vi.fn().mockResolvedValue({ id: "123", name: "Test" });

      const result = await executeSafely(
        "test__tool",
        operation,
        { id: "123" }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "123", name: "Test" });
      expect(result.error).toBeUndefined();
    });

    it("should return error result on failed operation", async () => {
      const operation = vi.fn().mockRejectedValue(
        new Error("Database query failed")
      );

      const result = await executeSafely(
        "test__tool",
        operation,
        { id: "123" }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("unknown_error");
      expect(result.error?.message).toBe("Database query failed");
    });

    it("should retry retryable errors", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce({ code: "08000", message: "Connection failed" })
        .mockResolvedValue({ id: "123" });

      const result = await executeSafely(
        "test__tool",
        operation,
        { id: "123" },
        undefined,
        { maxAttempts: 3, initialDelayMs: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "123" });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should handle PostgreSQL errors with proper categorization", async () => {
      const operation = vi.fn().mockRejectedValue({
        code: "23505",
        message: "duplicate key value violates unique constraint",
      });

      const result = await executeSafely(
        "test__tool",
        operation,
        { email: "test@example.com" }
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("unique_violation");
      expect(result.error?.message).toContain("already exists");
    });
  });
});
