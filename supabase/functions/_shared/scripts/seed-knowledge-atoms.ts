
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedKnowledgeAtoms() {
    console.log("Seeding Knowledge Atoms...");

    // --- KA-PROD-01: Protection-First Ordering ---
    console.log("Creating KA-PROD-01: Protection-First Ordering...");

    const { data: wfProd01, error: wfError1 } = await supabase
        .from('mira_workflows')
        .insert({
            name: 'ka_prod_01_protection_first',
            description: 'Expert Brain: Prioritizes protection over investment. Triggers when client wants to invest but lacks basic cover.',
            version: 1,
            is_active: true
        })
        .select()
        .single();

    if (wfError1) {
        console.error("Error creating KA-PROD-01:", wfError1);
    } else {
        // Nodes for KA-PROD-01
        // 1. Start
        // 2. Analysis (LLM): Check context for existing coverage.
        // 3. Advice (LLM): Explain protection hierarchy.

        const nodes = [
            {
                workflow_id: wfProd01.id,
                type: 'start',
                name: 'start',
                config: {},
                position_x: 0,
                position_y: 100
            },
            {
                workflow_id: wfProd01.id,
                type: 'llm',
                name: 'analyze_gap',
                config: {
                    system_prompt: "You are an expert insurance advisor. Your goal is to identify if the client has adequate 'Protection' (Medical, CI) before discussing 'Investment'.",
                    prompt_template: "Context: {{context}}\nUser Request: {{user_message}}\n\nAnalyze if the user has mentioned having Hospitalization or Critical Illness cover. If not, or if unknown, we must pivot to protection.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            },
            {
                workflow_id: wfProd01.id,
                type: 'llm',
                name: 'protection_advice',
                config: {
                    system_prompt: "You are a wise, empathetic advisor. You believe in 'Protection First'.",
                    prompt_template: "The user wants to invest but may lack protection. Explain gently: 'Before we look at returns, we must ensure your income and health are safe.' Use the analogy of 'building a house on a strong foundation'. Suggest reviewing their Medical/CI cover first.",
                    model: "gpt-4o-mini"
                },
                position_x: 400,
                position_y: 100
            }
        ];

        for (const node of nodes) {
            const { data: nodeRow, error } = await supabase.from('mira_workflow_nodes').insert(node).select().single();
            if (error) console.error("Error creating node:", error);
            // Store ID for edges (simplified for this script, assuming linear creation order or fetching back)
        }

        // Re-fetch nodes to get IDs for edges
        const { data: createdNodes } = await supabase.from('mira_workflow_nodes').select('*').eq('workflow_id', wfProd01.id);
        const start = createdNodes.find(n => n.name === 'start');
        const analyze = createdNodes.find(n => n.name === 'analyze_gap');
        const advice = createdNodes.find(n => n.name === 'protection_advice');

        if (start && analyze && advice) {
            await supabase.from('mira_workflow_edges').insert([
                { workflow_id: wfProd01.id, source_node_id: start.id, target_node_id: analyze.id },
                { workflow_id: wfProd01.id, source_node_id: analyze.id, target_node_id: advice.id }
            ]);
        }
    }

    // --- KA-FNA-01: Comprehensive Fact-Find ---
    console.log("Creating KA-FNA-01: Comprehensive Fact-Find...");

    const { data: wfFna01, error: wfError2 } = await supabase
        .from('mira_workflows')
        .insert({
            name: 'ka_fna_01_fact_find',
            description: 'Expert Brain: Comprehensive Fact-Find Checklist. Ensures all key financial data is captured.',
            version: 1,
            is_active: true
        })
        .select()
        .single();

    if (wfError2) {
        console.error("Error creating KA-FNA-01:", wfError2);
    } else {
        // Nodes: Start -> Check Missing Data (Tool/LLM) -> Ask Question (LLM)
        // For this seed, we'll simulate the logic with LLM nodes.

        const nodes = [
            { workflow_id: wfFna01.id, type: 'start', name: 'start', config: {}, position_x: 0, position_y: 100 },
            {
                workflow_id: wfFna01.id,
                type: 'llm',
                name: 'check_missing_data',
                config: {
                    system_prompt: "You are an FNA (Financial Needs Analysis) auditor.",
                    prompt_template: "Review the current context: {{context}}. Identify missing fields from: [Income, Expenses, Assets, Liabilities, Existing Insurance, Goals]. Output the next missing field to ask about.",
                    model: "gpt-4o-mini"
                },
                position_x: 200,
                position_y: 100
            },
            {
                workflow_id: wfFna01.id,
                type: 'llm',
                name: 'ask_question',
                config: {
                    system_prompt: "You are a friendly advisor conducting a fact-find.",
                    prompt_template: "Based on the missing field identified, ask the user a polite, open-ended question to get this information. Explain why it's important.",
                    model: "gpt-4o-mini"
                },
                position_x: 400,
                position_y: 100
            }
        ];

        for (const node of nodes) {
            await supabase.from('mira_workflow_nodes').insert(node);
        }

        const { data: createdNodes } = await supabase.from('mira_workflow_nodes').select('*').eq('workflow_id', wfFna01.id);
        const start = createdNodes.find(n => n.name === 'start');
        const check = createdNodes.find(n => n.name === 'check_missing_data');
        const ask = createdNodes.find(n => n.name === 'ask_question');

        if (start && check && ask) {
            await supabase.from('mira_workflow_edges').insert([
                { workflow_id: wfFna01.id, source_node_id: start.id, target_node_id: check.id },
                { workflow_id: wfFna01.id, source_node_id: check.id, target_node_id: ask.id }
            ]);
        }
    }

    console.log("Knowledge Atoms seeded successfully!");
}

seedKnowledgeAtoms();
