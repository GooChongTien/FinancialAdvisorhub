
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedExpertBrain() {
    console.log("Seeding Expert Brain Workflows...");

    // --- KA-OPS-01: Meeting Prep ---
    console.log("Creating KA-OPS-01: Meeting Prep...");
    const { data: wfOps01, error: wfError1 } = await supabase
        .from('mira_workflows')
        .insert({
            name: 'ka_ops_01_meeting_prep',
            description: 'Expert Brain: Prepares a meeting agenda and tasks for client reviews.',
            version: 1,
            is_active: true,
            trigger_intent: 'ops__prepare_meeting' // Explicit trigger mapping
        })
        .select()
        .single();

    if (wfError1) {
        console.error("Error creating KA-OPS-01:", wfError1);
    } else {
        // Nodes: Start -> Generate Agenda (LLM) -> Create Task (Tool) -> Navigate (Tool)
        const nodes = [
            {
                workflow_id: wfOps01.id,
                type: 'start',
                name: 'start',
                config: {},
                position_x: 0,
                position_y: 100
            },
            {
                workflow_id: wfOps01.id,
                type: 'llm',
                name: 'generate_agenda',
                config: {
                    system_prompt: "You are an efficient executive assistant for an insurance advisor.",
                    prompt_template: "Create a concise 4-point meeting agenda for a client review based on this context: {{context}}. Focus on: 1. Changes in life/income. 2. Protection gaps. 3. Medical cover. 4. New goals. Output ONLY the agenda text.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            },
            {
                workflow_id: wfOps01.id,
                type: 'tool',
                name: 'create_prep_task',
                config: {
                    tool_name: 'todo__tasks.create',
                    arguments: {
                        title: "Prepare client meeting (Auto-generated)",
                        due: new Date().toISOString().split('T')[0] // Today
                    }
                },
                position_x: 400,
                position_y: 100
            },
            {
                workflow_id: wfOps01.id,
                type: 'tool',
                name: 'navigate_fna',
                config: {
                    tool_name: 'ui__navigate', // Assuming a generic navigation tool exists or we use the response action
                    arguments: {
                        route: '/fna'
                    }
                },
                position_x: 600,
                position_y: 100
            }
        ];

        // Insert nodes
        const nodeMap = new Map();
        for (const node of nodes) {
            const { data, error } = await supabase.from('mira_workflow_nodes').insert(node).select().single();
            if (error) console.error(`Error creating node ${node.name}:`, error);
            else nodeMap.set(node.name, data.id);
        }

        // Connect edges
        if (nodeMap.has('start') && nodeMap.has('generate_agenda')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfOps01.id, source_node_id: nodeMap.get('start'), target_node_id: nodeMap.get('generate_agenda') });
        }
        if (nodeMap.has('generate_agenda') && nodeMap.has('create_prep_task')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfOps01.id, source_node_id: nodeMap.get('generate_agenda'), target_node_id: nodeMap.get('create_prep_task') });
        }
        if (nodeMap.has('create_prep_task') && nodeMap.has('navigate_fna')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfOps01.id, source_node_id: nodeMap.get('create_prep_task'), target_node_id: nodeMap.get('navigate_fna') });
        }
    }

    // --- KA-ETH-01: Vulnerable Client Safeguard ---
    console.log("Creating KA-ETH-01: Vulnerable Client Safeguard...");
    const { data: wfEth01, error: wfError2 } = await supabase
        .from('mira_workflows')
        .insert({
            name: 'ka_eth_01_vulnerable_client',
            description: 'Expert Brain: Detects vulnerable clients and enforces compliance checks.',
            version: 1,
            is_active: true,
            trigger_intent: 'compliance__check_vulnerability'
        })
        .select()
        .single();

    if (wfError2) {
        console.error("Error creating KA-ETH-01:", wfError2);
    } else {
        // Nodes: Start -> Analyze Vulnerability (LLM) -> Conditional Warning (LLM)
        const nodes = [
            { workflow_id: wfEth01.id, type: 'start', name: 'start', config: {}, position_x: 0, position_y: 100 },
            {
                workflow_id: wfEth01.id,
                type: 'llm',
                name: 'analyze_vulnerability',
                config: {
                    system_prompt: "You are a compliance officer. Detect if the client is 'Vulnerable' (Age > 62, low education, or unable to understand English).",
                    prompt_template: "Context: {{context}}. User Input: {{user_message}}. Is this client vulnerable? Output 'YES' or 'NO' followed by a brief reason.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            },
            {
                workflow_id: wfEth01.id,
                type: 'llm',
                name: 'compliance_advice',
                config: {
                    system_prompt: "You are a helpful compliance assistant.",
                    prompt_template: "Based on the analysis: {{analyze_vulnerability.result}}. If YES, provide the 'Vulnerable Client Checklist' (Presence of Trusted Individual, Translation, etc.). If NO, confirm standard process.",
                    model: "gpt-4o-mini"
                },
                position_x: 400,
                position_y: 100
            }
        ];

        const nodeMap = new Map();
        for (const node of nodes) {
            const { data, error } = await supabase.from('mira_workflow_nodes').insert(node).select().single();
            if (error) console.error(`Error creating node ${node.name}:`, error);
            else nodeMap.set(node.name, data.id);
        }

        if (nodeMap.has('start') && nodeMap.has('analyze_vulnerability')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfEth01.id, source_node_id: nodeMap.get('start'), target_node_id: nodeMap.get('analyze_vulnerability') });
        }
        if (nodeMap.has('analyze_vulnerability') && nodeMap.has('compliance_advice')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfEth01.id, source_node_id: nodeMap.get('analyze_vulnerability'), target_node_id: nodeMap.get('compliance_advice') });
        }
    }

    console.log("Expert Brain workflows seeded successfully!");
}

seedExpertBrain();
