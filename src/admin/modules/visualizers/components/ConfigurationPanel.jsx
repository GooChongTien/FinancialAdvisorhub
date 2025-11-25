import { Alert, AlertDescription } from "@/admin/components/ui/alert";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
    Activity,
    Baby,
    Building,
    Car,
    GraduationCap,
    Heart,
    Home,
    Info,
    Shield,
    TrendingUp
} from "lucide-react";
import { useState } from "react";

// Helper function to generate savings plan recommendation based on goal
const generateSavingsPlanRecommendation = (goalType, goalYear, goalAmount) => {
    // Lumpsum goals: house, car, wedding
    if (['house_purchase', 'car_purchase', 'wedding'].includes(goalType)) {
        return {
            type: 'lumpsum',
            premiumYears: Math.max(5, goalYear - 2),
            annualPremium: Math.round(goalAmount / Math.max(5, goalYear - 2) * 0.9),
            maturityYear: goalYear,
            maturityPayout: goalAmount
        };
    }

    // Retirement and kids education: annuity
    if (['retirement', 'kids_education'].includes(goalType)) {
        return {
            type: 'annuity',
            premiumYears: Math.max(10, goalYear - 5),
            annualPremium: Math.round(goalAmount / Math.max(10, goalYear - 5) * 0.8),
            maturityYear: goalYear,
            annualPayout: Math.round(goalAmount / 20)
        };
    }

    // Business and medical: regular payout
    return {
        type: 'regular_payout',
        premiumYears: Math.max(5, goalYear - 2),
        annualPremium: Math.round(goalAmount / Math.max(5, goalYear - 2) * 0.85),
        maturityYear: goalYear,
        payoutYears: 10,
        annualPayout: Math.round(goalAmount / 10)
    };
};

