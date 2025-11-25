import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { AlertCircle, DollarSign, TrendingUp, Users } from "lucide-react";
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

const COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#6366f1"];

export default function Customers() {
    const { leads, loading } = useAnalyticsData();

    const kpis = useMemo(() => {
        const totalCustomers = leads.filter((l) => !!l.is_client).length;
        // Mocking "New This Month" based on random logic or existing dates if available
        // For now, let's assume 12% growth
        const newThisMonth = Math.round(totalCustomers * 0.12);

        // Mocking "Hot Leads"
        const hotLeads = Math.round(leads.length * 0.3);

        // Mocking "Avg Customer Value"
        const avgValue = 2850;

        return {
            totalCustomers,
            newThisMonth,
            hotLeads,
            avgValue,
        };
    }, [leads]);

    // Mock Data for Charts
    const acquisitionData = [
        { month: "Jul", entity: 5, individual: 8 },
        { month: "Aug", entity: 8, individual: 12 },
        { month: "Sep", entity: 6, individual: 10 },
        { month: "Oct", entity: 12, individual: 15 },
        { month: "Nov", entity: 10, individual: 14 },
    ];

    const sourceData = [
        { name: "Referral", value: 45 },
        { name: "Online", value: 30 },
        { name: "Event", value: 15 },
        { name: "Cold Call", value: 10 },
    ];

    const temperatureData = [
        { month: "Jul", temp: 30, target: 45 },
        { month: "Aug", temp: 35, target: 50 },
        { month: "Sep", temp: 38, target: 52 },
        { month: "Oct", temp: 42, target: 55 },
        { month: "Nov", temp: 45, target: 60 },
    ];

    const typeData = [
        { name: "Individual", value: 120 },
        { name: "Entity", value: 30 },
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
                                <p className="text-slate-500 text-sm">Total Customers</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.totalCustomers}</p>
                                    <span className="text-xs font-medium text-green-600">+22%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-blue-50 text-blue-700 p-2">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">New This Month</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.newThisMonth}</p>
                                    <span className="text-xs font-medium text-green-600">+15%</span>
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
                                <p className="text-slate-500 text-sm">Hot Leads</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">{kpis.hotLeads}</p>
                                    <span className="text-xs font-medium text-green-600">+8%</span>
                                </div>
                            </div>
                            <div className="rounded-lg bg-red-50 text-red-700 p-2">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm">Avg. Customer Value</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <p className="text-2xl font-bold text-slate-900">${kpis.avgValue.toLocaleString()}</p>
                                    <span className="text-xs font-medium text-green-600">+12%</span>
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
                            <CardTitle>Customer Acquisition Trend</CardTitle>
                            <p className="text-sm text-slate-500">New customers by type over time</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={acquisitionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIndividual" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEntity" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="individual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIndividual)" name="Individual" />
                                    <Area type="monotone" dataKey="entity" stroke="#10b981" fillOpacity={1} fill="url(#colorEntity)" name="Entity" />
                                    <Legend />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lead Source Distribution</CardTitle>
                            <p className="text-sm text-slate-500">Where customers come from</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceData.map((entry, index) => (
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
                            <CardTitle>Temperature Trend Over Time</CardTitle>
                            <p className="text-sm text-slate-500">Lead temperature evolution</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={temperatureData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Temperature" />
                                    <Line type="monotone" dataKey="target" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} name="Target" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Customer Type Breakdown</CardTitle>
                            <p className="text-sm text-slate-500">Individual vs Entity customers</p>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={typeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
