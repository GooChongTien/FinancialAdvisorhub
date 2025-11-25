import { Button } from "@/admin/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { formatCurrency } from "@/lib/utils";
import {
    ArrowLeft,
    Calculator,
    CheckCircle2,
    DollarSign
} from "lucide-react";
import { useState } from "react";

export default function ProductQuote({ product, onBack, onProceedApplication, onStartProposal }) {
    const { prefs } = usePreferences();
    const [step, setStep] = useState("form"); // form | summary
    const [formData, setFormData] = useState({
        age: "",
        gender: "",
        smoker: "No",
        sum_assured: product.min_sum_assured || "",
        policy_term: "20",
        // General Insurance fields
        car_model: "",
        manufacture_year: "",
    });

    const isGeneralInsurance = product.product_type.includes("Motor") || product.product_type.includes("Travel") || product.product_type.includes("Home");

    const calculatePremium = () => {
        // Mock calculation logic
        const age = parseInt(formData.age) || 30;
        const sumAssured = parseInt(formData.sum_assured) || 100000;
        const term = parseInt(formData.policy_term) || 20;

        let baseRate = 0.002; // Base rate per dollar of sum assured

        if (formData.gender === "Female") baseRate *= 0.9;
        if (formData.smoker === "Yes") baseRate *= 1.5;
        if (age > 40) baseRate *= 1.2;
        if (age > 50) baseRate *= 1.5;

        const annualPremium = sumAssured * baseRate;
        const monthlyPremium = annualPremium / 12;

        return {
            monthly: monthlyPremium,
            annual: annualPremium,
            total: annualPremium * term
        };
    };

    const [quoteResult, setQuoteResult] = useState(null);

    const handleGenerateQuote = () => {
        const result = calculatePremium();
        setQuoteResult(result);
        setStep("summary");
    };

    if (step === "summary" && quoteResult) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <Button variant="ghost" onClick={() => setStep("form")} className="pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Edit Quote Parameters
                </Button>

                <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Quote Generated!</h1>
                            <p className="text-primary-100 mt-1">Based on your inputs for {product.product_name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-slate-200 shadow-lg">
                            <CardHeader className="border-b border-slate-100">
                                <CardTitle className="flex items-center gap-2 text-primary-900">
                                    <DollarSign className="w-6 h-6 text-primary-600" />
                                    Premium Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-sm text-slate-500 mb-2">Estimated Monthly Premium</p>
                                    <p className="text-5xl font-bold text-primary-600 mb-4">
                                        {formatCurrency(quoteResult.monthly, prefs)}
                                    </p>
                                    <p className="text-xs text-slate-500">Includes all applicable taxes and fees</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                                        <span className="text-slate-600">Annual Premium</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(quoteResult.annual, prefs)}</span>
                                    </div>
                                    <div className="p-4 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                                        <span className="text-slate-600">Total Premium ({formData.policy_term} yrs)</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(quoteResult.total, prefs)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="border-slate-200 shadow-lg">
                            <CardHeader className="border-b border-slate-100">
                                <CardTitle className="text-sm">Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                {product.require_fact_finding ? (
                                    <>
                                        <Button className="w-full bg-primary-600 hover:bg-primary-700" onClick={() => onStartProposal(quoteResult, formData)}>
                                            Start New Proposal
                                        </Button>
                                        <p className="text-xs text-slate-500 text-center px-2">
                                            This product requires a full fact-find. You will be redirected to the proposal creation flow.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onProceedApplication(quoteResult, formData)}>
                                            Proceed Application
                                        </Button>
                                        <p className="text-xs text-slate-500 text-center px-2">
                                            Direct application available. No full fact-find required.
                                        </p>
                                    </>
                                )}
                                <Button variant="outline" className="w-full" onClick={() => setStep("form")}>
                                    Edit Quote
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Product Details
            </Button>

            <Card className="border-slate-200 shadow-lg">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary-600" />
                        Quick Quote: {product.product_name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                    {!isGeneralInsurance ? (
                        // Life/Health Form
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    placeholder="Enter age"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Smoker Status</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                    value={formData.smoker}
                                    onChange={(e) => setFormData({ ...formData, smoker: e.target.value })}
                                >
                                    <option value="No">Non-Smoker</option>
                                    <option value="Yes">Smoker</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sum Assured ({prefs.currency})</Label>
                                <Input
                                    type="number"
                                    value={formData.sum_assured}
                                    onChange={(e) => setFormData({ ...formData, sum_assured: e.target.value })}
                                    placeholder="Enter sum assured"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Policy Term (Years)</Label>
                                <Input
                                    type="number"
                                    value={formData.policy_term}
                                    onChange={(e) => setFormData({ ...formData, policy_term: e.target.value })}
                                    placeholder="Enter term"
                                />
                            </div>
                        </div>
                    ) : (
                        // General Insurance Form
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Car Model</Label>
                                <Input
                                    value={formData.car_model}
                                    onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                                    placeholder="e.g. Honda Civic"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Manufacture Year</Label>
                                <Input
                                    type="number"
                                    value={formData.manufacture_year}
                                    onChange={(e) => setFormData({ ...formData, manufacture_year: e.target.value })}
                                    placeholder="e.g. 2020"
                                />
                            </div>
                            {/* Common fields */}
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    placeholder="Enter age"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <Button
                        className="w-full h-12 text-lg mt-6"
                        onClick={handleGenerateQuote}
                        disabled={!formData.age || !formData.gender}
                    >
                        Generate Quote
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
