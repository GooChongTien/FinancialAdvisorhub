import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Box, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
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

const COLORS = ["#3b82f6", "#f59e0b", "#a855f7", "#10b981"];

export default function Servicing() {
    const { policies, loading } = useAnalyticsData();
    const { t } = useTranslation();

    const kpis = useMemo(() => {
        // Mocking Servicing Data
        const totalRequests = 142;
        const pendingRequests = 18;
        const avgResolutionTime = 2.4; // days
        const satisfactionRate = 94; // %

        return {
            totalRequests,
            pendingRequests,
            avgResolutionTime,
            satisfactionRate,
        };
    }, [policies]);

    // Mock Data for Charts
    const trendData = [
        { month: "Jul", created: 22, pending: 2, resolved: 20 },
        { month: "Aug", created: 28, pending: 3, resolved: 25 },
        { month: "Sep", created: 25, pending: 3, resolved: 22 },
        { month: "Oct", created: 32, pending: 4, resolved: 28 },
        { month: "Nov", created: 36, pending: 5, resolved: 30 },
    ];

    const typeData = [
        { name: "Policy Change", value: 35 },
        { name: "Claim Submission", value: 28 },
        { name: "Document Request", value: 22 },
        { name: "Premium Payment", value: 15 },
    ];

    const statusData = [
        { status: "Completed", value: 120 },
        { status: "In Progress", value: 14 },
        { status: "Pending", value: 8 },
    ];

    const resolutionTimeData = [
        { range: "< 1 day", value: 45 },
        { range: "1-2 days", value: 38 },
        { range: "3-5 days", value: 28 },
        { range: "5-7 days", value: 18 },
        { range: "> 7 days", value: 13 },
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
                                <p className="text-slate-500 text-sm">{t("analytics.servicing.total")}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.totalRequests}</p>
                                    <span className="text-xs font-medium text-green-600">+8%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-50 text-blue-700 p-2">
                                <Box className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">{t("analytics.servicing.pending")}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.pendingRequests}</p>
                                    <span className="text-xs font-medium text-green-600">-12%</span>
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
                                <p className="text-slate-500 text-sm">{t("analytics.servicing.avgResolution")}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.avgResolutionTime} days</p>
                                    <span className="text-xs font-medium text-green-600">-15%</span>
                                </div>
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
                                <p className="text-slate-500 text-sm">{t("analytics.servicing.satisfaction")}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.satisfactionRate}%</p>
                                    <span className="text-xs font-medium text-green-600">+3%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-purple-50 text-purple-700 p-2">
                                <CheckCircle className="h-5 w-5" />
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
                            <CardTitle>{t("analytics.servicing.trendTitle")}</CardTitle>
                            <p className="text-sm text-slate-500">
                                {t("analytics.servicing.trendSubtitle")}
                            </p>
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
                                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} name={t("analytics.servicing.created")} />
                                    <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name={t("analytics.servicing.pending")} />
                                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name={t("analytics.servicing.resolved")} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("analytics.servicing.typeTitle")}</CardTitle>
                            <p className="text-sm text-slate-500">
                                {t("analytics.servicing.typeSubtitle")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {typeData.map((entry, index) => (
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
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("analytics.servicing.statusTitle")}</CardTitle>
                            <p className="text-sm text-slate-500">
                                {t("analytics.servicing.statusSubtitle")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="status" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t("analytics.servicing.requests")} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t("analytics.servicing.resolutionTitle")}</CardTitle>
                            <p className="text-sm text-slate-500">
                                {t("analytics.servicing.resolutionSubtitle")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={resolutionTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name={t("analytics.servicing.requests")} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
