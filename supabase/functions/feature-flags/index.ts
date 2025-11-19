/**
 * Deno Edge Function: GET /functions/v1/feature-flags
 * Returns feature flag status for the requesting advisor
 */

import { createCorsHeaders } from "../_shared/utils/cors.ts";
import {
  getAllFlags,
  getFlagConfig,
  isFeatureEnabled,
  isMiraEnabled,
  isModeEnabled,
  isAgentEnabled,
} from "../_shared/services/feature-flags.ts";

interface FeatureFlagsRequest {
  advisorId?: string;
  flags?: string[]; // Optional: request specific flags only
}

interface FeatureFlagsResponse {
  enabled: Record<string, boolean>;
  config?: Record<string, unknown>; // Include detailed config if ?debug=true
}

function extractAdvisorId(req: Request): string | undefined {
  // Try to extract from query params
  const url = new URL(req.url);
  const advisorId = url.searchParams.get("advisorId");
  if (advisorId) return advisorId;

  // Try to extract from request body (POST)
  // This will be handled in the main function

  // Try to extract from auth header (future: integrate with Supabase Auth)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // TODO: Decode JWT and extract advisor ID
    // For now, just return undefined
  }

  return undefined;
}

async function handleRequest(req: Request): Promise<Response> {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = Object.fromEntries(createCorsHeaders(origin));

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow GET and POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  try {
    let advisorId: string | undefined = extractAdvisorId(req);
    let requestedFlags: string[] | undefined;

    // Handle POST request with body
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.advisorId) {
        advisorId = body.advisorId;
      }
      if (Array.isArray(body.flags)) {
        requestedFlags = body.flags;
      }
    }

    const url = new URL(req.url);
    const debugMode = url.searchParams.get("debug") === "true";

    // Get all flags or specific flags
    let enabledFlags: Record<string, boolean>;
    if (requestedFlags && requestedFlags.length > 0) {
      enabledFlags = {};
      for (const flagName of requestedFlags) {
        enabledFlags[flagName] = isFeatureEnabled(flagName as any, advisorId);
      }
    } else {
      enabledFlags = getAllFlags(advisorId);
    }

    const response: FeatureFlagsResponse = {
      enabled: enabledFlags,
    };

    // Include detailed config in debug mode
    if (debugMode) {
      response.config = {};
      for (const flagName of Object.keys(enabledFlags)) {
        const config = getFlagConfig(flagName as any);
        if (config) {
          response.config[flagName] = config;
        }
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60", // Cache for 1 minute
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[feature-flags] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: { message, code: "internal_error" } }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
}

if (import.meta.main) {
  Deno.serve(handleRequest);
}

export default handleRequest;
