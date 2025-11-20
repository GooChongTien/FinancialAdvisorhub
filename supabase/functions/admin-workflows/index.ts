import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { GraphExecutor } from "../_shared/services/engine/graph-executor.ts";

console.log("Hello from admin-workflows!");

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get request URL to parse path parameters if needed
        const url = new URL(req.url);
        // Path pattern: /admin-workflows or /admin-workflows/:id
        const pathParts = url.pathname.split("/").filter(Boolean);
        const id = pathParts.length > 1 ? pathParts[1] : null;

        // GET /admin-workflows - List all workflows
        if (req.method === "GET" && !id) {
            const { data, error } = await supabase
                .from("mira_workflows")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // GET /admin-workflows/:id - Get single workflow with nodes and edges
        if (req.method === "GET" && id) {
            // Fetch workflow
            const { data: workflow, error: wfError } = await supabase
                .from("mira_workflows")
                .select("*")
                .eq("id", id)
                .single();

            if (wfError) throw wfError;

            // Fetch nodes
            const { data: nodes, error: nodesError } = await supabase
                .from("mira_workflow_nodes")
                .select("*")
                .eq("workflow_id", id);

            if (nodesError) throw nodesError;

            // Fetch edges
            const { data: edges, error: edgesError } = await supabase
                .from("mira_workflow_edges")
                .select("*")
                .eq("workflow_id", id);

            if (edgesError) throw edgesError;

            return new Response(JSON.stringify({ ...workflow, nodes, edges }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // POST /admin-workflows - Create new workflow
        if (req.method === "POST" && !id) {
            const body = await req.json();
            const { name, description, trigger_intent, status, version } = body;

            const { data, error } = await supabase
                .from("mira_workflows")
                .insert([
                    {
                        name,
                        description,
                        trigger_intent,
                        status: status || "draft",
                        version: version || "1.0.0",
                        is_active: true,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // PUT /admin-workflows/:id - Update workflow metadata
        if (req.method === "PUT" && id) {
            const body = await req.json();
            const { name, description, trigger_intent, status, is_active } = body;

            const updates: any = { updated_at: new Date().toISOString() };
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (trigger_intent !== undefined) updates.trigger_intent = trigger_intent;
            if (status !== undefined) updates.status = status;
            if (is_active !== undefined) updates.is_active = is_active;

            const { data, error } = await supabase
                .from("mira_workflows")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // PATCH /admin-workflows/:id - Save workflow nodes and edges
        if (req.method === "PATCH" && id) {
            const body = await req.json();
            const { nodes, edges } = body;

            // Start a transaction-like operation
            // 1. Delete existing nodes and edges
            await supabase.from("mira_workflow_nodes").delete().eq("workflow_id", id);
            await supabase.from("mira_workflow_edges").delete().eq("workflow_id", id);

            // 2. Insert new nodes
            if (nodes && nodes.length > 0) {
                const nodesToInsert = nodes.map((node: any) => ({
                    workflow_id: id,
                    id: node.id,
                    type: node.type,
                    name: node.data?.label || node.type,
                    config: node.data || {},
                    position_x: node.position?.x || 0,
                    position_y: node.position?.y || 0,
                }));

                const { error: nodesError } = await supabase
                    .from("mira_workflow_nodes")
                    .insert(nodesToInsert);

                if (nodesError) throw nodesError;
            }

            // 3. Insert new edges
            if (edges && edges.length > 0) {
                const edgesToInsert = edges.map((edge: any) => ({
                    workflow_id: id,
                    id: edge.id,
                    source_node_id: edge.source,
                    target_node_id: edge.target,
                    condition_label: edge.label || null,
                }));

                const { error: edgesError } = await supabase
                    .from("mira_workflow_edges")
                    .insert(edgesToInsert);

                if (edgesError) throw edgesError;
            }

            // 4. Update workflow timestamp
            await supabase
                .from("mira_workflows")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", id);

            return new Response(JSON.stringify({ success: true, nodes_saved: nodes?.length || 0, edges_saved: edges?.length || 0 }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // POST /admin-workflows/:id/execute - Execute workflow
        // POST /admin-workflows/:id/test - Test workflow execution (same as execute)
        if (req.method === "POST" && id && (url.pathname.includes("/execute") || url.pathname.includes("/test"))) {
            const body = await req.json();
            const { input } = body;

            const startTime = Date.now();
            const executionId = crypto.randomUUID();

            try {
                // Initialize GraphExecutor
                const executor = new GraphExecutor(supabaseUrl, supabaseKey);

                // Log execution start
                await supabase.from("mira_execution_logs").insert({
                    id: executionId,
                    workflow_id: id,
                    status: "running",
                    input_data: input || {},
                    started_at: new Date().toISOString(),
                });

                // Execute workflow using real GraphExecutor
                const result = await executor.execute(id, {
                    messages: input?.message ? [{ role: 'user', content: input.message }] : [],
                    context: input?.context || {},
                    ui_actions: [],
                    metadata: {}
                });

                const duration = Date.now() - startTime;

                // Log execution completion
                await supabase.from("mira_execution_logs").update({
                    status: "completed",
                    output_data: result,
                    completed_at: new Date().toISOString(),
                    execution_time_ms: duration,
                }).eq("id", executionId);

                return new Response(
                    JSON.stringify({
                        execution_id: executionId,
                        status: "success",
                        output: result,
                        duration,
                    }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            } catch (testError: any) {
                const duration = Date.now() - startTime;

                // Log execution failure
                await supabase.from("mira_execution_logs").update({
                    status: "failed",
                    error_message: testError.message,
                    completed_at: new Date().toISOString(),
                    execution_time_ms: duration,
                }).eq("id", executionId);

                return new Response(
                    JSON.stringify({
                        execution_id: executionId,
                        status: "error",
                        error: testError.message,
                        duration,
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            }
        }

        // POST /admin-workflows/execute-by-intent - Execute workflow by intent
        if (req.method === "POST" && url.pathname.includes("/execute-by-intent")) {
            const body = await req.json();
            const { intent, input } = body;

            if (!intent) {
                return new Response(JSON.stringify({ error: "intent is required" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const startTime = Date.now();
            const executionId = crypto.randomUUID();

            try {
                // Find workflow by trigger_intent
                const { data: workflow, error: wfError } = await supabase
                    .from("mira_workflows")
                    .select("id, name")
                    .eq("trigger_intent", intent)
                    .eq("is_active", true)
                    .single();

                if (wfError || !workflow) {
                    return new Response(
                        JSON.stringify({ error: `No active workflow found for intent: ${intent}` }),
                        {
                            status: 404,
                            headers: { ...corsHeaders, "Content-Type": "application/json" },
                        }
                    );
                }

                // Initialize GraphExecutor
                const executor = new GraphExecutor(supabaseUrl, supabaseKey);

                // Log execution start
                await supabase.from("mira_execution_logs").insert({
                    id: executionId,
                    workflow_id: workflow.id,
                    status: "running",
                    input_data: { intent, ...input },
                    started_at: new Date().toISOString(),
                });

                // Execute workflow
                const result = await executor.execute(workflow.id, {
                    messages: input?.message ? [{ role: 'user', content: input.message }] : [],
                    context: input?.context || {},
                    ui_actions: [],
                    metadata: { intent }
                });

                const duration = Date.now() - startTime;

                // Log execution completion
                await supabase.from("mira_execution_logs").update({
                    status: "completed",
                    output_data: result,
                    completed_at: new Date().toISOString(),
                    execution_time_ms: duration,
                }).eq("id", executionId);

                return new Response(
                    JSON.stringify({
                        execution_id: executionId,
                        workflow_id: workflow.id,
                        workflow_name: workflow.name,
                        status: "success",
                        output: result,
                        duration,
                    }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            } catch (execError: any) {
                const duration = Date.now() - startTime;

                // Log execution failure
                if (executionId) {
                    await supabase.from("mira_execution_logs").update({
                        status: "failed",
                        error_message: execError.message,
                        completed_at: new Date().toISOString(),
                        execution_time_ms: duration,
                    }).eq("id", executionId);
                }

                return new Response(
                    JSON.stringify({
                        execution_id: executionId,
                        status: "error",
                        error: execError.message,
                        duration,
                    }),
                    {
                        status: 500,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            }
        }

        // DELETE /admin-workflows/:id - Delete workflow
        if (req.method === "DELETE" && id) {
            const { error } = await supabase
                .from("mira_workflows")
                .delete()
                .eq("id", id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
