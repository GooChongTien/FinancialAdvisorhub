import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/admin/components/ui/card";
import {
    ArrowLeft,
    Calendar,
    Check,
    FileText,
    Info,
    Shield,
    Users
} from "lucide-react";

export default function ProductDetail({ product, onBack, onGetQuote }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Back Button */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="mb-4 pl-0 hover:pl-2 transition-all text-slate-500 hover:text-slate-800 hover:bg-transparent"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
                </Button>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{product.product_name}</h1>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-primary-100">
                                {product.product_type}
                            </Badge>
                            {product.need_type?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-slate-600">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    {product.allow_quick_quote && (
                        <Button
                            size="lg"
                            className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20"
                            onClick={() => onGetQuote(product)}
                        >
                            Get Quote
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <section className="prose prose-slate max-w-none">
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {product.description}
                        </p>
                    </section>

                    {/* Key Features */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="h-5 w-5 text-primary-600" />
                                Key Features & Benefits
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {product.key_features?.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="mt-0.5 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    <span className="text-slate-700 font-medium">{feature}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Eligibility Rules */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Users className="h-5 w-5 text-blue-600" />
                                Eligibility & Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Age Entry</span>
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium">
                                            {product.min_age} to {product.max_age} years old
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Sum Assured Limit</span>
                                    <div className="flex items-center gap-2 text-slate-900">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span className="font-medium">
                                            ${product.min_sum_assured?.toLocaleString()} - ${product.max_sum_assured?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Premium Modes</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {product.premium_modes?.map(mode => (
                                            <Badge key={mode} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                                {mode}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="bg-slate-50 border-slate-200">
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-500" />
                                Product Resources
                            </h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start bg-white hover:bg-slate-50">
                                    Download Brochure
                                </Button>
                                <Button variant="outline" className="w-full justify-start bg-white hover:bg-slate-50">
                                    Policy Wording
                                </Button>
                                <Button variant="outline" className="w-full justify-start bg-white hover:bg-slate-50">
                                    Benefit Illustration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                    Ask Mira for a quick summary or sales talking points for this product.
                                </p>
                                <Button size="sm" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50 border border-blue-200">
                                    Ask Mira
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
