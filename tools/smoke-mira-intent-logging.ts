#!/usr/bin/env ts-node
/**
 * Mira intent logging smoke test.
 *
 * - Loads environment variables from .env.local
 * - Sends a couple of agent-chat requests (customer + analytics)
 * - Reads back the latest intent logs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");

if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn("[smoke] Failed to load .env.local:", result.error);
  }
} else {
  console.warn("[smoke] .env.local not found, relying on process env");
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const AGENT_API_URL = process.env.VITE_AGENT_API_URL ?? (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : undefined);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY || !AGENT_API_URL) {
  console.error("[smoke] Missing Supabase configuration. Please ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_ANON_KEY, and VITE_AGENT_API_URL are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

type SmokeCase = {
  module: string;
  page: string;
  message: string;
};

const cases: SmokeCase[] = [
  {
    module: "customer",
    page: "/customer",
    message: "Add a new lead named Sarah Lee with phone 98765432",
  },
  {
    module: "analytics",
    page: "/analytics",
    message: "Show my year to date performance",
  },
];

async function postAgentChat(testCase: SmokeCase) {
  const payload = {
    mode: "batch",
    context: {
      module: testCase.module,
      page: testCase.page,
    },
    metadata: {
      source: "smoke-test",
    },
    messages: [
      {
        role: "user",
        content: testCase.message,
      },
    ],
  };

  const res = await fetch(`${AGENT_API_URL}/agent-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent chat request failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json;
}

async function fetchIntentLogs(limit = 10) {
  const { data, error } = await supabase
    .from("mira_intent_logs")
    .select("topic, intent_name, confidence, selected_agent, selected_skill, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function main() {
  console.log("[smoke] Sending agent-chat requests...");
  const responses: Array<{ module: string; result: any }> = [];
  for (const testCase of cases) {
    console.log(`  > ${testCase.module}: "${testCase.message}"`);
    try {
      const result = await postAgentChat(testCase);
      responses.push({ module: testCase.module, result });
    } catch (error) {
      console.error(`[smoke] Agent chat failed for ${testCase.module}:`, error);
      process.exit(1);
    }
  }

  for (const entry of responses) {
    console.log(`[smoke] ${entry.module} raw response:`, JSON.stringify(entry.result));
    const meta = entry.result?.metadata ?? entry.result?.message?.metadata;
    const needsClarification = meta?.needs_clarification;
    console.log(
      `[smoke] ${entry.module} response metadata:`,
      needsClarification ? "needs clarification" : "no clarification",
      meta ? JSON.stringify(meta) : "(no metadata)",
    );
  }

  console.log("[smoke] Fetching latest intent logs...");
  try {
    const logs = await fetchIntentLogs(10);
    if (logs.length === 0) {
      console.warn("[smoke] No intent logs found.");
    } else {
      for (const log of logs) {
        console.log(
          `  - ${log.created_at}: topic=${log.topic}, intent=${log.intent_name}, confidence=${log.confidence}, agent=${log.selected_agent}, skill=${log.selected_skill}`,
        );
      }
    }
  } catch (error) {
    console.error("[smoke] Failed to fetch intent logs:", error);
    process.exit(1);
  }

  console.log("[smoke] Completed.");
}

main().catch((error) => {
  console.error("[smoke] Unexpected failure:", error);
  process.exit(1);
});
