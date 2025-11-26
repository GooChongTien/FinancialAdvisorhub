import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { Label } from "@/admin/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calculator, Check, FileText, User, Users } from "lucide-react";
import React, { useState } from "react";

export default function NewProposalModal({ open, onOpenChange, onCreate, leadId, initialPath, initialProductId }) {
    const [step, setStep] = useState(initialPath ? 2 : 1);
    const [path, setPath] = useState(initialPath || null); // 'qa' or 'ff'
    const [subPath, setSubPath] = useState(null); // 'individual' or 'group' (for FF)
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Reset state when closed
    React.useEffect(() => {
        if (!open) {
            setStep(initialPath ? 2 : 1);
            setPath(initialPath || null);
            setSubPath(null);
            setSelectedProduct(null);
        }
    }, [open, initialPath]);

    const { data: products = [] } = useQuery({
        queryKey: ["products-qa"],
        queryFn: () => adviseUAdminApi.entities.Product.list(),
        enabled: open,
    });

    const qaProducts = products.filter(p => p.allow_quick_quote);

    // Pre-select product if initialProductId is provided
    React.useEffect(() => {
        if (initialProductId && products.length > 0) {
            const p = products.find(p => p.id === initialProductId);
            if (p) setSelectedProduct(p);
        }
    }, [initialProductId, products]);

    const handlePathSelect = (selectedPath) => {
        setPath(selectedPath);
        setStep(2);
    };

    const handleCreate = () => {
        let journeyType = "FULL";
        let stage = "Fact Finding";
        let productId = null;
        let productName = null;

        if (path === "qa") {
            journeyType = "QA";
            stage = "Quotation";
            if (selectedProduct) {
                productId = selectedProduct.id;
                productName = selectedProduct.product_name;
            }
        } else if (path === "ff") {
            if (subPath === "group") {
                journeyType = "GROUP";
            } else {
                journeyType = "FULL";
            }
            stage = "Fact Finding";
        }

        onCreate({
            lead_id: leadId,
            journey_type: journeyType,
            stage: stage,
            product_id: productId,
            product_name: productName,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Proposal</DialogTitle>
                    <DialogDescription>
                        {step === 1 ? "Choose how you want to start this proposal." :
                            path === "qa" ? "Select a product for Quick Quote." :
                                "Select the type of Fact Finding."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card
                                className={cn("cursor-pointer hover:border-primary-500 transition-all", path === "qa" && "border-primary-500 bg-primary-50")}
                                onClick={() => handlePathSelect("qa")}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Calculator className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Quote & Apply</h3>
                                        <p className="text-sm text-slate-500">Skip fact finding. Generate a quick quote for simple products.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className={cn("cursor-pointer hover:border-primary-500 transition-all", path === "ff" && "border-primary-500 bg-primary-50")}
                                onClick={() => handlePathSelect("ff")}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Start Fact Finding</h3>
                                        <p className="text-sm text-slate-500">Comprehensive needs analysis for full financial planning.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {step === 2 && path === "qa" && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Product</Label>
                                <Select
                                    value={selectedProduct?.id}
                                    onValueChange={(val) => setSelectedProduct(qaProducts.find(p => p.id === val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {qaProducts.map(product => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.product_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedProduct && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <h4 className="font-medium text-slate-900">{selectedProduct.product_name}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{selectedProduct.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && path === "ff" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card
                                className={cn("cursor-pointer hover:border-primary-500 transition-all", subPath === "individual" && "border-primary-500 bg-primary-50")}
                                onClick={() => setSubPath("individual")}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Individual</h3>
                                        <p className="text-sm text-slate-500">For personal financial planning and life insurance.</p>
                                    </div>
                                    {subPath === "individual" && <Check className="w-5 h-5 text-primary-600 absolute top-4 right-4" />}
                                </CardContent>
                            </Card>

                            <Card
                                className={cn("cursor-pointer hover:border-primary-500 transition-all", subPath === "group" && "border-primary-500 bg-primary-50")}
                                onClick={() => setSubPath("group")}
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Group / Entity</h3>
                                        <p className="text-sm text-slate-500">For corporate or group insurance policies.</p>
                                    </div>
                                    {subPath === "group" && <Check className="w-5 h-5 text-primary-600 absolute top-4 right-4" />}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step === 2 ? (
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step === 2 && (
                        <Button
                            onClick={handleCreate}
                            disabled={(path === "qa" && !selectedProduct) || (path === "ff" && !subPath)}
                        >
                            Create Proposal <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
