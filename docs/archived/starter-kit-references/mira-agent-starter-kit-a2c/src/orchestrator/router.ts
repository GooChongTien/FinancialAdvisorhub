import fs from "node:fs";
import YAML from "yaml";

const intentsCfg = YAML.parse(fs.readFileSync("config/routing/intents.yaml", "utf-8"));

export async function classify(userText: string) {
  const lower = userText.toLowerCase();
  for (const it of intentsCfg.intents) {
    const kws: string[] = it.match?.keywords ?? [];
    if (kws.some((k: string) => lower.includes(k))) {
      return { intent: it.name as string, confidence: it.threshold ?? 0.6, entities: {} };
    }
  }
  return { intent: "system_help", confidence: 0.4, entities: {} };
}

