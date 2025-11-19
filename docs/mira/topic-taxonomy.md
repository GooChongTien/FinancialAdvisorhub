# Mira Topic Taxonomy – Structure & Conventions

> Reference for contributors editing `docs/mira_topics.json`. Use this when proposing new modules, subtopics, or intents so naming stays consistent across the Router, Skill Agents, and UI.

## File Layout

```
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": "1.0.0",
  "metadata": { ... },
  "topics": [
    {
      "topic": "customer",
      "display_name": "Customer Management",
      "description": "...",
      "subtopics": [
        {
          "subtopic": "lead_management",
          "display_name": "...",
          "intents": [
            {
              "intent_name": "create_lead",
              "display_name": "Create New Lead",
              "description": "...",
              "required_fields": [],
              "optional_fields": [],
              "ui_actions": [],
              "example_phrases": []
            }
          ]
        }
      ]
    }
  ]
}
```

### Naming Rules
- `topic`: snake_case module id (matches `MiraContext.module` + SkillAgent `module`)
- `subtopic`: snake_case grouping (max 3 words)
- `intent_name`: snake_case action id consumed by Intent Router + agents. Prefix complex actions with module when necessary (`broadcast__publish_campaign`)
- `display_name`: user-facing label (Sentence Case)

### Required Intent Fields
| Field | Purpose |
|-------|---------|
| `description` | Human-friendly summary for documentation |
| `required_fields` | Domain fields the agent/tool must have before execution |
| `optional_fields` | Fields that improve accuracy but are not blockers |
| `ui_actions` | Declarative hints for Inline UI executor |
| `example_phrases` | 3–5 representative user utterances for scoring |

### Conventions
- Example phrases should be full sentences written in the advisor’s voice and must include discriminating keywords mapped to tool actions.
- Keep required/optional field names aligned with Supabase column names or DTO fields exposed in `/agent-tools`.
- UI actions describe the canonical flow (navigate, prefill, execute). These values inform `createCRUDFlow` defaults and Insight previews.
- When adding a new topic or intent, also update:
  - `supabase/functions/_shared/services/router/intent-router.ts` cache warmers (no change needed if taxonomy JSON updated)
  - `docs/MIRA_CONSOLIDATED_IMPLEMENTATION_PLAN.md` Phase 0 success log
  - Relevant SkillAgent implementation + tests

### Versioning
- Increment `metadata.last_updated` whenever intents or field definitions change.
- Use a semantic `version` string (major.minor.patch) tied to router releases.
- Commit JSON + related test fixtures together with an ADR summarizing the change.

### Validation
- Run `npm run test:unit -- router.intent-router.test.ts` to ensure the new taxonomy compiles.
- Future improvement: add `npm run taxonomy:lint` (tracked in backlog).

### Appendix – Quick Reference
| Module | Subtopics (examples) | Sample Intents |
|--------|----------------------|----------------|
| `customer` | `lead_management`, `lead_detail` | `create_lead`, `update_lead_status`, `view_lead_detail` |
| `new_business` | `proposals`, `underwriting` | `new_business__proposals.create`, `new_business__underwriting.submit` |
| `product` | `search`, `comparison` | `product__products.search`, `product__products.compare` |
| `analytics` | `performance`, `trend` | `view_ytd_progress`, `view_stage_counts` |
| `todo` | `tasks`, `calendar` | `list_tasks`, `mark_complete`, `view_calendar` |
| `broadcast` | `campaigns`, `audience` | `broadcast__broadcasts.create`, `broadcast__broadcasts.publish` |
| `visualizer` | `plans`, `insights` | `visualizer__generatePlan`, `visualizer__compareScenario` |

Keep this document in sync with the JSON file whenever taxonomy updates land in main.
