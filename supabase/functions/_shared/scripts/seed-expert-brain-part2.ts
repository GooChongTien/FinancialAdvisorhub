
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedExpertBrainPart2() {
    console.log("Seeding Expert Brain Part 2 Workflows...");

    // --- KA-FNA-02: FNA Data Capture ---
    console.log("Creating KA-FNA-02: FNA Data Capture...");
    const { data: wfFna02, error: wfError1 } = await supabase
        .from('mira_workflows')
        .insert({
            agent_id: 'expert_brain',
            name: 'ka_fna_02_data_capture',
            description: 'Expert Brain: Captures client data updates and applies them to the FNA.',
            is_active: true,
            trigger_intent: 'fna__capture_update_data'
        })
        .select()
        .single();

    if (wfError1) {
        console.error("Error creating KA-FNA-02:", wfError1);
    } else {
        // Nodes: Start -> Extract Data (LLM) -> Update Field (Tool)
        const nodes = [
            { workflow_id: wfFna02.id, type: 'start', name: 'start', config: {}, position_x: 0, position_y: 100 },
            {
                workflow_id: wfFna02.id,
                type: 'llm',
                name: 'extract_update_data',
                config: {
                    system_prompt: "You are a data entry assistant. Extract field updates from the user's message.",
                    prompt_template: "User Input: {{user_message}}. Extract the field path (e.g., 'fna.income.monthly') and value. Output JSON: { \"path\": \"...\", \"value\": ... }.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            },
            {
                workflow_id: wfFna02.id,
                type: 'tool',
                name: 'apply_update',
                config: {
                    tool_name: 'fna.update_field',
                    arguments: {
                        path: "{{extract_update_data.result.path}}",
                        value: "{{extract_update_data.result.value}}",
                        description: "Updating client record based on conversation."
                    }
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

        if (nodeMap.has('start') && nodeMap.has('extract_update_data')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfFna02.id, source_node_id: nodeMap.get('start'), target_node_id: nodeMap.get('extract_update_data') });
        }
        if (nodeMap.has('extract_update_data') && nodeMap.has('apply_update')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfFna02.id, source_node_id: nodeMap.get('extract_update_data'), target_node_id: nodeMap.get('apply_update') });
        }
    }

    // --- KA-REG-01: Regulatory Q&A ---
    console.log("Creating KA-REG-01: Regulatory Q&A...");
    const { data: wfReg01, error: wfError2 } = await supabase
        .from('mira_workflows')
        .insert({
            agent_id: 'expert_brain',
            name: 'ka_reg_01_regulatory_qa',
            description: 'Expert Brain: Answers questions about Singapore insurance regulations.',
            is_active: true,
            trigger_intent: 'kb__regulatory_qa'
        })
        .select()
        .single();

    if (wfError2) {
        console.error("Error creating KA-REG-01:", wfError2);
    } else {
        // Nodes: Start -> Answer Question (LLM)
        const nodes = [
            { workflow_id: wfReg01.id, type: 'start', name: 'start', config: {}, position_x: 0, position_y: 100 },
            {
                workflow_id: wfReg01.id,
                type: 'llm',
                name: 'answer_regulation',
                config: {
                    system_prompt: "You are an expert on Singapore insurance regulations (MAS, LIA, PDPA). Answer strictly based on official guidelines.",
                    prompt_template: "User Question: {{user_message}}. Provide a concise, compliant answer citing relevant acts or guidelines if possible.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            }
        ];

        const nodeMap = new Map();
        for (const node of nodes) {
            const { data, error } = await supabase.from('mira_workflow_nodes').insert(node).select().single();
            if (error) console.error(`Error creating node ${node.name}:`, error);
            else nodeMap.set(node.name, data.id);
        }

        if (nodeMap.has('start') && nodeMap.has('answer_regulation')) {
            await supabase.from('mira_workflow_edges').insert({ workflow_id: wfReg01.id, source_node_id: nodeMap.get('start'), target_node_id: nodeMap.get('answer_regulation') });
        }
    }

    console.log("Expert Brain Part 2 workflows seeded successfully!");
}

seedExpertBrainPart2();
