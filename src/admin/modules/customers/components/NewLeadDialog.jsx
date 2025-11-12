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
  name: "",
  contact_number: "",
  email: "",
  lead_source: "Referral",
};

function validateLead(formData) {
  const errors = {};
  const trimmedName = formData.name.trim();
  if (!trimmedName) {
    errors.name = "Name is required.";
  }

  const rawContact = formData.contact_number.trim();
  if (!rawContact) {
    errors.contact_number = "Contact number is required.";
  } else {
    const digits = rawContact.replace(/\D/g, "");
    if (digits.length < 8) {
      errors.contact_number = "Enter a valid contact number with at least 8 digits.";
    }
  }

  if (formData.email) {
    const emailPattern =
      // eslint-disable-next-line no-control-regex
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
  }

  return errors;
}

export default function NewLeadDialog({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [action, setAction] = useState(null);
  const [touched, setTouched] = useState({});

  useMiraPrefillListener(MIRA_PREFILL_TARGETS.NEW_LEAD_FORM, (payload) => {
    const allowedKeys = ["name", "contact_number", "email", "lead_source"];
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
    setTouched({
      name: true,
      contact_number: true,
      email: true,
    });
    if (!isFormValid) {
      return;
    }
    const submitData = {
      ...formData,
      status: "Not Initiated",
      last_contacted: new Date().toISOString(),
    };
    onSubmit(submitData, saveAction);
  };
  const handleClose = () => {
    setFormData({ ...EMPTY_FORM });
    setAction(null);
    setTouched({});
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {" "}
      <DialogContent className="sm:max-w-md">
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
          <div className="space-y-2">
            {" "}
            <Label htmlFor="name">
              {" "}
              Name <span className="text-red-500">*</span>{" "}
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
              placeholder="Enter full name"
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
