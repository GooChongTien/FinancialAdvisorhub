import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Skeleton } from "@/admin/components/ui/skeleton";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { createPageUrl } from "@/admin/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Calculator,
  FileText,
  Filter,
  Send,
  Target,
  TrendingUp,
  Plus
} from "lucide-react";
import NewProposalModal from "@/admin/modules/proposal/components/NewProposalModal";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

const stageIcons = {
  "Fact Finding": FileText,
  "Financial Planning": TrendingUp,
  Recommendation: Target,
  Quotation: Calculator,
  Application: Send,
};

const stageColors = {
  "Fact Finding": "text-blue-600",
  "Financial Planning": "text-teal-700",
  Recommendation: "text-orange-600",
  Quotation: "text-green-600",
  Application: "text-primary-600",
};

export default function NewBusiness() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [initialModalState, setInitialModalState] = useState({ path: null, productId: null });

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => adviseUAdminApi.entities.Proposal.list("-updated_date"),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => adviseUAdminApi.entities.Lead.list(),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const leadId = params.get("leadId");
    const search = params.get("search");
    const journeyType = params.get("journeyType");
    const productId = params.get("productId");

    // If search param exists, set it to searchTerm
    if (search && search.trim()) {
      setSearchTerm(search.trim());
    }

    if (action === "new") {
      // Enforce single in-progress proposal per lead ONLY if leadId is present
      if (leadId) {
        const existing = proposals.find(
          (p) => p.lead_id === leadId && p.status === "In Progress",
        );
        if (existing) {
          navigate(createPageUrl(`ProposalDetail?id=${existing.id}`));
          return;
        }
      }

      if (leads.length > 0 || !leadId) {
        setSelectedLeadId(leadId);

        // Map journeyType param to modal path
        let path = null;
        if (journeyType === "QA") path = "qa";
        if (journeyType === "FULL" || journeyType === "GROUP") path = "ff";

        setInitialModalState({ path, productId });
        setIsNewProposalModalOpen(true);
      }
    }
  }, [location, proposals, leads, navigate]);

  const createProposalMutation = useMutation({
    mutationFn: async (payload) => {
      const { lead_id, journey_type, stage, product_id, product_name } = payload;
      const lead = leads.find((l) => l.id === lead_id);
      const proposalNumber = `PRO-${Date.now()}`;

      const fact_finding_data = {
        personal_details: {
          name: lead?.name || "",
          email: lead?.email || "",
          phone_number: lead?.phone || "",
        }
      };

      let quotation_data = {};
      if (journey_type === "QA" && product_name) {
        quotation_data = {
          quote_scenarios: [
            {
              id: "main",
              name: "Quick Quote",
              is_recommended: true,
              products: [
                {
                  product_name: product_name,
                  product_id: product_id,
                  premium_frequency: "Annual",
                  life_assured_index: 0
                }
              ]
            }
          ]
        };
      }

      return adviseUAdminApi.entities.Proposal.create({
        proposal_number: proposalNumber,
        lead_id: lead_id,
        proposer_name: lead?.name || "Unknown",
        journey_type: journey_type,
        stage: stage,
        product_id: product_id,
        product_name: product_name,
        status: "In Progress",
        completion_percentage: 0,
        last_updated: new Date().toISOString(),
        quotation_data,
        fact_finding_data,
      });
    },
    onSuccess: (newProposal) => {
      queryClient.invalidateQueries(["proposals"]);
      navigate(createPageUrl(`ProposalDetail?id=${newProposal.id}`));
    },
  });

  const handleCreateProposal = (payload) => {
    createProposalMutation.mutate(payload);
    setIsNewProposalModalOpen(false);
  };

  const filteredProposals = React.useMemo(() => {
    let result = proposals.filter((proposal) => {
      const matchesSearch =
        proposal.proposer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposal_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage =
        filterStage === "all" || proposal.stage === filterStage;
      const matchesStatus =
        filterStatus === "all" || proposal.status === filterStatus;
      return matchesSearch && matchesStage && matchesStatus;
    });

    // Apply sorting
    if (sortBy === "date-desc") {
      result.sort((a, b) => new Date(b.last_updated || b.updated_date) - new Date(a.last_updated || a.updated_date));
    } else if (sortBy === "date-asc") {
      result.sort((a, b) => new Date(a.last_updated || a.updated_date) - new Date(b.last_updated || b.updated_date));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.proposer_name.localeCompare(b.proposer_name));
    } else if (sortBy === "stage") {
      const stageOrder = ["Fact Finding", "Financial Planning", "Recommendation", "Quotation", "Application"];
      result.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));
    }

    return result;
  }, [proposals, searchTerm, filterStage, filterStatus, sortBy]);

  const totalProposals = proposals?.length ?? 0;
  const inProgressCount = proposals.filter((p) => p.status === "In Progress").length;

  useMiraPageData(
    () => ({
      view: "new_business_pipeline",
      searchTerm,
      filterStage,
      filterStatus,
      sortBy,
      totalProposals,
      filteredCount: filteredProposals.length,
      inProgressCount,
    }),
    [
      searchTerm,
      filterStage,
      filterStatus,
      sortBy,
      totalProposals,
      filteredProposals.length,
      inProgressCount,
    ],
  );

  const getStageProgress = (currentStage) => {
    const stages = [
      "Fact Finding",
      "Financial Planning",
      "Recommendation",
      "Quotation",
      "Application",
    ];
    const currentIndex = stages.indexOf(currentStage);
    return stages.map((stage, index) => ({
      stage,
      status:
        index < currentIndex
          ? "completed"
          : index === currentIndex
            ? "current"
            : "pending",
    }));
  };

  // Map display label to internal id used for computing numeric progress
  const STAGE_LABEL_TO_ID = {
    "Fact Finding": "fact-finding",
    "Financial Planning": "fna",
    Recommendation: "recommendation",
    Quotation: "quotation",
    Application: "application",
  };

  // Compute per-stage numeric progress (0-100) similar to Proposal Detail header
  const getStagePercent = (proposal, stageLabel) => {
    const stageId = STAGE_LABEL_TO_ID[stageLabel];
    try {
      switch (stageId) {
        case "fact-finding": {
          const ff = proposal?.fact_finding_data || {};
          const pd = ff.personal_details || {};
          const personalRequired = [
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

  const getStatusColor = (status) => {
    const colors = {
      "In Progress": "bg-blue-100 text-blue-700",
      "Pending for UW": "bg-yellow-100 text-yellow-700",
      "Pending for Payment": "bg-orange-100 text-orange-700",
      "Pending for Approval": "bg-purple-100 text-purple-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 space-y-6">
          <PageHeader
            title={t("newBusiness.title")}
            subtitle={t("newBusiness.subtitle")}
            icon={FileText}
            className="mb-0"
          >
            <Button onClick={() => {
              setSelectedLeadId(null);
              setInitialModalState({ path: null, productId: null });
              setIsNewProposalModalOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {t("newBusiness.cta.newProposal")}
            </Button>
          </PageHeader>

          {/* Unified Search/Filter/Sort Bar */}
          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder={t("newBusiness.searchPlaceholder")}
            filterButton={
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={filterStage !== "all" || filterStatus !== "all" ? "default" : "outline"}
                    size="icon"
                    className={filterStage !== "all" || filterStatus !== "all" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title={t("newBusiness.filters.title")}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">{t("newBusiness.filters.stage")}</h4>
                      <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("newBusiness.filters.stage")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("newBusiness.filters.allStages")}</SelectItem>
                          <SelectItem value="Fact Finding">{t("newBusiness.filters.stageOptions.factFinding")}</SelectItem>
                          <SelectItem value="Financial Planning">{t("newBusiness.filters.stageOptions.financialPlanning")}</SelectItem>
                          <SelectItem value="Recommendation">{t("newBusiness.filters.stageOptions.recommendation")}</SelectItem>
                          <SelectItem value="Quotation">{t("newBusiness.filters.stageOptions.quotation")}</SelectItem>
                          <SelectItem value="Application">{t("newBusiness.filters.stageOptions.application")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">{t("newBusiness.filters.status")}</h4>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("newBusiness.filters.allStatus")}</SelectItem>
                          <SelectItem value="In Progress">{t("newBusiness.filters.statusOptions.inProgress")}</SelectItem>
                          <SelectItem value="Pending for UW">{t("newBusiness.filters.statusOptions.pendingUw")}</SelectItem>
                          <SelectItem value="Completed">{t("newBusiness.filters.statusOptions.completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
            sortButton={
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={sortBy !== "date-desc" ? "default" : "outline"}
                    size="icon"
                    className={sortBy !== "date-desc" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title={t("newBusiness.sort.title")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">{t("newBusiness.sort.title")}</h4>
                    <div className="space-y-2">
                      <Button
                        variant={sortBy === "date-desc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("date-desc")}
                      >
                        {t("newBusiness.sort.latest")}
                      </Button>
                      <Button
                        variant={sortBy === "date-asc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("date-asc")}
                      >
                        {t("newBusiness.sort.oldest")}
                      </Button>
                      <Button
                        variant={sortBy === "name-asc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("name-asc")}
                      >
                        {t("newBusiness.sort.name")}
                      </Button>
                      <Button
                        variant={sortBy === "stage" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("stage")}
                      >
                        {t("newBusiness.sort.stage")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
          />
        </div>

        {/* Proposals List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-lg">
                  <CardContent className="p-6">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("newBusiness.empty.title")}
                </h3>
                <p className="text-slate-500">
                  {t("newBusiness.empty.body")}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProposals.map((proposal) => {
              const stageProgress = getStageProgress(proposal.stage);
              return (
                <Card
                  key={proposal.id}
                  className="shadow-lg border-slate-200 hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() =>
                    navigate(createPageUrl(`ProposalDetail?id=${proposal.id}`))
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {proposal.proposer_name}
                          </h3>
                          <Badge className={getStatusColor(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">Proposal #{proposal.proposal_number}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Last updated: {format(new Date(proposal.last_updated || proposal.updated_date), "MMM d, yyyy h:mm a")}</div>
                      </div>
                      {/* Inline stage tracker aligned right; widen connectors to pull left edge closer */}
                      <div className="ml-auto flex items-center mt-2 shrink-0">
                        <div className="flex items-center">
                          {stageProgress.map((item, index) => {
                            const Icon = stageIcons[item.stage];
                            const pct = getStagePercent(proposal, item.stage);
                            const showPie = pct > 0 && pct < 100;
                            const deg = pct * 3.6;
                            const isCurrent = item.status === "current";
                            return (
                              <React.Fragment key={item.stage}>
                                <div
                                  className={`relative ${showPie ? "h-14 w-14 rounded-full text-blue-600" : "h-12 w-12"} flex items-center justify-center transition-all`}
                                  style={showPie ? { backgroundImage: `conic-gradient(currentColor ${deg}deg, #E2E8F0 0)` } : undefined}
                                >
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${showPie
                                      ? (isCurrent ? "bg-blue-500 text-white ring-4 ring-primary-100" : "bg-blue-500 text-white")
                                      : item.status === "completed"
                                        ? "bg-green-500 text-white"
                                        : isCurrent
                                          ? "bg-primary-500 text-white ring-4 ring-primary-100"
                                          : "bg-slate-200 text-slate-400"
                                      }`}
                                  >
                                    <Icon className="w-6 h-6" />
                                  </div>
                                </div>
                                {index < stageProgress.length - 1 && (
                                  <div
                                    className={`w-10 h-1 mx-2 rounded transition-all ${item.status === "completed" ? "bg-green-500" : "bg-slate-200"
                                      }`}
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* In-row tracker above replaces standalone section */}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <NewProposalModal
        open={isNewProposalModalOpen}
        onOpenChange={setIsNewProposalModalOpen}
        onCreate={handleCreateProposal}
        leadId={selectedLeadId}
        initialPath={initialModalState.path}
        initialProductId={initialModalState.productId}
      />
    </div >
  );
}
