import taxonomy from "../../../docs/mira_topics.json";

type IntentNode = {
  intent_name: string;
  display_name?: string;
  description?: string;
};

type SubtopicNode = {
  intents: IntentNode[];
};

type TopicNode = {
  subtopics: SubtopicNode[];
};

type TaxonomyFile = {
  topics: TopicNode[];
};

const FALLBACK_LABEL = "handle this request";

const intentLabels = new Map<string, string>();

const VERB_MAP: Record<string, string> = {
  view: "show",
  create: "create",
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

const data = taxonomy as TaxonomyFile;

function normalizeSentence(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withoutPeriod = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  const sentence = withoutPeriod.replace(/\s+/g, " ");
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

function humanizeSlug(slug: string): string {
  const parts = slug.split("_").filter(Boolean);
  if (parts.length === 0) return FALLBACK_LABEL;
  const [verbRaw, ...rest] = parts;
  const verb = VERB_MAP[verbRaw] ?? verbRaw;
  const object = rest.join(" ").replace(/\bytd\b/gi, "year-to-date");
  const phrase = object ? `${verb} ${object}` : verb;
  return phrase.toLowerCase();
}

function registerLabel(intent: IntentNode) {
  const fromDisplay = normalizeSentence(intent.display_name);
  if (fromDisplay) {
    intentLabels.set(intent.intent_name, fromDisplay);
    return;
  }

  const fromDescription = normalizeSentence(intent.description);
  if (fromDescription) {
    intentLabels.set(intent.intent_name, fromDescription);
    return;
  }

  intentLabels.set(intent.intent_name, humanizeSlug(intent.intent_name));
}

for (const topic of data.topics) {
  for (const subtopic of topic.subtopics) {
    for (const intent of subtopic.intents) {
      registerLabel(intent);
    }
  }
}

export function intentLabel(intent?: string | null): string {
  if (!intent) return FALLBACK_LABEL;
  return intentLabels.get(intent) ?? FALLBACK_LABEL;
}

export default intentLabel;
