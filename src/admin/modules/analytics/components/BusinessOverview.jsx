import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { BarChart3, PieChart as PieChartIcon, Receipt, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

function lastNMonthsLabels(n = 12) {
    const arr = [];
    const d = new Date();
    d.setDate(1);
    for (let i = n - 1; i >= 0; i--) {
        const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const ym = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        arr.push({
            key: ym,
            label: dt.toLocaleString(undefined, { month: "short" }),
            ym,
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

const PRODUCT_COLORS = ["#137fec", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#f59e0b"];
const FUNNEL_COLORS = ["#0ea5e9", "#6366f1", "#22c55e", "#f97316"];

export default function BusinessOverview() {
    const { leads, policies, proposals, loading } = useAnalyticsData();
    const [range, setRange] = useState("12M"); // 30D | 90D | YTD | 12M
    const [drilldown, setDrilldown] = useState(null);

    const monthsCount = useMemo(() => {
        const now = new Date();
        switch (range) {
            case "30D":
                return 2;
            case "90D":
                return 4;
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
            const totalPremium = pol.reduce((acc, p) => acc + (Number(p.premium_amount) || 0), 0);
            return {
                month: m.label,
                policiesNew: pol.length,
                premium: Number(totalPremium.toFixed(0)),
                proposalsActive: prop.filter((x) => x.status === "In Progress").length,
            };
        });
        const teamAvg = rows.reduce((acc, r) => acc + r.policiesNew, 0) / (rows.length || 1);
        return rows.map((r) => ({ ...r, teamAvgPolicies: Number(teamAvg.toFixed(1)) }));
    }, [months, filtered.policies, filtered.proposals]);

    const kpis = useMemo(() => {
        const activeProposals = filtered.proposals.filter((p) => p.status === "In Progress").length;
        const totalPremium = filtered.policies.reduce((acc, p) => acc + (Number(p.premium_amount) || 0), 0);
        return {
            newPolicies: filtered.policies.length,
            totalPremium,
            activeProposals,
            clients: filtered.leads.filter((l) => !!l.is_client).length,
        };
    }, [filtered.leads, filtered.policies, filtered.proposals]);

    const averageCompletion = useMemo(() => {
        return Math.round(
            filtered.proposals.reduce((a, p) => a + (p.completion_percentage || 0), 0) /
            (filtered.proposals.length || 1),
        );
    }, [filtered.proposals]);

    const goals = useMemo(() => {
        const qPremiumTarget = 250000;
        const qPremium = monthly.slice(-3).reduce((a, r) => a + r.premium, 0);
        const acquisitionTarget = 200;
        const acquisition = filtered.leads.length;
        return [
            {
                label: "Quarterly Premium Target",
                value: qPremium,
                target: qPremiumTarget,
            },
            {
                label: "New Customer Acquisition",
                value: acquisition,
                target: acquisitionTarget,
            },
            {
                label: "Avg. Proposal Completion",
                value: averageCompletion,
                target: 100,
            },
        ];
    }, [monthly, filtered.leads.length, averageCompletion]);

    const productMix = useMemo(() => {
        const totals = new Map();
        filtered.policies.forEach((p) => {
            const key = p.product_name || p.plan_name || p.product_code || "Unknown";
            const current = totals.get(key) || { name: key, value: 0, premium: 0 };
            current.value += 1;
            current.premium += Number(p.premium_amount) || 0;
            totals.set(key, current);
        });
        return Array.from(totals.values()).sort((a, b) => b.value - a.value);
    }, [filtered.policies]);

    const topProducts = useMemo(() => {
        return [...productMix]
            .sort((a, b) => b.premium - a.premium)
            .slice(0, 5)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));
    }, [productMix]);

    const conversionFunnel = useMemo(
        () => [
            { stage: "Leads", value: filtered.leads.length },
            { stage: "Proposals", value: filtered.proposals.length },
            { stage: "Policies", value: filtered.policies.length },
        ],
        [filtered.leads.length, filtered.proposals.length, filtered.policies.length],
    );

    const completionGaugeData = useMemo(
        () => [{ name: "Completion", value: averageCompletion, fill: "#6366f1" }],
        [averageCompletion],
    );

    const handleDrillDown = (payload) => setDrilldown(payload);

    useMiraPageData(
        () => ({
            view: "analytics_dashboard",
            range,
            leadsCount: filtered.leads.length,
            policiesCount: filtered.policies.length,
            proposalsCount: filtered.proposals.length,
            drilldown,
            kpis,
        }),
        [range, filtered.leads.length, filtered.policies.length, filtered.proposals.length, drilldown, kpis],
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="mb-6 h-24 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
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
            </div>

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
                                <p className="text-slate-500 text-sm">Customers</p>
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle>Monthly Performance</CardTitle>
                        <span className="text-xs text-slate-500">Premium trend</span>
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
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <CardTitle>Policies vs Team Avg</CardTitle>
                        <span className="text-xs text-slate-500">click bars to drill</span>
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
                                    <Bar
                                        dataKey="policiesNew"
                                        fill="#137fec"
                                        name="New Policies"
                                        onClick={(data) => handleDrillDown({ type: "policies", month: data.month })}
                                    />
                                    <Bar dataKey="teamAvgPolicies" fill="#22c55e" name="Team Avg" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-4 w-4" /> Product Mix</CardTitle>
                        <span className="text-xs text-slate-500">click a slice</span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={productMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                                        {productMix.map((entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                                                onClick={() => handleDrillDown({ type: "product", product: entry.name })}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name, props) => {
                                            const payload = props && props.payload ? props.payload : {};
                                            return [`${value} policies`, payload.name || name || ""];
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                        <CardTitle>Conversion Funnel</CardTitle>
                        <span className="text-xs text-slate-500">tap to drill</span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={conversionFunnel} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis type="category" dataKey="stage" />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                                        {conversionFunnel.map((entry, index) => (
                                            <Cell
                                                key={entry.stage}
                                                fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                                                onClick={() => handleDrillDown({ type: "funnel", stage: entry.stage })}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                        <CardTitle>Completion Gauge</CardTitle>
                        <span className="text-xs text-slate-500">Avg. across proposals</span>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="relative h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    data={completionGaugeData}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar
                                        background
                                        dataKey="value"
                                        clockWise
                                        cornerRadius={12}
                                        fill="#6366f1"
                                        className="drop-shadow-sm"
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-3xl font-bold text-slate-900">{averageCompletion}%</p>
                                <p className="text-xs text-slate-500">Avg. completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                    <CardTitle>Goal-Based Tracker</CardTitle>
                    <span className="text-xs text-slate-500">Targets vs actuals</span>
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
                                <div className="w-full bg-primary/10 rounded-full h-2.5">
                                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    {g.value.toLocaleString()} / {g.target.toLocaleString()}
                                </p>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100 flex items-center justify-between">
                    <CardTitle>Top Performing Products</CardTitle>
                    <span className="text-xs text-slate-500">By total premium</span>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500">
                                    <th className="py-2 pr-4">Rank</th>
                                    <th className="py-2 pr-4">Product</th>
                                    <th className="py-2 pr-4">Policies</th>
                                    <th className="py-2 pr-4">Premium</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((item) => (
                                    <tr key={item.name} className="border-t border-slate-100">
                                        <td className="py-2 pr-4 font-semibold text-slate-900">#{item.rank}</td>
                                        <td className="py-2 pr-4">{item.name}</td>
                                        <td className="py-2 pr-4">{item.value}</td>
                                        <td className="py-2 pr-4">${Math.round(item.premium).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {topProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-slate-500">
                                            No product data available in this range.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {drilldown && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="font-semibold">Drill-down:</span> {JSON.stringify(drilldown)}
                </div>
            )}
        </div>
    );
}
