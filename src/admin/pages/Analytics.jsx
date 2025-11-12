import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { TrendingUp, Users, Receipt, BarChart3 } from "lucide-react";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

function useAnalyticsData() {
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["analytics", "leads"],
    queryFn: () => adviseUAdminApi.entities.Lead.list("-updated_at", 2000),
  });

  const { data: policies = [], isLoading: loadingPolicies } = useQuery({
    queryKey: ["analytics", "policies"],
    queryFn: () => adviseUAdminApi.entities.Policy.list("-created_at", 2000),
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["analytics", "proposals"],
    queryFn: () => adviseUAdminApi.entities.Proposal.list("-last_updated", 2000),
  });

  return {
    leads,
    policies,
    proposals,
    loading: loadingLeads || loadingPolicies || loadingProposals,
  };
}

function lastNMonthsLabels(n = 12) {
  const arr = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    arr.push({
      key: `${dt.getFullYear()}-${dt.getMonth() + 1}`.padStart(7, "0"),
      label: dt.toLocaleString(undefined, { month: "short" }),
      ym: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return arr;
}

function groupByMonth(rows, dateField) {
  const map = new Map();
  rows.forEach((r) => {
    const raw = r?.[dateField] || r?.created_at || r?.updated_at || null;
    if (!raw) return;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return;
    const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    map.set(ym, (map.get(ym) || []).concat(r));
  });
  return map;
}

export default function Analytics() {
  const { leads, policies, proposals, loading } = useAnalyticsData();
  const [range, setRange] = useState("12M"); // 30D | 90D | YTD | 12M

  const monthsCount = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "30D":
        return 2; // show last 2 months for context
      case "90D":
        return 4; // ~last quarter
      case "YTD":
        return now.getMonth() + 1;
      default:
        return 12;
    }
  }, [range]);

  const rangeStartDate = useMemo(() => {
    const now = new Date();
    if (range === "30D") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    }
    if (range === "90D") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    }
    if (range === "YTD") {
      return new Date(now.getFullYear(), 0, 1);
    }
    return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  }, [range]);

  const months = useMemo(() => lastNMonthsLabels(monthsCount), [monthsCount]);

  const filtered = useMemo(() => {
    const inRange = (raw) => {
      if (!raw) return false;
      const d = new Date(raw);
      return !Number.isNaN(d) && d >= rangeStartDate;
    };
    return {
      policies: policies.filter((p) => inRange(p.created_at)),
      proposals: proposals.filter((p) => inRange(p.last_updated || p.updated_at)),
      leads: leads.filter((l) => inRange(l.created_at)),
    };
  }, [leads, policies, proposals, rangeStartDate]);

  const monthly = useMemo(() => {
    const byPolicy = groupByMonth(filtered.policies, "created_at");
    const byProposal = groupByMonth(filtered.proposals, "last_updated");
    const rows = months.map((m) => {
      const pol = byPolicy.get(m.ym) || [];
      const prop = byProposal.get(m.ym) || [];
      const totalPremium = pol.reduce(
        (acc, p) => acc + (Number(p.premium_amount) || 0),
        0,
      );
      return {
        month: m.label,
        policiesNew: pol.length,
        premium: Number(totalPremium.toFixed(0)),
        proposalsActive: prop.filter((x) => x.status === "In Progress").length,
      };
    });
    const teamAvg =
      rows.reduce((acc, r) => acc + r.policiesNew, 0) / (rows.length || 1);
    return rows.map((r) => ({ ...r, teamAvgPolicies: Number(teamAvg.toFixed(1)) }));
  }, [months, filtered.policies, filtered.proposals]);

  const kpis = useMemo(() => {
    const activeProposals = filtered.proposals.filter((p) => p.status === "In Progress").length;
    const totalPremium = filtered.policies.reduce(
      (acc, p) => acc + (Number(p.premium_amount) || 0),
      0,
    );
    return {
      newPolicies: filtered.policies.length,
      totalPremium,
      activeProposals,
      clients: filtered.leads.filter((l) => !!l.is_client).length,
    };
  }, [filtered.leads, filtered.policies, filtered.proposals]);

  const goals = useMemo(() => {
    const qPremiumTarget = 250000; // example target
    const qPremium = monthly.slice(-3).reduce((a, r) => a + r.premium, 0);
    const acquisitionTarget = 200;
    const acquisition = filtered.leads.length % acquisitionTarget; // placeholder
    return [
      {
        label: "Quarterly Premium Target",
        value: qPremium,
        target: qPremiumTarget,
      },
      {
        label: "New Client Acquisition",
        value: acquisition,
        target: acquisitionTarget,
      },
      {
        label: "Avg. Proposal Completion",
        value: Math.round(
          filtered.proposals.reduce((a, p) => a + (p.completion_percentage || 0), 0) /
            (filtered.proposals.length || 1),
        ),
        target: 100,
      },
    ];
  }, [monthly, filtered.leads, filtered.proposals]);

  useMiraPageData(
    () => ({
      view: "analytics_dashboard",
      range,
      leadsCount: filtered.leads.length,
      policiesCount: filtered.policies.length,
      proposalsCount: filtered.proposals.length,
    }),
    [range, filtered.leads.length, filtered.policies.length, filtered.proposals.length],
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics Dashboard"
        subtitle="A visualization-first view of your portfolio performance."
        icon={BarChart3}
        actions={(
          <div className="flex items-center gap-2">
            {[
              { k: "30D", label: "30D" },
              { k: "90D", label: "90D" },
              { k: "YTD", label: "YTD" },
              { k: "12M", label: "12M" },
            ].map((opt) => (
              <Button
                key={opt.k}
                variant={range === opt.k ? "default" : "outline"}
                className="h-9 px-3"
                onClick={() => setRange(opt.k)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        )}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">New Policies</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {kpis.newPolicies.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-primary-50 text-primary-700 p-2">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Premium</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ${Math.round(kpis.totalPremium).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 text-green-700 p-2">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Active Proposals</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {kpis.activeProposals.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 text-blue-700 p-2">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Clients</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {kpis.clients.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 text-slate-700 p-2">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ left: 10, right: 10 }}>
                  <defs>
                    <linearGradient id="colorPremium" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#137fec" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#137fec" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="premium"
                    stroke="#137fec"
                    fillOpacity={1}
                    fill="url(#colorPremium)"
                    name="Premium"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Policies vs Team Avg</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="policiesNew" fill="#137fec" name="New Policies" />
                  <Bar dataKey="teamAvgPolicies" fill="#22c55e" name="Team Avg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goal-based Tracker */}
      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Goal-Based Tracker</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {goals.map((g) => {
            const pct = Math.max(0, Math.min(100, Math.round((100 * g.value) / (g.target || 1))));
            return (
              <div key={g.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-slate-700 font-medium">{g.label}</p>
                  <p className="text-sm text-slate-500">{pct}%</p>
                </div>
                <div className="w-full bg-primary/20 rounded-full h-2.5">
                  <div
                    className="bg-primary-600 h-2.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {g.value.toLocaleString()} / {g.target.toLocaleString()}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-6 h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">{content}</div>
    </div>
  );
}
