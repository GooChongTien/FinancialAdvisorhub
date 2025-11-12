import { z } from "zod";
import taxonomy from "../../../docs/mira_topics.json";
import type { IntentMetadata, UIAction } from "./types";

type TaxonomyFile = {
  topics: Array<{
    topic: string;
    subtopics: Array<{
      subtopic: string;
      intents: Array<{
        intent_name: string;
        display_name?: string;
        description?: string;
        required_fields?: string[];
        optional_fields?: string[];
        ui_actions?: UIAction[];
        example_phrases?: string[];
      }>;
    }>;
  }>;
};

const asTaxonomy = taxonomy as TaxonomyFile;

const stringField = () => z.string().min(1).trim();
const dateField = () => z.union([z.string().min(1), z.date()]);
const numberLikeField = () => z.union([z.number(), z.string().min(1)]);
const boolField = () => z.union([z.boolean(), z.literal("true"), z.literal("false")]);
const recordField = () => z.record(z.string().min(1), z.unknown());
const stringArrayField = () => z.array(z.string().min(1));

const FIELD_SCHEMAS: Record<string, z.ZodTypeAny> = {
  broadcast_id: stringField(),
  campaign_id: stringField(),
  address: stringField(),
  category: stringField(),
  contact_number: stringField(),
  content: stringField(),
  customer_data: recordField(),
  customer_id: stringField(),
  customer_profile: recordField(),
  date: dateField(),
  date_filter: stringField(),
  date_of_birth: dateField(),
  date_range: z.union([
    stringField(),
    z.object({ start: dateField(), end: dateField() }),
  ]),
  duration: numberLikeField(),
  email: z.string().email(),
  field_name: stringField(),
  financial_info: recordField(),
  filter_criteria: recordField(),
  filter_type: stringField(),
  filter_value: stringField(),
  gender: stringField(),
  lead_id: stringField(),
  lead_identifier: stringField(),
  lead_source: stringField(),
  location: stringField(),
  medical_info: recordField(),
  metric_type: stringField(),
  name: stringField(),
  national_id: stringField(),
  need_type: stringField(),
  new_date: dateField(),
  new_stage: stringField(),
  new_status: stringField(),
  new_time: stringField(),
  new_value: numberLikeField(),
  notes: z.string().max(1000),
  optional_fields: stringArrayField(),
  pin_status: boolField(),
  product_id: stringField(),
  product_ids: stringArrayField(),
  product_selection: stringArrayField(),
  proposal_id: stringField(),
  proposer_name: stringField(),
  quote_ids: stringArrayField(),
  scenario_ids: stringArrayField(),
  scenario_parameters: recordField(),
  search_term: stringField(),
  stage: stringField(),
  tab: stringField(),
  task_id: stringField(),
  time: stringField(),
  time_range: z.union([
    stringField(),
    z.object({ start: stringField(), end: stringField() }),
  ]),
  title: stringField(),
  type: stringField(),
  view_mode: stringField(),
  budget: numberLikeField(),
  coverage_amount: numberLikeField(),
  customer_age: numberLikeField(),
  age_range: numberLikeField(),
  completed: boolField(),
  is_pinned: boolField(),
  status: stringField(),
  relationship_type: stringField(),
  product_ids_csv: stringField(),
  customer_profile_id: stringField(),
  time_window: stringField(),
  customer_segment: stringField(),
};

const FALLBACK_SCHEMA = z.unknown();

const buildIntentSchema = (required: string[], optional: string[]) => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of required) {
    const schema = FIELD_SCHEMAS[field] ?? FALLBACK_SCHEMA;
    shape[field] = schema;
  }

  for (const field of optional) {
    const schema = FIELD_SCHEMAS[field] ?? FALLBACK_SCHEMA;
    shape[field] = schema.optional();
  }

  return z.object(shape);
};

export type IntentSchema = ReturnType<typeof buildIntentSchema>;

export interface IntentCatalogEntry {
  topic: string;
  subtopic: string;
  intent: string;
  displayName?: string;
  description?: string;
  requiredFields: string[];
  optionalFields: string[];
  examplePhrases: string[];
  uiActions: UIAction[];
  schema: IntentSchema;
}

const catalogEntries: IntentCatalogEntry[] = [];
const catalogByKey = new Map<string, IntentCatalogEntry>();
const intentsByTopic = new Map<string, IntentCatalogEntry[]>();

const buildKey = (topic: string, intent: string) => `${topic}:${intent}`;

for (const topicNode of asTaxonomy.topics) {
  for (const subtopic of topicNode.subtopics) {
    for (const intent of subtopic.intents) {
      const required = intent.required_fields ?? [];
      const optional = intent.optional_fields ?? [];
      const entry: IntentCatalogEntry = {
        topic: topicNode.topic,
        subtopic: subtopic.subtopic,
        intent: intent.intent_name,
        displayName: intent.display_name,
        description: intent.description,
        requiredFields: required,
        optionalFields: optional,
        examplePhrases: intent.example_phrases ?? [],
        uiActions: (intent.ui_actions ?? []) as UIAction[],
        schema: buildIntentSchema(required, optional),
      };

      catalogEntries.push(entry);
      catalogByKey.set(buildKey(entry.topic, entry.intent), entry);
      const list = intentsByTopic.get(entry.topic) ?? [];
      list.push(entry);
      intentsByTopic.set(entry.topic, list);
    }
  }
}

export const intentCatalog = catalogEntries;

export function listIntentsByTopic(topic: string) {
  return intentsByTopic.get(topic) ?? [];
}

export function getIntentDefinition(topic: string, intent: string) {
  return catalogByKey.get(buildKey(topic, intent));
}

export function findIntent(intent: string) {
  for (const entry of catalogEntries) {
    if (entry.intent === intent) return entry;
  }
  return undefined;
}

export function validateIntentPayload(topic: string, intent: string, payload: Record<string, unknown>) {
  const definition = getIntentDefinition(topic, intent);
  if (!definition) {
    return {
      success: false,
      error: `Intent ${intent} not found under topic ${topic}`,
      issues: [],
    } as const;
  }

  const result = definition.schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data } as const;
  }

  return {
    success: false,
    error: "validation_error",
    issues: result.error.issues,
  } as const;
}

export function buildMetadataFromIntent(entry: IntentCatalogEntry): IntentMetadata {
  return {
    topic: entry.topic,
    subtopic: entry.subtopic,
    intent: entry.intent,
    confidence: 0,
    agent: "",
  };
}
  initial_stage: stringField(),
  last_contacted: dateField(),
  occupation: stringField(),
  premium_term: numberLikeField(),
  report_type: stringField(),
  source: stringField(),
