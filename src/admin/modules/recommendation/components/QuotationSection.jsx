import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Textarea } from "@/admin/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  Save,
  Calculator,
  Plus,
  Trash2,
  FileText,
  Download,
  Users,
  Sparkles,
  Copy,
  Eye,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/admin/components/ui/dialog";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";
import { useToast } from "@/admin/components/ui/toast";

export default function QuotationSection({ proposal, onSave, isSaving }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    life_assured: [],
    quote_scenarios: [
      {
        id: "main",
        name: "Main Quotation",
        is_recommended: true,
        products: [],
      },
    ],
    active_scenario_id: "main",
    ...proposal.quotation_data,
  });

  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [showCompareView, setShowCompareView] = useState(false);
  const [compareIndex, setCompareIndex] = useState(0);
  const [showIllustrationPreview, setShowIllustrationPreview] = useState(false);
  const [generatingIllustration, setGeneratingIllustration] = useState(false);
  const [validationError, setValidationError] = useState("");
  const previewRef = useRef(null);

  useEffect(() => {
    if (proposal.quotation_data) {
      setFormData({ ...formData, ...proposal.quotation_data });
    }
    // Pre-populate life assured from fact finding if available
    if (
      proposal.fact_finding_data &&
      (!formData.life_assured || formData.life_assured.length === 0)
    ) {
      const pd = proposal.fact_finding_data.personal_details || {};
      const mainLifeAssured = {
        title: pd.title || "",
        name: pd.name || proposal.proposer_name || "",
        gender: pd.gender || "",
        date_of_birth: pd.date_of_birth || "",
        age: pd.date_of_birth
          ? (() => {
              const d = new Date(pd.date_of_birth);
              if (Number.isNaN(d.getTime())) return "";
              const t = new Date();
              let a = t.getFullYear() - d.getFullYear();
              const m = t.getMonth() - d.getMonth();
              if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
              return a;
            })()
          : pd.age || "",
        smoker_status: !!pd.smoker_status,
        occupation: pd.occupation || "",
        occupation_class: "Standard",
        is_primary: true,
      };
      setFormData((prev) => ({
        ...prev,
        life_assured: [mainLifeAssured],
      }));
    }
  }, [proposal.quotation_data, proposal.fact_finding_data]);

  const currentScenario = formData.quote_scenarios[selectedScenarioIndex] || {
    products: [],
  };

  // (Totals are computed later near the render section for clarity)

  // Life Assured Management
  const addLifeAssured = () => {
    setFormData({
      ...formData,
      life_assured: [
        ...formData.life_assured,
        {
          title: "",
          name: "",
          gender: "",
          date_of_birth: "",
          age: "",
          smoker_status: false,
          occupation: "",
          occupation_class: "Standard",
          is_primary: false,
        },
      ],
    });
  };

  const removeLifeAssured = (index) => {
    setFormData({
      ...formData,
      life_assured: formData.life_assured.filter((_, i) => i !== index),
    });
  };

  const updateLifeAssured = (index, field, value) => {
    const updated = [...formData.life_assured];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate age from DOB
    if (field === "date_of_birth" && value) {
      const today = new Date();
      const birthDate = new Date(value);
      if (!Number.isNaN(birthDate.getTime())) {
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        updated[index].age = age;
      }
    }

    setFormData({ ...formData, life_assured: updated });
  };

  // Product Management
  const addProduct = () => {
    const scenarios = [...formData.quote_scenarios];
    const currentProducts = scenarios[selectedScenarioIndex].products || [];

    // Get recommended products from recommendation section
    const recommendedProducts =
      proposal.recommendation_data?.selected_plan?.products || [];

    // Pre-fill with first recommended product if available
    const prefillData = recommendedProducts[currentProducts.length] || {};

    scenarios[selectedScenarioIndex].products = [
      ...currentProducts,
      {
        product_name: prefillData.product_name || "",
        product_code: prefillData.product_code || "",
        coverage_type: prefillData.coverage_type || "",
        sum_assured: prefillData.coverage_amount || "",
        premium_amount: prefillData.premium || "",
        premium_frequency: "Annual",
        policy_term: "20",
        payment_term: "20",
        life_assured_index: 0,
        riders: [],
        available_riders: getAvailableRiders(prefillData.coverage_type || ""),
      },
    ];

    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  const removeProduct = (index) => {
    const scenarios = [...formData.quote_scenarios];
    scenarios[selectedScenarioIndex].products = scenarios[
      selectedScenarioIndex
    ].products.filter((_, i) => i !== index);
    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  const updateProduct = (index, field, value) => {
    const scenarios = [...formData.quote_scenarios];
    scenarios[selectedScenarioIndex].products[index] = {
      ...scenarios[selectedScenarioIndex].products[index],
      [field]: value,
    };
    // When updating available riders, auto-attach mandatory riders
    if (field === "available_riders") {
      const prod = scenarios[selectedScenarioIndex].products[index];
      const mandatory = (prod.available_riders || []).filter((r) => r.is_mandatory);
      prod.riders = [
        ...(prod.riders || []),
        ...mandatory.filter((r) => !(prod.riders || []).some((x) => x.code === r.code)).map((r) => ({
          code: r.code,
          name: r.name,
          coverage_amount: r.default_coverage || "",
          premium_impact: r.base_premium || 0,
        })),
      ];
    }
    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  // Rider Management
  const toggleRider = (productIndex, riderCode) => {
    const scenarios = [...formData.quote_scenarios];
    const product = scenarios[selectedScenarioIndex].products[productIndex];
    const riderMeta = (product.available_riders || []).find((r) => r.code === riderCode);
    if (riderMeta?.is_mandatory) return; // cannot remove mandatory
    const isIncompatible = riderMeta?.incompatible_with && (product.riders || []).some((r) => riderMeta.incompatible_with.includes(r.code));
    if (isIncompatible) {
      // Prevent enabling incompatible riders and inform user
      showToast({
        type: "error",
        title: "Incompatible Rider",
        description: `${riderMeta.name} cannot be combined with a currently selected rider. Remove the conflicting rider first.`,
      });
      return;
    }
    if (isIncompatible) return;
    const existingRiderIndex = (product.riders || []).findIndex(
      (r) => r.code === riderCode
    );

    if (existingRiderIndex >= 0) {
      // Remove rider
      product.riders = product.riders.filter((r) => r.code !== riderCode);
    } else {
      // Add rider
      const availableRider = product.available_riders.find(
        (r) => r.code === riderCode
      );
      product.riders = [
        ...(product.riders || []),
        {
          code: riderCode,
          name: availableRider.name,
          coverage_amount: availableRider.default_coverage || "",
          premium_impact: availableRider.base_premium || 0,
        },
      ];
    }

    scenarios[selectedScenarioIndex].products[productIndex] = product;
    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  const updateRiderCoverage = (productIndex, riderCode, coverage) => {
    const scenarios = [...formData.quote_scenarios];
    const product = scenarios[selectedScenarioIndex].products[productIndex];
    const riderIndex = product.riders.findIndex((r) => r.code === riderCode);

    if (riderIndex >= 0) {
      product.riders[riderIndex].coverage_amount = coverage;
      // Recalculate premium impact based on coverage
      const baseImpact = product.riders[riderIndex].premium_impact || 0;
      const cov = parseFloat(coverage) || 0;
      product.riders[riderIndex].premium_impact =
        baseImpact === 0 ? 0 : (cov / 100000) * baseImpact;
    }

    scenarios[selectedScenarioIndex].products[productIndex] = product;
    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  // Scenario Management
  const addScenario = () => {
    const newScenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${formData.quote_scenarios.length + 1}`,
      is_recommended: false,
      products: JSON.parse(
        JSON.stringify(currentScenario.products || [])
      ), // Deep copy
    };
    setFormData({
      ...formData,
      quote_scenarios: [...formData.quote_scenarios, newScenario],
    });
    setSelectedScenarioIndex(formData.quote_scenarios.length);
  };

  const removeScenario = (index) => {
    if (formData.quote_scenarios.length <= 1) return; // Keep at least one
    const scenarios = formData.quote_scenarios.filter((_, i) => i !== index);
    setFormData({ ...formData, quote_scenarios: scenarios });
    if (selectedScenarioIndex >= scenarios.length) {
      setSelectedScenarioIndex(scenarios.length - 1);
    }
  };

  const markAsRecommended = (index) => {
    const scenarios = formData.quote_scenarios.map((s, i) => ({
      ...s,
      is_recommended: i === index,
    }));
    setFormData({ ...formData, quote_scenarios: scenarios });
  };

  // Calculate Totals
  const calculateScenarioTotal = (scenario) => {
    const annualPremium = (scenario.products || []).reduce((sum, p) => {
      const amount = parseFloat(p.premium_amount) || 0;
      const riderTotal = (p.riders || []).reduce(
        (rSum, r) => rSum + (parseFloat(r.premium_impact) || 0),
        0
      );
      const multiplier =
        {
          Monthly: 12,
          Quarterly: 4,
          "Semi-Annual": 2,
          Annual: 1,
        }[p.premium_frequency] || 1;
      return sum + (amount + riderTotal) * multiplier;
    }, 0);

    const totalCoverage = (scenario.products || []).reduce((sum, p) => {
      const mainCoverage = parseFloat(p.sum_assured) || 0;
      const riderCoverage = (p.riders || []).reduce(
        (rSum, r) => rSum + (parseFloat(r.coverage_amount) || 0),
        0
      );
      return sum + mainCoverage + riderCoverage;
    }, 0);

    return { annualPremium, totalCoverage };
  };

  // Generate Illustration
  const generateIllustration = () => {
    setGeneratingIllustration(true);
    setTimeout(() => {
      setGeneratingIllustration(false);
      setShowIllustrationPreview(true);
    }, 2000);
  };
  const downloadIllustration = () => {
    try {
      const html = previewRef.current?.innerHTML ?? "";
      const win = window.open("", "_blank");
      win.document.write(`<!doctype html><html><head><title>Product Illustration</title><style>body{font-family:ui-sans-serif, system-ui, -apple-system; padding:16px}</style></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},300)}</script></body></html>`);
      win.document.close();
      showToast({ type: "success", title: "Ready to Download", description: "Use your browser to save as PDF." });
    } catch (e) {
      showToast({ type: "error", title: "Unable to prepare PDF", description: e?.message ?? "" });
    }
  };
  const emailIllustration = () => {
    showToast({ type: "success", title: "Email queued", description: "Illustration will be emailed to the customer." });
  };

  const handleSave = () => {
    setValidationError("");
    const la = formData.life_assured || [];
    if (la.length === 0) {
      setValidationError("Add at least one Life Assured");
      return;
    }
    for (const person of la) {
      if (!person.name || !person.gender || (!person.age && !person.date_of_birth) || !person.occupation) {
        setValidationError("Life Assured requires Name, Gender, Age/DOB, Occupation");
        return;
      }
    }
    const sc = formData.quote_scenarios || [];
    if (sc.length === 0 || (sc[0].products || []).length === 0) {
      setValidationError("Add at least one product to the scenario");
      return;
    }
    for (const p of sc[0].products) {
      if (!p.product_name || !p.coverage_type || !p.sum_assured || !p.premium_frequency) {
        setValidationError("Each product needs name, coverage type, sum assured, and premium frequency");
        return;
      }
    }
    onSave(formData);
  };

  const { annualPremium, totalCoverage } =
    calculateScenarioTotal(currentScenario);

  return (
    <div className="mx-auto w-full max-w-[1065px] px-6 lg:px-8 space-y-6">
      {/* Quotation Container - wraps all subsections */}
      <Card className="shadow-lg border-slate-200 rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white px-6 lg:px-8 py-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Calculator className="w-7 h-7 text-primary-600" />
            Quotation
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 pt-6 pb-6 space-y-6">

          {/* Life Assured Details Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-6 h-6 text-blue-600" /> Life Assured Details
                </CardTitle>
            <Button onClick={addLifeAssured} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add Life Assured
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 py-6 space-y-6">
          {formData.life_assured?.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No life assured added yet</p>
              <Button onClick={addLifeAssured} className="mt-3" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add First Life Assured
              </Button>
            </div>
          ) : (
            formData.life_assured.map((la, index) => (
              <div
                key={index}
                className="relative rounded-lg border-2 border-slate-200 bg-white px-4 py-3"
              >
                {!la.is_primary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeLifeAssured(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
                {la.is_primary && (
                  <Badge className="absolute top-2 right-2" variant="default">
                    Primary
                  </Badge>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label>Title</Label>
                    <Select
                      value={la.title}
                      onValueChange={(val) =>
                        updateLifeAssured(index, "title", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Ms">Ms</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Full Name *</Label>
                    <Input
                      value={la.name}
                      onChange={(e) =>
                        updateLifeAssured(index, "name", e.target.value)
                      }
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Gender *</Label>
                    <Select
                      value={la.gender}
                      onValueChange={(val) =>
                        updateLifeAssured(index, "gender", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      value={la.date_of_birth}
                      onChange={(e) =>
                        updateLifeAssured(index, "date_of_birth", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Age</Label>
                    <Input
                      value={la.age}
                      onChange={(e) => updateLifeAssured(index, "age", e.target.value)}
                      placeholder="Auto from DOB; editable"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Occupation *</Label>
                    <Input
                      value={la.occupation}
                      onChange={(e) =>
                        updateLifeAssured(index, "occupation", e.target.value)
                      }
                      placeholder="e.g., Engineer"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Occupation Class</Label>
                    <Select
                      value={la.occupation_class}
                      onValueChange={(val) =>
                        updateLifeAssured(index, "occupation_class", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard">
                          Standard (Class 1-2)
                        </SelectItem>
                        <SelectItem value="Moderate">
                          Moderate Risk (Class 3)
                        </SelectItem>
                        <SelectItem value="High">High Risk (Class 4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id={`smoker-${index}`}
                      checked={la.smoker_status}
                      onCheckedChange={(checked) =>
                        updateLifeAssured(index, "smoker_status", checked)
                      }
                    />
                    <Label htmlFor={`smoker-${index}`} className="cursor-pointer">
                      Smoker
                    </Label>
                  </div>
                </div>

                {(la.smoker_status || la.occupation_class !== "Standard") && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Underwriting note: {la.smoker_status ? "Smoker rates apply. " : ""}
                      {la.occupation_class !== "Standard"
                        ? `${la.occupation_class} occupation class may require additional premium or exclusions.`
                        : ""}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
            </CardContent>
          </Card>

          {/* Quote Scenario Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Copy className="w-6 h-6 text-purple-600" /> Quote Scenarios ({formData.quote_scenarios.length}/5)
                </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCompareView(true)}
                size="sm"
                variant="outline"
                disabled={formData.quote_scenarios.length < 2}
              >
                <Eye className="w-4 h-4 mr-2" /> Compare
              </Button>
              <Button
                onClick={addScenario}
                size="sm"
                variant="outline"
                disabled={formData.quote_scenarios.length >= 5}
              >
                <Copy className="w-4 h-4 mr-2" /> Duplicate Scenario
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {formData.quote_scenarios.map((scenario, index) => (
              <div key={scenario.id} className="relative">
                <Button
                  variant={
                    selectedScenarioIndex === index ? "default" : "outline"
                  }
                  onClick={() => setSelectedScenarioIndex(index)}
                  className="min-w-[150px]"
                >
                  {scenario.is_recommended && <Star className="w-4 h-4 mr-1" />}
                  {scenario.name}
                </Button>
                {formData.quote_scenarios.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                    onClick={() => removeScenario(index)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
            </CardContent>
          </Card>

          {/* Main Quotation Products & Benefits Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-white px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-6 h-6 text-green-600" />
                    {currentScenario.name} - Products & Benefits
                  </CardTitle>
              {!currentScenario.is_recommended && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => markAsRecommended(selectedScenarioIndex)}
                  className="pl-0 text-amber-600"
                >
                  <Star className="w-4 h-4 mr-1" /> Mark as Recommended
                </Button>
              )}
            </div>
            <Button onClick={addProduct} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 py-6">
          {currentScenario.products?.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No products added to this scenario yet</p>
              <Button onClick={addProduct} className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {currentScenario.products.map((product, index) => (
                <div
                  key={index}
                  className="p-6 border-2 border-slate-200 rounded-xl relative bg-slate-50"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>

                  <h4 className="font-semibold text-slate-900 mb-4">
                    Product {index + 1}
                  </h4>

                  {/* Basic Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                      <Label>Product Name *</Label>
                      <Input
                        value={product.product_name}
                        onChange={(e) =>
                          updateProduct(index, "product_name", e.target.value)
                        }
                        placeholder="e.g., LifeShield Plus"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Product Code</Label>
                      <Input
                        value={product.product_code}
                        onChange={(e) =>
                          updateProduct(index, "product_code", e.target.value)
                        }
                        placeholder="e.g., LSP-001"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Coverage Type *</Label>
                      <Select
                        value={product.coverage_type}
                        onValueChange={(value) => {
                          updateProduct(index, "coverage_type", value);
                          updateProduct(
                            index,
                            "available_riders",
                            getAvailableRiders(value)
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hospitalisation">
                            Hospitalisation
                          </SelectItem>
                          <SelectItem value="Death">Death</SelectItem>
                          <SelectItem value="Critical Illness">
                            Critical Illness
                          </SelectItem>
                          <SelectItem value="TPD">
                            Total & Permanent Disability
                          </SelectItem>
                          <SelectItem value="Disability Income">
                            Disability Income
                          </SelectItem>
                          <SelectItem value="Accidental">
                            Accidental Death & Dismemberment
                          </SelectItem>
                          <SelectItem value="Savings">Savings</SelectItem>
                          <SelectItem value="Investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Life Assured</Label>
                      <Select
                        value={String(product.life_assured_index ?? 0)}
                        onValueChange={(val) => updateProduct(index, "life_assured_index", Number(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.life_assured || []).map((p, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {(p.name || `Life Assured ${i + 1}`)} ({p.gender || "-"}, {p.age || "-"}{p.smoker_status ? ", Smoker" : ""})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Sum Assured *</Label>
                      <Input
                        type="number"
                        value={product.sum_assured}
                        onChange={(e) =>
                          updateProduct(index, "sum_assured", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Base Premium *</Label>
                      <Input
                        type="number"
                        value={product.premium_amount}
                        onChange={(e) =>
                          updateProduct(index, "premium_amount", e.target.value)
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-slate-500">
                        Estimated Annual Premium: ${(() => {
                          const la = (formData.life_assured || [])[product.life_assured_index || 0] || {};
                          const sum = parseFloat(product.sum_assured) || 0;
                          const baseRate = {
                            Death: 2.5,
                            "Critical Illness": 3.2,
                            Hospitalisation: 1.8,
                            TPD: 1.5,
                            "Disability Income": 2.2,
                            Accidental: 0.9,
                            Savings: 0.5,
                            Investment: 0.8,
                          }[product.coverage_type] || 1.0;
                          let annual = (sum / 1000) * baseRate;
                          const age = parseFloat(la.age) || 35;
                          if (age >= 50) annual *= 1.3; else if (age >= 40) annual *= 1.15;
                          if (la.smoker_status) annual *= 1.2;
                          const oc = la.occupation_class || "Standard";
                          if (oc === "Moderate") annual *= 1.1;
                          if (oc === "High") annual *= 1.25;
                          const ridersAnnual = (product.riders || []).reduce((s, r) => s + (parseFloat(r.premium_impact) || 0), 0);
                          annual += ridersAnnual;
                          return annual.toFixed(2);
                        })()}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Premium Frequency *</Label>
                      <Select
                        value={product.premium_frequency}
                        onValueChange={(value) =>
                          updateProduct(index, "premium_frequency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                          <SelectItem value="Annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Policy Term (years) *</Label>
                      <Input
                        type="number"
                        value={product.policy_term}
                        onChange={(e) =>
                          updateProduct(index, "policy_term", e.target.value)
                        }
                        placeholder="e.g., 20"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Payment Term (years)</Label>
                      <Input
                        type="number"
                        value={product.payment_term}
                        onChange={(e) =>
                          updateProduct(index, "payment_term", e.target.value)
                        }
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>

                  {/* Riders & Benefits */}
                  {product.available_riders && product.available_riders.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="mt-4">
                        <Label className="text-base font-semibold mb-3 block">
                          Available Riders & Benefits
                        </Label>
                        <div className="space-y-3">
                          {product.available_riders.map((rider) => {
                            const isSelected = (product.riders || []).some(
                              (r) => r.code === rider.code
                            );
                            const selectedRider = (product.riders || []).find(
                              (r) => r.code === rider.code
                            );
                            const isIncompatible =
                              rider.incompatible_with &&
                              (product.riders || []).some((r) =>
                                rider.incompatible_with.includes(r.code)
                              );

                            return (
                              <div
                                key={rider.code}
                                className={`p-3 border rounded-lg ${
                                  isSelected
                                    ? "border-green-500 bg-green-50"
                                    : "border-slate-200 bg-white"
                                } ${isIncompatible ? "opacity-50" : ""}`}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    id={`rider-${index}-${rider.code}`}
                                    checked={isSelected}
                                    disabled={
                                      isIncompatible ||
                                      (rider.is_mandatory && isSelected)
                                    }
                                    onCheckedChange={() =>
                                      toggleRider(index, rider.code)
                                    }
                                  />
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`rider-${index}-${rider.code}`}
                                      className="cursor-pointer font-medium"
                                    >
                                      {rider.name}
                                      {rider.is_mandatory && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2"
                                        >
                                          Mandatory
                                        </Badge>
                                      )}
                                    </Label>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {rider.description}
                                    </p>
                                    {isSelected && (
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs">
                                            Coverage Amount
                                          </Label>
                                          <Input
                                            type="number"
                                            size="sm"
                                            value={selectedRider?.coverage_amount || ""}
                                            onChange={(e) =>
                                              updateRiderCoverage(
                                                index,
                                                rider.code,
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Default: ${rider.default_coverage}`}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">
                                            Additional Premium
                                          </Label>
                                          <Input
                                            size="sm"
                                            value={`$${(selectedRider?.premium_impact || 0).toFixed(2)}`}
                                            disabled
                                            className="bg-slate-50"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    {isIncompatible && (
                                      <p className="text-xs text-amber-600 mt-1">
                                        Incompatible with selected riders
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-slate-600">
                                      +${rider.base_premium?.toFixed(2) || "0.00"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Scenario Total Summary */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Total Annual Premium
                    </p>
                    <p className="text-3xl font-bold text-primary-700">
                      ${annualPremium.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Monthly: ${(annualPremium / 12).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Total Sum Assured
                    </p>
                    <p className="text-3xl font-bold text-green-700">
                      ${totalCoverage.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {currentScenario.products?.length || 0} product(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
            </CardContent>
          </Card>

          {/* Product Illustration Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-6 lg:px-8 py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6 text-indigo-600" /> Product Illustration
              </CardTitle>
            </CardHeader>
        <CardContent className="px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Generate a comprehensive product illustration document with
              coverage summary, premium breakdown, benefit schedule, and terms &
              conditions.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={generateIllustration}
                disabled={
                  generatingIllustration ||
                  !currentScenario.products ||
                  currentScenario.products.length === 0
                }
                variant="default"
              >
                {generatingIllustration ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" /> Generate Illustration
                  </>
                )}
              </Button>
              <Dialog
                open={showIllustrationPreview}
                onOpenChange={setShowIllustrationPreview}
              >
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Product Illustration Preview</DialogTitle>
                  </DialogHeader>
                  <div ref={previewRef}>
                    <IllustrationPreview
                      scenario={currentScenario}
                      lifeAssured={formData.life_assured}
                      proposal={proposal}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={downloadIllustration}>
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <Button onClick={emailIllustration}>Email to Customer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      {/* Compare Scenarios Dialog */}
      <Dialog open={showCompareView} onOpenChange={setShowCompareView}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Quote Scenarios</DialogTitle>
          </DialogHeader>
          <CompareScenarios
            scenarios={formData.quote_scenarios}
            activeIndex={compareIndex}
            onChangeActiveIndex={setCompareIndex}
            onSelectScenario={(i) => {
              markAsRecommended(i);
              setSelectedScenarioIndex(i);
              setShowCompareView(false);
              showToast({ type: "success", title: "Quote Selected", description: `${formData.quote_scenarios[i].name} marked as Recommended.` });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setShowCompareView(true)}>
          <Eye className="w-4 h-4 mr-2" /> Preview All
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 px-8"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Quotation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper function to get available riders based on coverage type
function getAvailableRiders(coverageType) {
  const riders = {
    Death: [
      {
        code: "ADB",
        name: "Accidental Death Benefit",
        description: "Additional payout if death is due to accident",
        base_premium: 50,
        default_coverage: "100000",
        is_mandatory: false,
      },
      {
        code: "TPD",
        name: "Total & Permanent Disability",
        description: "Coverage for total and permanent disability",
        base_premium: 120,
        default_coverage: "100000",
        is_mandatory: false,
      },
      {
        code: "WOP",
        name: "Waiver of Premium",
        description: "Waive future premiums upon disability",
        base_premium: 80,
        default_coverage: "N/A",
        is_mandatory: false,
      },
    ],
    "Critical Illness": [
      {
        code: "ECI",
        name: "Early Critical Illness",
        description: "Coverage for early stage critical illnesses",
        base_premium: 100,
        default_coverage: "50000",
        is_mandatory: false,
      },
      {
        code: "MCB",
        name: "Multi-Claim Benefit",
        description: "Multiple claims for different critical illnesses",
        base_premium: 150,
        default_coverage: "N/A",
        is_mandatory: false,
      },
    ],
    Hospitalisation: [
      {
        code: "PSHB",
        name: "Private Hospital Benefit",
        description: "Upgrade to private hospital ward",
        base_premium: 200,
        default_coverage: "N/A",
        is_mandatory: false,
      },
      {
        code: "OPD",
        name: "Outpatient Dental",
        description: "Coverage for outpatient dental treatments",
        base_premium: 80,
        default_coverage: "5000",
        is_mandatory: false,
      },
      {
        code: "BCP",
        name: "Basic Co-pay",
        description: "Mandatory basic co-pay provision",
        base_premium: 0,
        default_coverage: "N/A",
        is_mandatory: true,
      },
    ],
    Savings: [
      {
        code: "GI",
        name: "Guaranteed Insurability",
        description: "Increase coverage without medical underwriting",
        base_premium: 60,
        default_coverage: "N/A",
        is_mandatory: false,
      },
    ],
    Investment: [
      {
        code: "TSB",
        name: "Top-up Savings Benefit",
        description: "Optional top-up contributions",
        base_premium: 0,
        default_coverage: "N/A",
        is_mandatory: false,
      },
    ],
  };

  return riders[coverageType] || [];
}

// Illustration Preview Component
function IllustrationPreview({ scenario, lifeAssured, proposal }) {
  const primaryLife = lifeAssured?.find((la) => la.is_primary) || {};

  return (
    <div className="space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="text-center border-b-2 pb-4">
        <div className="text-sm text-primary-700 font-semibold">AdvisorHub</div>
        <h1 className="text-2xl font-bold text-slate-900">
          PRODUCT ILLUSTRATION
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          This illustration is for reference only and does not constitute an
          offer
        </p>
      </div>

      {/* Life Assured Details */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-slate-700">Life Assured</p>
          <p className="text-base">
            {primaryLife.title} {primaryLife.name}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Age / Gender</p>
          <p className="text-base">
            {primaryLife.age} / {primaryLife.gender}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Smoker Status</p>
          <p className="text-base">
            {primaryLife.smoker_status ? "Smoker" : "Non-Smoker"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Occupation</p>
          <p className="text-base">{primaryLife.occupation}</p>
        </div>
      </div>

      <Separator />

      {/* Coverage Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Coverage Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 p-2 text-left">
                  Product
                </th>
                <th className="border border-slate-300 p-2 text-right">
                  Sum Assured
                </th>
                <th className="border border-slate-300 p-2 text-right">
                  Premium
                </th>
                <th className="border border-slate-300 p-2 text-center">
                  Frequency
                </th>
                <th className="border border-slate-300 p-2 text-center">
                  Term
                </th>
              </tr>
            </thead>
            <tbody>
              {scenario.products?.map((product, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-300 p-2">
                    {product.product_name}
                    <br />
                    <span className="text-xs text-slate-500">
                      {product.coverage_type}
                    </span>
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    ${parseFloat(product.sum_assured || 0).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 p-2 text-right">
                    ${parseFloat(product.premium_amount || 0).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    {product.premium_frequency}
                  </td>
                  <td className="border border-slate-300 p-2 text-center">
                    {product.policy_term} years
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefits & Riders */}
      {scenario.products?.some((p) => p.riders?.length > 0) && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Riders & Additional Benefits
            </h3>
            {scenario.products.map(
              (product, idx) =>
                product.riders &&
                product.riders.length > 0 && (
                  <div key={idx} className="mb-4">
                    <p className="font-medium text-slate-700 mb-2">
                      {product.product_name}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {product.riders.map((rider, rIdx) => (
                        <li key={rIdx}>
                          {rider.name}
                          {rider.coverage_amount && rider.coverage_amount !== "N/A"
                            ? ` - $${parseFloat(rider.coverage_amount).toLocaleString()}`
                            : ""}
                          <span className="text-slate-500">
                            {" "}
                            (+${rider.premium_impact?.toFixed(2)})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </>
      )}

      {/* Important Notes */}
      <Separator />
      <div className="text-xs text-slate-600 space-y-3">
        <p className="font-semibold">Important Notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>This illustration is valid for 30 days from the date of issue</li>
          <li>
            Premium rates are subject to underwriting and may change based on
            medical examination results
          </li>
          <li>
            All coverage and benefits are subject to the terms and conditions of
            the policy
          </li>
          <li>
            Please refer to the policy contract for complete details of
            coverage, exclusions, and limitations
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 pt-4 border-t">
        <p>Generated on {new Date().toLocaleDateString()}</p>
        <p className="mt-1">
          Prepared by: {proposal.advisor_name || "Insurance Advisor"}
        </p>
      </div>
    </div>
  );
}

// Compare Scenarios Component
function CompareScenarios({ scenarios, activeIndex = 0, onChangeActiveIndex, onSelectScenario }) {
  const containerRef = React.useRef(null);
  const tableRef = React.useRef(null);
  const [startX, setStartX] = React.useState(null);

  useEffect(() => {
    try {
      if (!tableRef.current) return;
      const ths = tableRef.current.querySelectorAll('thead th');
      const target = ths[activeIndex + 1];
      if (target && containerRef.current) {
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    } catch (_) {}
  }, [activeIndex]);

  const goPrev = () => onChangeActiveIndex?.(Math.max(0, activeIndex - 1));
  const goNext = () => onChangeActiveIndex?.(Math.min(scenarios.length - 1, activeIndex + 1));
  const onTouchStart = (e) => setStartX(e.changedTouches?.[0]?.clientX ?? null);
  const onTouchEnd = (e) => {
    if (startX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? startX;
    const dx = endX - startX;
    const threshold = 50;
    if (dx > threshold) goPrev();
    if (dx < -threshold) goNext();
    setStartX(null);
  };

  const calcAnnual = (scenario) => {
    return (scenario.products || []).reduce((sum, p) => {
      const amount = parseFloat(p.premium_amount) || 0;
      const riderTotal = (p.riders || []).reduce((rSum, r) => rSum + (parseFloat(r.premium_impact) || 0), 0);
      const multiplier = { Monthly: 12, Quarterly: 4, 'Semi-Annual': 2, Annual: 1 }[p.premium_frequency] || 1;
      return sum + (amount + riderTotal) * multiplier;
    }, 0);
  };
  const calcCoverage = (scenario) => {
    return (scenario.products || []).reduce((sum, p) => {
      const mainCoverage = parseFloat(p.sum_assured) || 0;
      const riderCoverage = (p.riders || []).reduce((rSum, r) => rSum + (parseFloat(r.coverage_amount) || 0), 0);
      return sum + mainCoverage + riderCoverage;
    }, 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-6">
        <div className="text-sm text-slate-600">Viewing <span className="font-medium">{activeIndex + 1}</span> of {scenarios.length}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={activeIndex === 0}>◀</Button>
          <Button variant="outline" size="sm" onClick={goNext} disabled={activeIndex >= scenarios.length - 1}>▶</Button>
          <Button size="sm" className="bg-primary-600 hover:bg-primary-700" onClick={() => onSelectScenario?.(activeIndex)}>✓ Select This Quote</Button>
        </div>
      </div>
      <div ref={containerRef} className="overflow-x-auto" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <table ref={tableRef} className="w-full border-collapse">
        <thead className="bg-slate-100">
          <tr>
            <th className="border border-slate-300 p-3 text-left">Feature</th>
            {scenarios.map((scenario, idx) => (
              <th key={idx} className={`border border-slate-300 p-3 text-center ${idx === activeIndex ? 'bg-white' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <input type="radio" name="scenarioSelect" checked={!!scenario.is_recommended} onChange={() => onSelectScenario?.(idx)} />
                  <span className="font-medium">{scenario.name}</span>
                  {scenario.is_recommended && (
                    <Badge className="ml-1" variant="default">
                      <Star className="w-3 h-3 mr-1" /> Recommended
                    </Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">Number of Products</td>
            {scenarios.map((scenario, idx) => (
              <td key={idx} className={`border border-slate-300 p-3 text-center ${idx === activeIndex ? 'bg-white' : ''}`}>
                {scenario.products?.length || 0}
              </td>
            ))}
          </tr>
          <tr className="bg-green-50">
            <td className="border border-slate-300 p-3 font-medium">Total Annual Premium</td>
            {scenarios.map((scenario, idx) => (
              <td key={idx} className={`border border-slate-300 p-3 text-center font-semibold text-green-700 ${idx === activeIndex ? 'bg-green-100' : ''}`}>
                ${calcAnnual(scenario).toFixed(2)}
              </td>
            ))}
          </tr>
          <tr className="bg-blue-50">
            <td className="border border-slate-300 p-3 font-medium">Total Sum Assured</td>
            {scenarios.map((scenario, idx) => (
              <td key={idx} className={`border border-slate-300 p-3 text-center font-semibold text-blue-700 ${idx === activeIndex ? 'bg-blue-100' : ''}`}>
                ${calcCoverage(scenario).toLocaleString()}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">
              Coverage Types
            </td>
            {scenarios.map((scenario, idx) => {
              const types = [...new Set((scenario.products || []).map((p) => p.coverage_type))];
              return (
                <td key={idx} className={`border border-slate-300 p-3 text-center ${idx === activeIndex ? 'bg-white' : ''}`}>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {types.map((type, tIdx) => (
                      <Badge key={tIdx} variant="secondary" className="text-xs">{type}</Badge>
                    ))}
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">
              Total Riders
            </td>
            {scenarios.map((scenario, idx) => {
              const riderCount = (scenario.products || []).reduce((sum, p) => sum + (p.riders?.length || 0), 0);
              return (
                <td key={idx} className={`border border-slate-300 p-3 text-center ${idx === activeIndex ? 'bg-white' : ''}`}>
                  {riderCount}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="border border-slate-300 p-3 font-medium">
              Key Products
            </td>
            {scenarios.map((scenario, idx) => (
              <td key={idx} className={`border border-slate-300 p-3 text-sm text-slate-600 ${idx === activeIndex ? 'bg-white' : ''}`}>
                {scenario.products?.map((p) => p.product_name).join(', ') || 'No products'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
      <p className="text-xs text-slate-500">Tip: swipe left/right or use ◀ ▶ to navigate. Select the desired quote using the tick above.</p>
    </div>
  );
}

