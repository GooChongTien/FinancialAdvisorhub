import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

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

        // POST /admin-workflows/:id/test - Test workflow execution
        if (req.method === "POST" && id && url.pathname.includes("/test")) {
            const body = await req.json();
            const { input, nodes, edges } = body;

            const startTime = Date.now();

            try {
                // Simulate workflow execution
                // In a real implementation, this would execute the actual workflow graph
                const trace = [];

                // Find start node
                const startNode = nodes.find((n: any) => n.type === "start");
                if (!startNode) {
                    throw new Error("No start node found in workflow");
                }

                trace.push({
                    node_id: startNode.id,
                    node_type: startNode.type,
                    timestamp: new Date().toISOString(),
                    status: "executed",
                });

                // Simulate traversing edges
                let currentNodeId = startNode.id;
                const visited = new Set([currentNodeId]);

                while (true) {
                    const nextEdge = edges.find((e: any) => e.source === currentNodeId);
                    if (!nextEdge) break;

                    const nextNode = nodes.find((n: any) => n.id === nextEdge.target);
                    if (!nextNode || visited.has(nextNode.id)) break;

                    visited.add(nextNode.id);

                    trace.push({
                        node_id: nextNode.id,
                        node_type: nextNode.type,
                        node_label: nextNode.data?.label,
                        timestamp: new Date().toISOString(),
                        status: "executed",
                        config: nextNode.data,
                    });

                    if (nextNode.type === "end") break;
                    currentNodeId = nextNode.id;
                }

                const duration = Date.now() - startTime;

                return new Response(
                    JSON.stringify({
                        status: "success",
                        output: {
                            message: "Workflow test completed successfully",
                            input_received: input,
                            nodes_executed: trace.length,
                        },
                        trace,
                        duration,
                    }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            } catch (testError: any) {
                const duration = Date.now() - startTime;
                return new Response(
                    JSON.stringify({
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
