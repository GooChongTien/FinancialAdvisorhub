
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

    // Step 0: Create Agent Config first
    const { data: agentConfig, error: agentError } = await supabase
        .from('mira_agent_configs')
        .insert({
            agent_id: 'customer_agent',
            module: 'customers',
            display_name: 'Customer Agent',
            system_prompt: 'You are the Customer Agent. Your goal is to help advisors manage their customers.',
            tools: [
                {
                    name: 'create_lead',
                    description: 'Creates a new lead in the system',
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            contact_number: { type: 'string' },
                            email: { type: 'string' }
                        },
                        required: ['name', 'contact_number']
                    }
                }
            ],
            parameters: {
                temperature: 0.7,
                model: 'gpt-4o-mini'
            },
            active: true
        })
        .select()
        .single();

    if (agentError) {
        console.error("Error creating agent config:", agentError);
        return;
    }

    console.log(`Created agent config: ${agentConfig.agent_id}`);

    // 1. Create Workflow
    const { data: workflow, error: wfError } = await supabase
        .from('mira_workflows')
        .insert({
            agent_id: 'customer_agent',
            name: 'customer_agent_v1',
            description: 'Customer Agent Workflow - Handles lead creation and customer queries',
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
    // Start Node
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

    // Node 1: Router (LLM that decides what to do)
    const { data: routerNode, error: n1Error } = await supabase
        .from('mira_workflow_nodes')
        .insert({
            workflow_id: workflow.id,
            type: 'llm',
            name: 'intent_classifier',
            config: {
                system_prompt: "You are the Customer Agent. Your goal is to help advisors manage their customers. If the user wants to add a new lead, output 'TOOL: create_lead'. Otherwise, answer their question helpfully.",
                prompt_template: "{{user_message}}",
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
                tool_name: 'create_lead',
                inputs: {}
            },
            position_x: 300,
            position_y: 200
        })
        .select()
        .single();

    // Node 3: Response Generator
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

    console.log("Created nodes: start, intent_classifier, create_lead_tool, response_generator");

    // 3. Create Edges
    const { error: e1Error } = await supabase
        .from('mira_workflow_edges')
        .insert({
            workflow_id: workflow.id,
            source_node_id: startNode.id,
            target_node_id: toolNode.id
        });

    const { error: e2Error } = await supabase
        .from('mira_workflow_edges')
        .insert({
            workflow_id: workflow.id,
            source_node_id: toolNode.id,
            target_node_id: responseNode.id
        });

    if (e1Error || e2Error) {
        console.error("Error creating edges:", e1Error, e2Error);
        return;
    }

    console.log("Created edges: start -> tool -> response");
    console.log("✅ Workflow seeded successfully!");
    console.log(`   - Agent: customer_agent`);
    console.log(`   - Workflow: ${workflow.name} (${workflow.id})`);
    console.log(`   - Nodes: 4 (start, classifier, tool, response)`);
    console.log(`   - Edges: 2`);
}

seedCustomerAgent();
