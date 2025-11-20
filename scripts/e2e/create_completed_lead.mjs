// Seed a lead that has completed Fact Finding, FNA, Recommendation, and Quotation
// Usage: node scripts/create_completed_lead.mjs "Lead Name" "+65 8123 4567" "lead@example.com"

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local into process.env for Supabase client
function bootstrapEnv() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const envPath = resolve(root, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (e) {
    console.warn('Could not load .env.local:', e?.message ?? e);
  }
}

bootstrapEnv();

const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''
);

if (!serviceRoleKey) {
  console.warn(
    '[seed] SUPABASE_SERVICE_ROLE_KEY not set. Running with anon key; row level security may block inserts.',
  );
} else {
  // Reuse the shared AdviseU client with elevated privileges for local seeding.
  process.env.VITE_SUPABASE_ANON_KEY = serviceRoleKey;
}

const { adviseUAdminApi } = await import('../src/admin/api/adviseUAdminApi.js');

function randomId(prefix = 'LEAD') {
  return `${prefix}-${Math.floor(Math.random() * 1e6).toString().padStart(6, '0')}`;
}

const leadName = process.argv[2] || 'Alex Tan';
const leadPhone = process.argv[3] || '+65 8123 4567';
const leadEmail = process.argv[4] || 'alex.tan@example.com';

console.log('Creating lead and completed proposal for:', leadName);

// 1) Create Lead
const lead = await adviseUAdminApi.entities.Lead.create({
  name: leadName,
  contact_number: leadPhone,
  email: leadEmail,
  status: 'Proposal',
});

// 2) Create Proposal for the lead
const proposal = await adviseUAdminApi.entities.Proposal.create({
  proposal_number: randomId('PRO'),
  lead_id: lead.id,
  proposer_name: lead.name,
  stage: 'Quotation',
  status: 'In Progress',
  completion_percentage: 80,
});

// 3) Build completed stage payloads
const factFinding = {
  personal_details: {
    title: 'Mr',
    name: lead.name,
    gender: 'Male',
    nric: 'S1234567A',
    date_of_birth: '1988-05-12',
    nationality: 'Singaporean',
    smoker_status: false,
    marital_status: 'Married',
    occupation: 'Engineer',
    phone_number: lead.contact_number,
    email: lead.email,
    address: '123 Example Street, #08-01, Singapore 123456',
  },
  dependents: [
    { title: 'Mrs', name: 'Jo Tan', gender: 'Female', nric: 'S7654321B', date_of_birth: '1990-03-20', relationship: 'Spouse' },
    { title: 'Ms', name: 'Ivy Tan', gender: 'Female', nric: 'T0123456C', date_of_birth: '2018-09-10', relationship: 'Child' },
  ],
  cka: { qualifications: ['CMFAS'], work_experience: ['Unit Trusts'], transaction_frequency: '3-12', outcome: 'CKA Met' },
  rpq: {
    investment_years: '5-10',
    risk_tolerance: '20-30',
    hold_duration: '5-10',
    finance_duration: '5-10',
    riskiest_assets: 'equities',
    retirement_years: '10',
    total_score: 18,
    risk_band: 'Medium to High Risk',
    assessed_at: new Date().toISOString(),
  },
};

const fna = {
  incomes: [ { source: 'Salary', amount: 8000, frequency: 'monthly' } ],
  expenses: [ { category: 'Household', amount: 3000 }, { category: 'Loans', amount: 1000 } ],
  assets: [ { type: 'Savings', amount: 50000 }, { type: 'Investments', amount: 80000 } ],
  liabilities: [ { type: 'Mortgage', amount: 200000 } ],
  existing_policies: [ { insurer: 'ABC Life', type: 'Life', coverage_amount: 100000, premium: 120, expiry_date: '2035-12-31' } ],
  affordability: 1000, // monthly
  needs_analysis: 'Requires higher life coverage and some CI protection.',
  goals: 'Provide income protection and start long-term savings.',
  recommended_percent: 0.12,
};

const recommendation = {
  recommendations: 'Balanced protection with term life and CI, plus small savings plan.',
  product_rationale: 'Fits budget ~12% income; aligned to Medium-High RPQ.',
  advice_confirmed: true,
  client_signature_date: new Date().toISOString().slice(0,10),
  client_signature_data: '',
  advisor_signature_data: '',
  selected_plan: {
    products: [
      { product_name: 'LifeShield Plus', product_code: 'LSP-001', coverage_type: 'Death', coverage_amount: 300000, premium: 600, premium_frequency: 'Annual' },
      { product_name: 'Care CI', product_code: 'CI-101', coverage_type: 'Critical Illness', coverage_amount: 100000, premium: 480, premium_frequency: 'Annual' },
    ],
  },
};

const quotation = {
  life_assured: [
    {
      title: factFinding.personal_details.title,
      name: factFinding.personal_details.name,
      gender: factFinding.personal_details.gender,
      date_of_birth: factFinding.personal_details.date_of_birth,
      age: 36,
      smoker_status: factFinding.personal_details.smoker_status,
      occupation: factFinding.personal_details.occupation,
      occupation_class: 'Standard',
      is_primary: true,
    },
  ],
  quote_scenarios: [
    {
      id: 'main',
      name: 'Main Quotation',
      is_recommended: true,
      products: [
        {
          product_name: 'LifeShield Plus',
          product_code: 'LSP-001',
          coverage_type: 'Death',
          sum_assured: 300000,
          premium_amount: 600,
          premium_frequency: 'Annual',
          policy_term: '20',
          payment_term: '20',
          life_assured_index: 0,
          riders: [ { code: 'ADB', name: 'Accidental Death Benefit', coverage_amount: 100000, premium_impact: 50 } ],
          available_riders: [],
        },
        {
          product_name: 'Care CI',
          product_code: 'CI-101',
          coverage_type: 'Critical Illness',
          sum_assured: 100000,
          premium_amount: 480,
          premium_frequency: 'Annual',
          policy_term: '20',
          payment_term: '20',
          life_assured_index: 0,
          riders: [],
          available_riders: [],
        }
      ],
    },
  ],
  active_scenario_id: 'main',
};

// 4) Update proposal with all stage payloads
const updated = await adviseUAdminApi.entities.Proposal.update(proposal.id, {
  fact_finding_data: factFinding,
  fna_data: fna,
  recommendation_data: recommendation,
  quotation_data: quotation,
  stage: 'Quotation',
  completion_percentage: 90,
});

console.log('\nCreated Lead:', lead.id, '-', lead.name);
console.log('Proposal:', updated.proposal_number, 'Stage:', updated.stage);
console.log('All stages populated. Open:', `ProposalDetail?id=${updated.id}`);
