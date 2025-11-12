import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { formatCurrency } from "@/lib/utils";
import {
  Shield,
  Heart,
  PiggyBank,
  Sparkles,
  Umbrella,
  Calculator,
  Calendar,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

const coverageIcons = {
  Protection: Shield,
  Health: Heart,
  Savings: PiggyBank,
  Investment: Sparkles,
  Retirement: Umbrella,
};

const coverageColors = {
  Protection: "from-blue-500 to-blue-600",
  Health: "from-red-500 to-red-600",
  Savings: "from-green-500 to-green-600",
  Investment: "from-purple-500 to-purple-600",
  Retirement: "from-orange-500 to-orange-600",
};

export default function QuoteSummary() {
  const navigate = useNavigate();
  const { prefs } = usePreferences();
  const urlParams = new URLSearchParams(window.location.search);

  const quoteData = {
    productId: urlParams.get("productId"),
    productName: urlParams.get("productName"),
    productType: urlParams.get("productType"),
    age: urlParams.get("age"),
    gender: urlParams.get("gender"),
    smoker: urlParams.get("smoker"),
    sumAssured: urlParams.get("sumAssured"),
    policyTerm: urlParams.get("policyTerm"),
    monthly: urlParams.get("monthly"),
    annual: urlParams.get("annual"),
    total: urlParams.get("total"),
  };

  if (!quoteData.productName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500">No quote data found</p>
          <Button
            onClick={() => navigate(createPageUrl("Product"))}
            className="mt-4"
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const Icon = coverageIcons[quoteData.productType] || Shield;
  const gradientColor =
    coverageColors[quoteData.productType] || "from-slate-500 to-slate-600";

  const handleNewQuote = () => {
    navigate(createPageUrl("Product"));
  };

  const handleSaveQuote = () => {
    alert("Quote saved! (Feature to be implemented)");
  };

  const handleShareQuote = () => {
    alert("Share quote (Feature to be implemented)");
  };

  const handleStartFullProposal = async () => {
    try {
      const proposalNumber = `PRO-${Date.now()}`;
      // Minimal proposal seed from quick quote
      const payload = {
        proposal_number: proposalNumber,
        proposer_name: "", // advisor links client during Fact Finding
        status: "In Progress",
        stage: "Fact Finding",
        product_name: quoteData.productName,
        product_type: quoteData.productType,
        quick_quote_params: {
          age: quoteData.age,
          gender: quoteData.gender,
          smoker: quoteData.smoker,
          sum_assured: quoteData.sumAssured,
          policy_term: quoteData.policyTerm,
          monthly: quoteData.monthly,
          annual: quoteData.annual,
          total: quoteData.total,
          product_id: quoteData.productId,
        },
        last_updated: new Date().toISOString(),
      };
      const created = await (await import("@/admin/api/adviseUAdminApi")).adviseUAdminApi.entities.Proposal.create(payload);
      if (created?.id) {
        navigate(createPageUrl(`ProposalDetail?id=${created.id}`));
      } else {
        throw new Error("Failed to create proposal");
      }
    } catch (e) {
      alert(e?.message || "Unable to start full proposal");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                Quote Generated Successfully!
              </h1>
              <p className="text-primary-100 mt-1">
                Review your premium details below
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-slate-200 overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${gradientColor}`}></div>
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {quoteData.productName}
                  </CardTitle>
                  <Badge className="bg-slate-100 text-slate-700 mt-2">
                    {quoteData.productType}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-slate-200 bg-gradient-to-br from-primary-50 to-white">
              <CardHeader className="border-b border-primary-100">
                <CardTitle className="flex items-center gap-2 text-primary-900">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                  Premium Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center p-8 bg-white rounded-xl shadow-md mb-6">
                  <p className="text-sm text-slate-500 mb-2">
                    Recommended Monthly Premium
                  </p>
                  <p className="text-5xl font-bold text-primary-600 mb-4">
                    {formatCurrency(Number(quoteData.monthly), prefs)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Affordable monthly payment for your coverage
                  </p>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Premium Breakdown
                  </h3>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">Annual Premium</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(Number(quoteData.annual), prefs)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">
                        Total Premium ({quoteData.policyTerm} years)
                      </span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(Number(quoteData.total), prefs)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900 font-medium">
                        Sum Assured
                      </span>
                    </div>
                    <span className="text-xl font-bold text-blue-700">
                      {formatCurrency(Number(quoteData.sumAssured), prefs)}
                    </span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">
                      Excellent Value
                    </h4>
                  </div>
                  <p className="text-sm text-green-800">
                    For just <strong>{formatCurrency(Number(quoteData.monthly), prefs)}/month</strong>, you
                    get{" "}
                    <strong>
                      {formatCurrency(Number(quoteData.sumAssured), prefs)}
                    </strong>{" "}
                    in coverage - that's{" "}
                    {(
                      parseInt(quoteData.sumAssured) /
                      (parseFloat(quoteData.monthly) *
                        12 *
                        parseInt(quoteData.policyTerm))
                    ).toFixed(1)}
                    x your total premium paid!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="shadow-lg border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-sm">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Button className="w-full bg-primary-600 hover:bg-primary-700" onClick={handleStartFullProposal}>
                  Start Full Proposal
                </Button>
                <Button variant="outline" className="w-full" onClick={handleSaveQuote}>
                  Save Quote
                </Button>
                <Button variant="outline" className="w-full" onClick={handleShareQuote}>
                  Share with Client
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleNewQuote}>
                  New Quick Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
