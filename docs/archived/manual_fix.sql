-- 1. Force schema cache reload (Fixes 'missing module column' error)
NOTIFY pgrst, 'reload config';

-- 2. Ensure mira_chat_threads exists (Fixes 'Chat History' error if table missing)
CREATE TABLE IF NOT EXISTS public.mira_chat_threads (
  id text primary key,
  advisor_id text not null,
  title text,
  last_message_preview text,
  last_message_role text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  last_activity_at timestamptz default timezone('utc', now())
);

-- 3. Enable RLS and add policies for Chat Threads (Ensures access control)
ALTER TABLE public.mira_chat_threads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if they exist
DROP POLICY IF EXISTS "Advisors can view their own chats" ON public.mira_chat_threads;
DROP POLICY IF EXISTS "Advisors can insert their own chats" ON public.mira_chat_threads;
DROP POLICY IF EXISTS "Advisors can update their own chats" ON public.mira_chat_threads;
DROP POLICY IF EXISTS "Advisors can delete their own chats" ON public.mira_chat_threads;

CREATE POLICY "Advisors can view their own chats"
  ON public.mira_chat_threads FOR SELECT
  USING (auth.uid()::text = advisor_id);

CREATE POLICY "Advisors can insert their own chats"
  ON public.mira_chat_threads FOR INSERT
  WITH CHECK (auth.uid()::text = advisor_id);

CREATE POLICY "Advisors can update their own chats"
  ON public.mira_chat_threads FOR UPDATE
  USING (auth.uid()::text = advisor_id);

CREATE POLICY "Advisors can delete their own chats"
  ON public.mira_chat_threads FOR DELETE
  USING (auth.uid()::text = advisor_id);

-- 4. Ensure mira_behavioral_events has the module column
ALTER TABLE public.mira_behavioral_events 
ADD COLUMN IF NOT EXISTS module TEXT;

-- 5. Force cache reload again to be sure
NOTIFY pgrst, 'reload config';
