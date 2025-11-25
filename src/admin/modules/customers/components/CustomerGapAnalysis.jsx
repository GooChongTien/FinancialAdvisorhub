import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import {
  RefreshCw,
  FileText,
  Share2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Shield,
  Home,
  Heart,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/admin/components/ui/dialog";
import { Badge } from "@/admin/components/ui/badge";
import { Progress } from "@/admin/components/ui/progress";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { formatCurrency as formatCurrencyShared } from "@/lib/utils";

// Icon mapping for restoring after localStorage
const iconMap = {
  death: Heart,
  disability: Shield,
  critical_illness: AlertTriangle,
  hospitalization: Home,
  retirement: Briefcase,
  education: GraduationCap,
};

// Restore icons after loading from localStorage
const restoreIcons = (analysis) => {
  if (!analysis || !analysis.gaps) return analysis;

  return {
    ...analysis,
    gaps: analysis.gaps.map(gap => ({
      ...gap,
      icon: iconMap[gap.type] || AlertCircle,
    })),
  };
};

export default function CustomerGapAnalysis({ lead }) {
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [deliveryMethod, setDeliveryMethod] = useState("download");

  // Load saved gap analysis on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`gap_analysis_${lead?.id}`);
    if (savedAnalysis) {
      const parsed = JSON.parse(savedAnalysis);
      const restored = restoreIcons(parsed);
      setGapAnalysis(restored);
    }

    const savedHistory = localStorage.getItem(`gap_history_${lead?.id}`);
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      const restoredHistory = parsedHistory.map(restoreIcons);
      setAnalysisHistory(restoredHistory);
    }
  }, [lead?.id]);

  // Generate gap analysis based on the customer's FNA and existing coverage
  const generateGapAnalysis = () => {
    setIsGenerating(true);

    // Simulate API call with realistic delay
    setTimeout(() => {
      const newAnalysis = calculateGapAnalysis();
      setGapAnalysis(newAnalysis);

      // Save to localStorage
      localStorage.setItem(
        `gap_analysis_${lead?.id}`,
        JSON.stringify(newAnalysis)
      );

      // Add to history
      const historyEntry = {
        ...newAnalysis,
        archived_date: newAnalysis.analysis_date,
      };
      const updatedHistory = [historyEntry, ...analysisHistory].slice(0, 10); // Keep last 10
      setAnalysisHistory(updatedHistory);
      localStorage.setItem(
        `gap_history_${lead?.id}`,
        JSON.stringify(updatedHistory)
      );

      setIsGenerating(false);
    }, 3000);
  };

  // Calculate gap analysis
  const calculateGapAnalysis = () => {
    // Get customer data from localStorage (supports legacy client_* key for compatibility)
    const customerRaw =
      localStorage.getItem(`customer_${lead?.id}`) ||
      localStorage.getItem(`client_${lead?.id}`) ||
      "{}";
    const customerData = JSON.parse(customerRaw);
    const fnaData = JSON.parse(
      localStorage.getItem(`fna_${lead?.id}`) || "{}"
    );
    const portfolioData = JSON.parse(
      localStorage.getItem(`portfolio_${lead?.id}`) || "[]"
    );

    const income = parseFloat(fnaData.monthly_income) || 50000;
    const dependents = parseInt(fnaData.number_of_dependents) || 2;
    const age = calculateAge(customerData.date_of_birth) || 35;
    const outstandingDebt =
      parseFloat(fnaData.total_outstanding_debt) || 200000;

    // Calculate recommended coverage amounts
    const recommendations = {
      death: {
        name: "Death Protection",
        icon: Heart,
        color: "red",
        recommended: income * 12 * 10 + outstandingDebt, // 10 years income + debt
        current: getCurrentCoverage(portfolioData, "death"),
        priority: "High",
        rationale:
          "Based on Human Life Value method: 10 years of income replacement plus outstanding debt coverage",
      },
      disability: {
        name: "Total Permanent Disability",
        icon: Shield,
        color: "orange",
        recommended: income * 12 * 8, // 8 years income
        current: getCurrentCoverage(portfolioData, "tpd"),
        priority: "High",
        rationale:
          "Coverage for loss of income and ongoing care needs in case of permanent disability",
      },
      critical_illness: {
        name: "Critical Illness",
        icon: AlertTriangle,
        color: "amber",
        recommended: income * 12 * 5, // 5 years income
        current: getCurrentCoverage(portfolioData, "ci"),
        priority: "High",
        rationale:
          "Coverage for treatment costs and income replacement during recovery period",
      },
      hospitalization: {
        name: "Hospitalization & Surgical",
        icon: Home,
        color: "blue",
        recommended: 100000, // Fixed amount for medical coverage
        current: getCurrentCoverage(portfolioData, "medical"),
        priority: "Medium",
        rationale:
          "Comprehensive medical coverage for hospital stays and surgical procedures",
      },
      retirement: {
        name: "Retirement Planning",
        icon: Briefcase,
        color: "green",
        recommended: income * 12 * 15, // 15 years for retirement
        current: getCurrentCoverage(portfolioData, "retirement"),
        priority: "Medium",
        rationale:
          "Build retirement fund to maintain lifestyle after retirement at age 65",
      },
      education: {
        name: "Education Fund",
        icon: GraduationCap,
        color: "purple",
        recommended: dependents * 150000, // $150k per dependent
        current: getCurrentCoverage(portfolioData, "education"),
        priority: dependents > 0 ? "Medium" : "Low",
        rationale:
          "Secure educational future for dependents including university costs",
      },
    };

    // Calculate gaps
    const gaps = Object.entries(recommendations).map(([key, rec]) => {
      const gap = rec.recommended - rec.current;
      const coverage_percentage = rec.recommended
        ? (rec.current / rec.recommended) * 100
        : 100;

      return {
        type: key,
        ...rec,
        gap: Math.max(0, gap),
        coverage_percentage: Math.min(100, coverage_percentage),
        status:
          coverage_percentage >= 80
            ? "adequate"
            : coverage_percentage >= 50
            ? "partial"
            : "critical",
      };
    });

    // Sort by priority and gap amount
    const sortedGaps = gaps.sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    });

    const criticalGaps = sortedGaps.filter((g) => g.status === "critical");
    const partialGaps = sortedGaps.filter((g) => g.status === "partial");
    const adequateGaps = sortedGaps.filter((g) => g.status === "adequate");

    const totalRecommended = gaps.reduce((sum, g) => sum + g.recommended, 0);
    const totalCurrent = gaps.reduce((sum, g) => sum + g.current, 0);
    const totalGap = totalRecommended - totalCurrent;
    const overallCoverage = (totalCurrent / totalRecommended) * 100;

    return {
      analysis_date: new Date().toISOString().split("T")[0],
      last_updated: new Date().toLocaleString(),
      customer_profile: {
        age,
        monthly_income: income,
        dependents,
        outstanding_debt: outstandingDebt,
      },
      gaps: sortedGaps,
      summary: {
        total_recommended: totalRecommended,
        total_current: totalCurrent,
        total_gap: Math.max(0, totalGap),
        overall_coverage_percentage: overallCoverage,
        critical_gaps: criticalGaps.length,
        partial_gaps: partialGaps.length,
        adequate_coverage: adequateGaps.length,
      },
      key_findings: generateKeyFindings(sortedGaps, overallCoverage),
      recommendations: generateRecommendations(sortedGaps),
    };
  };

  // Helper: Get current coverage from portfolio
  const getCurrentCoverage = (portfolio, coverageType) => {
    if (!Array.isArray(portfolio)) return 0;

    const typeMap = {
      death: ["life", "term life", "whole life"],
      tpd: ["tpd", "disability"],
      ci: ["critical illness", "ci"],
      medical: ["medical", "hospitalization", "health"],
      retirement: ["retirement", "endowment", "investment"],
      education: ["education", "savings"],
    };

    const relevantTypes = typeMap[coverageType] || [];

    return portfolio
      .filter((policy) => {
        const policyType = (policy.policy_type || "").toLowerCase();
        return (
          policy.status === "active" &&
          relevantTypes.some((t) => policyType.includes(t))
        );
      })
      .reduce((sum, policy) => sum + (parseFloat(policy.sum_assured) || 0), 0);
  };

  // Helper: Calculate age
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
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

  // Generate key findings
  const generateKeyFindings = (gaps, overallCoverage) => {
    const findings = [];

    if (overallCoverage < 50) {
      findings.push(
        `Overall protection level is ${overallCoverage.toFixed(1)}% - significantly below recommended levels`
      );
    } else if (overallCoverage < 80) {
      findings.push(
        `Overall protection at ${overallCoverage.toFixed(1)}% - moderate coverage gaps exist`
      );
    } else {
      findings.push(
        `Good overall protection at ${overallCoverage.toFixed(1)}% of recommended levels`
      );
    }

    const criticalGaps = gaps.filter((g) => g.status === "critical");
    if (criticalGaps.length > 0) {
      findings.push(
        `${criticalGaps.length} critical coverage gap(s) identified: ${criticalGaps.map((g) => g.name).join(", ")}`
      );
    }

    const highPriorityWithGaps = gaps.filter(
      (g) => g.priority === "High" && g.gap > 0
    );
    if (highPriorityWithGaps.length > 0) {
      findings.push(
        `High priority: Address ${highPriorityWithGaps.map((g) => g.name).join(" and ")} coverage`
      );
    }

    const largestGap = gaps.reduce((max, g) => (g.gap > max.gap ? g : max));
    if (largestGap.gap > 0) {
      findings.push(
        `Largest gap: ${largestGap.name} with ${formatCurrency(largestGap.gap)} shortfall`
      );
    }

    return findings;
  };

  // Generate recommendations
  const generateRecommendations = (gaps) => {
    const recommendations = [];

    gaps
      .filter((g) => g.gap > 0)
      .forEach((gap) => {
        let products = [];
        switch (gap.type) {
          case "death":
            products = ["Term Life Insurance", "Whole Life Insurance"];
            break;
          case "disability":
            products = [
              "TPD Rider",
              "Disability Income Insurance",
              "Integrated Shield Plan with TPD",
            ];
            break;
          case "critical_illness":
            products = [
              "Critical Illness Insurance",
              "Early CI Rider",
              "Multi-Pay CI Plan",
            ];
            break;
          case "hospitalization":
            products = [
              "Integrated Shield Plan",
              "MediShield Life Upgrade",
              "Hospitalization Rider",
            ];
            break;
          case "retirement":
            products = [
              "Retirement Annuity",
              "Investment-Linked Policy",
              "CPF Top-up",
            ];
            break;
          case "education":
            products = [
              "Education Savings Plan",
              "Endowment Policy",
              "Investment Plan",
            ];
            break;
        }

        recommendations.push({
          gap_type: gap.type,
          name: gap.name,
          gap_amount: gap.gap,
          priority: gap.priority,
          suggested_products: products,
          estimated_premium_range: estimatePremiumRange(gap.gap, gap.type),
          next_steps: `Schedule consultation to review ${gap.name.toLowerCase()} options`,
        });
      });

    return recommendations;
  };

  // Estimate premium range
  const estimatePremiumRange = (coverageAmount, type) => {
    // Rough premium estimation (actual would be from rating engine)
    const rates = {
      death: 0.002, // 0.2% of sum assured annually
      disability: 0.0015,
      critical_illness: 0.003,
      hospitalization: 0.001,
      retirement: 0.04, // 4% return assumption
      education: 0.035,
    };

    const annualPremium = coverageAmount * (rates[type] || 0.002);
    const monthlyMin = Math.round((annualPremium / 12) * 0.8);
    const monthlyMax = Math.round((annualPremium / 12) * 1.2);

    return {
      monthly_min: monthlyMin,
      monthly_max: monthlyMax,
      annual: Math.round(annualPremium),
    };
  };

  const { prefs } = usePreferences?.() ?? { prefs: { currency: "SGD", language: "en" } };
  // Format currency using advisor preference
  const formatCurrency = (amount) =>
    formatCurrencyShared(amount, {
      currency: prefs?.currency || "SGD",
      language: prefs?.language || "en",
    });

  // Get status details
  const getStatusDetails = (status) => {
    switch (status) {
      case "adequate":
        return {
          label: "Adequate",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle2,
        };
      case "partial":
        return {
          label: "Partial Coverage",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          icon: AlertCircle,
        };
      case "critical":
        return {
          label: "Critical Gap",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Unknown",
          color: "text-slate-600",
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          icon: AlertCircle,
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Handle report generation
  const handleGenerateReport = () => {
    setShowReportDialog(true);
  };

  // Handle report download/share
  const handleDeliverReport = () => {
    if (deliveryMethod === "download") {
      // Simulate PDF download
      alert(
        `Gap Analysis Report downloaded as ${reportFormat.toUpperCase()}`
      );
    } else if (deliveryMethod === "email") {
      // Simulate email sending
      alert(`Gap Analysis Report emailed to ${lead?.email || "customer"}`);
    }
    setShowReportDialog(false);
  };

  // If no analysis generated yet
  if (!gapAnalysis) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle>Gap Assessment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                No Gap Analysis Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Generate a comprehensive gap analysis to identify coverage
                opportunities for {lead?.name || "this customer"}
              </p>
              <Button
                onClick={generateGapAnalysis}
                disabled={isGenerating}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Gap Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Analysis Requirements</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">
                    Customer Information
                  </p>
                  <p className="text-sm text-slate-600">
                    Age, income, dependents, and financial obligations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">
                    Financial Needs Analysis
                  </p>
                  <p className="text-sm text-slate-600">
                    Completed FNA with protection needs calculated
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">
                    Current Coverage Portfolio
                  </p>
                  <p className="text-sm text-slate-600">
                    Existing policies and coverage amounts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render gap analysis results
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gap Analysis Summary</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Last updated: {gapAnalysis.last_updated}
              </p>
            </div>
            <div className="flex gap-2">
              {analysisHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryDialog(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  History ({analysisHistory.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={generateGapAnalysis}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-600 mb-1">
                Recommended Coverage
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(gapAnalysis.summary.total_recommended)}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600 mb-1">
                Current Coverage
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(gapAnalysis.summary.total_current)}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-600 mb-1">
                Total Gap
              </p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(gapAnalysis.summary.total_gap)}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600 mb-1">
                Coverage Level
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {gapAnalysis.summary.overall_coverage_percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Overall Coverage Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Overall Protection Adequacy
              </p>
              <p className="text-sm text-slate-600">
                {gapAnalysis.summary.overall_coverage_percentage.toFixed(1)}%
              </p>
            </div>
            <Progress
              value={gapAnalysis.summary.overall_coverage_percentage}
              className="h-3"
            />
          </div>

          {/* Gap Status Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-2xl font-bold text-red-700">
                {gapAnalysis.summary.critical_gaps}
              </p>
              <p className="text-sm text-red-600">Critical Gaps</p>
            </div>
            <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">
                {gapAnalysis.summary.partial_gaps}
              </p>
              <p className="text-sm text-amber-600">Partial Coverage</p>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                {gapAnalysis.summary.adequate_coverage}
              </p>
              <p className="text-sm text-green-600">Adequate Coverage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Key Findings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {gapAnalysis.key_findings.map((finding, index) => (
              <li key={index} className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{finding}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Detailed Gap Analysis */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Coverage Gap Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {gapAnalysis.gaps.map((gap) => {
              const statusDetails = getStatusDetails(gap.status);
              const Icon = gap.icon;
              const StatusIcon = statusDetails.icon;

              return (
                <div
                  key={gap.type}
                  className={`border rounded-lg p-4 ${statusDetails.borderColor} ${statusDetails.bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-${gap.color}-100 flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 text-${gap.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {gap.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(gap.priority)}
                          >
                            {gap.priority} Priority
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${statusDetails.color} border-current`}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusDetails.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">
                        Recommended
                      </p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(gap.recommended)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Current</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(gap.current)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Gap</p>
                      <p
                        className={`font-semibold ${gap.gap > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {formatCurrency(gap.gap)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">Coverage Adequacy</span>
                      <span className="font-medium text-slate-700">
                        {gap.coverage_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={gap.coverage_percentage} className="h-2" />
                  </div>

                  <p className="text-sm text-slate-600 italic">
                    {gap.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Recommendations & Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {gapAnalysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {rec.name}
                    </h4>
                    <p className="text-sm text-red-600 font-medium">
                      Coverage Gap: {formatCurrency(rec.gap_amount)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(rec.priority)}
                  >
                    {rec.priority}
                  </Badge>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Suggested Products:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rec.suggested_products.map((product, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-primary-50 text-primary-700 border border-primary-200"
                      >
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-600">
                      Estimated Premium:{" "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(rec.estimated_premium_range.monthly_min)}{" "}
                      - {formatCurrency(rec.estimated_premium_range.monthly_max)}
                      /month
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Next Step:</span>{" "}
                    {rec.next_steps}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-16 justify-start border-2 hover:border-primary-400"
              onClick={handleGenerateReport}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-600" />
                <span className="font-semibold">Generate Report</span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-16 justify-start border-2 hover:border-blue-400"
              onClick={() => {
                setDeliveryMethod("email");
                handleGenerateReport();
              }}
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Share with Customer</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Gap Analysis Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Report Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={reportFormat === "pdf" ? "default" : "outline"}
                  onClick={() => setReportFormat("pdf")}
                  className={
                    reportFormat === "pdf" ? "bg-primary-600 hover:bg-primary-700" : ""
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant={reportFormat === "docx" ? "default" : "outline"}
                  onClick={() => setReportFormat("docx")}
                  className={
                    reportFormat === "docx"
                      ? "bg-primary-600 hover:bg-primary-700"
                      : ""
                  }
                >
                  <FileText className="w-4 h-4 mr-2" />
                  DOCX
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Delivery Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={deliveryMethod === "download" ? "default" : "outline"}
                  onClick={() => setDeliveryMethod("download")}
                  className={
                    deliveryMethod === "download"
                      ? "bg-primary-600 hover:bg-primary-700"
                      : ""
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant={deliveryMethod === "email" ? "default" : "outline"}
                  onClick={() => setDeliveryMethod("email")}
                  className={
                    deliveryMethod === "email"
                      ? "bg-primary-600 hover:bg-primary-700"
                      : ""
                  }
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">
                Report Contents:
              </h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>✓ Executive Summary</li>
                <li>✓ Current Coverage Analysis</li>
                <li>✓ Identified Gaps & Priorities</li>
                <li>✓ Product Recommendations</li>
                <li>✓ Visual Charts & Graphs</li>
                <li>✓ Next Steps & Action Plan</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeliverReport}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {deliveryMethod === "download" ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gap Analysis History</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {analysisHistory.map((item, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
                onClick={() => {
                  setGapAnalysis(item);
                  setShowHistoryDialog(false);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900">
                    Analysis from {item.archived_date}
                  </p>
                  <Badge variant="secondary">
                    {item.summary.overall_coverage_percentage.toFixed(1)}%
                    Coverage
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Total Gap</p>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(item.summary.total_gap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Critical Gaps</p>
                    <p className="font-semibold text-red-600">
                      {item.summary.critical_gaps}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Adequate</p>
                    <p className="font-semibold text-green-600">
                      {item.summary.adequate_coverage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHistoryDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
