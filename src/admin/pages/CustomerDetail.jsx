import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import TemperatureBadge from "@/admin/components/ui/TemperatureBadge";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import CustomerGapAnalysis from "@/admin/modules/customers/components/CustomerGapAnalysis";
import CustomerOverview from "@/admin/modules/customers/components/CustomerOverview";
import CustomerPortfolio from "@/admin/modules/customers/components/CustomerPortfolio";
import CustomerServicing from "@/admin/modules/customers/components/CustomerServicing";
import OurJourneyTimeline from "@/admin/modules/customers/components/OurJourneyTimeline";
import { createPageUrl } from "@/admin/utils";
import { calculateCustomerTemperature } from "@/lib/customer-temperature";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, FileText, TrendingUp, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get("id");
  const storageKey = `advisorhub:customer-detail-tab:${leadId ?? "default"}`;

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "overview";
    return window.sessionStorage.getItem(storageKey) ?? "overview";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored) {
      setActiveTab(stored);
    } else {
      setActiveTab("overview");
    }
  }, [storageKey]);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: async () => {
      const leads = await adviseUAdminApi.entities.Lead.filter({ id: leadId });
      return leads[0] || null;
    },
    enabled: !!leadId,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies", leadId],
    queryFn: () => adviseUAdminApi.entities.Policy.filter({ lead_id: leadId }),
    enabled: !!leadId && lead?.is_client,
  });

  const { data: leadMilestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ["customer-milestones", leadId],
    queryFn: () => adviseUAdminApi.entities.Milestone.list({ lead_id: leadId }),
    enabled: !!leadId,
  });

  const normalizedMilestones = useMemo(
    () =>
      leadMilestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.milestone_title ?? milestone.title,
        description: milestone.milestone_description ?? milestone.description,
        date: milestone.milestone_date ?? milestone.date,
        category: (milestone.category || "general").toLowerCase(),
        status:
          milestone.status ??
          (milestone.milestone_date && new Date(milestone.milestone_date) < new Date()
            ? "completed"
            : "upcoming"),
        celebrated: milestone.is_celebrated,
        celebrationMethod: milestone.celebration_method,
      })),
    [leadMilestones],
  );

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

  useEffect(() => {
    if (!normalizedMilestones.length || selectedMilestoneId) return;
    setSelectedMilestoneId(normalizedMilestones[0].id);
  }, [normalizedMilestones, selectedMilestoneId]);

  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId) return null;
    return normalizedMilestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null;
  }, [normalizedMilestones, selectedMilestoneId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, activeTab);
  }, [storageKey, activeTab]);

  // Ensure the tab value is always valid for the current lead type
  // Ensure the tab value is always valid for the current lead type
  const validTabs = ["overview"];
  if (lead?.is_client) {
    validTabs.push("portfolio", "servicing");
    if (lead.customer_type !== "Entity") {
      validTabs.push("gap");
    }
  }
  const normalizedActiveTab = validTabs.includes(activeTab)
    ? activeTab
    : validTabs[0];

  useEffect(() => {
    if (!lead) return;
    if (normalizedActiveTab !== activeTab) {
      setActiveTab(normalizedActiveTab);
    }
  }, [lead, activeTab, normalizedActiveTab]);

  useMiraPageData(
    () => ({
      view: "customer_detail",
      leadId,
      isClient: Boolean(lead?.is_client),
      activeTab: normalizedActiveTab,
    }),
    [leadId, lead?.is_client, normalizedActiveTab],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Lead not found</p>
      </div>
    );
  }

  const getAge = () => {
    if (!lead.date_of_birth) return null;
    const today = new Date();
    const birthDate = new Date(lead.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Back Arrow - Top Left Edge */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(createPageUrl("Customer"))}
          className="absolute left-8 top-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="mb-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
              <Badge className={lead.is_client ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                {lead.is_client ? "Existing" : "New"}
              </Badge>
              <TemperatureBadge
                {...calculateCustomerTemperature({
                  lastInteractionAt: lead.last_contacted,
                  activeProposals: lead.active_proposals ?? 0,
                  openServiceRequests: lead.open_service_requests ?? 0,
                })}
              />
            </div>
            <div className="flex items-center gap-4 text-slate-600 text-sm">
              {lead.customer_type !== "Entity" && getAge() && (
                <span>{getAge()} years old</span>
              )}
              {lead.customer_type === "Entity" && lead.industry && (
                <span>{lead.industry}</span>
              )}
              <span>•</span>
              <span>
                {lead.active_proposals ?? 0} active{" "}
                {(lead.active_proposals ?? 0) === 1 ? "proposal" : "proposals"}
              </span>
              <span>•</span>
              <span>
                {lead.open_service_requests ?? 0} service{" "}
                {(lead.open_service_requests ?? 0) === 1 ? "request" : "requests"}
              </span>
              {lead.is_client && (
                <>
                  <span>•</span>
                  <span>
                    {policies.length} active{" "}
                    {policies.length === 1 ? "policy" : "policies"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="text-xs text-slate-500 mb-4">
            <span className="cursor-pointer hover:text-primary-600" onClick={() => navigate(createPageUrl("Customer"))}>Customers</span>
            <span className="mx-2">/</span>
            <span>{lead.name}</span>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={normalizedActiveTab} onValueChange={setActiveTab}>
            <TabsList className="border border-slate-200 bg-white p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
              >
                <User className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              {lead.is_client && (
                <>
                  <TabsTrigger
                    value="portfolio"
                    className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger
                    value="servicing"
                    className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Servicing
                  </TabsTrigger>
                  {lead.customer_type !== "Entity" && (
                    <TabsTrigger
                      value="gap"
                      className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Gap & Opportunity
                    </TabsTrigger>
                  )}
                </>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div >

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={normalizedActiveTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            <div className="space-y-6">
              <Card className="shadow-lg border-slate-200 overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    Our Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <OurJourneyTimeline
                    milestones={normalizedMilestones}
                    activeId={selectedMilestoneId}
                    onSelect={(milestone) => setSelectedMilestoneId(milestone.id)}
                    emptyMessage="No milestones captured yet."
                    className="border-none shadow-none"
                  />
                </CardContent>
              </Card>
              <CustomerOverview lead={lead} />
            </div>
          </TabsContent>

          {lead.is_client && (
            <>
              <TabsContent value="portfolio">
                <CustomerPortfolio lead={lead} policies={policies} />
              </TabsContent>

              <TabsContent value="servicing">
                <CustomerServicing lead={lead} />
              </TabsContent>

              <TabsContent value="gap">
                <CustomerGapAnalysis lead={lead} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
