import { readFileSync } from "node:fs";
import YAML from "yaml";

const intents = YAML.parse(readFileSync("config/routing/intents.yaml", "utf-8"));

export async function classify(userText: string) {
  // naive keyword + very light heuristics; replace with model call as needed
  const lower = userText.toLowerCase();
  for (const it of intents.intents) {
    const kws: string[] = it.match?.keywords ?? [];
    if (kws.some(k => lower.includes(k))) {
      return { intent: it.name as string, confidence: it.threshold ?? 0.6, entities: {} };
    }
  }
  return { intent: "answer", confidence: 0.45, entities: {} };
}
