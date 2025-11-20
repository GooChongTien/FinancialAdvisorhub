
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/utils/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);

        // GET /workflows - List all workflows
        if (req.method === "GET") {
            const { data: workflows, error } = await supabase
                .from("mira_workflows")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(workflows), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // POST /workflows - Create a new workflow
        if (req.method === "POST") {
            const body = await req.json();
            const { agent_id, name, description, trigger_intent, is_active } = body;

            if (!agent_id || !name) {
                return new Response(JSON.stringify({ error: "agent_id and name are required" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }

            const { data, error } = await supabase
                .from("mira_workflows")
                .insert({
                    agent_id,
                    name,
                    description,
                    trigger_intent,
                    is_active: is_active ?? true,
                })
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 201,
            });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 405,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