export default function ConfigurationPanel({ config, onChange, className }) {
    const [activeTab, setActiveTab] = useState("coverage");

    const handleTriggerDestiny = (event) => {
        const isSelected = config.badEvents.some(e => e.id === event.id);
        let newBadEvents;

        if (isSelected) {
            // If clicking the already selected event, uncheck it (empty array)
            newBadEvents = [];
        } else {
            // If clicking a new event, replace any existing selection with this one
            // Random year logic:
            // 60% chance: 3-5 years
            // 20% chance: 6-10 years
            // 20% chance: > 10 years (11-20)
            const rand = Math.random();
            let triggerYear;

            if (rand < 0.6) {
                triggerYear = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
            } else if (rand < 0.8) {
                triggerYear = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
            } else {
                triggerYear = Math.floor(Math.random() * (20 - 11 + 1)) + 11;
            }

            newBadEvents = [{ ...event, triggerYear }];
        }

        onChange({
            ...config,
            badEvents: newBadEvents
        });
    };

    return (
        <div className={cn("flex flex-col h-full bg-white border-l w-96 flex-shrink-0", className)}>
            <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Configuration</h3>
                <p className="text-sm text-gray-500">Adjust scenario parameters</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-2">
                    <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="coverage">Coverage</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                        <TabsTrigger value="events">Events</TabsTrigger>
                    </TabsList>
                </div>

                {/* Tab 1: Coverage (Savings Plan) */}
                <TabsContent value="coverage" className="mt-0 flex-1 overflow-auto p-4">
                    <div className="space-y-6">
                        {/* Savings Plan Config */}
                        {config.savingsPlan && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">🛡️ Savings Plan</h4>
                                <Alert className="bg-green-50 border-green-200 mb-3">
                                    <Info className="w-4 h-4 text-green-600" />
                                    <AlertDescription className="text-green-800 text-xs break-words whitespace-normal">
                                        Based on your life goal, we recommend a {config.savingsPlan.type === 'lumpsum' ? 'Lumpsum Endowment' : config.savingsPlan.type === 'regular_payout' ? 'Regular Payout Endowment' : 'Annuity'} plan. You can adjust values below.
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs">Premium Payment Years</Label>
                                        <Input
                                            type="number"
                                            value={config.savingsPlan.premiumYears}
                                            onChange={(e) => onChange({
                                                ...config,
                                                savingsPlan: { ...config.savingsPlan, premiumYears: parseInt(e.target.value) || 0 }
                                            })}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs">Annual Premium</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                            <Input
                                                type="number"
                                                className="pl-7 mt-1"
                                                value={config.savingsPlan.annualPremium}
                                                onChange={(e) => onChange({
                                                    ...config,
                                                    savingsPlan: { ...config.savingsPlan, annualPremium: parseInt(e.target.value) || 0 }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Maturity Year</Label>
                                        <Input
                                            type="number"
                                            value={config.savingsPlan.maturityYear}
                                            onChange={(e) => onChange({
                                                ...config,
                                                savingsPlan: { ...config.savingsPlan, maturityYear: parseInt(e.target.value) || 0 }
                                            })}
                                            className="mt-1"
                                        />
                                    </div>

                                    {config.savingsPlan.type === 'lumpsum' && (
                                        <div>
                                            <Label className="text-xs">Maturity Payout</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                                <Input
                                                    type="number"
                                                    className="pl-7 mt-1"
                                                    value={config.savingsPlan.maturityPayout}
                                                    onChange={(e) => onChange({
                                                        ...config,
                                                        savingsPlan: { ...config.savingsPlan, maturityPayout: parseInt(e.target.value) || 0 }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(config.savingsPlan.type === 'regular_payout' || config.savingsPlan.type === 'annuity') && (
                                        <>
                                            <div>
                                                <Label className="text-xs">Annual Payout</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                                    <Input
                                                        type="number"
                                                        className="pl-7 mt-1"
                                                        value={config.savingsPlan.annualPayout}
                                                        onChange={(e) => onChange({
                                                            ...config,
                                                            savingsPlan: { ...config.savingsPlan, annualPayout: parseInt(e.target.value) || 0 }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            {config.savingsPlan.type === 'regular_payout' && (
                                                <div>
                                                    <Label className="text-xs">Payout Years</Label>
                                                    <Input
                                                        type="number"
                                                        value={config.savingsPlan.payoutYears}
                                                        onChange={(e) => onChange({
                                                            ...config,
                                                            savingsPlan: { ...config.savingsPlan, payoutYears: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Insurance Coverage Config */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">🛡️ Insurance Coverage</h4>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">Death Coverage</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7 mt-1"
                                            value={config.coverage?.death || 0}
                                            onChange={(e) => onChange({
                                                ...config,
                                                coverage: { ...config.coverage, death: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Critical Illness Coverage</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7 mt-1"
                                            value={config.coverage?.ci || 0}
                                            onChange={(e) => onChange({
                                                ...config,
                                                coverage: { ...config.coverage, ci: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">TPD Coverage</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7 mt-1"
                                            value={config.coverage?.tpd || 0}
                                            onChange={(e) => onChange({
                                                ...config,
                                                coverage: { ...config.coverage, tpd: parseInt(e.target.value) || 0 }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 2: Data (Financial Data Inputs) */}
                <TabsContent value="data" className="mt-0 flex-1 overflow-auto p-4">
                    <div className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-200">
                            <Info className="w-4 h-4 text-blue-600" />
                            <AlertDescription className="text-blue-800 text-xs">
                                Changes here only affect this scenario simulation
                            </AlertDescription>
                        </Alert>

                        <div>
                            <Label htmlFor="annual-income">Annual Income</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    id="annual-income"
                                    type="number"
                                    className="pl-7"
                                    value={config.financialData.annualIncome}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, annualIncome: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="monthly-expenses">Monthly Expenses</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    id="monthly-expenses"
                                    type="number"
                                    className="pl-7"
                                    value={config.financialData.monthlyExpenses}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, monthlyExpenses: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="monthly-savings">Monthly Savings</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    id="monthly-savings"
                                    type="number"
                                    className="pl-7"
                                    value={config.financialData.monthlySavings}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, monthlySavings: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="current-savings">Current Savings</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <Input
                                    id="current-savings"
                                    type="number"
                                    className="pl-7"
                                    value={config.financialData.currentSavings}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, currentSavings: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="investment-return">Investment Return Rate</Label>
                            <div className="relative">
                                <Input
                                    id="investment-return"
                                    type="number"
                                    value={config.financialData.investmentReturnRate}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, investmentReturnRate: parseInt(e.target.value) || 0 }
                                    })}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="income-growth">Income Growth Rate</Label>
                            <div className="relative">
                                <Input
                                    id="income-growth"
                                    type="number"
                                    value={config.financialData.incomeGrowthRate}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, incomeGrowthRate: parseInt(e.target.value) || 0 }
                                    })}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="inflation-rate">Inflation Rate</Label>
                            <div className="relative">
                                <Input
                                    id="inflation-rate"
                                    type="number"
                                    value={config.financialData.inflationRate || 3}
                                    onChange={(e) => onChange({
                                        ...config,
                                        financialData: { ...config.financialData, inflationRate: parseInt(e.target.value) || 0 }
                                    })}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="retirement-age">Retirement Age</Label>
                            <Input
                                id="retirement-age"
                                type="number"
                                value={config.financialData.retirementAge}
                                onChange={(e) => onChange({
                                    ...config,
                                    financialData: { ...config.financialData, retirementAge: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 3: Events */}
                <TabsContent value="events" className="mt-0 flex-1 overflow-auto p-4">
                    <div className="space-y-6">
                        <Alert className="bg-amber-50 border-amber-200">
                            <Info className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-amber-800 text-xs">
                                Select 1 bad event and add life goals. System auto-recommends savings plans.
                            </AlertDescription>
                        </Alert>

                        {/* Bad Events */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">⚡ Bad Events (Trigger Destiny)</h4>
                            <div className="space-y-2">
                                {BAD_EVENTS.map(event => {
                                    const Icon = event.icon;
                                    const isSelected = config.badEvents.some(e => e.id === event.id);
                                    const selectedEvent = config.badEvents.find(e => e.id === event.id);

                                    return (
                                        <button
                                            key={event.id}
                                            onClick={() => handleTriggerDestiny(event)}
                                            className={cn(
                                                "w-full p-3 rounded-lg border-2 transition-all text-left relative",
                                                isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium text-sm">{event.label}</span>
                                            </div>
                                            {isSelected && selectedEvent && (
                                                <>
                                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                                                    <p className="text-xs text-blue-700 mt-2">
                                                        ⚡ Strikes at Year {selectedEvent.triggerYear}
                                                    </p>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Life Goals */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">🎯 Life Goals (Planned Events)</h4>
                            <div className="space-y-2">
                                {LIFE_GOALS.map(goal => {
                                    const Icon = goal.icon;
                                    const selectedGoal = config.lifeGoals.find(g => g.id === goal.id);

                                    return (
                                        <div
                                            key={goal.id}
                                            className={cn(
                                                "w-full p-3 rounded-lg border-2",
                                                selectedGoal ? "border-green-500 bg-green-50" : "border-gray-200"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium text-sm">{goal.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (selectedGoal) {
                                                            onChange({
                                                                ...config,
                                                                lifeGoals: config.lifeGoals.filter(g => g.id !== goal.id)
                                                            });
                                                        } else {
                                                            // Check limit: Max 2 additional goals (excluding retirement)
                                                            const additionalGoalsCount = config.lifeGoals.filter(g => g.id !== 'retirement').length;
                                                            if (additionalGoalsCount >= 2) {
                                                                // Ideally show a toast/alert here, but for now just return
                                                                return;
                                                            }

                                                            const newGoal = { ...goal, goalYear: 10, goalAmount: 100000 };

                                                            // We do NOT update savingsPlan here anymore, as it's reserved for Retirement Annuity.
                                                            // The projection logic will automatically assume Lumpsum plans for these goals.
                                                            onChange({
                                                                ...config,
                                                                lifeGoals: [...config.lifeGoals, newGoal]
                                                            });
                                                        }
                                                    }}
                                                    disabled={!selectedGoal && config.lifeGoals.filter(g => g.id !== 'retirement').length >= 2}
                                                    className={cn(
                                                        "px-3 py-1 text-xs rounded",
                                                        selectedGoal
                                                            ? "bg-gray-200 hover:bg-gray-300"
                                                            : config.lifeGoals.filter(g => g.id !== 'retirement').length >= 2
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "bg-gray-200 hover:bg-gray-300"
                                                    )}
                                                >
                                                    {selectedGoal ? '✓ Added' : '+ Add'}
                                                </button>
                                            </div>

                                            {selectedGoal && (
                                                <div className="mt-3 space-y-2 pl-8">
                                                    <div>
                                                        <Label className="text-xs">Goal Year (from now)</Label>
                                                        <Input
                                                            type="number"
                                                            value={selectedGoal.goalYear}
                                                            onChange={(e) => {
                                                                const updatedYear = parseInt(e.target.value) || 0;
                                                                const updatedGoals = config.lifeGoals.map(g =>
                                                                    g.id === goal.id ? { ...g, goalYear: updatedYear } : g
                                                                );
                                                                // We do NOT update savingsPlan here.
                                                                onChange({
                                                                    ...config,
                                                                    lifeGoals: updatedGoals
                                                                });
                                                            }}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Goal Amount</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2.5 text-gray-500 text-xs">$</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-7 mt-1"
                                                                value={selectedGoal.goalAmount}
                                                                onChange={(e) => {
                                                                    const updatedAmount = parseInt(e.target.value) || 0;
                                                                    const updatedGoals = config.lifeGoals.map(g =>
                                                                        g.id === goal.id ? { ...g, goalAmount: updatedAmount } : g
                                                                    );
                                                                    // We do NOT update savingsPlan here.
                                                                    onChange({
                                                                        ...config,
                                                                        lifeGoals: updatedGoals
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

const BAD_EVENTS = [
    { id: 'death', label: 'Death', icon: Shield, recommendation: 'Death Coverage' },
    { id: 'critical_illness', label: 'Critical Illness', icon: Heart, recommendation: 'Critical Illness Coverage' },
    { id: 'tpd', label: 'TPD', icon: Activity, recommendation: 'TPD Coverage' },
    { id: 'inflation_shock', label: 'Inflation Shock', icon: TrendingUp, recommendation: 'Inflation Protection' }
];

const LIFE_GOALS = [
    { id: 'retirement', label: 'Retirement', icon: Home, recommendation: 'Annuity' },
    { id: 'kids_education', label: 'Kids Education', icon: GraduationCap, recommendation: 'Annuity' },
    { id: 'house_purchase', label: 'House Purchase', icon: Building, recommendation: 'Lumpsum Endowment at goal year' },
    { id: 'car_purchase', label: 'Car Purchase', icon: Car, recommendation: 'Lumpsum Endowment at goal year' },
    { id: 'business', label: 'Start Business', icon: TrendingUp, recommendation: 'Regular Payout Endowment' },
    { id: 'medical', label: 'Medical Fund', icon: Heart, recommendation: 'Regular Payout Endowment' },
    { id: 'baby', label: 'Having a Baby', icon: Baby, recommendation: 'Regular Payout Endowment' },
    { id: 'wedding', label: 'Wedding', icon: Heart, recommendation: 'Lumpsum Endowment at goal year' }
];
