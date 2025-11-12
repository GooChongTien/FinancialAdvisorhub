import fs from "node:fs";
import YAML from "yaml";
import type { Context, Envelope } from "../sdk/types.js";
import * as skills from "../skills/index.js";

const skillsCfg = YAML.parse(fs.readFileSync("config/skills_a2c.yaml", "utf-8"));

export async function runIntent(ctx: Context, intent: string, userText: string): Promise<Envelope> {
  const skillEntry = skillsCfg.skills[intent] || skillsCfg.default_skill;
  const skillName: string = skillEntry.skill;
  const fn = (skills as any)[skillName];
  if (!fn) {
    return { message: `I don't have a skill wired for intent '${intent}' yet.` };
  }
  return await fn(ctx, userText);
}

