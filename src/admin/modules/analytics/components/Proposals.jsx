import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { CheckCircle2, Clock, DollarSign, FileText } from "lucide-react";
import { useMemo } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

const COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#6366f1", "#eab308"];

export default function Proposals() {
    const { proposals, loading } = useAnalyticsData();

    const kpis = useMemo(() => {
        const totalProposals = proposals.length;
        const activeProposals = proposals.filter((p) => p.status === "In Progress").length;
        const accepted = proposals.filter((p) => p.status === "Accepted" || p.status === "Completed").length;
        const successRate = totalProposals > 0 ? Math.round((accepted / totalProposals) * 100) : 0;

        // Mocking Avg Deal Size
        const avgDealSize = 3240;

        return {
            totalProposals,
            activeProposals,
            successRate,
            avgDealSize,
        };
    }, [proposals]);

    // Mock Data for Charts
    const trendData = [
        { month: "Jul", created: 12, completed: 8, rejected: 2 },
        { month: "Aug", created: 18, completed: 12, rejected: 3 },
        { month: "Sep", created: 15, completed: 10, rejected: 2 },
        { month: "Oct", created: 22, completed: 16, rejected: 4 },
        { month: "Nov", created: 28, completed: 20, rejected: 3 },
    ];

    const agingData = [
        { range: "0-7 days", value: 12 },
        { range: "8-14 days", value: 8 },
        { range: "15-30 days", value: 3 },
        { range: "30+ days", value: 1 },
    ];

    const productData = [
        { name: "Life", value: 35 },
        { name: "Health", value: 25 },
        { name: "Investment", value: 20 },
        { name: "General", value: 15 },
        { name: "Other", value: 5 },
    ];

    const conversionData = [
        { month: "Jul", rate: 65 },
        { month: "Aug", rate: 68 },
        { month: "Sep", rate: 66 },
        { month: "Oct", rate: 72 },
        { month: "Nov", rate: 75 },
    ];

    if (loading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">Total Proposals</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.totalProposals}</p>
                                    <span className="text-xs font-medium text-green-600">+14%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-50 text-blue-700 p-2">
                                <FileText className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">Active Proposals</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.activeProposals}</p>
                                    <span className="text-xs font-medium text-green-600">+5%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-orange-50 text-orange-700 p-2">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">Success Rate</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.successRate}%</p>
                                    <span className="text-xs font-medium text-green-600">+6%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-green-50 text-green-700 p-2">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">Avg. Deal Size</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">${kpis.avgDealSize.toLocaleString()}</p>
                                    <span className="text-xs font-medium text-green-600">+18%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-50 text-purple-700 p-2">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Proposal Trend Analysis</CardTitle>
                            <p className="text-sm text-slate-500">Created, completed, and rejected proposals</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name="Created" />
                                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Proposal Aging Analysis</CardTitle>
                            <p className="text-sm text-slate-500">Active proposals by age</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={agingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Proposals" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Proposals by Product Category</CardTitle>
                            <p className="text-sm text-slate-500">Proposal distribution across products</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {productData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Conversion Rate Trend</CardTitle>
                            <p className="text-sm text-slate-500">Success rate over time (%)</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={conversionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" />
                                    <YAxis domain={[0, 100]} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="rate" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" name="Success Rate" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
