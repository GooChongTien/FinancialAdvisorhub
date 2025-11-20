
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Vocabulary Data (Embedded to avoid file read issues in Edge Runtime if needed, 
// but here we paste the content from docs/mira_domain_vocabulary.json)
const vocabulary = {
    "insurance_products": {
        "protection": [
            "term life", "term insurance", "whole life", "whole life insurance",
            "critical illness", "CI", "CI rider", "early CI", "multi-pay CI",
            "total permanent disability", "TPD", "TPD rider",
            "disability income", "DII", "income replacement",
            "accidental death", "AD&D", "personal accident"
        ],
        "health": [
            "shield plan", "integrated shield", "medishield", "medishield life",
            "hospitalization", "hospital plan", "rider B", "private hospital",
            "outpatient", "specialist", "panel doctor", "restructured hospital"
        ],
        "savings": [
            "endowment", "endowment plan", "savings plan", "maturity benefit",
            "annuity", "immediate annuity", "deferred annuity", "retirement income",
            "cash value", "surrender value", "non-participating", "participating"
        ],
        "investment": [
            "ILP", "investment-linked policy", "investment-linked",
            "universal life", "UL", "unit trust", "fund value",
            "sub-fund", "fund switching", "premium allocation", "top-up"
        ],
        "riders": [
            "rider", "supplementary benefit", "waiver of premium", "WOP",
            "payor benefit", "guaranteed insurability", "accelerated benefit"
        ]
    },
    "sales_process": {
        "stages": [
            "fact-find", "fact finding", "FNA", "financial needs analysis",
            "needs analysis", "gap analysis", "coverage gap",
            "quotation", "quote", "premium calculation", "pricing",
            "benefit illustration", "BI", "proposal", "product comparison",
            "application", "submission", "policy delivery", "case closed"
        ],
        "activities": [
            "initial contact", "first call", "cold call", "warm call",
            "appointment", "meeting", "client meeting", "presentation",
            "follow-up", "chase", "follow up call", "callback",
            "objection handling", "closing", "sign up", "commit"
        ],
        "outcomes": [
            "won", "closed", "issued", "accepted", "approved",
            "lost", "declined", "lapsed", "withdrawn", "cancelled",
            "pending", "in progress", "under review", "negotiating"
        ]
    },
    "underwriting": {
        "process": [
            "underwriting", "UW", "medical underwriting", "financial underwriting",
            "underwriter", "UW team", "submission", "submit for UW",
            "medical exam", "health declaration", "medical report", "APS",
            "attending physician statement", "blood test", "urine test",
            "financial questionnaire", "income proof", "proof of income"
        ],
        "decisions": [
            "approved", "standard", "accepted as applied",
            "loading", "extra premium", "premium loading", "rated",
            "exclusion", "exclusion clause", "specific exclusion",
            "postponed", "deferred", "pending", "counter-offer",
            "declined", "rejected", "uninsurable"
        ],
        "requirements": [
            "medical requirement", "financial requirement", "additional docs",
            "NRIC copy", "payslip", "CPF statement", "income tax", "NOA",
            "bank statement", "proof of address", "employment letter"
        ]
    },
    "customer_lifecycle": {
        "lead_stages": [
            "cold", "cold lead", "uncontacted",
            "warm", "warm lead", "contacted", "interested",
            "hot", "hot lead", "ready to buy", "high intent",
            "qualified", "qualified lead", "FNA done",
            "proposal", "BI presented", "quotation stage",
            "negotiation", "discussing", "objection",
            "client", "customer", "policyholder", "insured"
        ],
        "lead_sources": [
            "referral", "client referral", "word of mouth",
            "event", "roadshow", "seminar", "trade show", "networking",
            "social media", "facebook", "instagram", "linkedin",
            "cold call", "telemarketing", "outbound",
            "website", "online", "web inquiry", "landing page",
            "walk-in", "office visit"
        ],
        "relationship": [
            "prospect", "lead", "potential client",
            "client", "customer", "policyholder",
            "VIP", "high net worth", "HNW", "UHNW",
            "dormant", "inactive", "lapsed client"
        ]
    },
    "financial_terms": {
        "premium": [
            "premium", "annual premium", "monthly premium", "single premium",
            "regular premium", "limited pay", "pay to age 65", "whole life pay",
            "premium term", "payment term", "10-pay", "15-pay", "20-pay"
        ],
        "coverage": [
            "sum assured", "SA", "coverage amount", "death benefit", "benefit amount",
            "face value", "face amount", "coverage", "protection level",
            "policy term", "coverage period", "to age 65", "to age 99", "lifetime"
        ],
        "benefits": [
            "guaranteed", "non-guaranteed", "reversionary bonus", "terminal bonus",
            "maturity benefit", "survival benefit", "living benefit",
            "death benefit", "claim payout", "policy proceeds",
            "cash value", "surrender value", "paid-up value"
        ]
    },
    "regulatory_singapore": {
        "entities": [
            "MAS", "Monetary Authority of Singapore", "LIA", "Life Insurance Association",
            "GIA", "General Insurance Association", "CMFAS", "FECAA",
            "ComFEC", "Commercial and Financial Education Council",
            "FAIR", "Financial Advisers Industry Review"
        ],
        "compliance": [
            "PDPA", "personal data protection", "data privacy",
            "AML", "anti-money laundering", "KYC", "know your customer",
            "balanced scorecard", "fair dealing", "representative's reward",
            "RNF", "Representatives' Notification Framework"
        ],
        "documentation": [
            "NRIC", "national registration identity card",
            "FIN", "foreign identification number",
            "CPF", "central provident fund",
            "Singpass", "Singapore personal access",
            "Myinfo", "my info", "government data"
        ]
    },
    "advisor_terminology": {
        "metrics": [
            "conversion rate", "close rate", "hit rate",
            "persistency", "lapse rate", "retention",
            "AUM", "assets under management", "MDRT", "COT", "TOT",
            "FYC", "first year commission", "renewal", "trailer fee",
            "production", "sales volume", "case count", "new business"
        ],
        "activities": [
            "prospecting", "lead generation", "networking",
            "cross-sell", "up-sell", "top-up", "increase coverage",
            "annual review", "policy review", "needs review",
            "servicing", "claims", "amendments", "endorsement"
        ],
        "tools": [
            "ePOS", "eApp", "electronic application",
            "quote engine", "quotation system", "illustration system",
            "CRM", "customer relationship management",
            "BI system", "benefit illustration system"
        ]
    },
    "common_abbreviations": [
        "FNA", "BI", "CI", "TPD", "DII", "ILP", "UL", "WOP",
        "SA", "MAS", "LIA", "PDPA", "NRIC", "CPF", "FIN",
        "UW", "APS", "NOA", "HNW", "UHNW", "MDRT", "COT", "TOT",
        "FYC", "AUM", "CRM", "ePOS"
    ],
    "intent_mappings": {
        "create_lead": [
            "referral", "event", "networking", "cold call", "walk-in",
            "prospect", "potential client", "interested party"
        ],
        "create_proposal": [
            "fact-find", "FNA", "needs analysis", "start proposal", "new case",
            "begin application", "sales process"
        ],
        "generate_quote": [
            "quotation", "quote", "BI", "benefit illustration", "pricing",
            "premium calculation", "how much", "cost"
        ],
        "submit_for_underwriting": [
            "submit", "UW", "underwriting", "application", "send to insurer",
            "medical review", "approval"
        ],
        "create_task": [
            "follow-up", "reminder", "chase", "callback", "schedule",
            "to-do", "task", "appointment"
        ],
        "search_products": [
            "product", "plan", "shield", "term life", "whole life", "ILP",
            "protection", "savings", "investment", "retirement"
        ],
        "view_performance": [
            "dashboard", "analytics", "metrics", "KPI", "stats", "numbers",
            "performance", "conversion", "sales", "production"
        ]
    }
};

async function ingest() {
    console.log("Starting ingestion...");

    // 1. Ingest Topics and Subtopics
    for (const [topic, content] of Object.entries(vocabulary)) {
        if (topic === "common_abbreviations" || topic === "intent_mappings") continue;

        for (const [subtopic, phrases] of Object.entries(content)) {
            // Insert Topic
            const { error: topicError } = await supabase
                .from('mira_topics')
                .upsert({
                    topic,
                    subtopic,
                    description: `Vocabulary for ${topic} - ${subtopic}`
                }, { onConflict: 'topic, subtopic' });

            if (topicError) {
                console.error(`Error inserting topic ${topic}/${subtopic}:`, topicError);
                continue;
            }

            // Create a generic intent for this subtopic to store the vocabulary phrases
            // This allows the intent classifier to match these phrases to this topic area
            const intentName = `discuss_${subtopic}`;
            const { error: intentError } = await supabase
                .from('mira_intents')
                .upsert({
                    topic,
                    subtopic,
                    intent_name: intentName,
                    display_name: `Discuss ${subtopic}`,
                    description: `General discussion about ${subtopic}`,
                    example_phrases: phrases
                }, { onConflict: 'topic, subtopic, intent_name' });

            if (intentError) {
                console.error(`Error inserting intent ${intentName}:`, intentError);
            } else {
                console.log(`Ingested ${topic}/${subtopic} with ${phrases.length} phrases.`);
            }
        }
    }

    // 2. Ingest Explicit Intent Mappings
    const intentMappings = vocabulary.intent_mappings;
    for (const [intentName, phrases] of Object.entries(intentMappings)) {
        // We need a topic/subtopic for these. We'll map them to a 'general' topic or infer from name.
        // For simplicity, we'll put them under 'agent_actions' topic.

        const topic = 'agent_actions';
        const subtopic = 'core_workflow';

        // Ensure topic exists
        await supabase.from('mira_topics').upsert({
            topic,
            subtopic,
            description: 'Core agent actions'
        }, { onConflict: 'topic, subtopic' });

        const { error } = await supabase
            .from('mira_intents')
            .upsert({
                topic,
                subtopic,
                intent_name: intentName,
                display_name: intentName.replace('_', ' ').toUpperCase(),
                description: `Intent to ${intentName.replace('_', ' ')}`,
                example_phrases: phrases
            }, { onConflict: 'topic, subtopic, intent_name' });

        if (error) {
            console.error(`Error inserting action intent ${intentName}:`, error);
        } else {
            console.log(`Ingested action intent ${intentName} with ${phrases.length} phrases.`);
        }
    }

    console.log("Ingestion complete.");
}

ingest();
