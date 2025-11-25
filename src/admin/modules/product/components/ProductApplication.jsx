import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Button } from "@/admin/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Separator } from "@/admin/components/ui/separator";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { formatCurrency } from "@/lib/utils";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    Search,
    User
} from "lucide-react";
import { useState } from "react";

export default function ProductApplication({ product, quoteResult, onBack, onComplete }) {
    const { prefs } = usePreferences();
    const [step, setStep] = useState("details"); // details | payment | success
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        id_number: "",
        bank_name: "",
        account_number: ""
    });

    const handleSearchCustomer = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            // Mock search - in real app use API
            const results = await adviseUAdminApi.entities.Lead.list("-updated_at", 100);
            const found = results.find(c =>
                c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (found) {
                setSelectedCustomer(found);
                setFormData({
                    ...formData,
                    full_name: found.full_name,
                    email: found.email || "",
                    phone: found.phone || "",
                });
            } else {
                alert("Customer not found. Please enter details manually.");
                setSelectedCustomer(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePayment = async () => {
        setStep("processing");
        // Simulate API call
        setTimeout(() => {
            setStep("success");
        }, 2000);
    };

    if (step === "success") {
        return (
            <div className="animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto text-center pt-12">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Application Successful!</h1>
                <p className="text-slate-600 mb-8">
                    Policy for <span className="font-semibold">{product.product_name}</span> has been issued.
                    <br />
                    Policy Number: <span className="font-mono bg-slate-100 px-2 py-1 rounded">POL-{Date.now().toString().slice(-6)}</span>
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={onComplete} variant="outline">Back to Products</Button>
                    <Button onClick={() => window.print()}>Print Summary</Button>
                </div>
            </div>
        )
    }

    if (step === "processing") {
        return (
            <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                <p className="text-lg font-medium text-slate-600">Processing Payment & Issuing Policy...</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quote
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200 shadow-lg">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary-600" />
                                Applicant Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Search Section */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <Label className="mb-2 block">Existing Customer Lookup</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button variant="secondary" onClick={handleSearchCustomer} disabled={isSearching}>
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {selectedCustomer && (
                                    <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Customer found: {selectedCustomer.full_name}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="As per ID"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ID Number</Label>
                                    <Input
                                        value={formData.id_number}
                                        onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                        placeholder="NRIC / Passport"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+65 1234 5678"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium text-slate-900">Auto Credit Details (For Claims/Payouts)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input
                                            value={formData.bank_name}
                                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                            placeholder="e.g. DBS"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input
                                            value={formData.account_number}
                                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                            placeholder="Account No."
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary-50 border-primary-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-primary-900 text-lg">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Product</span>
                                <span className="font-medium text-slate-900">{product.product_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Total Premium</span>
                                <span className="font-bold text-lg text-primary-700">{formatCurrency(quoteResult.total, prefs)}</span>
                            </div>
                            <Separator className="bg-primary-200" />
                            <Button className="w-full h-12 text-lg shadow-lg shadow-primary-600/20" onClick={handlePayment}>
                                <CreditCard className="mr-2 h-5 w-5" /> Pay & Issue
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
