import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Slider } from "@/admin/components/ui/slider";
import {
    calculatePlannedProjection,
    calculateRecommendedProjection,
    calculateWhatIfProjection,
    generateInsights,
    generateYearlyInsights
} from "@/admin/modules/visualizers/utils/projectionCalculations";
import { cn } from "@/lib/utils";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

export default function WealthProjectionChart({ customerId, config }) {
    const [currentYear, setCurrentYear] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showRecommended, setShowRecommended] = useState(false);

    // Calculate three projections
    const plannedProjection = useMemo(() =>
        calculatePlannedProjection(config.financialData, {
            badEvents: [],  // No bad events in planned
            lifeGoals: config.lifeGoals
        }),
        [config.financialData, config.lifeGoals]
    );

    const whatIfProjection = useMemo(() => {
        // Only calculate if there's a bad event
        if (!config.badEvents || config.badEvents.length === 0) return null;

        return calculateWhatIfProjection(config.financialData, {
            badEvents: config.badEvents,
            lifeGoals: config.lifeGoals
        });
    }, [config.financialData, config.badEvents, config.lifeGoals]);

    const recommendedProjection = useMemo(() =>
        calculateRecommendedProjection(config.financialData, {
            ...config.coverage,
            savingsPlan: config.savingsPlan
        }, {
            badEvents: config.badEvents,
            lifeGoals: config.lifeGoals
        }),
        [config.financialData, config.coverage, config.savingsPlan, config.badEvents, config.lifeGoals]
    );

    // Generate insights
    const insights = useMemo(() =>
        generateInsights(plannedProjection, recommendedProjection, {
            badEvents: config.badEvents,
            lifeGoals: config.lifeGoals
        }, config.coverage),
        [plannedProjection, recommendedProjection, config.badEvents, config.lifeGoals, config.coverage]
    );

    // Combine projections for chart
    const chartData = useMemo(() => {
        return plannedProjection.map((planned, index) => ({
            year: planned.year,
            age: planned.age,
            plannedWealth: Math.round(planned.netWorth),
            whatIfWealth: whatIfProjection ? Math.round(whatIfProjection[index].netWorth) : null,
            recommendedWealth: Math.round(recommendedProjection[index].netWorth),
            hasEvent: planned.hasEvent,
            eventType: planned.eventType
        }));
    }, [plannedProjection, whatIfProjection, recommendedProjection]);

    // Play animation - continuous looping
    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                setCurrentYear(prev => {
                    const maxYear = chartData.length - 1;
                    // Loop back to start when reaching the end
                    if (prev >= maxYear) {
                        return 0;
                    }
                    return prev + 1;
                });
            }, 100); // 100ms per year

            return () => clearInterval(interval);
        }
    }, [isPlaying, chartData.length]);

    // Get current year data and yearly insights
    const currentYearData = chartData[currentYear];
    const currentPlannedData = plannedProjection[currentYear];
    const currentRecommendedData = recommendedProjection[currentYear];

    // Generate yearly Mira insights
    const currentYearlyInsights = currentYearData && currentPlannedData && currentRecommendedData
        ? generateYearlyInsights(
            currentYear,
            currentPlannedData,
            currentRecommendedData,
            { badEvents: config.badEvents, lifeGoals: config.lifeGoals },
            config.coverage,
            config.financialData
        )
        : [];

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Card className="border-2">
                    <CardContent className="p-4">
                        <p className="font-semibold mb-2">Year {data.year} (Age {data.age})</p>
                        <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                                <span className="text-blue-600">Planned:</span>
                                <span className="font-medium">${data.plannedWealth.toLocaleString()}</span>
                            </div>
                            {data.whatIfWealth !== null && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-red-600">What-If:</span>
                                    <span className="font-medium">${data.whatIfWealth.toLocaleString()}</span>
                                </div>
                            )}
                            {showRecommended && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-green-600">Recommended:</span>
                                    <span className="font-medium">${data.recommendedWealth.toLocaleString()}</span>
                                </div>
                            )}
                            {data.hasEvent && (
                                <div className="mt-2 pt-2 border-t">
                                    <Badge variant="destructive">⚡ {data.eventType}</Badge>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Chart */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Wealth Projection Over Time</h3>
                        <div className="flex gap-2 items-center">
                            {/* Always show Planned */}
                            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                Planned
                            </Badge>

                            {/* Show What-If when bad event exists */}
                            {whatIfProjection && (
                                <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                                    What-If
                                </Badge>
                            )}

                            {/* Show Recommended when toggled */}
                            {showRecommended && (
                                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                                    Recommended
                                </Badge>
                            )}

                            {/* Toggle Button */}
                            <Button
                                size="sm"
                                variant={showRecommended ? "default" : "outline"}
                                onClick={() => setShowRecommended(!showRecommended)}
                                className="ml-2"
                            >
                                {showRecommended ? "Hide" : "Show"} Recommended
                            </Button>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart
                            data={chartData}
                            onClick={(data) => {
                                if (data && data.activeLabel !== undefined) {
                                    setCurrentYear(data.activeLabel);
                                    setIsPlaying(false); // Pause when user clicks
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <defs>
                                <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="whatIfGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="recommendedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="age"
                                label={{ value: 'Age', position: 'bottom', offset: -5 }}
                                stroke="#6b7280"
                            />
                            <YAxis
                                label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
                                stroke="#6b7280"
                                tickFormatter={(value) => `$${(value / 1000)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* Planned Projection - Always shown */}
                            <Area
                                type="monotone"
                                dataKey="plannedWealth"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#plannedGradient)"
                                name="Planned"
                            />

                            {/* What-If Projection - Only when bad event exists */}
                            {whatIfProjection && (
                                <Area
                                    type="monotone"
                                    dataKey="whatIfWealth"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fill="url(#whatIfGradient)"
                                    name="What-If"
                                />
                            )}

                            {/* Recommended Projection - User toggleable */}
                            {showRecommended && (
                                <Area
                                    type="monotone"
                                    dataKey="recommendedWealth"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#recommendedGradient)"
                                    name="Recommended"
                                />
                            )}

                            {/* Current Year Indicator */}
                            <ReferenceLine
                                x={currentYearData?.age}
                                stroke="#f59e0b"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                            />

                            {/* Event Markers with Icons */}
                            {config.badEvents?.map(event => {
                                const eventDataPoint = chartData.find(d => d.year === event.triggerYear);
                                if (!eventDataPoint) return null;

                                // Calculate max Y position from all visible lines
                                const maxWealth = Math.max(
                                    eventDataPoint.plannedWealth,
                                    eventDataPoint.whatIfWealth || 0,
                                    showRecommended ? eventDataPoint.recommendedWealth : 0
                                );

                                return (
                                    <ReferenceDot
                                        key={event.id}
                                        x={eventDataPoint.age}
                                        y={maxWealth * 1.1}
                                        r={15}
                                        fill="#ef4444"
                                        stroke="white"
                                        strokeWidth={2}
                                        label={{
                                            value: '⚡',
                                            position: 'center',
                                            fontSize: 16
                                        }}
                                    />
                                );
                            })}

                            {config.lifeGoals?.map(goal => {
                                const eventDataPoint = chartData.find(d => d.year === goal.goalYear);
                                if (!eventDataPoint) return null;

                                // Calculate max Y position from all visible lines
                                const maxWealth = Math.max(
                                    eventDataPoint.plannedWealth,
                                    eventDataPoint.whatIfWealth || 0,
                                    showRecommended ? eventDataPoint.recommendedWealth : 0
                                );

                                return (
                                    <ReferenceDot
                                        key={goal.id}
                                        x={eventDataPoint.age}
                                        y={maxWealth * 1.1}
                                        r={15}
                                        fill="#8b5cf6"
                                        stroke="white"
                                        strokeWidth={2}
                                        label={{
                                            value: '🎯',
                                            position: 'center',
                                            fontSize: 16
                                        }}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Timeline Controls */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        {/* Play/Pause Controls */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentYear(Math.max(0, currentYear - 5))}
                            >
                                <SkipBack className="w-4 h-4" />
                            </Button>

                            <Button
                                size="sm"
                                variant={isPlaying ? "destructive" : "default"}
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? (
                                    <>
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Play
                                    </>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCurrentYear(Math.min(chartData.length - 1, currentYear + 5))}
                            >
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Timeline Scrubber */}
                        <div className="flex-1">
                            <Slider
                                value={[currentYear]}
                                onValueChange={([value]) => setCurrentYear(value)}
                                max={chartData.length - 1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        {/* Year Display */}
                        <div className="text-sm font-medium whitespace-nowrap">
                            Year {currentYear} / {chartData.length - 1}
                            {currentYearData && (
                                <span className="text-gray-500 ml-2">(Age {currentYearData.age})</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wealth Comparison Cards */}
            <div className="grid grid-cols-3 gap-4">
                {/* Planned - Always shown */}
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-700 mb-2">Planned (Year {currentYear})</p>
                        <p className="text-2xl font-bold text-blue-900">
                            ${currentYearData?.plannedWealth.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">Life goals only</p>
                    </CardContent>
                </Card>

                {/* What-If - Show when bad event exists */}
                {whatIfProjection && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                            <p className="text-sm text-red-700 mb-2">What-If (Year {currentYear})</p>
                            <p className="text-2xl font-bold text-red-900">
                                ${currentYearData?.whatIfWealth?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-red-600 mt-2">With risk event</p>
                            {currentYearData && currentYearData.whatIfWealth < currentYearData.plannedWealth && (
                                <Badge className="mt-2 bg-red-600">
                                    -${(currentYearData.plannedWealth - currentYearData.whatIfWealth).toLocaleString()} impact
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Recommended - Show when toggled */}
                {showRecommended && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                            <p className="text-sm text-green-700 mb-2">Recommended (Year {currentYear})</p>
                            <p className="text-2xl font-bold text-green-900">
                                ${currentYearData?.recommendedWealth.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-green-600 mt-2">With protection & planning</p>
                            {currentYearData && currentYearData.recommendedWealth > currentYearData.plannedWealth && (
                                <Badge className="mt-2 bg-green-600">
                                    +${(currentYearData.recommendedWealth - currentYearData.plannedWealth).toLocaleString()} better
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Mira's Yearly Insights for Current Year */}
            {currentYearlyInsights && currentYearlyInsights.length > 0 && (
                <div className="space-y-3">
                    {currentYearlyInsights.map((insight, index) => (
                        <Card
                            key={index}
                            className={cn(
                                "border-2",
                                insight.type === 'warning' && "border-red-200 bg-red-50",
                                insight.type === 'success' && "border-green-200 bg-green-50",
                                insight.type === 'info' && "border-purple-200 bg-purple-50"
                            )}
                        >
                            <CardContent className="p-4">
                                <h4 className={cn(
                                    "font-semibold mb-2 text-sm",
                                    insight.type === 'warning' && "text-red-900",
                                    insight.type === 'success' && "text-green-900",
                                    insight.type === 'info' && "text-purple-900"
                                )}>
                                    💡 {insight.title}
                                </h4>
                                <p className={cn(
                                    "text-xs",
                                    insight.type === 'warning' && "text-red-700",
                                    insight.type === 'success' && "text-green-700",
                                    insight.type === 'info' && "text-purple-700"
                                )}>
                                    {insight.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
