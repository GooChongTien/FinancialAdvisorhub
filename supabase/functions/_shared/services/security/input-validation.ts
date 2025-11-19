/**
 * Input Validation and Security
 *
 * Provides validation, sanitization, and security checks for MIRA Co-Pilot inputs.
 * Protects against injection attacks, excessive payloads, and malicious content.
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Maximum lengths to prevent DoS attacks
const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONTEXT_SIZE = 5000;
const MAX_METADATA_SIZE = 1000;

// Dangerous patterns that could indicate injection attempts
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onload\s*=/gi,
  /<iframe[^>]*>/gi,
  /data:text\/html/gi,
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\bUNION\b.*\bSELECT\b)/gi,
  /(\bDROP\b.*\bTABLE\b)/gi,
  /(\bINSERT\b.*\bINTO\b)/gi,
  /(\bUPDATE\b.*\bSET\b)/gi,
  /(\bDELETE\b.*\bFROM\b)/gi,
  /(--|\bOR\b.*=.*\bOR\b)/gi,
];

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Validate and sanitize user message input
 */
export function validateUserMessage(message: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if message exists
  if (!message || typeof message !== 'string') {
    errors.push('Message must be a non-empty string');
    return { isValid: false, errors, warnings };
  }

  // Check length
  if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    return { isValid: false, errors, warnings };
  }

  // Check for dangerous patterns (XSS attempts)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(message)) {
      errors.push('Message contains potentially dangerous content');
      return { isValid: false, errors, warnings };
    }
  }

  // Check for SQL injection attempts (though we use parameterized queries, still good to detect)
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      warnings.push('Message contains SQL-like patterns');
      // Don't block, but log warning
    }
  }

  // Sanitize: trim whitespace, normalize line breaks
  const sanitized = message
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks

  // Check minimum length after sanitization
  if (sanitized.length === 0) {
    errors.push('Message cannot be empty after sanitization');
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Validate context object size and structure
 */
export function validateContext(context: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!context || typeof context !== 'object') {
    errors.push('Context must be a valid object');
    return { isValid: false, errors, warnings };
  }

  // Check serialized size
  const serialized = JSON.stringify(context);
  if (serialized.length > MAX_CONTEXT_SIZE) {
    errors.push(`Context exceeds maximum size of ${MAX_CONTEXT_SIZE} bytes`);
    return { isValid: false, errors, warnings };
  }

  // Validate structure using Zod
  const contextSchema = z.object({
    module: z.string().optional(),
    page: z.string().optional(),
    pageData: z.record(z.unknown()).optional(),
    advisorId: z.string().optional(),
  });

  const result = contextSchema.safeParse(context);
  if (!result.success) {
    errors.push('Context has invalid structure');
    errors.push(...result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Validate metadata object
 */
export function validateMetadata(metadata: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!metadata) {
    // Metadata is optional
    return { isValid: true, errors, warnings };
  }

  if (typeof metadata !== 'object') {
    errors.push('Metadata must be an object');
    return { isValid: false, errors, warnings };
  }

  // Check serialized size
  const serialized = JSON.stringify(metadata);
  if (serialized.length > MAX_METADATA_SIZE) {
    errors.push(`Metadata exceeds maximum size of ${MAX_METADATA_SIZE} bytes`);
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Validate advisor ID format
 */
export function validateAdvisorId(advisorId: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!advisorId) {
    errors.push('Advisor ID is required');
    return { isValid: false, errors, warnings };
  }

  if (typeof advisorId !== 'string') {
    errors.push('Advisor ID must be a string');
    return { isValid: false, errors, warnings };
  }

  // UUID format validation (Supabase auth uses UUIDs)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(advisorId)) {
    errors.push('Advisor ID must be a valid UUID');
    return { isValid: false, errors, warnings };
  }

  return {
    isValid: true,
    errors,
    warnings,
  };
}

/**
 * Comprehensive request validation
 */
export interface AgentChatRequest {
  message: string;
  context?: unknown;
  metadata?: unknown;
  advisorId?: string;
}

export interface ValidatedRequest {
  message: string;
  context?: unknown;
  metadata?: unknown;
  advisorId?: string;
}

export function validateAgentChatRequest(
  request: unknown
): { isValid: boolean; validated?: ValidatedRequest; errors: string[]; warnings: string[] } {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Check request is an object
  if (!request || typeof request !== 'object') {
    allErrors.push('Request must be a valid object');
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }

  const req = request as Record<string, unknown>;

  // Validate message
  const messageResult = validateUserMessage(req.message as string);
  allErrors.push(...messageResult.errors);
  allWarnings.push(...messageResult.warnings);

  if (!messageResult.isValid) {
    return { isValid: false, errors: allErrors, warnings: allWarnings };
  }

  // Validate context if provided
  if (req.context !== undefined) {
    const contextResult = validateContext(req.context);
    allErrors.push(...contextResult.errors);
    allWarnings.push(...contextResult.warnings);

    if (!contextResult.isValid) {
      return { isValid: false, errors: allErrors, warnings: allWarnings };
    }
  }

  // Validate metadata if provided
  if (req.metadata !== undefined) {
    const metadataResult = validateMetadata(req.metadata);
    allErrors.push(...metadataResult.errors);
    allWarnings.push(...metadataResult.warnings);

    if (!metadataResult.isValid) {
      return { isValid: false, errors: allErrors, warnings: allWarnings };
    }
  }

  // Validate advisor ID if provided (optional in some contexts)
  if (req.advisorId !== undefined) {
    const advisorIdResult = validateAdvisorId(req.advisorId);
    allErrors.push(...advisorIdResult.errors);
    allWarnings.push(...advisorIdResult.warnings);

    if (!advisorIdResult.isValid) {
      return { isValid: false, errors: allErrors, warnings: allWarnings };
    }
  }

  return {
    isValid: true,
    validated: {
      message: messageResult.sanitized!,
      context: req.context,
      metadata: req.metadata,
      advisorId: req.advisorId as string | undefined,
    },
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or a dedicated rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  record.count++;

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

export default {
  validateUserMessage,
  validateContext,
  validateMetadata,
  validateAdvisorId,
  validateAgentChatRequest,
  checkRateLimit,
};
