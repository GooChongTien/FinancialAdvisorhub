// Smart Plan summarization and intent detection.
// If OPENAI_API_KEY is present, use OpenAI for higher quality; otherwise fallback to deterministic heuristics.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

type Intent =
  | { type: "proposal"; confidence: number }
  | { type: "task"; confidence: number }
  | { type: "none"; confidence: number };

function summarize(text: string): string {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "No summary available.";
  return cleaned.length > 320 ? `${cleaned.slice(0, 320)}…` : cleaned;
}

function detectIntent(text: string): Intent {
  const lower = text.toLowerCase();
  const proposalHits = ["proposal", "quote", "application", "apply", "upgrade", "policy"].filter((k) =>
    lower.includes(k),
  ).length;
  const taskHits = ["follow up", "call", "meet", "meeting", "schedule", "remind"].filter((k) =>
    lower.includes(k),
  ).length;

  if (proposalHits > 0 && proposalHits >= taskHits) {
    const confidence = Math.min(1, 0.4 + proposalHits * 0.1);
    return { type: "proposal", confidence };
  }
  if (taskHits > 0) {
    const confidence = Math.min(1, 0.3 + taskHits * 0.1);
    return { type: "task", confidence };
  }
  return { type: "none", confidence: 0.1 };
}

function extractKeyPoints(text: string): string[] {
  const sentences = text
    .split(/[\n\.]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, 5);
}

async function summarizeWithOpenAI(text: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
  if (!apiKey) return null;
  const prompt = `Summarize the following advisor task/appointment notes for CRM storage. Return:\n- summary (2-4 sentences)\n- bullet key points (max 5)\n- intent: proposal | task | none\nText:\n${text}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  if (!content) return null;
  const summary = content.split("\n").filter((l) => l.trim()).slice(0, 1).join(" ").trim();
  const keyPoints = content
    .split("\n")
    .filter((l: string) => l.trim().startsWith("-"))
    .map((l: string) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const intent: Intent =
    /proposal|quote|application/i.test(content)
      ? { type: "proposal", confidence: 0.65 }
      : /task|follow[- ]?up|call|meeting/i.test(content)
        ? { type: "task", confidence: 0.55 }
        : { type: "none", confidence: 0.2 };
  return { summary: summary || null, keyPoints, intent };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const body = await req.json();
    const notes: string = body?.notes ?? "";
    const transcript: string = body?.transcript ?? "";
    const combined = `${notes}\n${transcript}`.trim();

    const aiResult = await summarizeWithOpenAI(combined || notes || transcript || "");
    const summary = aiResult?.summary ?? summarize(combined || notes || transcript || "");
    const intent = aiResult?.intent ?? detectIntent(combined);
    const keyPoints = aiResult?.keyPoints ?? extractKeyPoints(combined || summary);

    return new Response(
      JSON.stringify({
        summary,
        intent,
        key_points: keyPoints,
        sentiment: "neutral",
      }),
      {
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        status: 200,
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || "Invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
    });
  }
});
