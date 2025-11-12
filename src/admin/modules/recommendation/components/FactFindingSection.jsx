import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Switch } from "@/admin/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/admin/components/ui/radio-group";
import { Separator } from "@/admin/components/ui/separator";
import { SectionCard } from "@/admin/components/ui/section-card";
import {
  Save,
  Plus,
  Trash2,
  User,
  Users,
  GraduationCap,
  TrendingUp,
  FileText,
} from "lucide-react";
export default function FactFindingSection({ proposal, onSave, isSaving, onNext, readOnly = false, newLeadMode = false }) {
  const [formData, setFormData] = useState({
    personal_details: {
      title: "",
      name: proposal.proposer_name || "",
      gender: "",
      nric: "",
      date_of_birth: "",
      nationality: "",
      smoker_status: false,
      marital_status: "",
      occupation: "",
      phone_number: "",
      email: "",
      address: "",
    },
    dependents: [],
    cka: { qualifications: [], investment_experience: "", work_experience: [], transaction_frequency: "", skipped: false, outcome: "" },
    rpq: {
      investment_years: "",
      risk_tolerance: "",
      hold_duration: "",
      finance_duration: "",
      riskiest_assets: "",
      retirement_years: "",
      total_score: 0,
      risk_band: "",
    },
    ...proposal.fact_finding_data,
  });
  useEffect(() => {
    if (proposal.fact_finding_data) {
      setFormData({ ...formData, ...proposal.fact_finding_data });
    }
  }, [proposal.fact_finding_data]);

  const computeAge = (dob) => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const personalRequired = newLeadMode
    ? ["name", "phone_number"]
    : [
        "title",
        "name",
        "gender",
        "nric",
        "date_of_birth",
        "nationality",
        "smoker_status",
        "marital_status",
        "occupation",
        "phone_number",
        "email",
        "address",
      ];

  const rpqRequiredKeys = [
    "investment_years",
    "risk_tolerance",
    "hold_duration",
    "finance_duration",
    "riskiest_assets",
    "retirement_years",
  ];

  const rpqComplete = rpqRequiredKeys.every(
    (k) => formData.rpq[k] && String(formData.rpq[k]).length > 0,
  );

  const computeProgress = () => {
    // Personal details completeness (40%)
    const pd = formData.personal_details || {};
    const pdCompleteCount = personalRequired.filter((f) =>
      pd[f] !== undefined && pd[f] !== null && String(pd[f]).toString().length > 0,
    ).length;
    const pdScore = (pdCompleteCount / personalRequired.length) * 40;

    // Dependents completeness (20%) — require name + dob + relationship for each
    const deps = formData.dependents || [];
    let depScore = 0;
    if (deps.length > 0) {
      const completeDeps = deps.filter(
        (d) => d?.name && d?.date_of_birth && d?.relationship,
      ).length;
      depScore = (completeDeps / deps.length) * 20;
    }

    // CKA completeness (20%) — any qualification or work experience
    const hasCKA =
      (formData.cka?.qualifications?.length || 0) > 0 ||
      (formData.cka?.work_experience?.length || 0) > 0;
    const ckaScore = hasCKA ? 20 : 0;

    // RPQ completeness (20%)
    const rpqScore = rpqComplete ? 20 : 0;

    return Math.round(pdScore + depScore + ckaScore + rpqScore);
  };
  const progress = computeProgress();
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Mark as dirty on form changes
  useEffect(() => {
    if (proposal) {
      setDirty(true);
    }
  }, [formData]);

  // Auto-save every 2 minutes if there are unsaved changes
  useEffect(() => {
    const id = setInterval(() => {
      if (dirty) {
        onSave(formData);
        setLastSavedAt(new Date().toISOString());
        setDirty(false);
      }
    }, 120000);
    return () => clearInterval(id);
  }, [dirty, formData, onSave]);

  // Warn when leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "You have unsaved changes.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const isValidEmail = (email) => {
    if (!email) return true;
    return /\S+@\S+\.\S+/.test(email);
  };
  const isValidPhone = (phone) => {
    if (!phone) return true;
    const digits = String(phone).replace(/[^0-9]/g, "");
    return digits.length >= 8 && digits.length <= 15;
  };
  const isValidNRIC = (nric) => {
    if (!nric) return true;
    // Simple SG NRIC/FIN-like check: leading letter, 7 digits, trailing letter
    return /^[STFG]\d{7}[A-Z]$/.test(nric.toUpperCase());
  };
  const handleSave = () => {
    if (readOnly) return;
    const quals = formData.cka?.qualifications || [];
    const work = formData.cka?.work_experience || [];
    const tx = String(formData.cka?.transaction_frequency || "none").toLowerCase();
    const hasTx = tx !== "none" && tx !== "";
    const outcome = formData.cka?.skipped ? "N.A." : ((quals.length > 0 || work.length > 0 || hasTx) ? "CKA Met" : "CKA Not Met");
    onSave({ ...formData, cka: { ...formData.cka, outcome } });
    setLastSavedAt(new Date().toISOString());
    setDirty(false);
  };
  // Auto-calculate CKA outcome locally when inputs change
  useEffect(() => {
    const quals = formData.cka?.qualifications || [];
    const work = formData.cka?.work_experience || [];
    const outcome = formData.cka?.skipped ? "N.A." : ((quals.length > 0 || work.length > 0) ? "CKA Met" : "CKA Not Met");
    if (formData.cka?.outcome !== outcome) {
      setFormData({ ...formData, cka: { ...formData.cka, outcome } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cka?.qualifications, formData.cka?.work_experience, formData.cka?.transaction_frequency, formData.cka?.skipped]);
  const addDependent = () => {
    setFormData({
      ...formData,
      dependents: [
        ...formData.dependents,
        {
          title: "",
          name: "",
          gender: "",
          nric: "",
          date_of_birth: "",
          relationship: "",
        },
      ],
    });
  };
  const removeDependent = (index) => {
    setFormData({
      ...formData,
      dependents: formData.dependents.filter((_, i) => i !== index),
    });
  };
  const calculateRPQScore = () => {
    const scores = {
      investment_years: { "<3": 1, "3-5": 2, "5-10": 3, ">=10": 4 },
      risk_tolerance: { 10: 1, "10-20": 2, "20-30": 3, 30: 4 },
      hold_duration: { "<3": 1, "3-5": 2, "5-10": 3, ">=10": 4 },
      finance_duration: { "<3": 1, "3-5": 2, "5-10": 3, ">=10": 4 },
      riskiest_assets: { bonds: 1, balanced: 2, equities: 3, derivatives: 4 },
      retirement_years: { "<3": 1, "3-5": 2, "5-10": 3, ">=10": 4 },
    };
    let total = 0;
    Object.keys(scores).forEach((key) => {
      const value = formData.rpq[key];
      if (value && scores[key][value]) {
        total += scores[key][value];
      }
    });
    let band = "";
    if (total >= 6 && total <= 10) band = "Low Risk";
    else if (total >= 11 && total <= 15) band = "Low to Medium Risk";
    else if (total >= 16 && total <= 20) band = "Medium to High Risk";
    else if (total >= 21 && total <= 24) band = "High Risk";
    setFormData({
      ...formData,
      rpq: {
        ...formData.rpq,
        total_score: total,
        risk_band: band,
        assessed_at: new Date().toISOString(),
      },
    });
  };
  return (
    <div className="space-y-6">
      {/* Draft/Last Saved */}
      {lastSavedAt && (
        <p className="text-sm text-slate-500">Last saved on {new Date(lastSavedAt).toLocaleString()}</p>
      )}

      {/* Fact Finding Container - wraps all 4 subsections */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="w-7 h-7 text-primary-600" />
            Fact Finding
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">

          {/* Personal Details */}
          <Card className="shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="flex items-center gap-2 text-xl">
            {" "}
            <User className="w-6 h-6 text-blue-600" /> Personal Details{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent className={`pt-6 ${readOnly ? "pointer-events-none opacity-90" : ""}`}>
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label>Title</Label>{" "}
              <Select
                value={formData.personal_details.title}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      title: value,
                    },
                  })
                }
              >
                {" "}
                <SelectTrigger>
                  {" "}
                  <SelectValue placeholder="Select" />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  <SelectItem value="Mr">Mr</SelectItem>{" "}
                  <SelectItem value="Mrs">Mrs</SelectItem>{" "}
                  <SelectItem value="Ms">Ms</SelectItem>{" "}
                  <SelectItem value="Dr">Dr</SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>
                Name{personalRequired.includes("name") && (<span className="text-red-600">*</span>)}
              </Label>{" "}
              <Input
                value={formData.personal_details.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      name: e.target.value,
                    },
                  })
                }
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>Gender</Label>{" "}
              <Select
                value={formData.personal_details.gender}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      gender: value,
                    },
                  })
                }
              >
                {" "}
                <SelectTrigger>
                  {" "}
                  <SelectValue placeholder="Select" />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  <SelectItem value="Male">Male</SelectItem>{" "}
                  <SelectItem value="Female">Female</SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>
                NRIC{personalRequired.includes("nric") && (<span className="text-red-600">*</span>)}
              </Label>{" "}
              <Input
                value={formData.personal_details.nric}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      nric: e.target.value,
                    },
                  })
                }
              />{" "}
              {!isValidNRIC(formData.personal_details.nric) && (
                <p className="text-xs text-red-600">Enter a valid NRIC (e.g., S1234567A)</p>
              )}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>
                Date of Birth{personalRequired.includes("date_of_birth") && (<span className="text-red-600">*</span>)}
              </Label>{" "}
              <Input
                type="date"
                value={formData.personal_details.date_of_birth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      date_of_birth: e.target.value,
                    },
                  })
                }
              />{" "}
              {computeAge(formData.personal_details.date_of_birth) !== null && (
                <p className="text-xs text-slate-500">
                  Age: {computeAge(formData.personal_details.date_of_birth)}
                </p>
              )}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>
                Nationality{personalRequired.includes("nationality") && (<span className="text-red-600">*</span>)}
              </Label>{" "}
              <Select
                value={formData.personal_details.nationality}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      nationality: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singaporean">Singaporean</SelectItem>
                  <SelectItem value="Malaysian">Malaysian</SelectItem>
                  <SelectItem value="Indonesian">Indonesian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>Marital Status</Label>{" "}
              <Select
                value={formData.personal_details.marital_status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      marital_status: value,
                    },
                  })
                }
              >
                {" "}
                <SelectTrigger>
                  {" "}
                  <SelectValue placeholder="Select" />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  <SelectItem value="Single">Single</SelectItem>{" "}
                  <SelectItem value="Married">Married</SelectItem>{" "}
                  <SelectItem value="Divorced">Divorced</SelectItem>{" "}
                  <SelectItem value="Widowed">Widowed</SelectItem>{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>Occupation</Label>{" "}
              <Input
                value={formData.personal_details.occupation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      occupation: e.target.value,
                    },
                  })
                }
              />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>
                Phone Number{personalRequired.includes("phone_number") && (<span className="text-red-600">*</span>)}
              </Label>{" "}
              <Input
                value={formData.personal_details.phone_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      phone_number: e.target.value,
                    },
                  })
                }
              />{" "}
              {!isValidPhone(formData.personal_details.phone_number) && (
                <p className="text-xs text-red-600">Enter a valid phone number</p>
              )}
            </div>{" "}
            <div className="space-y-2 md:col-span-2">
              {" "}
              <Label>Email</Label>{" "}
              <Input
                type="email"
                value={formData.personal_details.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      email: e.target.value,
                    },
                  })
                }
              />{" "}
              {!isValidEmail(formData.personal_details.email) && (
                <p className="text-xs text-red-600">Enter a valid email address</p>
              )}
            </div>{" "}
            <div className="space-y-2 md:col-span-3">
              {" "}
              <Label>Address</Label>{" "}
              <Input
                value={formData.personal_details.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      address: e.target.value,
                    },
                  })
                }
              />{" "}
            </div>{" "}
            <div className="space-y-2 md:col-span-3">
              <Label>Smoker Status</Label>
              <Select
                value={formData.personal_details.smoker_status ? "Yes" : "No"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    personal_details: {
                      ...formData.personal_details,
                      smoker_status: value === "Yes",
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
          {/* Dependents */}
          <Card className="shadow-md border-slate-200">
        {" "}
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <CardTitle className="flex items-center gap-2 text-xl">
              {" "}
              <Users className="w-6 h-6 text-purple-600" /> Dependents{" "}
            </CardTitle>{" "}
            <Button onClick={addDependent} size="sm" variant="outline">
              {" "}
              <Plus className="w-4 h-4 mr-2" /> Add Dependent{" "}
            </Button>{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="pt-6">
          {" "}
          {formData.dependents.length === 0 ? (
            <p className="text-center text-slate-400 py-8">
              No dependents added
            </p>
          ) : (
            <div className="space-y-6">
              {" "}
              {formData.dependents.map((dependent, index) => (
                <div
                  key={index}
                  className="p-4 border border-slate-200 rounded-lg relative"
                >
                  {" "}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeDependent(index)}
                  >
                    {" "}
                    <Trash2 className="w-4 h-4 text-red-500" />{" "}
                  </Button>{" "}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {" "}
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Select
                        value={dependent.title || ""}
                        onValueChange={(value) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].title = value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
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
                    <div className="space-y-2">
                      {" "}
                      <Label>Name</Label>{" "}
                      <Input
                        value={dependent.name}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].name = e.target.value;
                          setFormData({
                            ...formData,
                            dependents: newDependents,
                          });
                        }}
                      />{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <Label>Relationship</Label>{" "}
                      <Input
                        value={dependent.relationship}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].relationship = e.target.value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      />
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <Label>Date of Birth</Label>{" "}
                      <Input
                        type="date"
                        value={dependent.date_of_birth}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].date_of_birth = e.target.value;
                          setFormData({
                            ...formData,
                            dependents: newDependents,
                          });
                        }}
                      />{" "}
                      {computeAge(dependent.date_of_birth) !== null && (
                        <p className="text-xs text-slate-500">
                          {computeAge(dependent.date_of_birth) >= 18 ? "Adult" : "Child"}
                        </p>
                      )}
                    </div>{" "}
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        value={dependent.gender || ""}
                        onValueChange={(value) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].gender = value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
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
                    <div className="space-y-2">
                      <Label>NRIC</Label>
                      <Input
                        value={dependent.nric || ""}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].nric = e.target.value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nationality</Label>
                      <Select
                        value={dependent.nationality || ""}
                        onValueChange={(value) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].nationality = value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Singaporean">Singaporean</SelectItem>
                          <SelectItem value="Malaysian">Malaysian</SelectItem>
                          <SelectItem value="Indonesian">Indonesian</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={dependent.email || ""}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].email = e.target.value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Smoker Status</Label>
                      <Select
                        value={dependent.smoker_status ? "Yes" : (dependent.smoker_status === false ? "No" : "")}
                        onValueChange={(value) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].smoker_status = value === "Yes";
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={dependent.phone_number || ""}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].phone_number = e.target.value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      />
                    </div>
                    {computeAge(dependent.date_of_birth) >= 18 && (
                      <>
                        <div className="space-y-2">
                          <Label>Marital Status</Label>
                          <Select
                            value={dependent.marital_status || ""}
                            onValueChange={(value) => {
                              const newDependents = [...formData.dependents];
                              newDependents[index].marital_status = value;
                              setFormData({ ...formData, dependents: newDependents });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Occupation</Label>
                          <Input
                            value={dependent.occupation || ""}
                            onChange={(e) => {
                              const newDependents = [...formData.dependents];
                              newDependents[index].occupation = e.target.value;
                              setFormData({ ...formData, dependents: newDependents });
                            }}
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2 md:col-span-3">
                      <Label>Address</Label>
                      <Input
                        value={dependent.address || ""}
                        onChange={(e) => {
                          const newDependents = [...formData.dependents];
                          newDependents[index].address = e.target.value;
                          setFormData({ ...formData, dependents: newDependents });
                        }}
                      />
                    </div>
                  </div>{" "}
                </div>
              ))}{" "}
            </div>
          )}{" "}
        </CardContent>{" "}
      </Card>{" "}
          {/* CKA - Customer Knowledge & Experience */}
          <SectionCard
            stage="fact-finding"
            icon={GraduationCap}
            title="Customer Knowledge & Experience (CKA)"
            description="Capture the client's qualifications and market exposure to support the CKA assessment."
            badge={
              <Badge
                variant={
                  formData.cka.skipped
                    ? "secondary"
                    : formData.cka.outcome === "CKA Met"
                      ? "success"
                      : formData.cka.outcome === "CKA Not Met"
                        ? "warning"
                        : "secondary"
                }
              >
                {formData.cka.skipped ? "Not Applicable" : formData.cka.outcome || "Pending"}
              </Badge>
            }
            actions={
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>Skip Section</span>
                <Switch
                  checked={!!formData.cka.skipped}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, cka: { ...formData.cka, skipped: checked } })
                  }
                  disabled={readOnly}
                />
              </label>
            }
          >
            {formData.cka.skipped ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                This section has been marked as not applicable. Toggle the switch above to capture CKA details.
              </p>
            ) : null}
            <div className={`space-y-6 ${formData.cka.skipped ? "opacity-50" : ""}`}>
              <div>
                <Label className="text-base font-semibold">Relevant Qualifications</Label>
                <div className="mt-2 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  {["CMFAS", "Degree in Finance", "Professional Cert", "N.A."].map((q) => {
                    const isChecked = (formData.cka.qualifications || []).includes(q);
                    return (
                      <label key={q} className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          disabled={formData.cka.skipped || readOnly}
                          onCheckedChange={(checked) => {
                            const current = new Set(formData.cka.qualifications || []);
                            if (checked) current.add(q); else current.delete(q);
                            setFormData({
                              ...formData,
                              cka: { ...formData.cka, qualifications: [...current] },
                            });
                          }}
                        />
                        {q}
                      </label>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Investment Experience</Label>
                <p className="mb-2 text-sm text-slate-500">
                  Select all investment products the client has previously engaged with.
                </p>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  {["Unit Trusts", "Bonds", "Equities", "Options/Derivatives", "N.A."].map((w) => {
                    const isChecked = (formData.cka.work_experience || []).includes(w);
                    return (
                      <label key={w} className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          disabled={formData.cka.skipped || readOnly}
                          onCheckedChange={(checked) => {
                            const current = new Set(formData.cka.work_experience || []);
                            if (checked) current.add(w); else current.delete(w);
                            setFormData({
                              ...formData,
                              cka: { ...formData.cka, work_experience: [...current] },
                            });
                          }}
                        />
                        {w}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Transaction Frequency (last 12 months)</Label>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    { key: "none", label: "None" },
                    { key: "<3", label: "< 3" },
                    { key: "3-12", label: "3-12" },
                    { key: ">12", label: "> 12" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        formData.cka.transaction_frequency === opt.key
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-slate-200 text-slate-600 hover:border-primary-200 hover:bg-primary-50/60"
                      }`}
                      onClick={() =>
                        setFormData({ ...formData, cka: { ...formData.cka, transaction_frequency: opt.key } })
                      }
                      disabled={formData.cka.skipped || readOnly}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
          {/* RPQ - Risk Profiling */}
          <SectionCard
            stage="fact-finding"
            icon={TrendingUp}
            title="Risk Profiling Questionnaire (RPQ)"
            description="Determine the client's investment profile to align product recommendations."
            badge={
              <Badge variant={formData.rpq.risk_band ? "success" : "secondary"}>
                {formData.rpq.risk_band || "Pending"}
              </Badge>
            }
          >
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Investment Experience</Label>
                <p className="mb-3 text-sm text-slate-500">
                  How many years of investment experience does the client have?
                </p>
                <RadioGroup
                  value={formData.rpq.investment_years}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, investment_years: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "exp1", value: "<3", label: "Less than 3 years" },
                    { id: "exp2", value: "3-5", label: "3 to 5 years" },
                    { id: "exp3", value: "5-10", label: "5 to 10 years" },
                    { id: "exp4", value: ">=10", label: "10 years or more" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Risk Tolerance</Label>
                <p className="mb-3 text-sm text-slate-500">
                  I am prepared to accept short-term losses of what percentage of my investments?
                </p>
                <RadioGroup
                  value={formData.rpq.risk_tolerance}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, risk_tolerance: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "risk1", value: "10", label: "Up to 10%" },
                    { id: "risk2", value: "10-20", label: "10% to 20%" },
                    { id: "risk3", value: "20-30", label: "20% to 30%" },
                    { id: "risk4", value: "30", label: "More than 30%" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Investment Horizon</Label>
                <p className="mb-3 text-sm text-slate-500">
                  How long can the client hold their investments before needing the funds?
                </p>
                <RadioGroup
                  value={formData.rpq.hold_duration}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, hold_duration: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "hold1", value: "<3", label: "Less than 3 years" },
                    { id: "hold2", value: "3-5", label: "3 to 5 years" },
                    { id: "hold3", value: "5-10", label: "5 to 10 years" },
                    { id: "hold4", value: ">=10", label: "10 years or more" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Financial Capacity</Label>
                <p className="mb-3 text-sm text-slate-500">
                  How long can the client finance the investment before needing funds back?
                </p>
                <RadioGroup
                  value={formData.rpq.finance_duration}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, finance_duration: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "fin1", value: "<3", label: "Less than 3 years" },
                    { id: "fin2", value: "3-5", label: "3 to 5 years" },
                    { id: "fin3", value: "5-10", label: "5 to 10 years" },
                    { id: "fin4", value: ">=10", label: "10 years or more" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Asset Preference</Label>
                <p className="mb-3 text-sm text-slate-500">
                  What is the riskiest asset the client is comfortable holding?
                </p>
                <RadioGroup
                  value={formData.rpq.riskiest_assets}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, riskiest_assets: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "asset1", value: "bonds", label: "Bonds" },
                    { id: "asset2", value: "balanced", label: "Balanced funds" },
                    { id: "asset3", value: "equities", label: "Equities" },
                    { id: "asset4", value: "derivatives", label: "Options/Derivatives" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-semibold">Retirement Timeline</Label>
                <p className="mb-3 text-sm text-slate-500">
                  How many years does the client have until retirement?
                </p>
                <RadioGroup
                  value={formData.rpq.retirement_years}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      rpq: { ...formData.rpq, retirement_years: value },
                    })
                  }
                  className="space-y-2"
                >
                  {[
                    { id: "ret1", value: "<3", label: "Less than 3 years" },
                    { id: "ret2", value: "3-5", label: "3 to 5 years" },
                    { id: "ret3", value: "5-10", label: "5 to 10 years" },
                    { id: "ret4", value: ">=10", label: "10 years or more" },
                  ].map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} disabled={readOnly} />
                      <Label htmlFor={opt.id}>{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <Button
                onClick={calculateRPQScore}
                variant="outline"
                className="w-full"
                disabled={!rpqComplete || readOnly}
              >
                {rpqComplete ? "Calculate Risk Score" : "Answer all questions to calculate"}
              </Button>
              {formData.rpq.total_score > 0 && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                  <p className="text-sm font-medium text-slate-900">
                    Total Score: {formData.rpq.total_score}
                  </p>
                  <p className="mt-1 text-lg font-bold text-primary-700">
                    {formData.rpq.risk_band}
                  </p>
                  {formData.rpq.assessed_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      Assessed on {new Date(formData.rpq.assessed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <div className="flex flex-col justify-end gap-2 md:flex-row">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onSave(formData);
                  setLastSavedAt(new Date().toISOString());
                  setDirty(false);
                }}
                disabled={isSaving || readOnly}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || readOnly}
                className="bg-primary-600 px-8 hover:bg-primary-700"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Fact Finding
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleSave();
                  if (onNext) onNext();
                }}
                disabled={isSaving || !rpqComplete || readOnly}
              >
                Save & Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

