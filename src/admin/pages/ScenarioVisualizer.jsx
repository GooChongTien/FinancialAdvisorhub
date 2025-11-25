import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import ConfigurationPanel from "@/admin/modules/visualizers/components/ConfigurationPanel";
import SankeyFlowDiagram from "@/admin/modules/visualizers/components/SankeyFlowDiagram";
import WealthProjectionChart from "@/admin/modules/visualizers/components/WealthProjectionChart";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Default assumptions for customers without financial data
const DEFAULT_ASSUMPTIONS = {
    annualIncome: 120000,
    monthlyExpenses: 5000,
    monthlySavings: 2000,
    currentSavings: 50000,
    investmentReturnRate: 5,
    incomeGrowthRate: 3,
    inflationRate: 3,
    retirementAge: 65,
    currentAge: 30
};

// Helper: Map customer data to financial data with smart defaults
const mapCustomerToFinancialData = (customerData) => {
    // Check if customer has complete financial data
    const hasCompleteData =
        customerData?.annual_income &&
        customerData?.monthly_expenses &&
        customerData?.age;

    if (hasCompleteData) {
        return {
            annualIncome: customerData.annual_income,
            monthlyExpenses: customerData.monthly_expenses,
            monthlySavings: customerData.monthly_savings || DEFAULT_ASSUMPTIONS.monthlySavings,
            currentSavings: customerData.current_savings || DEFAULT_ASSUMPTIONS.currentSavings,
            investmentReturnRate: customerData.investment_return_rate || DEFAULT_ASSUMPTIONS.investmentReturnRate,
            incomeGrowthRate: customerData.income_growth_rate || DEFAULT_ASSUMPTIONS.incomeGrowthRate,
            retirementAge: customerData.retirement_age || DEFAULT_ASSUMPTIONS.retirementAge,
            currentAge: customerData.age,
            isAssumed: false
        };
    }

    // Use smart defaults if data is insufficient
    return {
        ...DEFAULT_ASSUMPTIONS,
        isAssumed: true,
        assumedReason: "Customer financial data not available"
    };
};

