import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { UserPlus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMiraPrefillListener } from "@/admin/hooks/useMiraPrefillListener.js";
import { MIRA_PREFILL_TARGETS } from "@/lib/mira/prefillTargets.ts";

const EMPTY_FORM = {
  customer_type: "Individual",
  name: "",
  contact_number: "",
  email: "",
  lead_source: "Referral",
  // Entity-specific fields
  company_name: "",
  business_registration_no: "",
  industry: "",
  num_employees: "",
  annual_revenue: "",
};

function validateLead(formData) {
  const errors = {};
  const isEntity = formData.customer_type === "Entity";

  // For entity customers, company name is the primary identifier
  if (isEntity) {
    if (!formData.company_name?.trim()) {
      errors.company_name = "Company name is required.";
    } else if (formData.company_name.trim().length < 3) {
      errors.company_name = "Company name must be at least 3 characters.";
    }

    // Business registration number validation (optional, but format-checked if provided)
    if (formData.business_registration_no?.trim()) {
      const regNoPattern = /^[A-Z0-9]{4,15}$/i;
      if (!regNoPattern.test(formData.business_registration_no.trim())) {
        errors.business_registration_no = "Invalid format (4-15 alphanumeric characters).";
      }
    }

    // Industry is optional - no validation needed
  }

  // Name validation (for individuals, it's required; for entities, it's the contact person)
  const trimmedName = formData.name?.trim() || "";
  if (!trimmedName) {
    errors.name = isEntity ? "Contact person name is required." : "Name is required.";
  }

  // Contact number validation
  const rawContact = formData.contact_number?.trim() || "";
  if (!rawContact) {
    errors.contact_number = "Contact number is required.";
  } else {
    const digits = rawContact.replace(/\D/g, "");
    if (digits.length < 8) {
      errors.contact_number = "Enter a valid contact number with at least 8 digits.";
    }
  }

  // Email validation
  if (formData.email?.trim()) {
    const emailPattern =
      // eslint-disable-next-line no-control-regex
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
  }

  // Number of employees validation (optional for entities)
  if (isEntity && formData.num_employees) {
    const numEmployees = parseInt(formData.num_employees, 10);
    if (isNaN(numEmployees) || numEmployees < 1) {
      errors.num_employees = "Number of employees must be a positive number.";
    }
  }

  // Annual revenue validation (optional for entities)
  if (isEntity && formData.annual_revenue) {
    const revenue = parseFloat(formData.annual_revenue);
    if (isNaN(revenue) || revenue < 0) {
      errors.annual_revenue = "Annual revenue must be a positive number.";
    }
  }

  return errors;
}

