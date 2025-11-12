import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Textarea } from "@/admin/components/ui/textarea";
import { Save, DollarSign, TrendingUp, Plus, Trash2, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
export default function FNASection({ proposal, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    incomes: [], // {source, amount, frequency}
    expenses: [], // {category, amount}
    assets: [], // {type, amount}
    liabilities: [], // {type, amount}
    existing_policies: [], // {insurer, type, coverage_amount, premium, expiry_date, documents: [{title,url}]}
    existing_coverage: "",
    affordability: "",
    needs_analysis: "",
    goals: "",
    ...proposal.fna_data,
  });
  useEffect(() => {
    if (proposal.fna_data) {
      setFormData({ ...formData, ...proposal.fna_data });
    }
  }, [proposal.fna_data]);
  const handleSave = () => {
    onSave(formData);
  };

  const currency = useMemo(
    () => new Intl.NumberFormat(undefined, { style: "currency", currency: "SGD" }),
    [],
  );

  const parse = (v) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const monthlyFrom = (amount, frequency) => {
    const val = parse(amount);
    return frequency === "annual" ? val / 12 : val;
  };

  const totalMonthlyIncome = (formData.incomes || []).reduce(
    (acc, i) => acc + monthlyFrom(i.amount, i.frequency || "monthly"),
    0,
  );
  const totalMonthlyExpenses = (formData.expenses || []).reduce(
    (acc, e) => acc + parse(e.amount),
    0,
  );
  const totalAssets = (formData.assets || []).reduce(
    (acc, a) => acc + parse(a.amount),
    0,
  );
  const totalLiabilities = (formData.liabilities || []).reduce(
    (acc, l) => acc + parse(l.amount),
    0,
  );
  const netWorth = totalAssets - totalLiabilities;
  const disposableIncome = totalMonthlyIncome - totalMonthlyExpenses;
  // Clamp negative disposable income to 0 for budget displays
  const safeDisposableIncome = Math.max(0, disposableIncome);
  const recommendedBudget10 = safeDisposableIncome * 0.1;
  const recommendedBudget15 = safeDisposableIncome * 0.15;
  const [recommendedPercent, setRecommendedPercent] = useState(
    (proposal.fna_data?.recommended_percent ?? 0.125).toString(),
  );
  const recommendedPercentNum = Number(recommendedPercent);
  const recommendedBudgetCustom = safeDisposableIncome * (Number.isNaN(recommendedPercentNum) ? 0.125 : recommendedPercentNum);

  const existingMonthlyPremiums = (formData.existing_policies || []).reduce(
    (acc, p) => acc + parse(p.premium),
    0,
  );

  const policyTypes = [
    "Life",
    "Health",
    "Critical Illness",
    "Disability",
    "Accident",
    "Savings",
    "Others",
  ];
  const policiesByTypeTotals = (formData.existing_policies || []).reduce(
    (acc, p) => {
      const key = p.type || "Others";
      const amt = parse(p.coverage_amount);
      acc[key] = (acc[key] || 0) + amt;
      return acc;
    },
    {},
  );

  // Simple heuristic targets (can be refined later)
  const annualIncome = totalMonthlyIncome * 12;
  const coverageTargets = {
    Life: annualIncome * 10, // 10x annual income
    "Critical Illness": annualIncome * 5, // 5x annual income
    Disability: annualIncome * 2, // 2x annual income
    Accident: annualIncome * 1, // 1x annual income
    Health: 1, // presence check
  };
  const computeGap = (type) => {
    const current = policiesByTypeTotals[type] || 0;
    const target = coverageTargets[type] || 0;
    if (type === "Health") {
      return { current: policiesByTypeTotals[type] || 0, target: 1, gap: (policiesByTypeTotals[type] || 0) > 0 ? 0 : 1 };
    }
    const gap = Math.max(0, target - current);
    return { current, target, gap };
  };
  const needPriority = (gap, target) => {
    if (!target || target <= 0) return "Low";
    const ratio = gap / target;
    if (ratio >= 0.5) return "High";
    if (ratio >= 0.2) return "Medium";
    return "Low";
  };
  return (
    <div className="mx-auto w-full max-w-[1065px] px-6 lg:px-8 space-y-6">
      {/* Financial Planning Container - wraps all subsections */}
      <Card className="shadow-lg border-slate-200 rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white px-6 lg:px-8 py-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="w-7 h-7 text-primary-600" />
            Financial Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 pt-6 pb-6 space-y-6">

          {/* Financial Details Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-white px-6 lg:px-8 py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DollarSign className="w-6 h-6 text-green-600" /> Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6 space-y-6">
          {/* Incomes */}
          <div>
            <div className="flex items-center justify-between gap-6 mb-2">
              <Label className="text-base font-semibold">Income Sources</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    incomes: [
                      ...(formData.incomes || []),
                      { source: "Salary", amount: "", frequency: "monthly" },
                    ],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Income
              </Button>
            </div>
            {(formData.incomes || []).length === 0 ? (
              <p className="text-sm text-slate-500">No income sources added</p>
            ) : (
              <div className="space-y-3">
                {formData.incomes.map((inc, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <Label>Source</Label>
                      <Input
                        value={inc.source}
                        onChange={(e) => {
                          const arr = [...formData.incomes];
                          arr[idx].source = e.target.value;
                          setFormData({ ...formData, incomes: arr });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={inc.amount}
                        onChange={(e) => {
                          const arr = [...formData.incomes];
                          arr[idx].amount = e.target.value;
                          setFormData({ ...formData, incomes: arr });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Frequency</Label>
                      <Select
                        value={inc.frequency || "monthly"}
                        onValueChange={(val) => {
                          const arr = [...formData.incomes];
                          arr[idx].frequency = val;
                          setFormData({ ...formData, incomes: arr });
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
                        size="sm"
                        onClick={() => {
                          const arr = [...formData.incomes];
                          arr.splice(idx, 1);
                          setFormData({ ...formData, incomes: arr });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-slate-600">
                  Total Monthly Income: <span className="font-semibold">{currency.format(totalMonthlyIncome)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Expenses */}
          <div>
            <div className="flex items-center justify-between gap-6 mb-2">
              <Label className="text-base font-semibold">Expenses</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    expenses: [
                      ...(formData.expenses || []),
                      { category: "Housing", amount: "" },
                    ],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Expense
              </Button>
            </div>
            {(formData.expenses || []).length === 0 ? (
              <p className="text-sm text-slate-500">No expenses added</p>
            ) : (
              <div className="space-y-3">
                {formData.expenses.map((ex, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <Label>Category</Label>
                      <Select
                        value={ex.category}
                        onValueChange={(val) => {
                          const arr = [...formData.expenses];
                          arr[idx].category = val;
                          setFormData({ ...formData, expenses: arr });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Housing">Housing</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Food">Food</SelectItem>
                          <SelectItem value="Transport">Transport</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Amount (Monthly)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={ex.amount}
                        onChange={(e) => {
                          const arr = [...formData.expenses];
                          arr[idx].amount = e.target.value;
                          setFormData({ ...formData, expenses: arr });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const arr = [...formData.expenses];
                          arr.splice(idx, 1);
                          setFormData({ ...formData, expenses: arr });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-slate-600">
                  Total Monthly Expenses: <span className="font-semibold">{currency.format(totalMonthlyExpenses)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Assets & Liabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between gap-6 mb-2">
                <Label className="text-base font-semibold">Assets</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      assets: [
                        ...(formData.assets || []),
                        { type: "Savings", amount: "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Asset
                </Button>
              </div>
              {(formData.assets || []).length === 0 ? (
                <p className="text-sm text-slate-500">No assets added</p>
              ) : (
                <div className="space-y-3">
                  {formData.assets.map((as, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select
                          value={as.type}
                          onValueChange={(val) => {
                            const arr = [...formData.assets];
                            arr[idx].type = val;
                            setFormData({ ...formData, assets: arr });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Property">Property</SelectItem>
                            <SelectItem value="Savings">Savings</SelectItem>
                            <SelectItem value="Investments">Investments</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={as.amount}
                          onChange={(e) => {
                            const arr = [...formData.assets];
                            arr[idx].amount = e.target.value;
                            setFormData({ ...formData, assets: arr });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const arr = [...formData.assets];
                            arr.splice(idx, 1);
                            setFormData({ ...formData, assets: arr });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-slate-600">
                    Total Assets: <span className="font-semibold">{currency.format(totalAssets)}</span>
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between gap-6 mb-2">
                <Label className="text-base font-semibold">Liabilities</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      liabilities: [
                        ...(formData.liabilities || []),
                        { type: "Mortgage", amount: "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Liability
                </Button>
              </div>
              {(formData.liabilities || []).length === 0 ? (
                <p className="text-sm text-slate-500">No liabilities added</p>
              ) : (
                <div className="space-y-3">
                  {formData.liabilities.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Select
                          value={li.type}
                          onValueChange={(val) => {
                            const arr = [...formData.liabilities];
                            arr[idx].type = val;
                            setFormData({ ...formData, liabilities: arr });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mortgage">Mortgage</SelectItem>
                            <SelectItem value="Loans">Loans</SelectItem>
                            <SelectItem value="Credit Cards">Credit Cards</SelectItem>
                            <SelectItem value="Others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={li.amount}
                          onChange={(e) => {
                            const arr = [...formData.liabilities];
                            arr[idx].amount = e.target.value;
                            setFormData({ ...formData, liabilities: arr });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const arr = [...formData.liabilities];
                            arr.splice(idx, 1);
                            setFormData({ ...formData, liabilities: arr });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-slate-600">
                    Total Liabilities: <span className="font-semibold">{currency.format(totalLiabilities)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p className="text-slate-500 text-sm">Net Worth</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(netWorth)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Disposable Income (Monthly)</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(disposableIncome)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Recommended Budget (10-15%)</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(recommendedBudget10)} - {currency.format(recommendedBudget15)}</p>
            </div>
          </div>

          {/* Affordability Controls */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Set Recommended % of Disposable Income</Label>
              <Select
                value={recommendedPercent}
                onValueChange={(v) => {
                  setRecommendedPercent(v);
                  setFormData({ ...formData, recommended_percent: Number(v) });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.10">10%</SelectItem>
                  <SelectItem value="0.125">12.5%</SelectItem>
                  <SelectItem value="0.15">15%</SelectItem>
                  <SelectItem value="0.20">20%</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-600">
                Recommended Budget: <span className="font-semibold">{currency.format(recommendedBudgetCustom)}</span>
              </p>
              <div className="h-2 w-full rounded bg-slate-100" title="Affordability gauge">
                <div
                  className="h-2 rounded bg-primary-600"
                  style={{ width: `${Math.min(100, (recommendedPercentNum || 0.125) * 100)}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Existing Monthly Premiums (All Policies)</Label>
              <p className="text-xl font-bold text-slate-900">{currency.format(existingMonthlyPremiums)}</p>
              {Number(formData.affordability || 0) > 0 && existingMonthlyPremiums > Number(formData.affordability) && (
                <p className="text-sm text-red-600">Warning: Existing premiums exceed stated affordability.</p>
              )}
              {Number(formData.affordability || 0) > 0 && Number(formData.affordability) < recommendedBudgetCustom && (
                <p className="text-sm text-amber-600">Note: Stated affordability is below recommended budget.</p>
              )}
            </div>
          </div>

          {/* Existing coverage & Affordability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label>Existing Insurance Coverage</Label>
              <Textarea
                rows={3}
                placeholder="Describe existing insurance policies and coverage..."
                value={formData.existing_coverage}
                onChange={(e) => setFormData({ ...formData, existing_coverage: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Affordability for Insurance</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.affordability}
                onChange={(e) => setFormData({ ...formData, affordability: e.target.value })}
              />
            </div>
          </div>

          {/* Existing Policies (structured) */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-6 mb-2">
              <Label className="text-base font-semibold">Existing Policies</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    existing_policies: [
                      ...(formData.existing_policies || []),
                      {
                        insurer: "",
                        type: "Life",
                        coverage_amount: "",
                        premium: "",
                        expiry_date: "",
                        documents: [],
                      },
                    ],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add Policy
              </Button>
            </div>
            {(formData.existing_policies || []).length === 0 ? (
              <p className="text-sm text-slate-500">No existing policies added</p>
            ) : (
              <div className="space-y-4">
                {formData.existing_policies.map((pol, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Insurer</Label>
                        <Input
                          value={pol.insurer}
                          onChange={(e) => {
                            const arr = [...formData.existing_policies];
                            arr[idx].insurer = e.target.value;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Policy Type</Label>
                        <Select
                          value={pol.type || "Life"}
                          onValueChange={(val) => {
                            const arr = [...formData.existing_policies];
                            arr[idx].type = val;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {policyTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Coverage Amount</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={pol.coverage_amount}
                          onChange={(e) => {
                            const arr = [...formData.existing_policies];
                            arr[idx].coverage_amount = e.target.value;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Premium (Monthly)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={pol.premium}
                          onChange={(e) => {
                            const arr = [...formData.existing_policies];
                            arr[idx].premium = e.target.value;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={pol.expiry_date || ""}
                          onChange={(e) => {
                            const arr = [...formData.existing_policies];
                            arr[idx].expiry_date = e.target.value;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const arr = [...formData.existing_policies];
                            arr.splice(idx, 1);
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Documents for this policy */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm">Documents</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const arr = [...formData.existing_policies];
                            const docs = arr[idx].documents || [];
                            docs.push({ title: "", url: "" });
                            arr[idx].documents = docs;
                            setFormData({ ...formData, existing_policies: arr });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Document
                        </Button>
                      </div>
                      {(pol.documents || []).length === 0 ? (
                        <p className="text-xs text-slate-500">No documents attached</p>
                      ) : (
                        <div className="space-y-2">
                          {pol.documents.map((doc, di) => (
                            <div key={di} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                              <Input
                                placeholder="Document title"
                                value={doc.title}
                                onChange={(e) => {
                                  const arr = [...formData.existing_policies];
                                  arr[idx].documents[di].title = e.target.value;
                                  setFormData({ ...formData, existing_policies: arr });
                                }}
                              />
                              <Input
                                placeholder="https://..."
                                value={doc.url}
                                onChange={(e) => {
                                  const arr = [...formData.existing_policies];
                                  arr[idx].documents[di].url = e.target.value;
                                  setFormData({ ...formData, existing_policies: arr });
                                }}
                              />
                              <div className="flex items-end justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const arr = [...formData.existing_policies];
                                    arr[idx].documents.splice(di, 1);
                                    setFormData({ ...formData, existing_policies: arr });
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals by policy type */}
            {Object.keys(policiesByTypeTotals).length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(policiesByTypeTotals).map(([type, total]) => (
                  <div key={type} className="rounded border border-slate-200 px-4 py-3">
                    <p className="text-xs text-slate-500">{type} Total Coverage</p>
                    <p className="font-semibold text-slate-900">{currency.format(total)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
            </CardContent>
          </Card>

          {/* Needs Analysis Summary Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 lg:px-8 py-4">
              <div className="flex w-full items-center justify-between gap-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" /> Needs Analysis Summary
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print Summary
                </Button>
              </div>
            </CardHeader>
        <CardContent className="px-6 lg:px-8 py-6 space-y-6" data-print-summary>
          {/* Financial Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-500 text-sm">Total Monthly Income</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(totalMonthlyIncome)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Total Monthly Expenses</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(totalMonthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Net Worth</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(netWorth)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Recommended Budget</p>
              <p className="text-xl font-bold text-slate-900">{currency.format(recommendedBudgetCustom)}</p>
            </div>
          </div>

          {/* Coverage Gaps */}
          <div>
            <p className="font-semibold text-slate-900 mb-3">Coverage Gaps</p>
            <div className="space-y-3">
              {Object.keys(coverageTargets).map((type) => {
                const { current, target, gap } = computeGap(type);
                const prio = needPriority(gap, target);
                const pct = type === "Health" ? (current > 0 ? 100 : 0) : Math.min(100, Math.round(((current || 0) / (target || 1)) * 100));
                return (
                  <div key={type} className="rounded border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-6 mb-1">
                      <p className="text-sm font-medium text-slate-900">{type}</p>
                      <p className="text-xs text-slate-500">Priority: <span className={prio === 'High' ? 'text-red-600' : prio === 'Medium' ? 'text-amber-600' : 'text-slate-600'}>{prio}</span></p>
                    </div>
                    {type === "Health" ? (
                      <p className="text-sm text-slate-700">{current > 0 ? 'Covered' : 'Not Covered'}</p>
                    ) : (
                      <>
                        <div className="h-2 w-full rounded bg-slate-100 mb-2">
                          <div className="h-2 rounded bg-primary-600" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Current: {currency.format(current)}</span>
                          <span>Target: {currency.format(target)}</span>
                          <span>Gap: {currency.format(gap)}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority ranking summary */}
          <div>
            <p className="font-semibold text-slate-900 mb-2">Prioritized Needs</p>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {Object.keys(coverageTargets)
                .map((t) => ({ t, ...computeGap(t) }))
                .filter((x) => x.t !== 'Health')
                .sort((a, b) => (b.gap / (b.target || 1)) - (a.gap / (a.target || 1)))
                .slice(0, 3)
                .map((x, i) => (
                  <li key={x.t}>{i + 1}. {x.t} — gap {currency.format(x.gap)} ({Math.round((x.gap / (x.target || 1)) * 100)}%)</li>
                ))}
            </ul>
          </div>

          {/* Print styles */}
          <style>{`
            @media print {
              [role="banner"], [role="complementary"], nav, .no-print { display: none !important; }
              [data-print-summary] { box-shadow: none !important; }
            }
          `}</style>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary-600 hover:bg-primary-700 px-8"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Financial Planning
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
