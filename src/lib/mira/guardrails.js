const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const NRIC_REGEX = /\b[STFG]\d{7}[A-Z]\b/gi;
const PHONE_REGEX = /\b(?:\+?\d{1,3})?[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g;

const TOXIC_TOKENS = ["idiot", "stupid", "hate", "kill"];

export function scrubPII(text = "") {
  if (typeof text !== "string") return "";
  return text
    .replace(EMAIL_REGEX, "[redacted-email]")
    .replace(NRIC_REGEX, "[redacted-nric]")
    .replace(PHONE_REGEX, "[redacted-phone]");
}

export function evaluateToxicity(text = "") {
  const lowered = String(text).toLowerCase();
  const hits = TOXIC_TOKENS.filter((t) => lowered.includes(t));
  const score = hits.length === 0 ? 0 : Math.min(1, 0.25 * hits.length);
  return { score, blocked: score >= 0.25 };
}

export function enforceGuardrails(text = "") {
  const sanitized = scrubPII(text);
  const tox = evaluateToxicity(sanitized);
  return {
    sanitizedText: sanitized,
    blocked: tox.blocked,
    reason: tox.blocked ? "toxicity" : undefined,
    score: tox.score,
  };
}