export default function NewLeadDialog({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [action, setAction] = useState(null);
  const [touched, setTouched] = useState({});

  useMiraPrefillListener(MIRA_PREFILL_TARGETS.NEW_LEAD_FORM, (payload) => {
    const allowedKeys = [
      "customer_type",
      "name",
      "contact_number",
      "email",
      "lead_source",
      "company_name",
      "business_registration_no",
      "industry",
      "num_employees",
      "annual_revenue",
    ];
    const updates = allowedKeys.reduce((acc, key) => {
      if (payload[key] === undefined || payload[key] === null) return acc;
      acc[key] = String(payload[key]);
      return acc;
    }, {});
    if (Object.keys(updates).length === 0) {
      return undefined;
    }
    let previousSnapshot = null;
    setFormData((prev) => {
      previousSnapshot = { ...prev };
      return { ...prev, ...updates };
    });
    return () => {
      if (previousSnapshot) {
        setFormData(previousSnapshot);
      }
    };
  });

  const errors = useMemo(() => validateLead(formData), [formData]);
  const isFormValid = Object.keys(errors).length === 0;

  const handleSubmit = (saveAction) => {
    setAction(saveAction);
    const isEntity = formData.customer_type === "Entity";

    // Mark all required fields as touched for validation display
    const touchedFields = {
      name: true,
      contact_number: true,
      email: true,
    };

    if (isEntity) {
      touchedFields.company_name = true;
      // Optional fields - only mark as touched if they have content and might have errors
      if (formData.business_registration_no?.trim()) {
        touchedFields.business_registration_no = true;
      }
    }

    setTouched(touchedFields);

    if (!isFormValid) {
      return;
    }

    const submitData = {
      ...formData,
      status: "Not Initiated",
      last_contacted: new Date().toISOString(),
      // Convert numeric fields for entity customers
      num_employees: formData.num_employees ? parseInt(formData.num_employees, 10) : null,
      annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
    };

    onSubmit(submitData, saveAction);
  };
  const handleClose = () => {
    setFormData({ ...EMPTY_FORM });
    setAction(null);
    setTouched({});
    onClose();
  };
  const isEntity = formData.customer_type === "Entity";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {" "}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle className="flex items-center gap-2">
            {" "}
            <UserPlus className="w-5 h-5 text-primary-600" /> Add New Lead{" "}
          </DialogTitle>{" "}
        </DialogHeader>{" "}
        <div className="space-y-4 py-4">
          {" "}
          {/* Customer Type Selector */}
          <div className="space-y-2">
            {" "}
            <Label htmlFor="customer_type">
              Customer Type <span className="text-red-500">*</span>
            </Label>{" "}
            <Select
              value={formData.customer_type}
              onValueChange={(value) =>
                setFormData({ ...formData, customer_type: value })
              }
            >
              {" "}
              <SelectTrigger>
                {" "}
                <SelectValue />{" "}
              </SelectTrigger>{" "}
              <SelectContent>
                {" "}
                <SelectItem value="Individual">Individual</SelectItem>{" "}
                <SelectItem value="Entity">Entity (Company)</SelectItem>{" "}
              </SelectContent>{" "}
            </Select>{" "}
          </div>
          {/* Entity-specific fields */}
          {isEntity && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, company_name: true }))
                  }
                  placeholder="Enter company name"
                  className={cn(
                    touched.company_name && errors.company_name && "border-red-400 focus-visible:outline-red-500",
                  )}
                />
                {touched.company_name && errors.company_name && (
                  <p className="text-sm text-red-600">{errors.company_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_registration_no">
                  Business Registration No. <span className="text-gray-400 text-xs">(Optional)</span>
                </Label>
                <Input
                  id="business_registration_no"
                  value={formData.business_registration_no}
                  onChange={(e) =>
                    setFormData({ ...formData, business_registration_no: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, business_registration_no: true }))
                  }
                  placeholder="e.g., 202300001A"
                  className={cn(
                    touched.business_registration_no &&
                      errors.business_registration_no &&
                      "border-red-400 focus-visible:outline-red-500",
                  )}
                />
                {touched.business_registration_no && errors.business_registration_no && (
                  <p className="text-sm text-red-600">{errors.business_registration_no}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-gray-400 text-xs">(Optional)</span>
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, industry: true }))
                  }
                  placeholder="e.g., Technology, Finance, Healthcare"
                  className={cn(
                    touched.industry && errors.industry && "border-red-400 focus-visible:outline-red-500",
                  )}
                />
                {touched.industry && errors.industry && (
                  <p className="text-sm text-red-600">{errors.industry}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num_employees">Number of Employees</Label>
                  <Input
                    id="num_employees"
                    type="number"
                    value={formData.num_employees}
                    onChange={(e) =>
                      setFormData({ ...formData, num_employees: e.target.value })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, num_employees: true }))
                    }
                    placeholder="50"
                    min="1"
                    className={cn(
                      touched.num_employees &&
                        errors.num_employees &&
                        "border-red-400 focus-visible:outline-red-500",
                    )}
                  />
                  {touched.num_employees && errors.num_employees && (
                    <p className="text-sm text-red-600">{errors.num_employees}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_revenue">Annual Revenue</Label>
                  <Input
                    id="annual_revenue"
                    type="number"
                    value={formData.annual_revenue}
                    onChange={(e) =>
                      setFormData({ ...formData, annual_revenue: e.target.value })
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, annual_revenue: true }))
                    }
                    placeholder="5000000"
                    min="0"
                    step="0.01"
                    className={cn(
                      touched.annual_revenue &&
                        errors.annual_revenue &&
                        "border-red-400 focus-visible:outline-red-500",
                    )}
                  />
                  {touched.annual_revenue && errors.annual_revenue && (
                    <p className="text-sm text-red-600">{errors.annual_revenue}</p>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Contact Person / Name */}
          <div className="space-y-2">
            {" "}
            <Label htmlFor="name">
              {" "}
              {isEntity ? "Contact Person Name" : "Name"} <span className="text-red-500">*</span>{" "}
            </Label>{" "}
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, name: true }))
              }
              placeholder={isEntity ? "Enter contact person name" : "Enter full name"}
              className={cn(
                touched.name && errors.name && "border-red-400 focus-visible:outline-red-500",
              )}
              aria-invalid={Boolean(touched.name && errors.name)}
              aria-describedby={touched.name && errors.name ? "lead-name-error" : undefined}
            />{" "}
            {touched.name && errors.name ? (
              <p
                id="lead-name-error"
                className="text-sm text-red-600"
              >
                {errors.name}
              </p>
            ) : null}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <Label htmlFor="contact">
              {" "}
              Contact Number <span className="text-red-500">*</span>{" "}
            </Label>{" "}
            <Input
              id="contact"
              value={formData.contact_number}
              onChange={(e) =>
                setFormData({ ...formData, contact_number: e.target.value })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, contact_number: true }))
              }
              placeholder="+65 1234 5678"
              className={cn(
                touched.contact_number &&
                  errors.contact_number &&
                  "border-red-400 focus-visible:outline-red-500",
              )}
              aria-invalid={Boolean(
                touched.contact_number && errors.contact_number,
              )}
              aria-describedby={
                touched.contact_number && errors.contact_number
                  ? "lead-contact-error"
                  : undefined
              }
            />{" "}
            {touched.contact_number && errors.contact_number ? (
              <p
                id="lead-contact-error"
                className="text-sm text-red-600"
              >
                {errors.contact_number}
              </p>
            ) : null}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <Label htmlFor="email">Email (Optional)</Label>{" "}
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, email: true }))
              }
              placeholder="email@example.com"
              className={cn(
                touched.email &&
                  errors.email &&
                  "border-red-400 focus-visible:outline-red-500",
              )}
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby={
                touched.email && errors.email ? "lead-email-error" : undefined
              }
            />{" "}
            {touched.email && errors.email ? (
              <p
                id="lead-email-error"
                className="text-sm text-red-600"
              >
                {errors.email}
              </p>
            ) : null}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <Label htmlFor="source">Lead Source</Label>{" "}
            <Select
              value={formData.lead_source}
              onValueChange={(value) =>
                setFormData({ ...formData, lead_source: value })
              }
            >
              {" "}
              <SelectTrigger>
                {" "}
                <SelectValue />{" "}
              </SelectTrigger>{" "}
              <SelectContent>
                {" "}
                <SelectItem value="Referral">Referral</SelectItem>{" "}
                <SelectItem value="Social Media">Social Media</SelectItem>{" "}
                <SelectItem value="Walk-in">Walk-in</SelectItem>{" "}
                <SelectItem value="Cold Call">Cold Call</SelectItem>{" "}
                <SelectItem value="Website">Website</SelectItem>{" "}
                <SelectItem value="Event">Event</SelectItem>{" "}
                <SelectItem value="Other">Other</SelectItem>{" "}
              </SelectContent>{" "}
            </Select>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex flex-col gap-2">
          {" "}
          <Button
            onClick={() => handleSubmit("close")}
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary-700 w-full"
          >
            {" "}
            {isLoading && action === "close"
              ? "Saving..."
              : "Save & Close"}{" "}
          </Button>{" "}
          <Button
            onClick={() => handleSubmit("schedule")}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {" "}
            <Calendar className="w-4 h-4 mr-2" />{" "}
            {isLoading && action === "schedule"
              ? "Saving..."
              : "Save & Schedule Appointment"}{" "}
          </Button>{" "}
        </div>{" "}
      </DialogContent>{" "}
    </Dialog>
  );
}
