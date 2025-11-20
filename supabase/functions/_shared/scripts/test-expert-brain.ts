// Comprehensive test script for new Expert Brain workflows (FNA Data Capture, Regulatory Q&A, Meeting Prep, Vulnerable Client Safeguard)
// Run with Deno: deno run --allow-net --allow-env --env-file=.env.local test-expert-brain.ts

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "http://localhost:54321"; // adjust if needed
const ENDPOINT = `${SUPABASE_URL}/functions/v1/agent-chat`;

async function callAgent(payload: any) {
    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log("--- Response for intent", payload.context?.module, "---");
    console.log(JSON.stringify(data, null, 2));
}

async function main() {
    // 1️⃣ FNA Data Capture (KA-FNA-02)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "Update FNA field: income to 120000" }],
        context: { module: "fna" }, // triggers fna__capture_update_data
    });

    // 2️⃣ Regulatory Q&A (KA-REG-01)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "What are the latest regulations for Singapore wealth management?" }],
        context: { module: "knowledge" }, // triggers kb__regulatory_qa
    });

    // 3️⃣ Meeting Prep (KA-OPS-01)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "Prepare a meeting agenda for a client onboarding call" }],
        context: { module: "operations" }, // triggers ops__prepare_meeting
    });

    // 4️⃣ Vulnerable Client Safeguard (KA-ETH-01)
    await callAgent({
        mode: "batch",
        messages: [{ role: "user", content: "Check if the client is vulnerable and suggest safeguards" }],
        context: { module: "compliance" }, // triggers compliance__check_vulnerability
    });
}

main().catch((e) => console.error(e));
