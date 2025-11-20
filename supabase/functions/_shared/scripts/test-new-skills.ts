// Test script for new Expert Brain workflows (FNA Data Capture & Regulatory Q&A)
// Run with Deno: deno run --allow-net --allow-env --env-file=.env.local test-new-skills.ts

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? "";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/agent-chat`;

async function callAgent(payload: any) {
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("--- Response for intent", payload.context?.module, "---");
    console.log(JSON.stringify(data, null, 2));
}

async function main() {
    // 1. Test FNA Data Capture workflow (KA-FNA-02)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "Update FNA field: income to 120000" }],
        context: { module: "fna" }, // triggers fna__capture_update_data intent
    });

    // 2. Test Regulatory Q&A workflow (KA-REG-01)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "What are the latest regulations for Singapore wealth management?" }],
        context: { module: "knowledge" }, // triggers kb__regulatory_qa intent
    });
}

main().catch((e) => console.error(e));
