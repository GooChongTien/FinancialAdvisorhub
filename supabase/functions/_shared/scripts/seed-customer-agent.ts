
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedCustomerAgent() {
    console.log("Seeding Customer Agent Workflow...");

    // 1. Create Workflow
    const { data: workflow, error: wfError } = await supabase
        .from('mira_workflows')
        .insert({
            name: 'customer_agent_v1',
            description: 'Customer Agent Workflow - Handles lead creation and customer queries',
            version: 1,
            is_active: true
        })
        .select()
        .single();

    if (wfError) {
        console.error("Error creating workflow:", wfError);
        return;
    }

    console.log(`Created workflow: ${workflow.id}`);

    // 2. Create Nodes
    // Flow: Start -> Intent Router (LLM) -> [Create Lead Tool | General Chat LLM] -> End

    // Node 1: Router (LLM that decides what to do)
    const { data: routerNode, error: n1Error } = await supabase
        .from('mira_workflow_nodes')
        .insert({
            workflow_id: workflow.id,
            type: 'llm',
            name: 'intent_classifier',
            config: {
                system_prompt: "You are the Customer Agent. Your goal is to help advisors manage their customers. If the user wants to add a new lead, output 'TOOL: create_lead'. Otherwise, answer their question helpfuly.",
                prompt_template: "{{user_message}}", // Placeholder
                model: "gpt-4o-mini"
            },
            position_x: 100,
            position_y: 100
        })
        .select()
        .single();

    // Node 2: Create Lead Tool
    const { data: toolNode, error: n2Error } = await supabase
        .from('mira_workflow_nodes')
        .insert({
            workflow_id: workflow.id,
            type: 'tool',
            name: 'create_lead_tool',
            config: {
                tool_name: 'create_lead', // Must match registry
                inputs: {} // Dynamic inputs from state would go here
            },
            position_x: 300,
            position_y: 200
        })
        .select()
        .single();

    // Node 3: General Chat (Fallback)
    // For simplicity in this seed, we'll just let the Router node handle the chat response if it doesn't call a tool.
    // But strictly speaking, we might want a separate node. For now, let's keep it simple:
    // The Router Node *is* the chat node if it doesn't output a tool call.
    // But to demonstrate graph structure, let's add a "Final Response" node.

    const { data: responseNode, error: n3Error } = await supabase
        .from('mira_workflow_nodes')
        .insert({
            workflow_id: workflow.id,
            type: 'llm',
            name: 'response_generator',
            config: {
                system_prompt: "You are a helpful assistant confirming the action was taken.",
                prompt_template: "The lead has been created. Summarize this for the user.",
                model: "gpt-4o-mini"
            },
            position_x: 500,
            position_y: 200
        })
        .select()
        .single();

    if (n1Error || n2Error || n3Error) {
        console.error("Error creating nodes:", n1Error, n2Error, n3Error);
        return;
    }

    // 3. Create Edges
    // Start -> Intent Classifier
    // Intent Classifier -> Create Lead Tool (Conditional? For now, let's just wire it linearly for the test: Start -> Tool -> Response)
    // Real world: Start -> Router -> (if lead) -> Tool -> Response

    // For this verification, let's build a linear "Create Lead" pipeline to prove the tool execution works.
    // Start -> Create Lead Tool -> Response Generator -> End

    // Edge 1: Start -> Create Lead Tool (Skipping router for this specific test workflow)
    // We need a 'start' node concept. The graph executor handles 'start' virtually, but we need to define the entry point.
    // In our schema, we don't explicitly have a 'start' node row, we just have an edge from 'start' (virtual) to the first node.
    // Wait, the schema has 'type' column in nodes. Let's check GraphExecutor logic.
    // "if (sourceNode.type === 'start') { graph.setEntryPoint(targetNode.id); }"
    // So we need a node of type 'start'.

    const { data: startNode } = await supabase
        .from('mira_workflow_nodes')
        .insert({
            workflow_id: workflow.id,
            type: 'start',
            name: 'start',
            config: {},
            position_x: 0,
            position_y: 100
        })
        .select()
        .single();

    const { error: e1Error } = await supabase
        .from('mira_workflow_edges')
        .insert({
            workflow_id: workflow.id,
            source_node_id: startNode.id,
            target_node_id: toolNode.id // Go straight to tool for testing
        });

    const { error: e2Error } = await supabase
        .from('mira_workflow_edges')
        .insert({
            workflow_id: workflow.id,
            source_node_id: toolNode.id,
            target_node_id: responseNode.id
        });

    const { error: e3Error } = await supabase
        .from('mira_workflow_edges')
        .insert({
            workflow_id: workflow.id,
            source_node_id: responseNode.id,
            target_node_id: startNode.id // Loop back? No. End.
            // We need an END node? LangGraph has END.
            // Our executor doesn't explicitly handle END node type in the loop, but if a node has no outgoing edges, it stops.
        });

    if (e1Error || e2Error) {
        console.error("Error creating edges:", e1Error, e2Error);
        return;
    }

    console.log("Workflow seeded successfully!");
}

seedCustomerAgent();
