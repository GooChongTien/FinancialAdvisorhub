// Background job stub to recalculate customer temperature buckets.
// Run with: node scripts/ops/temperature-refresh.mjs
import { createClient } from "@supabase/supabase-js";
import { calculateCustomerTemperature } from "../../src/lib/customer-temperature.js";
import "dotenv/config";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("[temperature-refresh] Missing Supabase credentials; skipping run.");
  process.exit(0);
}

const supabase = createClient(url, key);

async function recalc() {
  const { data: leads, error } = await supabase.from("leads").select("id,last_contacted,active_proposals,open_service_requests");
  if (error) throw error;
  for (const lead of leads || []) {
    const temp = calculateCustomerTemperature({
      lastInteractionAt: lead.last_contacted,
      activeProposals: lead.active_proposals || 0,
      openServiceRequests: lead.open_service_requests || 0,
    }).bucket;
    await supabase
      .from("leads")
      .update({ temperature_bucket: temp, temperature: temp })
      .eq("id", lead.id);
  }
  console.log(`[temperature-refresh] Updated ${leads?.length ?? 0} leads`);
}

recalc().catch((err) => {
  console.error("[temperature-refresh] Failed", err);
  process.exit(1);
});
