import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/admin/components/ui/input';
import { Label } from '@/admin/components/ui/label';
import { Button } from '@/admin/components/ui/button';
import { Textarea } from '@/admin/components/ui/textarea';

const EMPTY_FORM = {
  keyman_name: '',
  position: '',
  date_of_birth: '',
  annual_salary: '',
  coverage_amount: '',
  role_in_business: '',
  medical_notes: '',
};

function validateForm(formData) {
  const errors = {};

  // Required field validations
  if (!formData.keyman_name?.trim()) {
    errors.keyman_name = 'Keyman name is required';
  }

  if (!formData.position?.trim()) {
    errors.position = 'Position is required';
  }

  if (!formData.date_of_birth?.trim()) {
    errors.date_of_birth = 'Date of birth is required';
  } else {
    // Validate date is not in future
    const dob = new Date(formData.date_of_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dob > today) {
      errors.date_of_birth = 'Date of birth cannot be in the future';
    }
  }

  if (!formData.coverage_amount) {
    errors.coverage_amount = 'Coverage amount is required';
  } else {
    const amount = parseFloat(formData.coverage_amount);
    if (amount <= 0) {
      errors.coverage_amount = 'Coverage amount must be positive';
    }
  }

  // Optional: Validate salary if provided
  if (formData.annual_salary) {
    const salary = parseFloat(formData.annual_salary);
    if (salary < 0) {
      errors.annual_salary = 'Annual salary cannot be negative';
    }
  }

  return errors;
}

export function KeymanDetailsForm({
  initialData,
  onSubmit,
  onCancel,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    ...initialData,
  }));
  const [touched, setTouched] = useState({});

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const errors = useMemo(
    () => validateForm(formData),
    [formData]
  );

  const isFormValid = Object.keys(errors).length === 0;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    if (!isFormValid) {
      return;
    }

    // Convert numeric fields
    const submitData = {
      ...formData,
      annual_salary: formData.annual_salary ? parseFloat(formData.annual_salary) : null,
      coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : null,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Keyman Name */}
      <div className="space-y-2">
        <Label htmlFor="keyman_name">{t('customer.keymanName')}</Label>
        <Input
          id="keyman_name"
          value={formData.keyman_name}
          onChange={(e) => handleChange('keyman_name', e.target.value)}
          onBlur={() => handleBlur('keyman_name')}
          placeholder="Enter keyman name"
        />
        {touched.keyman_name && errors.keyman_name && (
          <p className="text-sm text-red-600">{errors.keyman_name}</p>
        )}
      </div>

      {/* Position/Title */}
      <div className="space-y-2">
        <Label htmlFor="position">{t('customer.position')}</Label>
        <Input
          id="position"
          value={formData.position}
          onChange={(e) => handleChange('position', e.target.value)}
          onBlur={() => handleBlur('position')}
          placeholder="Enter position or title"
        />
        {touched.position && errors.position && (
          <p className="text-sm text-red-600">{errors.position}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="date_of_birth">{t('customer.dateOfBirth')}</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => handleChange('date_of_birth', e.target.value)}
          onBlur={() => handleBlur('date_of_birth')}
        />
        {touched.date_of_birth && errors.date_of_birth && (
          <p className="text-sm text-red-600">{errors.date_of_birth}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Annual Salary */}
        <div className="space-y-2">
          <Label htmlFor="annual_salary">{t('customer.annualSalary')}</Label>
          <Input
            id="annual_salary"
            type="number"
            value={formData.annual_salary}
            onChange={(e) => handleChange('annual_salary', e.target.value)}
            onBlur={() => handleBlur('annual_salary')}
            placeholder="Enter annual salary"
            min="0"
            step="0.01"
          />
          {touched.annual_salary && errors.annual_salary && (
            <p className="text-sm text-red-600">{errors.annual_salary}</p>
          )}
        </div>

        {/* Coverage Amount */}
        <div className="space-y-2">
          <Label htmlFor="coverage_amount">{t('customer.coverageAmount')}</Label>
          <Input
            id="coverage_amount"
            type="number"
            value={formData.coverage_amount}
            onChange={(e) => handleChange('coverage_amount', e.target.value)}
            onBlur={() => handleBlur('coverage_amount')}
            placeholder="Enter coverage amount"
            min="0"
            step="0.01"
          />
          {touched.coverage_amount && errors.coverage_amount && (
            <p className="text-sm text-red-600">{errors.coverage_amount}</p>
          )}
        </div>
      </div>

      {/* Role in Business (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="role_in_business">
          {t('customer.roleInBusiness')} <span className="text-slate-400 text-sm">(Optional)</span>
        </Label>
        <Textarea
          id="role_in_business"
          value={formData.role_in_business}
          onChange={(e) => handleChange('role_in_business', e.target.value)}
          onBlur={() => handleBlur('role_in_business')}
          placeholder="Describe the keyman's role and importance to the business"
          rows={3}
        />
      </div>

      {/* Medical/Health Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="medical_notes">
          {t('customer.medicalNotes')} <span className="text-slate-400 text-sm">(Optional)</span>
        </Label>
        <Textarea
          id="medical_notes"
          value={formData.medical_notes}
          onChange={(e) => handleChange('medical_notes', e.target.value)}
          onBlur={() => handleBlur('medical_notes')}
          placeholder="Any relevant health or medical information"
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {initialData ? t('common.save') : t('common.add')}
        </Button>
      </div>
    </form>
  );
}

export default KeymanDetailsForm;
