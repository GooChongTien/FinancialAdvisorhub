import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { createPageUrl } from "@/admin/utils";
import {
  Activity,
  Building2,
  Check,
  Heart,
  PiggyBank,
  Plane,
  Shield,
  Smile,
  Sparkles,
  Stethoscope,
  Umbrella,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
const coverageTypes = [
  { type: "Hospitalisation", icon: Heart, color: "text-red-500" },
  { type: "Death", icon: Shield, color: "text-slate-700" },
  { type: "Critical Illness", icon: Activity, color: "text-orange-500" },
  { type: "TPD", icon: Umbrella, color: "text-blue-500" },
  { type: "Disability Income", icon: Activity, color: "text-purple-500" },
  { type: "Accidental", icon: Shield, color: "text-yellow-600" },
  { type: "Savings", icon: PiggyBank, color: "text-green-500" },
  { type: "Lifestyle", icon: Sparkles, color: "text-pink-500" },
  { type: "Travel", icon: Plane, color: "text-primary-500" },
];

const entityCoverageTypes = [
  { type: "Term Life", icon: Users, color: "text-slate-700" },
  { type: "Hospitalization", icon: Building2, color: "text-blue-600" },
  { type: "Medical", icon: Stethoscope, color: "text-red-500" },
  { type: "Outpatient Dental", icon: Smile, color: "text-cyan-500" },
  { type: "Outpatient Clinical", icon: Activity, color: "text-green-500" },
];
export default function CustomerPortfolio({ lead, policies }) {
  const navigate = useNavigate();
  const activeCoverageTypes = lead?.customer_type === "Entity" ? entityCoverageTypes : coverageTypes;
  const coveredTypes = new Set(policies.map((p) => p.coverage_type));
  const [sortBy, setSortBy] = React.useState("policyDate");
  const [sortDir, setSortDir] = React.useState("desc");
  const totals = React.useMemo(() => {
    const annualPremium = policies.reduce((sum, p) => {
      const mult = ({ Monthly: 12, Quarterly: 4, 'Semi-Annual': 2, Annual: 1 }[p.premium_frequency] || 1);
      return sum + ((Number(p.premium_amount) || 0) * mult);
    }, 0);
    const totalSumAssured = policies.reduce((sum, p) => sum + (Number(p.sum_assured) || 0), 0);
    const coveredCount = coveredTypes.size;
    const uncoveredCount = Math.max(0, activeCoverageTypes.length - coveredCount);
    return { annualPremium, totalSumAssured, coveredCount, uncoveredCount };
  }, [policies, activeCoverageTypes]);

  const sortedPolicies = React.useMemo(() => {
    const arr = [...policies];
    const dir = sortDir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      if (sortBy === "policyDate") {
        const ta = a.policy_start_date ? new Date(a.policy_start_date).getTime() : 0;
        const tb = b.policy_start_date ? new Date(b.policy_start_date).getTime() : 0;
        return (ta - tb) * dir;
      }
      if (sortBy === "premium") {
        const pa = Number(a.premium_amount ?? 0);
        const pb = Number(b.premium_amount ?? 0);
        return (pa - pb) * dir;
      }
      if (sortBy === "coverageType") {
        return String(a.coverage_type ?? "").localeCompare(String(b.coverage_type ?? "")) * dir;
      }
      return 0;
    });
  }, [policies, sortBy, sortDir]);

  const statusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Lapsed":
        return "bg-red-100 text-red-700";
      case "Surrendered":
        return "bg-amber-100 text-amber-700";
      case "Matured":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };
  return (
    <div className="space-y-6">
      {" "}
      {/* Coverage Overview */}{" "}
      <Card className="shadow-lg border-slate-200">
        {" "}
        <CardHeader className="border-b border-slate-100">
          {" "}
          <div className="flex items-center justify-between">
            <CardTitle>Coverage Overview</CardTitle>
            <div className="text-right">
              <p className="text-xs text-slate-500">Annual Premium</p>
              <p className="text-sm font-semibold text-slate-900">${totals.annualPremium.toLocaleString()}</p>
            </div>
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="pt-6">
          {" "}
          <div className="mb-4 text-xs text-slate-600">
            Covered: <span className="font-medium text-slate-900">{totals.coveredCount}</span> / {activeCoverageTypes.length} types · Total Coverage: <span className="font-medium text-slate-900">${totals.totalSumAssured.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {" "}
            {activeCoverageTypes.map(({ type, icon: Icon, color }) => {
              const isCovered = coveredTypes.has(type);
              return (
                <div
                  key={type}
                  className={`p-4 rounded-xl border-2 transition-all ${isCovered ? "bg-primary-50 border-primary-200" : "bg-slate-50 border-slate-200 opacity-50"}`}
                >
                  {" "}
                  <div className="flex items-center justify-between mb-2">
                    {" "}
                    <Icon
                      className={`w-6 h-6 ${isCovered ? "text-primary-600" : "text-slate-400"}`}
                    />{" "}
                    {isCovered ? (
                      <Check className="w-4 h-4 text-primary-600" />
                    ) : (
                      <X className="w-4 h-4 text-slate-400" />
                    )}{" "}
                  </div>{" "}
                  <p
                    className={`text-sm font-medium ${isCovered ? "text-slate-900" : "text-slate-500"}`}
                  >
                    {" "}
                    {type}{" "}
                  </p>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Active Policies */}{" "}
      <Card className="shadow-lg border-slate-200">
        {" "}
        <CardHeader className="border-b border-slate-100">
          {" "}
          <div className="flex items-center justify-between">
            <CardTitle>Active Policies</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policyDate">Policy Date</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="coverageType">Coverage Type</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-8"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              >
                {sortDir === "asc" ? "Asc" : "Desc"}
              </Button>
            </div>
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="pt-6">
          {" "}
          {policies.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {" "}
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />{" "}
              <p>No policies found</p>{" "}
            </div>
          ) : (
            <div className="space-y-4">
              {" "}
              {sortedPolicies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => navigate(createPageUrl(`PolicyDetail?id=${policy.id}`))}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${policy.status === "Active" ? "border-slate-200" : "border-slate-300 bg-slate-50"}`}
                >
                  {" "}
                  <div className="flex items-start justify-between mb-3">
                    {" "}
                    <div>
                      {" "}
                      <h4 className="font-semibold text-slate-900">
                        {policy.product_name}
                      </h4>{" "}
                      <p className="text-sm text-slate-500 mt-1">
                        Policy #{policy.policy_number}
                      </p>{" "}
                    </div>{" "}
                    <Badge className={statusBadgeClass(policy.status)}>
                      {policy.status}
                    </Badge>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {" "}
                    <div>
                      {" "}
                      <p className="text-slate-500">Coverage Type</p>{" "}
                      <p className="font-medium text-slate-900">
                        {policy.coverage_type}
                      </p>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="text-slate-500">Sum Assured</p>{" "}
                      <p className="font-medium text-slate-900">
                        ${policy.sum_assured?.toLocaleString()}
                      </p>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="text-slate-500">Premium</p>{" "}
                      <p className="font-medium text-slate-900">
                        ${policy.premium_amount?.toFixed(2)}
                      </p>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <p className="text-slate-500">Frequency</p>{" "}
                      <p className="font-medium text-slate-900">
                        {policy.premium_frequency}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}{" "}
        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
