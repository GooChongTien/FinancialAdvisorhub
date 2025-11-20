import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { toolRegistry } from "../_shared/services/tools/registry.ts";

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const url = new URL(req.url);
        const method = req.method;
        const toolName = url.searchParams.get("name");

        // List all tools
        if (method === "GET" && !toolName) {
            const tools = toolRegistry.getAllTools();
            const toolsWithMetadata = tools.map((tool) => ({
                name: tool.name,
                description: tool.schema?.description || "No description",
                category: "general",
                parameters: tool.schema ? Object.keys(tool.schema.shape || {}) : [],
                requiredParams: [],
                isActive: true,
            }));

            return new Response(JSON.stringify({ tools: toolsWithMetadata }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get specific tool details
        if (method === "GET" && toolName) {
            const tool = toolRegistry.getTool(toolName);
            if (!tool) {
                return new Response(JSON.stringify({ error: "Tool not found" }), {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ tool }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Execute tool (for testing)
        if (method === "POST") {
            const { tool: toolName, args } = await req.json();

            const result = await toolRegistry.executeTool(toolName, {
                args: args || {},
                supabase: supabaseClient,
            });

            return new Response(JSON.stringify({ result }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        return new Response(
            JSON.stringify({ error: message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
