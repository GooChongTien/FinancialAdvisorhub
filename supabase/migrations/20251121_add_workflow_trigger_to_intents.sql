-- Add workflow trigger mapping to intents
-- This allows intents to automatically trigger specific workflows

ALTER TABLE mira_intents
ADD COLUMN IF NOT EXISTS trigger_workflow_id UUID REFERENCES mira_workflows(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_mira_intents_workflow ON mira_intents(trigger_workflow_id);

-- Add comment
COMMENT ON COLUMN mira_intents.trigger_workflow_id IS 'Optional workflow to trigger when this intent is detected';

-- Example: Link an intent to a workflow
-- UPDATE mira_intents
-- SET trigger_workflow_id = (SELECT id FROM mira_workflows WHERE name = 'FNA Data Capture Workflow' LIMIT 1)
-- WHERE intent_name = 'fna__capture_update_data';