export default function ScenarioVisualizer() {
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [activeTab, setActiveTab] = useState("projection");

    // Configuration state
    const [config, setConfig] = useState({
        // Coverage amounts
        coverage: {
            death: 500000,
            ci: 200000,
            tpd: 300000,
            accident: 100000
        },
        // Savings/Endowment Plan
        savingsPlan: {
            premiumYears: 0,
            annualPremium: 0,
            maturityYear: 0,
            maturityPayout: 0
        },
        // Financial data
        financialData: {
            annualIncome: 84000,
            monthlyExpenses: 6000,
            monthlySavings: 500,
            currentSavings: 30000,
            investmentReturnRate: 5,
            incomeGrowthRate: 3,
            inflationRate: 3,
            retirementAge: 65,
            currentAge: 30
        },
        // Selected events
        selectedEvents: [],
        // Bad events with triggered years
        badEvents: [],
        // Life goals with goal years
        lifeGoals: []
    });

    // Auto-configure Retirement Goal and Annuity for users < 65
    useEffect(() => {
        const { currentAge, retirementAge, monthlyExpenses, inflationRate } = config.financialData;

        if (currentAge < 65) {
            const yearsToRetirement = retirementAge - currentAge;
            const retirementYear = yearsToRetirement;

            // 1. Ensure "Retirement" goal exists
            const hasRetirementGoal = config.lifeGoals.some(g => g.id === 'retirement');
            if (!hasRetirementGoal) {
                const retirementGoal = {
                    id: 'retirement',
                    label: 'Retirement',
                    goalYear: retirementYear,
                    goalAmount: 0, // Retirement is an ongoing expense, handled by Annuity
                    isSystem: true
                };

                setConfig(prev => ({
                    ...prev,
                    lifeGoals: [...prev.lifeGoals, retirementGoal]
                }));
            }

            // 2. Configure Annuity Plan
            // Calculate inflated annual expense at retirement
            // FV = PV * (1 + r)^n
            const annualExpenses = monthlyExpenses * 12;
            const inflatedExpenses = Math.round(annualExpenses * Math.pow(1 + (inflationRate || 3) / 100, yearsToRetirement));

            setConfig(prev => ({
                ...prev,
                savingsPlan: {
                    type: 'annuity',
                    premiumYears: yearsToRetirement, // Pay until retirement
                    annualPremium: 0, // To be filled by user/advisor
                    maturityYear: retirementYear,
                    payoutYears: 85 - retirementAge, // Assume coverage until 85
                    annualPayout: inflatedExpenses,
                    maturityPayout: 0
                }
            }));
        }
    }, [config.financialData.currentAge, config.financialData.retirementAge, config.financialData.monthlyExpenses, config.financialData.inflationRate]);

    // Fetch customers for selector
    const { data: customers = [], isLoading: loadingCustomers } = useQuery({
        queryKey: ["customers-for-visualizer"],
        queryFn: () => adviseUAdminApi.entities.Lead.list("-updated_date")
    });

    // Filter customers: must have name and contact number for display
    // Financial data completeness is handled separately in mapCustomerToFinancialData
    const validCustomers = useMemo(() => {
        if (!customers || customers.length === 0) return [];

        // Filter: must have required fields for dropdown display
        const filtered = customers.filter(c =>
            c.name &&
            (c.phone || c.contact_number || c.mobile)
        );

        // Deduplicate by contact number (keeping the most recently updated)
        const uniqueMap = new Map();
        filtered.forEach(c => {
            const contactNumber = (c.phone || c.contact_number || c.mobile).replace(/\s/g, "");
            if (!uniqueMap.has(contactNumber)) {
                uniqueMap.set(contactNumber, c);
            }
        });

        return Array.from(uniqueMap.values());
    }, [customers]);

    // Fetch financial data for selected customer
    const { data: customerFinancialData, isLoading: loadingFinancialData } = useQuery({
        queryKey: ["customer-financial-data", selectedCustomerId],
        queryFn: async () => {
            if (!selectedCustomerId) return null;

            // TODO: Fetch from financial_projections table
            // For now, return mock data
            return {
                annualIncome: 120000,
                monthlyExpenses: 5000,
                monthlySavings: 2000,
                currentSavings: 50000,
                currentAge: 30
            };
        },
        enabled: !!selectedCustomerId
    });

    const selectedCustomer = validCustomers.find(c => c.id === selectedCustomerId);

    // Handle customer selection
    const handleCustomerSelect = (customerId) => {
        setSelectedCustomerId(customerId);

        // Get customer data and map to financial data
        const customer = validCustomers.find(c => c.id === customerId);
        const financialData = mapCustomerToFinancialData(customer);

        // Update configuration with mapped data
        setConfig(prev => ({
            ...prev,
            financialData,
            selectedEvents: [],
            badEvents: [],
            lifeGoals: []
        }));
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
            {/* Header with Customer Selector */}
            <div className="bg-white border-b px-8 py-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <TrendingUp className="w-7 h-7 text-blue-600" />
                            Scenario Visualizer
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Visualize wealth projections during good times and bad times
                        </p>
                    </div>
                </div>

                {/* Customer Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Search className="w-4 h-4" />
                        Select Customer:
                    </div>
                    <Select
                        value={selectedCustomerId || ""}
                        onValueChange={handleCustomerSelect}
                    >
                        <SelectTrigger className="w-full max-w-md">
                            <SelectValue placeholder="Choose a customer to visualize..." />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingCustomers ? (
                                <SelectItem value="loading" disabled>
                                    Loading customers...
                                </SelectItem>
                            ) : validCustomers.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                    No customers found
                                </SelectItem>
                            ) : (
                                validCustomers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name} ({customer.phone || customer.contact_number || customer.mobile})
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>


            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Visualization Area */}
                <div className="flex-1 overflow-auto">
                    {selectedCustomerId ? (
                        <div className="p-8">
                            {/* Tabs */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="projection">
                                        📊 Wealth Projection
                                    </TabsTrigger>
                                    <TabsTrigger value="cashflow">
                                        💰 Cash Flow
                                    </TabsTrigger>
                                    <TabsTrigger value="insights">
                                        💡 Insights
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="projection" className="mt-0">
                                    <WealthProjectionChart
                                        customerId={selectedCustomerId}
                                        config={config}
                                    />
                                </TabsContent>

                                <TabsContent value="cashflow" className="mt-0">
                                    <SankeyFlowDiagram
                                        customerId={selectedCustomerId}
                                        config={config}
                                    />
                                </TabsContent>

                                <TabsContent value="insights" className="mt-0">
                                    <Card>
                                        <CardContent className="p-8">
                                            <h3 className="text-lg font-semibold mb-4">💡 Mira's Insights</h3>
                                            <p className="text-gray-600">
                                                Insights will be generated based on selected events and projections.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        /* Empty State */
                        <div className="flex items-center justify-center h-full">
                            <Card className="max-w-md">
                                <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                                    <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                        No Customer Selected
                                    </h3>
                                    <p className="text-gray-500 text-center">
                                        Select a customer above to view their wealth projection,
                                        trigger destiny events, and compare scenarios.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right: Configuration Panel (Collapsible) */}
                {selectedCustomerId && (
                    <ConfigurationPanel
                        config={config}
                        onChange={setConfig}
                        customerId={selectedCustomerId}
                    />
                )}
            </div>
        </div>
    );
}
