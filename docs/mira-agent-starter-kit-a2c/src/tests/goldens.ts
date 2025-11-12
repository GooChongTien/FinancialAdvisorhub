import fs from "node:fs";
import YAML from "yaml";
import { classify } from "../orchestrator/router.js";

const goldens = YAML.parse(fs.readFileSync("config/evals/tests.yaml","utf-8"));

(async () => {
  let pass = 0, fail = 0;
  for (const t of goldens.tests) {
    const { intent } = await classify(t.user);
    const expected = t.expect.intent;
    const ok = !expected || expected === intent;
    if (ok) pass++; else {
      fail++;
      console.error("❌", t.name, "expected", expected, "got", intent);
    }
  }
  console.log(`✅ ${pass} passed, ❌ ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();

