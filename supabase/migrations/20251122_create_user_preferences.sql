-- Migration: Create User Preferences Table
-- Date: 2025-11-22
-- Description: Creates table to store user preferences for i18n, currency, and personalization settings
-- Supporting multi-language (5 languages) and multi-currency features

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference (using TEXT to match profiles.id type)
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Localization preferences
  language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'zh', 'ms', 'ta', 'hi')),
  -- en: English, zh: Chinese, ms: Malay, ta: Tamil, hi: Hindi
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  timezone VARCHAR(50) DEFAULT 'Asia/Singapore',

  -- Currency preferences
  default_currency VARCHAR(10) DEFAULT 'SGD' CHECK (default_currency IN ('SGD', 'USD', 'MYR', 'CNY', 'INR', 'EUR', 'GBP')),
  show_currency_symbol BOOLEAN DEFAULT TRUE,
  decimal_places INTEGER DEFAULT 2 CHECK (decimal_places BETWEEN 0 AND 4),

  -- Number formatting
  thousand_separator VARCHAR(5) DEFAULT ',',
  decimal_separator VARCHAR(5) DEFAULT '.',

  -- UI/UX preferences
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  sidebar_collapsed BOOLEAN DEFAULT FALSE,
  compact_mode BOOLEAN DEFAULT FALSE,
  dashboard_layout JSONB DEFAULT '[]'::jsonb, -- Customizable dashboard widget layout

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notification_frequency VARCHAR(20) DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'daily', 'weekly', 'off')),

  -- Smart Plan (AI) preferences
  enable_ai_suggestions BOOLEAN DEFAULT TRUE,
  auto_schedule_tasks BOOLEAN DEFAULT FALSE,
  ai_suggestion_frequency VARCHAR(20) DEFAULT 'moderate' CHECK (ai_suggestion_frequency IN ('minimal', 'moderate', 'frequent')),

  -- Mira AI preferences
  mira_voice_enabled BOOLEAN DEFAULT FALSE,
  mira_proactive_assistance BOOLEAN DEFAULT TRUE,
  mira_learning_enabled BOOLEAN DEFAULT TRUE,

  -- Data privacy preferences
  allow_analytics BOOLEAN DEFAULT TRUE,
  allow_behavioral_tracking BOOLEAN DEFAULT TRUE,
  data_retention_days INTEGER DEFAULT 90 CHECK (data_retention_days BETWEEN 30 AND 365),

  -- Quick access favorites
  favorite_pages TEXT[] DEFAULT ARRAY[]::TEXT[],
  recent_searches JSONB DEFAULT '[]'::jsonb, -- Recent search history
  pinned_customers UUID[] DEFAULT ARRAY[]::UUID[], -- Quick access to favorite customers

  -- Custom settings (extensible)
  custom_settings JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'User preferences for localization, personalization, and feature settings';
COMMENT ON COLUMN user_preferences.language IS 'User interface language: en, zh, ms, ta, hi';
COMMENT ON COLUMN user_preferences.default_currency IS 'Default currency for financial displays';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme: light, dark, or auto (system)';
COMMENT ON COLUMN user_preferences.dashboard_layout IS 'JSON configuration for dashboard widget positions';
COMMENT ON COLUMN user_preferences.enable_ai_suggestions IS 'Whether to show AI-powered suggestions';
COMMENT ON COLUMN user_preferences.mira_proactive_assistance IS 'Allow Mira to provide proactive help';
COMMENT ON COLUMN user_preferences.allow_behavioral_tracking IS 'Allow tracking for personalization';
COMMENT ON COLUMN user_preferences.favorite_pages IS 'Array of frequently accessed page routes';
COMMENT ON COLUMN user_preferences.pinned_customers IS 'Array of customer IDs for quick access';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_language ON user_preferences(language);
CREATE INDEX IF NOT EXISTS idx_user_preferences_currency ON user_preferences(default_currency);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_preferences_timestamp ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to create default preferences when a new user is created
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default preferences for new user
  INSERT INTO user_preferences (user_id, language, default_currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.language, 'en'),
    COALESCE(NEW.currency, 'SGD')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON profiles;
CREATE TRIGGER trigger_create_default_preferences
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_user_preferences();

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

-- Backfill: Create preferences for existing users
INSERT INTO user_preferences (user_id, language, default_currency)
SELECT
  id as user_id,
  COALESCE(language, 'en') as language,
  COALESCE(currency, 'SGD') as default_currency
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;
