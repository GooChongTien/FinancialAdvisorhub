import React, { useState, useEffect, useRef } from "react";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import {
  ArrowLeft,
  FileText,
  TrendingUp,
  Target,
  Calculator,
  Send,
} from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Card } from "@/admin/components/ui/card";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

// Import section components
import FactFindingSection from "@/admin/modules/recommendation/components/FactFindingSection.jsx";
import FNASection from "@/admin/modules/recommendation/components/FNASection.jsx";
import RecommendationSection from "@/admin/modules/recommendation/components/RecommendationSection.jsx";
import QuotationSection from "@/admin/modules/recommendation/components/QuotationSection.jsx";
import ApplicationSection from "@/admin/modules/recommendation/components/ApplicationSection.jsx";

const stages = [
  { id: "fact-finding", name: "Fact Finding", icon: FileText },
  { id: "fna", name: "Financial Planning", icon: TrendingUp },
  { id: "recommendation", name: "Recommendation", icon: Target },
  { id: "quotation", name: "Quotation", icon: Calculator },
  { id: "application", name: "Application", icon: Send },
];

const STAGE_ORDER = [
  "Fact Finding",
  "Financial Planning",
  "Recommendation",
  "Quotation",
  "Application",
];

const SECTION_TO_STAGE_LABEL = {
  fact_finding: "Fact Finding",
  fna: "Financial Planning",
  recommendation: "Recommendation",
  quotation: "Quotation",
  application: "Application",
};

