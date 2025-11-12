import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { Textarea } from "@/admin/components/ui/textarea";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Alert, AlertDescription } from "@/admin/components/ui/alert";
import { Badge } from "@/admin/components/ui/badge";
import { Separator } from "@/admin/components/ui/separator";
import { SectionCard } from "@/admin/components/ui/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  Save,
  Send,
  Lock,
  FileText,
  Users,
  Activity,
  CreditCard,
  CheckSquare,
  Plus,
  Trash2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import SignaturePad from "@/admin/components/ui/SignaturePad.jsx";
import { useToast } from "@/admin/components/ui/toast";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { supabase } from "@/admin/api/supabaseClient";
import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";

export default function ApplicationSection({
  proposal,
  onSave,
  isSaving,
  isLocked,
  onSubmit,
}) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    // E11-S01: Pre-populate from previous sections
    applicant_info: {},
    beneficiaries: [],
    health_questions: [],
    payment_config: {
      method: "",
      frequency: "",
      account_type: "",
      bank_name: "",
      account_number: "",
      account_holder: "",
      auto_debit_day: "1",
    },
    declarations: {
      health_declaration: false,
      data_consent: false,
      terms_acceptance: false,
      marketing_consent: false,
    },
    signatures: {
      applicant_signature: "",
      applicant_sign_date: "",
      witness_signature: "",
      witness_name: "",
      witness_sign_date: "",
    },
    supporting_documents: [],
    application_date: new Date().toISOString().split("T")[0],
    submission_status: "draft", // draft, submitted, approved, rejected
    ...proposal.application_data,
  });
  const receiptRef = useRef(null);
  const [advisorEmail, setAdvisorEmail] = useState("");
  const isSubmitted = String(formData.submission_status).toLowerCase() === 'submitted';
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1';
  const totalHealthQuestions = (formData.health_questions || []).length;
  const answeredHealthQuestions = (formData.health_questions || []).filter((q) => q.answer).length;
  const underwritingBadgeVariant = answeredHealthQuestions === totalHealthQuestions && totalHealthQuestions > 0
    ? "success"
    : answeredHealthQuestions > 0
      ? "warning"
      : "secondary";

  useMiraPopupListener(MIRA_POPUP_TARGETS.PROPOSAL_SUBMIT_CONFIRM, () => {
    setShowSubmitConfirm(true);
    return () => setShowSubmitConfirm(false);
  });

  useEffect(() => {
    // Load advisor email for notifications
    adviseUAdminApi.auth
      .me()
      .then((u) => setAdvisorEmail(u?.email || ""))
      .catch(() => {});

    // Pre-populate from previous sections - E11-S01
    if (proposal && !formData.applicant_info.name) {
      const ff = proposal.fact_finding_data || {};
      const pd = ff.personal_details || {};
      const fna = proposal.fna_data || {};
      const quotation = proposal.quotation_data || {};
      const recommendation = proposal.recommendation_data || {};

      setFormData((prev) => ({
        ...prev,
        applicant_info: {
          name: pd.name || proposal.proposer_name || "",
          nric: pd.nric || "",
          date_of_birth: pd.date_of_birth || "",
          gender: pd.gender || "",
          email: pd.email || "",
          contact_number: pd.phone_number || "",
          address: pd.address || "",
          occupation: pd.occupation || "",
          annual_income: (fna?.incomes || []).reduce((acc, i) => acc + (i.frequency === "annual" ? Number(i.amount)||0 : (Number(i.amount)||0)*12), 0).toString(),
        },
        life_assured: quotation.life_assured || [],
        selected_products: (quotation.quote_scenarios || []).find(s => s.is_recommended)?.products || [],
        recommendation_summary: recommendation.selected_plan || {},
      }));
    }

    if (proposal.application_data) {
      setFormData((prev) => ({ ...prev, ...proposal.application_data }));
    }

    // Initialize health questions if empty
    if (formData.health_questions.length === 0) {
      setFormData((prev) => ({
        ...prev,
        health_questions: getStandardHealthQuestions().map(q => ({
          ...q,
          answer: "",
          details: "",
        })),
      }));
    }

    // Initialize one beneficiary if empty
    if (formData.beneficiaries.length === 0) {
      addBeneficiary();
    }

    // Set sensible defaults for payment to ease completion
    setFormData((prev) => ({
      ...prev,
      payment_config: {
        ...prev.payment_config,
        method: prev.payment_config.method || "Cash",
        frequency: prev.payment_config.frequency || "Monthly",
      },
    }));
  }, [proposal]);

  const addBeneficiary = () => {
    setFormData({
      ...formData,
      beneficiaries: [
        ...formData.beneficiaries,
        {
          name: "",
          nric: "",
          date_of_birth: "",
          relationship: "",
          percentage: "",
          contact_number: "",
          address: "",
        },
      ],
    });
  };

  const removeBeneficiary = (index) => {
    setFormData({
      ...formData,
      beneficiaries: formData.beneficiaries.filter((_, i) => i !== index),
    });
  };

  const updateBeneficiary = (index, field, value) => {
    const updated = [...formData.beneficiaries];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, beneficiaries: updated });
  };

  const updateHealthAnswer = (index, field, value) => {
    const updated = [...formData.health_questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, health_questions: updated });
  };

  const addDocument = (file) => {
    const doc = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      upload_date: new Date().toISOString(),
      status: "uploaded",
    };
    setFormData({
      ...formData,
      supporting_documents: [...formData.supporting_documents, doc],
    });
  };

  const removeDocument = (id) => {
    setFormData({
      ...formData,
      supporting_documents: formData.supporting_documents.filter(d => d.id !== id),
    });
  };

  const validateForm = () => {
    const errors = [];

    // Applicant validation
    if (!formData.applicant_info.name) errors.push("Applicant name is required");
    if (!formData.applicant_info.nric) errors.push("Applicant NRIC is required");
    if (!formData.applicant_info.date_of_birth) errors.push("Applicant date of birth is required");
    if (!formData.applicant_info.gender) errors.push("Applicant gender is required");
    if (!formData.applicant_info.contact_number) errors.push("Applicant contact number is required");
    if (!formData.applicant_info.address) errors.push("Applicant address is required");
    if (!formData.applicant_info.occupation) errors.push("Applicant occupation is required");

    // Beneficiaries validation
    if (formData.beneficiaries.length === 0) {
      errors.push("At least one beneficiary is required");
    } else {
      const totalPercentage = formData.beneficiaries.reduce(
        (sum, b) => sum + (parseFloat(b.percentage) || 0),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push(`Beneficiary percentages must total 100% (currently ${totalPercentage}%)`);
      }
      formData.beneficiaries.forEach((b, i) => {
        if (!b.name) errors.push(`Beneficiary ${i + 1}: Name is required`);
        if (!b.relationship) errors.push(`Beneficiary ${i + 1}: Relationship is required`);
        if (!b.percentage) errors.push(`Beneficiary ${i + 1}: Percentage is required`);
      });
    }

    // Health questions validation
    const unanswered = formData.health_questions.filter(q => !q.answer);
    if (unanswered.length > 0) {
      errors.push(`${unanswered.length} health question(s) not answered`);
    }

    // Payment validation
    if (!formData.payment_config.method) errors.push("Payment method is required");
    if (!formData.payment_config.frequency) errors.push("Payment frequency is required");
    if (formData.payment_config.method === "GIRO") {
      if (!formData.payment_config.bank_name) errors.push("Bank name is required for GIRO");
      if (!formData.payment_config.account_number) errors.push("Account number is required for GIRO");
    }
    if (formData.payment_config.method === "Credit Card") {
      if (!formData.payment_config.card_number) errors.push("Credit card number is required");
      if (!formData.payment_config.card_expiry) errors.push("Credit card expiry is required");
      if (!formData.payment_config.card_cvv) errors.push("Credit card CVV is required");
    }
    if (formData.payment_config.method !== "Cash" && !formData.payment_config.first_payment_date) {
      errors.push("First payment date is required");
    }

    // Declaration validation
    if (!formData.declarations.health_declaration) errors.push("Health declaration required");
    if (!formData.declarations.data_consent) errors.push("Data consent required");
    if (!formData.declarations.terms_acceptance) errors.push("Terms acceptance required");

    // Signature validation
    if (!formData.signatures.applicant_signature) errors.push("Applicant signature required");

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      showToast({ type: 'error', title: 'Incomplete', description: 'Please complete required fields before submitting.' });
      return;
    }
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = async () => {
    const confirmation_number = `APP-${Date.now()}`;
    const submitted = {
      ...formData,
      submission_status: 'submitted',
      confirmation_number,
      submitted_at: new Date().toISOString(),
    };
    try {
      // Persist application data
      await onSave(submitted);
      setFormData(submitted);

      // Update proposal status for tracking
      try {
        await adviseUAdminApi.entities.Proposal.update(proposal.id, {
          status: 'Pending Underwriting',
          application_data: submitted,
        });
      } catch (_) {}

      // Queue confirmation email copy to advisor (RLS allows self insert)
      try {
        if (advisorEmail) {
          await supabase.from('email_outbox').insert([
            {
              to_email: advisorEmail,
              subject: `Application submitted: ${submitted.applicant_info?.name || ''} (${confirmation_number})`,
              body: `An application was submitted.\n\nRef: ${confirmation_number}\nApplicant: ${submitted.applicant_info?.name || ''}\nEmail: ${submitted.applicant_info?.email || ''}`,
              template: 'application_submitted',
              status: 'queued',
            },
          ]);
        }
      } catch (e) {
        console.warn('email_outbox insert failed:', e?.message || e);
      }

      // Attempt client confirmation email via Edge Function (uses service role within function)
      try {
        const clientEmail = submitted?.applicant_info?.email || '';
        if (clientEmail) {
          const clientBody = `Dear Client,\n\nYour application has been submitted.\n\nReference: ${confirmation_number}\nApplicant: ${submitted.applicant_info?.name || ''}\nSubmitted: ${new Date().toLocaleString()}\n\nWe will contact you shortly.`;
          await supabase.functions.invoke('email-sender', {
            body: {
              to_email: clientEmail,
              subject: `Your Application (${confirmation_number})`,
              body: clientBody,
              template: 'application_submitted_client',
            },
          });
        }
      } catch (_) {}

      showToast({ type: 'success', title: 'Application Submitted', description: `Reference: ${confirmation_number}. Status: Pending Underwriting.` });
    } catch (e) {
      showToast({ type: 'error', title: 'Submit failed', description: e?.message || 'Please try again.' });
    } finally {
      setShowSubmitConfirm(false);
    }
  };

  const handleE2EAutofill = () => {
    // Auto-fill minimal valid data for E2E
    const ff = formData;
    const updated = { ...ff };
    updated.applicant_info = {
      ...updated.applicant_info,
      name: updated.applicant_info.name || 'Alex Tan',
      nric: updated.applicant_info.nric || 'S1234567A',
      date_of_birth: updated.applicant_info.date_of_birth || '1990-01-01',
      gender: updated.applicant_info.gender || 'Male',
      contact_number: updated.applicant_info.contact_number || '+6500000000',
      address: updated.applicant_info.address || '123 Example St',
      occupation: updated.applicant_info.occupation || 'Engineer',
      email: updated.applicant_info.email || 'alex.tan@example.com',
    };
    if (!updated.beneficiaries || updated.beneficiaries.length === 0) {
      updated.beneficiaries = [{ name: 'Spouse Name', relationship: 'Spouse', percentage: '100' }];
    } else {
      updated.beneficiaries = updated.beneficiaries.map((b, i) => i === 0 ? { ...b, name: b.name || 'Spouse Name', relationship: b.relationship || 'Spouse', percentage: b.percentage || '100' } : b);
    }
    updated.health_questions = (updated.health_questions || []).map(q => ({ ...q, answer: 'No', details: '' }));
    updated.payment_config = {
      ...updated.payment_config,
      method: 'Cash',
      frequency: 'Monthly',
    };
    updated.declarations = { health_declaration: true, data_consent: true, terms_acceptance: true, marketing_consent: false };
    // Simple signature image
    const emptySig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z/C/HwAFgwJ/lSujCwAAAABJRU5ErkJggg==';
    updated.signatures = { ...updated.signatures, applicant_signature: updated.signatures.applicant_signature || emptySig, applicant_sign_date: new Date().toISOString() };
    setFormData(updated);
    showToast({ type: 'success', title: 'E2E autofill applied' });
  };
  const handleE2ESubmit = () => {
    // In E2E mode, bypass dialog and directly submit after autofill
    confirmSubmit();
  };

  // (duplicate handleSubmit/confirmSubmit removed)

  if (isLocked) {
    return (
      <Card className="shadow-lg border-slate-200 rounded-xl opacity-60">
        <CardContent className="p-12 text-center">
          <Lock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Section Locked
          </h3>
          <p className="text-slate-500">
            Please complete all previous sections before accessing the
            Application section
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalBeneficiaryPercentage = formData.beneficiaries.reduce(
    (sum, b) => sum + (parseFloat(b.percentage) || 0),
    0
  );

  // isSubmitted already defined above; keep one source of truth
  const applicantRequired = ["name","nric","date_of_birth","gender","contact_number","address","occupation"];
  const applicantComplete = applicantRequired.every((k)=> (formData.applicant_info?.[k] ?? "").toString().length>0);
  const beneficiariesComplete = formData.beneficiaries.length>0 && Math.abs(formData.beneficiaries.reduce((s,b)=>s+(parseFloat(b.percentage)||0),0)-100)<0.01;
  const healthComplete = (formData.health_questions||[]).every((q)=>q.answer && (q.answer==="No" || (q.answer==="Yes" && (q.details||"").length>0)));
  const paymentRequired = formData.payment_config.method && formData.payment_config.frequency && (formData.payment_config.method==="Cash" || (formData.payment_config.bank_name && (formData.payment_config.account_number||formData.payment_config.card_number)));
  const declarationsComplete = formData.declarations.health_declaration && formData.declarations.data_consent && formData.declarations.terms_acceptance;
  const signatureComplete = !!formData.signatures.applicant_signature;
  const stepsComplete = [applicantComplete, beneficiariesComplete, healthComplete, paymentRequired, declarationsComplete, signatureComplete].filter(Boolean).length;
  const progressPct = Math.round((stepsComplete/6)*100);
  const premiumSummary = useMemo(()=>{
    const products = formData.selected_products || [];
    const annual = products.reduce((sum,p)=> sum + ((parseFloat(p.premium_amount)||0) * ({Monthly:12,Quarterly:4,'Semi-Annual':2,Annual:1}[p.premium_frequency]||1)),0);
    return { annual, monthly: annual/12 };
  }, [formData.selected_products]);
  const downloadReceipt = () => {
    const products = formData.selected_products || [];
    const annual = premiumSummary.annual;
    const applicant = formData.applicant_info || {};
    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system;padding:16px">
        <h1 style="font-size:20px;font-weight:700">Application Submission Receipt</h1>
        <p>Reference: ${formData.reference_number || ''}</p>
        <p>Submitted on: ${new Date(formData.submission_date).toLocaleString()}</p>
        <hr/>
        <p><b>Applicant</b></p>
        <p>${applicant.name || ''} (${applicant.nric || ''})</p>
        <p>${applicant.address || ''}</p>
        <p>${applicant.contact_number || ''} · ${applicant.email || ''}</p>
        <hr/>
        <p><b>Products</b></p>
        <ul>
          ${(products.map(p=>`<li>${p.product_name} — ${p.coverage_type} ($${p.sum_assured}) [${p.premium_frequency}] $${Number(p.premium_amount||0).toFixed(2)}</li>`)).join('')}
        </ul>
        <p><b>Total Annual Premium:</b> $${annual.toFixed(2)}</p>
      </div>`;
    const win = window.open('', '_blank');
    win.document.write(`<!doctype html><html><head><title>Application Receipt</title></head><body>${html}<script>window.onload=function(){setTimeout(function(){window.print();},300)}</script></body></html>`);
    win.document.close();
  };

  const emailReceipt = () => {
    const to = encodeURIComponent(
      [formData.applicant_info?.email, advisorEmail].filter(Boolean).join(",")
    );
    const subject = encodeURIComponent(
      `Application Receipt - Ref: ${formData.reference_number || ""}`
    );
    const products = (formData.selected_products || [])
      .map(
        (p) =>
          `${p.product_name} — ${p.coverage_type} ($${p.sum_assured}) [${p.premium_frequency}] $${Number(p.premium_amount || 0).toFixed(2)}`
      )
      .join("%0D%0A");
    const body = encodeURIComponent(
      `Dear ${formData.applicant_info?.name || "Client"},%0D%0A%0D%0A` +
        `Thank you for your application. Please find your submission details below.%0D%0A%0D%0A` +
        `Reference: ${formData.reference_number || ""}%0D%0A` +
        `Submitted on: ${new Date(
          formData.submission_date
        ).toLocaleString()}%0D%0A%0D%0AProducts:%0D%0A${products}%0D%0A%0D%0ATotal Annual Premium: $${(
          premiumSummary.annual || 0
        ).toFixed(2)}%0D%0A%0D%0ARegards,%0D%0A${proposal.advisor_name || "Advisor"}`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const downloadFullApplication = () => {
    const applicant = formData.applicant_info || {};
    const beneficiaries = formData.beneficiaries || [];
    const health = formData.health_questions || [];
    const payment = formData.payment_config || {};
    const products = formData.selected_products || [];
    const benRows = beneficiaries
      .map(
        (b) =>
          `<tr><td>${b.name || ""}</td><td>${b.relationship || ""}</td><td>${
            b.percentage || 0
          }%</td></tr>`
      )
      .join("");
    const qRows = health
      .map(
        (q) =>
          `<tr><td>${q.question}</td><td>${q.answer || ""}</td><td>$${
            q.details || ""
          }</td></tr>`
      )
      .join("");
    const prodRows = products
      .map(
        (p) =>
          `<tr><td>${p.product_name}</td><td>${p.coverage_type}</td><td>$${p.sum_assured}</td><td>${
            p.premium_frequency
          }</td><td>$${Number(p.premium_amount || 0).toFixed(2)}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><title>Full Application</title><style>
      body{font-family:ui-sans-serif,system-ui,-apple-system;padding:16px}
      table{width:100%;border-collapse:collapse;margin:8px 0}
      th,td{border:1px solid #cbd5e1;padding:6px;text-align:left;font-size:12px}
      h2{margin-top:16px}
    </style></head><body>
      <h1>Insurance Application</h1>
      <p>Reference: ${formData.reference_number || ""}</p>
      <p>Submitted on: ${new Date(formData.submission_date).toLocaleString()}</p>
      <h2>Applicant</h2>
      <p>${applicant.name || ""} (${applicant.nric || ""})</p>
      <p>${applicant.address || ""}</p>
      <p>${applicant.contact_number || ""} · ${applicant.email || ""}</p>
      <h2>Selected Products</h2>
      <table><thead><tr><th>Product</th><th>Coverage</th><th>Sum Assured</th><th>Frequency</th><th>Premium</th></tr></thead><tbody>${prodRows}</tbody></table>
      <h2>Beneficiaries</h2>
      <table><thead><tr><th>Name</th><th>Relationship</th><th>Allocation</th></tr></thead><tbody>${benRows}</tbody></table>
      <h2>Underwriting Questionnaire</h2>
      <table><thead><tr><th>Question</th><th>Answer</th><th>Details</th></tr></thead><tbody>${qRows}</tbody></table>
      <h2>Payment</h2>
      <p>Method: ${payment.method || ""} · Frequency: ${
      payment.frequency || ""
    } · First payment: ${payment.first_payment_date || ""}</p>
      <h2>Declarations</h2>
      <ul>
        <li>Health declaration: ${formData.declarations.health_declaration ?
      "Yes"
      : "No"}</li>
        <li>Data consent: ${formData.declarations.data_consent ? "Yes" : "No"}</li>
        <li>Terms acceptance: ${formData.declarations.terms_acceptance ?
      "Yes"
      : "No"}</li>
      </ul>
      <script>window.onload=function(){setTimeout(function(){window.print();},300)}</script>
    </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="mx-auto w-full max-w-[1065px] px-6 lg:px-8 space-y-6">
      {/* Application Container - wraps all subsections */}
      <Card className="shadow-lg border-slate-200 rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white px-6 lg:px-8 py-6">
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <Send className="w-7 h-7 text-primary-600" />
            Application
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 lg:px-8 pt-6 pb-6 space-y-6">

          {/* Status Badge */}
          <div className="flex items-center justify-end">
        {isSubmitted ? (
          <Badge variant="outline" className="border-green-300 text-green-700">Submitted</Badge>
        ) : (
          <Badge variant="outline" className="border-blue-300 text-blue-700">Draft</Badge>
        )}
      </div>

      {/* Status Alert */}
      {isSubmitted ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Application submitted successfully on {new Date(formData.submission_date).toLocaleDateString()}. Reference: {formData.reference_number}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-blue-50 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            This is the final step. Please ensure all information is accurate
            before submission.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-semibold mb-2">Please correct the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

          {/* Application Details Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white px-6 lg:px-8 py-4">
              <div className="flex w-full items-center justify-between gap-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-6 h-6 text-blue-600" /> Application Details
                </CardTitle>
                {isE2E && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleE2EAutofill} data-testid="e2e-autofill">
                      E2E Auto-Fill
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleE2ESubmit} data-testid="e2e-submit">
                      E2E Submit
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Application Date</Label>
              <Input
                type="date"
                value={formData.application_date}
                onChange={(e) =>
                  setFormData({ ...formData, application_date: e.target.value })
                }
                disabled={isSubmitted}
              />
            </div>

            <div className="space-y-3">
              <Label>Status</Label>
              <Input
                value={formData.submission_status.toUpperCase()}
                disabled
                className="bg-slate-50 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3"><Label>Full Name *</Label><Input value={formData.applicant_info.name||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, name: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3"><Label>NRIC *</Label><Input value={formData.applicant_info.nric||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, nric: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3"><Label>Date of Birth *</Label><Input type="date" value={formData.applicant_info.date_of_birth||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, date_of_birth: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3"><Label>Gender *</Label><Select value={formData.applicant_info.gender||""} onValueChange={(val)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, gender: val } })} disabled={isSubmitted}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
            <div className="space-y-3"><Label>Email *</Label><Input type="email" value={formData.applicant_info.email||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, email: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3"><Label>Contact Number *</Label><Input value={formData.applicant_info.contact_number||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, contact_number: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3"><Label>Occupation *</Label><Input value={formData.applicant_info.occupation||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, occupation: e.target.value } })} disabled={isSubmitted} /></div>
            <div className="space-y-3 md:col-span-2"><Label>Address *</Label><Textarea rows={2} value={formData.applicant_info.address||""} onChange={(e)=> setFormData({ ...formData, applicant_info: { ...formData.applicant_info, address: e.target.value } })} disabled={isSubmitted} /></div>

            {/* Policy Summary */}
            <div className="md:col-span-2">
              <Separator className="my-4" />
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2">Policy Summary</p>
                {(formData.selected_products || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No products selected from Quotation.</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    {(formData.selected_products || []).map((p, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{p.product_name} — {p.coverage_type} (${p.sum_assured})</span>
                        <span>{p.premium_frequency || 'Annual'} ${Number(p.premium_amount||0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
                      <span>Total (Annual)</span>
                      <span>${premiumSummary.annual.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            </CardContent>
          </Card>

          {/* Beneficiaries Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-6">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-6 h-6 text-purple-600" /> Beneficiaries
                </CardTitle>
            {!isSubmitted && (
              <Button onClick={addBeneficiary} size="sm" variant="outline" data-testid="add-beneficiary">
                <Plus className="w-4 h-4 mr-2" /> Add Beneficiary
              </Button>
            )}
          </div>
        </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6 space-y-6">
          {formData.beneficiaries.map((ben, index) => (
            <div
              key={index}
              className="relative rounded-lg border-2 border-slate-200 bg-white px-4 py-3"
            >
              {!isSubmitted && formData.beneficiaries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeBeneficiary(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}

              <h4 className="mb-3 font-semibold text-slate-900">
                Beneficiary {index + 1}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Name *</Label>
                  <Input
                    value={ben.name}
                    onChange={(e) => updateBeneficiary(index, "name", e.target.value)}
                    placeholder="Full name"
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>NRIC/Passport</Label>
                  <Input
                    value={ben.nric}
                    onChange={(e) => updateBeneficiary(index, "nric", e.target.value)}
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={ben.date_of_birth}
                    onChange={(e) => updateBeneficiary(index, "date_of_birth", e.target.value)}
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Relationship *</Label>
                  <Select
                    value={ben.relationship}
                    onValueChange={(val) => updateBeneficiary(index, "relationship", val)}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger data-testid={`ben-rel-${index}`}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Estate">Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Allocation % *</Label>
                  <Input
                    data-testid={`ben-alloc-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    value={ben.percentage}
                    onChange={(e) => updateBeneficiary(index, "percentage", e.target.value)}
                    placeholder="e.g., 50"
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Contact Number</Label>
                  <Input
                    value={ben.contact_number}
                    onChange={(e) => updateBeneficiary(index, "contact_number", e.target.value)}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total Percentage Check */}
          <div
            className={`p-4 rounded-lg ${
              Math.abs(totalBeneficiaryPercentage - 100) < 0.01
                ? "bg-green-50 border border-green-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">Total Allocation:</span>
              <span
                className={`text-2xl font-bold ${
                  Math.abs(totalBeneficiaryPercentage - 100) < 0.01
                    ? "text-green-700"
                    : "text-amber-700"
                }`}
              >
                {totalBeneficiaryPercentage.toFixed(1)}%
              </span>
            </div>
            {Math.abs(totalBeneficiaryPercentage - 100) > 0.01 && (
              <p className="text-xs text-amber-700 mt-2">
                Total must equal 100%
              </p>
            )}
          </div>
            </CardContent>
          </Card>

          {/* Underwriting Questionnaire Subsection */}
          <SectionCard
            stage="application"
            icon={Activity}
            title="Underwriting Questionnaire"
            description="Confirm health disclosures before submitting the application."
            badge={
              totalHealthQuestions > 0 ? (
                <Badge variant={underwritingBadgeVariant}>
                  {answeredHealthQuestions}/{totalHealthQuestions} answered
                </Badge>
              ) : null
            }
            actions={
              isSubmitted ? (
                <Badge variant="success" className="uppercase tracking-wide">
                  Submitted
                </Badge>
              ) : null
            }
          >
            <p className="text-sm text-slate-600">
              Please answer all questions truthfully. Your responses will be used for underwriting purposes.
            </p>
            <div className="space-y-6">
              {formData.health_questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  data-testid={`uq-row-${index}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <p className="flex-1 text-sm font-medium text-slate-900">
                      {index + 1}. {question.question}
                    </p>
                    <Badge
                      variant={
                        question.answer === "Yes"
                          ? "destructive"
                          : question.answer === "No"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {question.answer || "Pending"}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant={question.answer === "Yes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateHealthAnswer(index, "answer", "Yes")}
                      disabled={isSubmitted}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={question.answer === "No" ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateHealthAnswer(index, "answer", "No")}
                      disabled={isSubmitted}
                    >
                      No
                    </Button>
                  </div>
                  {question.answer === "Yes" && (
                    <div className="mt-6 space-y-3">
                      <Label className="text-sm font-medium">Please provide details:</Label>
                      <Textarea
                        rows={3}
                        value={question.details}
                        onChange={(e) => updateHealthAnswer(index, "details", e.target.value)}
                        placeholder="Provide full details including dates, diagnosis, treatment, and current status..."
                        disabled={isSubmitted}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>{/* Payment Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-white px-6 lg:px-8 py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="w-6 h-6 text-green-600" /> Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Payment Method *</Label>
              <Select
                value={formData.payment_config.method}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    payment_config: { ...formData.payment_config, method: val },
                  })
                }
                disabled={isSubmitted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIRO">GIRO (Auto Debit)</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Payment Frequency *</Label>
              <Select
                value={formData.payment_config.frequency}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    payment_config: { ...formData.payment_config, frequency: val },
                  })
                }
                disabled={isSubmitted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_config.method !== "Cash" && (
              <>
                <div className="space-y-3">
                  <Label>Bank Name *</Label>
                  <Input
                    value={formData.payment_config.bank_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_config: {
                          ...formData.payment_config,
                          bank_name: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., DBS Bank"
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Account Type</Label>
                  <Select
                    value={formData.payment_config.account_type}
                    onValueChange={(val) =>
                      setFormData({
                        ...formData,
                        payment_config: {
                          ...formData.payment_config,
                          account_type: val,
                        },
                      })
                    }
                    disabled={isSubmitted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Savings">Savings Account</SelectItem>
                      <SelectItem value="Current">Current Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Account Number *</Label>
                  <Input
                    value={formData.payment_config.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_config: {
                          ...formData.payment_config,
                          account_number: e.target.value,
                        },
                      })
                    }
                    placeholder="Account number"
                    disabled={isSubmitted}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={formData.payment_config.account_holder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_config: {
                          ...formData.payment_config,
                          account_holder: e.target.value,
                        },
                      })
                    }
                    placeholder="As per bank records"
                    disabled={isSubmitted}
                  />
                </div>

                {formData.payment_config.method === "GIRO" && (
                  <div className="space-y-3">
                    <Label>Auto-Debit Day</Label>
                    <Select
                      value={formData.payment_config.auto_debit_day}
                      onValueChange={(val) =>
                        setFormData({
                          ...formData,
                          payment_config: {
                            ...formData.payment_config,
                            auto_debit_day: val,
                          },
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.payment_config.method === "Credit Card" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label>Card Type</Label>
                      <Select
                        value={formData.payment_config.card_type || ""}
                        onValueChange={(val)=> setFormData({ ...formData, payment_config: { ...formData.payment_config, card_type: val } })}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mastercard">Mastercard</SelectItem>
                          <SelectItem value="Amex">Amex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label>Expiry (MM/YY)</Label>
                      <Input
                        placeholder="MM/YY"
                        value={formData.payment_config.card_expiry || ""}
                        onChange={(e)=> setFormData({ ...formData, payment_config: { ...formData.payment_config, card_expiry: e.target.value } })}
                        disabled={isSubmitted}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>CVV</Label>
                      <Input
                        type="password"
                        value={formData.payment_config.card_cvv || ""}
                        onChange={(e)=> setFormData({ ...formData, payment_config: { ...formData.payment_config, card_cvv: e.target.value } })}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>First Payment Date</Label>
                  <Input
                    type="date"
                    value={formData.payment_config.first_payment_date || ""}
                    onChange={(e)=> setFormData({ ...formData, payment_config: { ...formData.payment_config, first_payment_date: e.target.value } })}
                    disabled={isSubmitted}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded border mt-2 bg-slate-50">
                  <p className="text-sm text-slate-700">
                    Estimated premium: <span className="font-semibold">${premiumSummary.annual.toFixed(2)}</span> per year (~${premiumSummary.monthly.toFixed(2)} per month)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={()=> setFormData({ ...formData, payment_config: { ...formData.payment_config, verified: true } })}
                    disabled={isSubmitted}
                  >
                    {formData.payment_config.verified ? "Verified" : "Verify Details"}
                  </Button>
                </div>

              </>
            )}
          </div>
            </CardContent>
          </Card>

          {/* Supporting Documents Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white px-6 lg:px-8 py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="w-6 h-6 text-indigo-600" /> Supporting Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              Upload supporting documents such as NRIC copy, income proof, medical reports, etc.
            </p>

            {!isSubmitted && (
              <div className="border-2 border-dashed border-slate-300 rounded-lg px-6 py-5 text-center">
                <Upload className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files[0]) addDocument(e.target.files[0]);
                  }}
                  className="max-w-xs mx-auto"
                />
              </div>
            )}

            {formData.supporting_documents.length > 0 && (
              <div className="space-y-3">
                {formData.supporting_documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-slate-500">
                          {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </CardContent>
          </Card>

          {/* Declaration & Signatures Subsection */}
          <Card className="shadow-md border-slate-200 rounded-lg">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white px-6 lg:px-8 py-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckSquare className="w-6 h-6 text-amber-600" /> Declaration & Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 lg:px-8 py-6 space-y-6">
          {/* Declarations */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-6">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={formData.declarations.health_declaration}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    declarations: {
                      ...formData.declarations,
                      health_declaration: checked,
                    },
                  })
                }
                id="health_decl"
                disabled={isSubmitted}
              />
              <Label htmlFor="health_decl" className="text-sm leading-relaxed">
                I declare that all health information provided is true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation may result in claim rejection or policy voidance.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                checked={formData.declarations.data_consent}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    declarations: {
                      ...formData.declarations,
                      data_consent: checked,
                    },
                  })
                }
                id="data"
                disabled={isSubmitted}
              />
              <Label htmlFor="data" className="text-sm leading-relaxed">
                I consent to the collection, use, and disclosure of my personal data for the purposes of processing this insurance application, policy administration, and related services in accordance with the Personal Data Protection Act.
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                checked={formData.declarations.terms_acceptance}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    declarations: {
                      ...formData.declarations,
                      terms_acceptance: checked,
                    },
                  })
                }
                id="terms"
                disabled={isSubmitted}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I have read, understood, and agree to the terms and conditions of the insurance policy including all exclusions, limitations, and policy provisions. I acknowledge receipt of the product disclosure sheet and policy illustration.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                checked={formData.declarations.marketing_consent}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    declarations: {
                      ...formData.declarations,
                      marketing_consent: checked,
                    },
                  })
                }
                id="marketing"
                disabled={isSubmitted}
              />
              <Label htmlFor="marketing" className="text-sm leading-relaxed">
                (Optional) I consent to receive marketing communications about products and services.
              </Label>
            </div>
          </div>

          <Separator />

          {/* Signatures */}
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Applicant Signature *
              </Label>
              <div className="border-2 border-slate-300 rounded-lg p-4">
                <SignaturePad
                  value={formData.signatures.applicant_signature}
                  onChange={(sig) =>
                    setFormData({
                      ...formData,
                      signatures: {
                        ...formData.signatures,
                        applicant_signature: sig,
                        applicant_sign_date: new Date().toISOString(),
                      },
                    })
                  }
                  disabled={isSubmitted}
                />
              </div>
              {formData.signatures.applicant_sign_date && (
                <p className="text-xs text-slate-500 mt-2">
                  Signed on: {new Date(formData.signatures.applicant_sign_date).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Witness Details (Optional)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                <Input
                  placeholder="Witness Name"
                  value={formData.signatures.witness_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      signatures: {
                        ...formData.signatures,
                        witness_name: e.target.value,
                      },
                    })
                  }
                  disabled={isSubmitted}
                />
              </div>
              <div className="border-2 border-slate-300 rounded-lg p-4">
                <SignaturePad
                  value={formData.signatures.witness_signature}
                  onChange={(sig) =>
                    setFormData({
                      ...formData,
                      signatures: {
                        ...formData.signatures,
                        witness_signature: sig,
                        witness_sign_date: new Date().toISOString(),
                      },
                    })
                  }
                  disabled={isSubmitted}
                />
              </div>
            </div>
          </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {!isSubmitted && (
          <>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
              className="px-8"
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Draft
                </>
              )}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-primary-600 hover:bg-primary-700 px-8"
            >
              <Send className="w-4 h-4 mr-2" /> Submit Application
            </Button>
          </>
        )}
        {isSubmitted && (
          <>
            <Button variant="outline" className="px-8" onClick={downloadReceipt}>
              <Download className="w-4 h-4 mr-2" /> Download Receipt
            </Button>
            <Button variant="outline" className="px-8" onClick={downloadFullApplication}>
              <Download className="w-4 h-4 mr-2" /> Download Full Application
            </Button>
            <Button className="px-8" onClick={emailReceipt}>
              <Send className="w-4 h-4 mr-2" /> Email Receipt
            </Button>
          </>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Application Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              You are about to submit this application. Please review:
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                All information is accurate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                All required fields completed
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Supporting documents uploaded
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Declarations signed
              </li>
            </ul>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Once submitted, you cannot edit this application. The underwriting team will review and contact you if additional information is needed.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmSubmit}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Send className="w-4 h-4 mr-2" /> Confirm Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Standard health questions for underwriting
function getStandardHealthQuestions() {
  return [
    {
      id: 1,
      question: "Are you currently taking any medication or under medical treatment?",
      category: "Current Health",
    },
    {
      id: 2,
      question: "Have you been hospitalized or undergone surgery in the past 5 years?",
      category: "Medical History",
    },
    {
      id: 3,
      question: "Do you have or have you ever had any heart disease, high blood pressure, or stroke?",
      category: "Cardiovascular",
    },
    {
      id: 4,
      question: "Do you have or have you ever had diabetes or any metabolic disorder?",
      category: "Metabolic",
    },
    {
      id: 5,
      question: "Do you have or have you ever had cancer or any tumor?",
      category: "Oncology",
    },
    {
      id: 6,
      question: "Do you have any physical disability or impairment?",
      category: "Physical",
    },
    {
      id: 7,
      question: "Have you ever been diagnosed with any mental health condition?",
      category: "Mental Health",
    },
    {
      id: 8,
      question: "Are you currently pregnant or planning pregnancy?",
      category: "Pregnancy",
    },
    {
      id: 9,
      question: "Do you participate in hazardous sports or activities?",
      category: "Lifestyle",
    },
    {
      id: 10,
      question: "Have you ever been declined, postponed, or rated for insurance?",
      category: "Insurance History",
    },
  ];
}


