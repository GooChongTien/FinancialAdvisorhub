import React, { useEffect, useState } from "react";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import { ArrowLeft, User, Briefcase, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/admin/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { Skeleton } from "@/admin/components/ui/skeleton";
import CustomerOverview from "@/admin/modules/customers/components/CustomerOverview";
import CustomerPortfolio from "@/admin/modules/customers/components/CustomerPortfolio";
import CustomerServicing from "@/admin/modules/customers/components/CustomerServicing";
import CustomerGapAnalysis from "@/admin/modules/customers/components/CustomerGapAnalysis";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey, activeTab);
  }, [storageKey, activeTab]);

  // Ensure the tab value is always valid for the current lead type
  const validTabs = lead?.is_client
    ? ["overview", "portfolio", "servicing", "gap"]
    : ["overview"];
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
            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
            <div className="flex items-center gap-4 text-slate-600 text-sm">
              {getAge() && <span>{getAge()} years old</span>}
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
                  <TabsTrigger
                    value="gap"
                    className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Gap & Opportunity
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs value={normalizedActiveTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            <CustomerOverview lead={lead} />
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
