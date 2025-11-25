-- Migration: Add exchange_rates table
-- Purpose: store currency conversion rates with effective dates

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate decimal(10, 6) NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(effective_date);

-- Ensure one rate per currency pair per day
ALTER TABLE exchange_rates
  ADD CONSTRAINT exchange_rates_pair_date_unique UNIQUE (from_currency, to_currency, effective_date);

-- Ensure positive rates
ALTER TABLE exchange_rates
  ADD CONSTRAINT check_positive_rate CHECK (rate > 0);

-- Prevent redundant same-currency conversions
ALTER TABLE exchange_rates
  ADD CONSTRAINT exchange_rates_distinct_currencies CHECK (from_currency <> to_currency);
