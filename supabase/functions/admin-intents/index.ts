import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

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

        // List all intents
        if (method === "GET") {
            const { data, error } = await supabaseClient
                .from("mira_intents")
                .select("*")
                .order("topic", { ascending: true });

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ intents: data || [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Create new intent
        if (method === "POST") {
            const body = await req.json();
            const {
                topic,
                subtopic,
                intent_name,
                display_name,
                description,
                example_phrases,
                required_fields,
                optional_fields,
                ui_actions,
            } = body;

            // Validate required fields
            if (!topic || !intent_name || !example_phrases || example_phrases.length === 0) {
                return new Response(
                    JSON.stringify({
                        error: "Missing required fields: topic, intent_name, and example_phrases",
                    }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            }

            const { data, error } = await supabaseClient
                .from("mira_intents")
                .insert({
                    topic,
                    subtopic: subtopic || null,
                    intent_name,
                    display_name: display_name || null,
                    description: description || null,
                    example_phrases,
                    required_fields: required_fields || [],
                    optional_fields: optional_fields || [],
                    ui_actions: ui_actions || [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ intent: data }), {
                status: 201,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Update existing intent
        if (method === "PUT") {
            const id = url.searchParams.get("id");

            if (!id) {
                return new Response(JSON.stringify({ error: "Intent ID required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const body = await req.json();
            const {
                topic,
                subtopic,
                intent_name,
                display_name,
                description,
                example_phrases,
                required_fields,
                optional_fields,
                ui_actions,
            } = body;

            const updates: any = {
                updated_at: new Date().toISOString(),
            };

            if (topic !== undefined) updates.topic = topic;
            if (subtopic !== undefined) updates.subtopic = subtopic;
            if (intent_name !== undefined) updates.intent_name = intent_name;
            if (display_name !== undefined) updates.display_name = display_name;
            if (description !== undefined) updates.description = description;
            if (example_phrases !== undefined) updates.example_phrases = example_phrases;
            if (required_fields !== undefined) updates.required_fields = required_fields;
            if (optional_fields !== undefined) updates.optional_fields = optional_fields;
            if (ui_actions !== undefined) updates.ui_actions = ui_actions;

            const { data, error } = await supabaseClient
                .from("mira_intents")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ intent: data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Delete intent
        if (method === "DELETE") {
            const id = url.searchParams.get("id");

            if (!id) {
                return new Response(JSON.stringify({ error: "Intent ID required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const { error } = await supabaseClient
                .from("mira_intents")
                .delete()
                .eq("id", id);

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ success: true }), {
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
