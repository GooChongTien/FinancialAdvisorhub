import { Badge } from "@/admin/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";

export default function ScenarioComparison({ customerId, financialData, lifeEvents }) {
    const scenarios = [
        { name: "Baseline", netWorth: 850000, premiums: 0, gap: 200000, recommended: false },
        { name: "With Life Insurance", netWorth: 820000, premiums: 30000, gap: 50000, recommended: false },
        { name: "Fully Protected", netWorth: 800000, premiums: 50000, gap: 0, recommended: true }
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {scenarios.map((scenario, i) => (
                <Card key={i} className={scenario.recommended ? "border-green-500 border-2" : ""}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-base">
                            {scenario.name}
                            {scenario.recommended && <Badge variant="success">Recommended</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <div className="text-sm text-gray-500">Net Worth at 65</div>
                            <div className="text-2xl font-bold">${scenario.netWorth.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Total Premiums</div>
                            <div className="text-lg">${scenario.premiums.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Protection Gap</div>
                            <div className={`text-lg ${scenario.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {scenario.gap > 0 ? `$${scenario.gap.toLocaleString()} shortfall` : 'Fully covered'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
