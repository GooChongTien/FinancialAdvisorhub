import fs from "fs";
import path from "path";

const file = path.resolve("docs/insurance-advisor-user-stories.md");
let s = fs.readFileSync(file, "utf8");

// Tick updated E01 acceptance criteria
const tick = (text) => text.replace("- [ ]", "- [x]");

// E01-S02
s = s.replace(
  /Story E01-S02[\s\S]*?Acceptance Criteria:\*\*\s*- \[x\] Option to enable\/disable 2FA is available- \[ \] System provides QR code for authentication app setup- \[ \] Backup codes are generated and downloadable- \[ \] Confirmation required before disabling 2FA- \[ \] Success\/error messages displayed clearly/,
  (m) => m
    .replace("- [ ] System provides QR code for authentication app setup", "- [x] System provides QR code for authentication app setup")
    .replace("- [ ] Backup codes are generated and downloadable", "- [x] Backup codes are generated and downloadable")
    .replace("- [ ] Confirmation required before disabling 2FA", "- [x] Confirmation required before disabling 2FA")
    .replace("- [ ] Success/error messages displayed clearly", "- [x] Success/error messages displayed clearly")
);

// E01-S03
s = s.replace(
  /Story E01-S03[\s\S]*?Acceptance Criteria:\*\*- \[ \] Current password verification required- \[ \] New password must meet complexity requirements \(min 8 chars, uppercase, lowercase, number, special char\)- \[ \] Password confirmation field matches new password- \[ \] System logs user out after successful password change- \[ \] Email notification sent to registered email- \[ \] Clear error messages for invalid inputs/,
  (m) => m
    .replace("- [ ] Current password verification required", "- [x] Current password verification required")
    .replace("- [ ] New password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, special char)", "- [x] New password must meet complexity requirements (min 8 chars, uppercase, lowercase, number, special char)")
    .replace("- [ ] Password confirmation field matches new password", "- [x] Password confirmation field matches new password")
    .replace("- [ ] System logs user out after successful password change", "- [x] System logs user out after successful password change")
    // keep email notification unchecked
    .replace("- [ ] Clear error messages for invalid inputs", "- [x] Clear error messages for invalid inputs")
);

// E01-S04
s = s.replace(
  /Story E01-S04[\s\S]*?Acceptance Criteria:\*\*[\s\S]*?Preferences saved automatically- \[ \] Changes reflect immediately across all modules- \[ \] Default preferences restore option available/,
  (m) => m
    .replace("- [ ] Default preferences restore option available", "- [x] Default preferences restore option available")
);

// Normalize formatting: add line breaks around common tokens
s = s
  // separate headers and sections
  .replaceAll("---", "\n\n---\n\n")
  .replaceAll("## ", "\n\n## ")
  .replaceAll("### ", "\n\n### ")
  // put acceptance criteria bullets on their own lines
  .replace(/- \[(x| )\]/g, (m) => "\n" + m)
  // add a newline before Table rows title to avoid breaking tables unnecessarily
  .replace("| Epic ID |", "\n\n| Epic ID |")
  // remove orphan heading markers introduced by splitting
  .replace(/\n#\r?\n/g, "\n");

fs.writeFileSync(file, s, "utf8");
console.log("Normalized and updated docs/insurance-advisor-user-stories.md");
