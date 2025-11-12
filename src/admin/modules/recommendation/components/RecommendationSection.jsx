import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Textarea } from "@/admin/components/ui/textarea";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Save, Target, CheckCircle, RefreshCw } from "lucide-react";
import SignaturePad from "@/admin/components/ui/SignaturePad.jsx";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Input } from "@/admin/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { useToast } from "@/admin/components/ui/toast";
export default function RecommendationSection({ proposal, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    recommendations: "",
    product_rationale: "",
    advice_confirmed: false,
    client_signature_date: "",
    client_signature_data: "",
    advisor_signature_data: "",
    generated: [], // array of generated combos for display
    ...proposal.recommendation_data,
  });
  useEffect(() => {
    if (proposal.recommendation_data) {
      setFormData({ ...formData, ...proposal.recommendation_data });
    }
  }, [proposal.recommendation_data]);
  const handleSave = async () => {
    try {
      await onSave(formData);
      showToast({ type: "success", title: "Saved", description: "Recommendation saved." });
    } catch (err) {
      showToast({ type: "error", title: "Failed to save", description: err?.message || "Please try again." });
    }
  };

  const fna = proposal.fna_data || {};
  const rpq = (proposal.fact_finding_data || {}).rpq || {};
  const cka = (proposal.fact_finding_data || {}).cka || {};
  const [allProducts, setAllProducts] = useState([]);
  const [selectedBaseIdx, setSelectedBaseIdx] = useState(0);
  const [customPlan, setCustomPlan] = useState([]); // [{product_id, amount, frequency}]
  const [changesLog, setChangesLog] = useState(formData.changes_log || []);
  const { showToast } = useToast();

  const parse = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const totalMonthlyIncome = (fna.incomes || []).reduce(
    (acc, i) => acc + (i.frequency === "annual" ? parse(i.amount) / 12 : parse(i.amount)),
    0,
  );
  const totalMonthlyExpenses = (fna.expenses || []).reduce((acc, e) => acc + parse(e.amount), 0);
  const disposableIncome = totalMonthlyIncome - totalMonthlyExpenses;
  const safeDisposableIncome = Math.max(0, disposableIncome);
  const selectedPct = Number(fna.recommended_percent || 0.1);
  const pctToUse = Number.isNaN(selectedPct) ? 0.1 : selectedPct;
  const budgetDefault = safeDisposableIncome * pctToUse;
  const budget = parse(fna.affordability) > 0 ? parse(fna.affordability) : budgetDefault;

  const suitabilityForRisk = (needType) => {
    const band = rpq.risk_band || "";
    if (!band) return 1;
    if (needType === "Investment") {
      if (band.includes("High")) return 1.3;
      if (band.includes("Medium")) return 1.1;
      return 0.8;
    }
    if (needType === "Savings") {
      if (band.includes("Low")) return 1.2;
      return 1.0;
    }
    return 1.0;
  };

  const pickProducts = (products, types) => {
    return types.map((t) => products.find((p) => p.need_type === t)).filter(Boolean);
  };

  const estimateAllocations = (types) => {
    // Simple splits per archetype
    const base = types.length;
    if (types.includes("Investment")) {
      const inv = budget * 0.5;
      const rest = (budget - inv) / (base - 1);
      return types.map((t) => (t === "Investment" ? inv : rest));
    }
    if (types.includes("Savings")) {
      const sav = budget * 0.6;
      const rest = (budget - sav) / (base - 1);
      return types.map((t) => (t === "Savings" ? sav : rest));
    }
    // Even split
    return types.map(() => budget / base);
  };

  const generate = async () => {
    const products = await adviseUAdminApi.entities.Product.list("product_name");
    setAllProducts(products);
    const prot = products.filter((p) => p.need_type === "Protection");
    const health = products.filter((p) => p.need_type === "Health");
    const ci = products.filter((p) => p.need_type === "Health" || p.need_type === "Protection");
    const savings = products.filter((p) => p.need_type === "Savings");
    const invest = products.filter((p) => p.need_type === "Investment");

    const archetypes = [];
    // Balanced Protection
    archetypes.push(["Protection", "Health", "Critical Illness"]);
    // Savings oriented
    if (savings.length) archetypes.push(["Savings", "Protection"]);
    // Growth oriented
    if (invest.length) archetypes.push(["Investment", "Protection", "Health"]);

    const combos = await Promise.all(
      archetypes.map(async (types) => {
        const picks = pickProducts(products, types.map((t) => (t === "Critical Illness" ? "Protection" : t)));
        const allocations = estimateAllocations(types);
        const items = picks.map((p, i) => ({ product: p, amount: Math.round(allocations[i]) }));
        const total = items.reduce((acc, it) => acc + it.amount, 0);
        const needMixScore = items.reduce((acc, it) => acc + suitabilityForRisk(it.product.need_type), 0) / items.length;
        const ckaScore = cka?.outcome === "CKA Met" ? 1.1 : 1.0;
        const score = Number((needMixScore * ckaScore * (budget / (total || 1))).toFixed(2));
        const name = types.join(" + ");
        const rationale = `Aligned to ${rpq.risk_band || 'stated'} risk profile and budget of ${Math.max(0, budget).toFixed(0)}.`;
        return { name, items, total, score, rationale };
      }),
    );

    const ranked = combos.sort((a, b) => b.score - a.score).slice(0, 3);
    setFormData((prev) => ({ ...prev, generated: ranked }));
    // Initialize customization from top-ranked plan
    setSelectedBaseIdx(0);
    const base = ranked[0] || { items: [] };
    setCustomPlan(
      base.items.map((it) => ({ product_id: it.product.id, amount: it.amount, frequency: "monthly" })),
    );
  };

  // Recalc custom plan totals (placed before snapshot usage)
  const parseNum = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const toMonthly = (amount, freq) => (freq === "annual" ? parseNum(amount) / 12 : parseNum(amount));
  const customTotal = customPlan.reduce((acc, it) => {
    const base = toMonthly(it.amount, it.frequency || "monthly");
    const riders = (it.riders || []).reduce((racc, r) => racc + toMonthly(r.amount || 0, r.frequency || "monthly"), 0);
    return acc + base + riders;
  }, 0);
  const customHasProtection = customPlan.some((it) => {
    const p = allProducts.find((x) => x.id === it.product_id);
    return p && (p.need_type === "Protection" || p.need_type === "Health");
  });
  const overBudget = customTotal > budget;

  // Track initial snapshot for dirty-state comparison
  const initialSnapshot = useMemo(() => {
    const base = proposal.recommendation_data || {};
    const snap = {
      recommendations: base.recommendations || "",
      product_rationale: base.product_rationale || "",
      advice_confirmed: !!base.advice_confirmed,
      client_signature_date: base.client_signature_date || "",
      client_signature_data: base.client_signature_data || "",
      advisor_signature_data: base.advisor_signature_data || "",
      custom_plan: base.custom_plan || [],
      custom_plan_total: base.custom_plan_total || 0,
      changes_log: base.changes_log || [],
    };
    try {
      return JSON.stringify(snap);
    } catch {
      return "";
    }
  }, [proposal.recommendation_data]);

  const currentSnapshot = useMemo(() => {
    const snap = {
      recommendations: formData.recommendations || "",
      product_rationale: formData.product_rationale || "",
      advice_confirmed: !!formData.advice_confirmed,
      client_signature_date: formData.client_signature_date || "",
      client_signature_data: formData.client_signature_data || "",
      advisor_signature_data: formData.advisor_signature_data || "",
      custom_plan: customPlan,
      custom_plan_total: customTotal,
      changes_log: changesLog,
    };
    try {
      return JSON.stringify(snap);
    } catch {
      return "x"; // force dirty if cannot serialize
    }
  }, [formData, customPlan, customTotal, changesLog]);

  const isDirty = useMemo(() => initialSnapshot !== currentSnapshot, [initialSnapshot, currentSnapshot]);


  // Select base plan
  const applyBasePlan = (idx) => {
    setSelectedBaseIdx(idx);
    const base = (formData.generated || [])[idx] || { items: [] };
    setCustomPlan(
      base.items.map((it) => ({ product_id: it.product.id, amount: it.amount, frequency: "monthly" })),
    );
  };

  useEffect(() => {
    // Ensure product list loaded for customization UI
    (async () => {
      if (!allProducts.length) {
        const prods = await adviseUAdminApi.entities.Product.list("product_name");
        setAllProducts(prods);
      }
    })();
  }, []);
  return (
    <div className="space-y-6">
      {/* Recommendation Container - wraps all subsections */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Target className="w-7 h-7 text-primary-600" />
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">

          {/* Product Recommendation Subsection */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-orange-600" /> Product Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Budget used for recommendations</p>
              <p className="text-xl font-bold text-slate-900">${Math.max(0, budget).toFixed(0)} / month</p>
            </div>
            <Button variant="outline" onClick={generate}>
              <RefreshCw className="w-4 h-4 mr-2" /> Generate Recommendations
            </Button>
          </div>
          {formData.generated && formData.generated.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.generated.map((rec, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500">#{idx + 1} Ranked</p>
                  <h4 className="font-semibold text-slate-900 mb-2">{rec.name}</h4>
                  <ul className="text-sm space-y-1 mb-3">
                    {rec.items.map((it, ii) => (
                      <li key={ii} className="flex justify-between">
                        <span>{it.product.product_name}</span>
                        <span>${it.amount.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-medium">Total: ${rec.total.toFixed(0)} / mo</p>
                  <p className="text-xs text-slate-500 mt-1">{rec.rationale}</p>
                </div>
              ))}
            </div>
          )}

          {/* Customization UI */}
          {formData.generated && formData.generated.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Select Base Plan</Label>
                <Select value={String(selectedBaseIdx)} onValueChange={(v) => applyBasePlan(Number(v))}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.generated || []).map((rec, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        #{idx + 1} {rec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => applyBasePlan(selectedBaseIdx)}
                  title="Revert to selected base plan"
                >
                  Revert
                </Button>
              </div>

              <div className="space-y-2">
                {customPlan.map((it, idx) => {
                  const prod = allProducts.find((x) => x.id === it.product_id);
                  return (
                    <div key={idx} className="space-y-3 p-3 border border-slate-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                        <div className="md:col-span-2">
                          <Label>Product</Label>
                          <Select
                            value={String(it.product_id || "")}
                            onValueChange={(val) => {
                              const arr = [...customPlan];
                              arr[idx].product_id = val;
                              setCustomPlan(arr);
                              setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "change_product", index: idx, product_id: val }]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {allProducts.map((p) => (
                                <SelectItem value={p.id} key={p.id}>
                                  {p.product_name} ({p.need_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            value={it.amount}
                            onChange={(e) => {
                              const arr = [...customPlan];
                              arr[idx].amount = e.target.value;
                              setCustomPlan(arr);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Frequency</Label>
                          <Select
                            value={it.frequency || "monthly"}
                            onValueChange={(val) => {
                              const arr = [...customPlan];
                              arr[idx].frequency = val;
                              setCustomPlan(arr);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end justify-end">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const arr = [...customPlan];
                              const removed = arr.splice(idx, 1);
                              setCustomPlan(arr);
                              setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "remove_item", index: idx, product_id: removed?.[0]?.product_id }]);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Riders / Benefits */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Riders / Benefits</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const arr = [...customPlan];
                              const riders = arr[idx].riders || [];
                              riders.push({ name: "", amount: "0", frequency: "monthly" });
                              arr[idx].riders = riders;
                              setCustomPlan(arr);
                              setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "add_rider", index: idx }]);
                            }}
                          >
                            Add Rider
                          </Button>
                        </div>
                        {(it.riders || []).length === 0 ? (
                          <p className="text-xs text-slate-500">No riders added</p>
                        ) : (
                          <div className="space-y-2">
                            {it.riders.map((r, ri) => (
                              <div key={ri} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                                <div className="md:col-span-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={r.name}
                                    onChange={(e) => {
                                      const arr = [...customPlan];
                                      arr[idx].riders[ri].name = e.target.value;
                                      setCustomPlan(arr);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Amount</Label>
                                  <Input
                                    type="number"
                                    value={r.amount}
                                    onChange={(e) => {
                                      const arr = [...customPlan];
                                      arr[idx].riders[ri].amount = e.target.value;
                                      setCustomPlan(arr);
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Frequency</Label>
                                  <Select
                                    value={r.frequency || "monthly"}
                                    onValueChange={(val) => {
                                      const arr = [...customPlan];
                                      arr[idx].riders[ri].frequency = val;
                                      setCustomPlan(arr);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="annual">Annual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-end justify-end">
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      const arr = [...customPlan];
                                      arr[idx].riders.splice(ri, 1);
                                      setCustomPlan(arr);
                                      setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "remove_rider", index: idx, rider_index: ri }]);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <div className="md:col-span-2">
                  <Label>Add Product</Label>
                  <Select
                    onValueChange={(val) => {
                      setCustomPlan((arr) => [...arr, { product_id: val, amount: "0", frequency: "monthly" }]);
                      setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "add_item", product_id: val }]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts.map((p) => (
                        <SelectItem value={p.id} key={p.id}>
                          {p.product_name} ({p.need_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-2 p-3 rounded border border-slate-200">
                <p className="text-sm">Custom Plan Total: <span className="font-semibold">${customTotal.toFixed(0)}</span> / mo</p>
                {overBudget && (
                  <p className="text-sm text-red-600 mt-1">Warning: Custom plan exceeds budget.</p>
                )}
                {!customHasProtection && (
                  <p className="text-sm text-amber-600 mt-1">Possible protection gap: include at least one Protection or Health product.</p>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      applyBasePlan(selectedBaseIdx);
                      setChangesLog((log) => [...log, { ts: new Date().toISOString(), action: "revert_to_base", index: selectedBaseIdx }]);
                    }}
                  >
                    Revert to Base
                  </Button>
                  <Button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        custom_plan: customPlan,
                        custom_plan_total: customTotal,
                        changes_log: changesLog,
                      }));
                      onSave({ ...formData, custom_plan: customPlan, custom_plan_total: customTotal, changes_log: changesLog });
                    }}
                  >
                    Save Plan Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
          {" "}
          <div className="space-y-6">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label>Recommended Products & Coverage</Label>{" "}
              <Textarea
                rows={6}
                placeholder="List the recommended insurance products, coverage amounts, and why they suit the client's needs..."
                value={formData.recommendations}
                onChange={(e) =>
                  setFormData({ ...formData, recommendations: e.target.value })
                }
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>Rationale for Recommendation</Label>{" "}
              <Textarea
                rows={5}
                placeholder="Explain the reasoning behind your product recommendations based on the FNA..."
                value={formData.product_rationale}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_rationale: e.target.value,
                  })
                }
              />
            </div>
          </div>
            </CardContent>
          </Card>

          {/* Confirmation of Advice Subsection */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-white">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle className="w-6 h-6 text-green-600" /> Confirmation of Advice
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
          {" "}
          <div className="space-y-6">
            {" "}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              {" "}
              <p className="text-sm text-slate-700 mb-4">
                {" "}
                I confirm that I have received and understood the advice
                provided by my financial advisor. The recommendations made are
                based on my financial situation, needs, and goals as discussed
                during the Financial Needs Analysis.{" "}
              </p>{" "}
              <div className="flex items-center space-x-2">
                {" "}
                <Checkbox
                  checked={formData.advice_confirmed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, advice_confirmed: checked })
                  }
                  id="confirm"
                />{" "}
                <Label htmlFor="confirm" className="font-medium">
                  {" "}
                  Client confirms understanding and acceptance of advice{" "}
                </Label>{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client Signature</Label>
                <SignaturePad
                  value={formData.client_signature_data}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, client_signature_data: data }))
                  }
                  width={360}
                  height={140}
                />
              </div>
              <div className="space-y-2">
                <Label>Advisor Signature</Label>
                <SignaturePad
                  value={formData.advisor_signature_data}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, advisor_signature_data: data }))
                  }
                  width={360}
                  height={140}
                />
              </div>
            </div>
            <div className="space-y-2">
              {" "}
              <Label>Confirmation Date</Label>{" "}
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={formData.client_signature_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client_signature_date: e.target.value,
                  })
                }
              />
            </div>
          </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      {/* Save Buttons */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="outline"
          >
            {isSaving ? "Saving..." : (<><Save className="w-4 h-4 mr-2" /> Save Recommendation</>)}
          </Button>
          <Button
            onClick={async () => {
              // Compose a single payload with all recommendation data
              const payload = {
                ...formData,
                custom_plan: customPlan,
                custom_plan_total: customTotal,
                changes_log: changesLog,
              };
              if (payload.advice_confirmed && !payload.confirmed_at) {
                payload.confirmed_at = new Date().toISOString();
              }
              try {
                await onSave(payload);
                showToast({
                  type: "success",
                  title: "Saved",
                  description: "Recommendation, plan, and confirmations saved.",
                });
              } catch (err) {
                showToast({
                  type: "error",
                  title: "Failed to save",
                  description: err?.message || "Please try again.",
                });
              }
            }}
            disabled={isSaving || !isDirty}
            className="bg-primary-600 hover:bg-primary-700 px-8 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : (<><Save className="w-4 h-4 mr-2" /> Save All</>)}
          </Button>
        </div>
      </div>{" "}
    </div>
  );
}
