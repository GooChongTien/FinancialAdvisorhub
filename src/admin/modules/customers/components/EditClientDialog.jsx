import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Button } from "@/admin/components/ui/button";

function getInitial(lead) {
  return {
    contact_number: lead?.contact_number ?? "",
    email: lead?.email ?? "",
    address: lead?.address ?? "",
  };
}

function validate(values) {
  const errors = {};
  const phone = String(values.contact_number || "").trim();
  const digits = phone.replace(/\D/g, "");
  if (phone && digits.length < 7) {
    errors.contact_number = "Enter a valid contact number.";
  }
  const email = String(values.email || "").trim();
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

export default function EditClientDialog({ open, onClose, onSubmit, lead, isSaving }) {
  const base = useMemo(() => getInitial(lead), [lead]);
  const [values, setValues] = useState(base);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (open) {
      setValues(getInitial(lead));
      setTouched({});
    }
  }, [open, lead]);

  const handleSave = () => {
    setTouched({ contact_number: true, email: true });
    if (!isValid) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              value={values.contact_number}
              onChange={(e) => setValues({ ...values, contact_number: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, contact_number: true }))}
              aria-invalid={Boolean(touched.contact_number && errors.contact_number)}
            />
            {touched.contact_number && errors.contact_number ? (
              <p className="text-sm text-red-600">{errors.contact_number}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              aria-invalid={Boolean(touched.email && errors.email)}
            />
            {touched.email && errors.email ? (
              <p className="text-sm text-red-600">{errors.email}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={3}
              value={values.address}
              onChange={(e) => setValues({ ...values, address: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving} className="bg-primary-600 hover:bg-primary-700">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

