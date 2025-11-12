import taxonomy from "../../../../../docs/mira_topics.json" assert { type: "json" };

type IntentNode = {
  intent_name: string;
  display_name?: string;
  description?: string;
};

type SubtopicNode = {
  subtopic: string;
  intents: IntentNode[];
};

type TopicNode = {
  topic: string;
  subtopics: SubtopicNode[];
};

type TaxonomyFile = {
  topics: TopicNode[];
};

const FALLBACK_LABEL = "continue with this action";
const intentLabels = new Map<string, string>();

const VERB_MAP: Record<string, string> = {
  view: "show",
  create: "add",
  add: "add",
  update: "update",
  edit: "edit",
  filter: "filter",
  search: "search for",
  generate: "generate",
  compare: "compare",
  schedule: "schedule",
  mark: "mark",
  run: "run",
  list: "list",
  open: "open",
  submit: "submit",
  check: "check",
};

function toSentenceCase(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withoutPeriod = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  const words = withoutPeriod.split(/\s+/).map((word, index) => {
    if (/^[A-Z0-9]{2,}$/.test(word)) {
      return word;
    }
    return word.toLowerCase();
  });
  const sentence = words.join(" ");
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

function fromDescription(description?: string): string | null {
  const sentence = toSentenceCase(description);
  if (!sentence) return null;
  return sentence;
}

function humanizeSlug(slug: string): string {
  const parts = slug.split("_").filter(Boolean);
  if (parts.length === 0) return FALLBACK_LABEL;
  const [first, ...rest] = parts;
  const verb = VERB_MAP[first] ?? first;
  const object = rest.join(" ").replace(/\b(ytd)\b/gi, "year-to-date");
  const phrase = object ? `${verb} ${object}` : verb;
  return phrase.toLowerCase();
}

function deriveLabel(intent: IntentNode): string {
  const fromDisplay = toSentenceCase(intent.display_name ?? "");
  if (fromDisplay) return fromDisplay;

  const fromDesc = fromDescription(intent.description);
  if (fromDesc) return fromDesc;

  return humanizeSlug(intent.intent_name);
}

function buildIntentLabels() {
  const data = taxonomy as TaxonomyFile;
  for (const topic of data.topics) {
    for (const subtopic of topic.subtopics) {
      for (const intent of subtopic.intents) {
        const label = deriveLabel(intent) || FALLBACK_LABEL;
        intentLabels.set(intent.intent_name, label);
      }
    }
  }
}

buildIntentLabels();

export function intentLabel(intent: string): string {
  if (!intent) return FALLBACK_LABEL;
  return intentLabels.get(intent) ?? FALLBACK_LABEL;
}