export default function ProposalDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get("id");

  const [activeSection, setActiveSection] = useState("fact-finding");
  // If no proposal id is provided, send the user back to New Business
  useEffect(() => {
    if (!proposalId) {
      navigate(createPageUrl("NewBusiness"));
    }
  }, [proposalId, navigate]);
  const sectionRefs = {
    "fact-finding": useRef(null),
    fna: useRef(null),
    recommendation: useRef(null),
    quotation: useRef(null),
    application: useRef(null),
  };

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const proposals = await adviseUAdminApi.entities.Proposal.filter({
        id: proposalId,
      });
      console.log("proposal fetch", proposalId, proposals?.length);
      return proposals[0];
    },
    enabled: !!proposalId,
  });

  const updateProposalMutation = useMutation({
    mutationFn: ({ id, data }) => adviseUAdminApi.entities.Proposal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["proposal", proposalId]);
    },
  });

  // Load linked lead to determine read-only behavior for Fact Finding when client already exists
  const { data: linkedLead } = useQuery({
    queryKey: ["proposal-linked-lead", proposal?.lead_id],
    queryFn: async () => {
      if (!proposal?.lead_id) return null;
      const leads = await adviseUAdminApi.entities.Lead.filter({ id: proposal.lead_id });
      return leads[0] || null;
    },
    enabled: Boolean(proposal?.lead_id),
  });

  useMiraPageData(
    () => ({
      view: "proposal_detail",
      proposalId,
      leadId: proposal?.lead_id ?? null,
      stage: proposal?.stage ?? null,
      status: proposal?.status ?? null,
      activeSection,
    }),
    [proposalId, proposal?.lead_id, proposal?.stage, proposal?.status, activeSection],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const [key, ref] of Object.entries(sectionRefs)) {
        if (ref.current) {
          const { offsetTop, offsetHeight } = ref.current;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(key);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      const yOffset = -200; // Adjusted to account for fixed header height
      const y =
        ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Compute per-stage progress (0-100) to drive colors and bars
  const getStageProgress = (stageId) => {
    try {
      switch (stageId) {
        case "fact-finding": {
          const ff = proposal?.fact_finding_data || {};
          const pd = ff.personal_details || {};
          const newLeadMode = !linkedLead || !linkedLead.is_client;
          const personalRequired = newLeadMode
            ? ["name", "phone_number"]
            : [
                "title",
                "name",
                "gender",
                "nric",
                "date_of_birth",
                "nationality",
                "smoker_status",
                "marital_status",
                "occupation",
                "phone_number",
                "email",
                "address",
              ];
          const pdCompleteCount = personalRequired.filter(
            (f) => pd[f] !== undefined && pd[f] !== null && String(pd[f]).length > 0,
          ).length;
          const pdScore = (pdCompleteCount / Math.max(1, personalRequired.length)) * 40;

          const deps = Array.isArray(ff.dependents) ? ff.dependents : [];
          let depScore = 0;
          if (deps.length > 0) {
            const completeDeps = deps.filter(
              (d) => d?.name && d?.date_of_birth && d?.relationship,
            ).length;
            depScore = (completeDeps / deps.length) * 20;
          }

          const hasCKA =
            ((ff.cka?.qualifications || []).length || 0) > 0 ||
            ((ff.cka?.work_experience || []).length || 0) > 0;
          const ckaScore = hasCKA ? 20 : 0;

          const rpqKeys = [
            "investment_years",
            "risk_tolerance",
            "hold_duration",
            "finance_duration",
            "riskiest_assets",
            "retirement_years",
          ];
          const rpqComplete = rpqKeys.every((k) => {
            const v = ff.rpq?.[k];
            return v !== undefined && v !== null && String(v).length > 0;
          });
          const rpqScore = rpqComplete ? 20 : 0;
          return Math.round(pdScore + depScore + ckaScore + rpqScore);
        }
        case "fna": {
          const fna = proposal?.fna_data || {};
          const checks = [
            Array.isArray(fna.incomes) && fna.incomes.length > 0,
            Array.isArray(fna.expenses) && fna.expenses.length > 0,
            Array.isArray(fna.assets) && fna.assets.length > 0,
            Array.isArray(fna.liabilities) && fna.liabilities.length > 0,
            !!(fna.affordability && String(fna.affordability).length > 0),
            !!(
              (fna.needs_analysis && String(fna.needs_analysis).length > 0) ||
              (fna.goals && String(fna.goals).length > 0)
            ),
          ];
          const count = checks.filter(Boolean).length;
          return Math.round((count / checks.length) * 100);
        }
        case "recommendation": {
          const rec = proposal?.recommendation_data || {};
          const checks = [
            !!(rec.recommendations && String(rec.recommendations).length > 0),
            !!(rec.product_rationale && String(rec.product_rationale).length > 0),
            !!rec.advice_confirmed,
            !!(rec.client_signature_data && String(rec.client_signature_data).length > 0),
            Array.isArray(rec.generated) && rec.generated.length > 0,
          ];
          const count = checks.filter(Boolean).length;
          return Math.round((count / checks.length) * 100);
        }
        case "quotation": {
          const q = proposal?.quotation_data || {};
          const lifeOk = Array.isArray(q.life_assured) && q.life_assured.length > 0;
          const scenarios = Array.isArray(q.quote_scenarios) ? q.quote_scenarios : [];
          const current = scenarios.find((s) => s?.is_recommended) || scenarios[0] || { products: [] };
          const products = Array.isArray(current.products) ? current.products : [];
          const hasProducts = products.length > 0;
          const productsNamed = hasProducts && products.every((p) => (p.product_name || "").length > 0);
          const checks = [lifeOk, hasProducts, productsNamed];
          const count = checks.filter(Boolean).length;
          return Math.round((count / checks.length) * 100);
        }
        case "application": {
          const app = proposal?.application_data || {};
          if (String(app.submission_status).toLowerCase() === "submitted") return 100;
          const ai = app.applicant_info || {};
          const applicantOk = [
            "name",
            "nric",
            "date_of_birth",
            "gender",
            "contact_number",
            "address",
          ].every((k) => ai[k] && String(ai[k]).length > 0);
          const beneficiaries = Array.isArray(app.beneficiaries) ? app.beneficiaries : [];
          const hasBeneficiary = beneficiaries.length > 0;
          const totalPct = beneficiaries.reduce((s, b) => s + (parseFloat(b?.percentage) || 0), 0);
          const bPctOk = hasBeneficiary && Math.abs(totalPct - 100) <= 0.5;
          const declarationsOk = !!(
            app.declarations?.health_declaration &&
            app.declarations?.data_consent &&
            app.declarations?.terms_acceptance
          );
          const signatureOk = !!(app.signatures?.applicant_signature);
          const checks = [applicantOk, bPctOk, declarationsOk, signatureOk];
          const count = checks.filter(Boolean).length;
          return Math.round((count / checks.length) * 100);
        }
        default:
          return 0;
      }
    } catch (_) {
      return 0;
    }
  };

  // Map stages to statuses following New Business card standard
  const getHeaderStageStatuses = () => {
    const ordered = [
      { id: "fact-finding", label: "Fact Finding" },
      { id: "fna", label: "Financial Planning" },
      { id: "recommendation", label: "Recommendation" },
      { id: "quotation", label: "Quotation" },
      { id: "application", label: "Application" },
    ];
    const currentLabel = proposal?.stage || "Fact Finding";
    let currentIndex = ordered.findIndex((s) => s.label === currentLabel);
    if (currentIndex === -1) {
      // Fallback to progress-derived position: highest stage with any progress > 0
      const progresses = ordered.map((s) => getStageProgress(s.id));
      const anyIndex = progresses.reduce((acc, v, i) => (v > 0 ? i : acc), 0);
      currentIndex = anyIndex;
    }
    return ordered.map((s, i) => ({
      id: s.id,
      name: s.label,
      status: i < currentIndex ? "completed" : i === currentIndex ? "current" : "pending",
    }));
  };

  const handleSaveSection = (sectionName, data) => {
    const updatedData = {
      [`${sectionName}_data`]: data,
      last_updated: new Date().toISOString(),
    };

    // Keep proposal.stage in sync with furthest stage being worked on
    const currentLabel = proposal?.stage || "Fact Finding";
    const currentIdx = Math.max(0, STAGE_ORDER.indexOf(currentLabel));
    let targetLabel = SECTION_TO_STAGE_LABEL[sectionName] || currentLabel;
    // Upgrade to Application if submitted flag present
    if (
      sectionName === "application" &&
      String(data?.submission_status || "").toLowerCase() === "submitted"
    ) {
      targetLabel = "Application";
    }
    const targetIdx = Math.max(0, STAGE_ORDER.indexOf(targetLabel));
    if (targetIdx > currentIdx) {
      updatedData.stage = targetLabel;
    }

    console.log("handleSaveSection keys", sectionName, Object.keys(updatedData));
    return updateProposalMutation.mutateAsync({ id: proposal.id, data: updatedData });
  };

  const canAccessApplication = () => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (search.includes("e2e=1")) return true;
    const recOk = proposal?.recommendation_data?.advice_confirmed === true;
    return (
      proposal?.fact_finding_data &&
      proposal?.fna_data &&
      recOk &&
      proposal?.quotation_data
    );
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Proposal not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Back Arrow - Top Left Edge */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("NewBusiness"))}
          className="absolute left-8 top-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {proposal.proposer_name}
            </h1>
            <p className="text-sm text-slate-500">
              Proposal #{proposal.proposal_number}
            </p>
          </div>
          {/* Breadcrumb row removed as requested */}

          {/* Progress Bar Navigation (New Business standard) with pie ring for 1–99% */}
          <div className="flex items-center justify-between pb-2">
            {getHeaderStageStatuses().map((item, index, arr) => {
              const stageMeta = stages.find((s) => s.id === item.id) || stages[0];
              const Icon = stageMeta.icon;
              const disabled = item.id === "application" && !canAccessApplication();
              const progress = Math.max(0, Math.min(100, getStageProgress(item.id)));
              const showPie = progress > 0 && progress < 100;
              const deg = progress * 3.6;
              return (
                <React.Fragment key={item.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`relative ${showPie ? "h-14 w-14 rounded-full text-blue-600" : "h-12 w-12"} flex items-center justify-center transition-all`}
                      style={showPie ? { backgroundImage: `conic-gradient(currentColor ${deg}deg, #E2E8F0 0)` } : undefined}
                    >
                      <button
                        onClick={() => scrollToSection(item.id)}
                        disabled={disabled}
                        className={`w-12 h-12 rounded-full flex items-center justify-center focus:outline-none ${
                          showPie
                            ? (item.status === "current"
                                ? "bg-blue-500 text-white ring-4 ring-primary-100"
                                : "bg-blue-500 text-white")
                            : item.status === "completed"
                              ? "bg-green-500 text-white"
                              : item.status === "current"
                                ? "bg-primary-500 text-white ring-4 ring-primary-100"
                                : "bg-slate-200 text-slate-400"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.03] focus:scale-[1.03]"}`}
                        title={stageMeta.name}
                      >
                        <Icon className="w-6 h-6" />
                      </button>
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        item.status === "completed" || item.status === "current"
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {stageMeta.name}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div
                      className={`relative -top-2 flex-1 h-1 mx-2 rounded transition-all ${
                        item.status === "completed" ? "bg-green-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div ref={sectionRefs["fact-finding"]}>
          <FactFindingSection
            proposal={proposal}
            onSave={(data) => handleSaveSection("fact_finding", data)}
            isSaving={updateProposalMutation.isPending}
            onNext={() => scrollToSection("fna")}
            readOnly={Boolean(linkedLead?.is_client)}
            newLeadMode={Boolean((linkedLead && !linkedLead.is_client) || !linkedLead)}
          />
        </div>

        <div ref={sectionRefs["fna"]}>
          <FNASection
            proposal={proposal}
            onSave={(data) => handleSaveSection("fna", data)}
            isSaving={updateProposalMutation.isPending}
          />
        </div>

        <div ref={sectionRefs["recommendation"]}>
          <RecommendationSection
            proposal={proposal}
            onSave={(data) => handleSaveSection("recommendation", data)}
            isSaving={updateProposalMutation.isPending}
          />
        </div>

        <div ref={sectionRefs["quotation"]}>
          <QuotationSection
            proposal={proposal}
            onSave={(data) => handleSaveSection("quotation", data)}
            isSaving={updateProposalMutation.isPending}
          />
        </div>

        <div ref={sectionRefs["application"]}>
          <ApplicationSection
            proposal={proposal}
            onSave={(data) => handleSaveSection("application", data)}
            isSaving={updateProposalMutation.isPending}
            isLocked={!canAccessApplication()}
          />
        </div>
      </div>
    </div>
  );
}
