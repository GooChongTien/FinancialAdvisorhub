import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/admin/components/ui/input';
import { Label } from '@/admin/components/ui/label';
import { Button } from '@/admin/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/admin/components/ui/select';

const EMPTY_FORM = {
  customer_type: 'Individual',
  name: '',
  contact_number: '',
  email: '',
  // Entity fields
  company_name: '',
  business_registration_no: '',
  industry: '',
  num_employees: '',
  annual_revenue: '',
};

function validateForm(formData, customerType) {
  const errors = {};

  // Common validations
  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.contact_number?.trim()) {
    errors.contact_number = 'Phone is required';
  } else {
    const digits = formData.contact_number.replace(/\D/g, '');
    if (digits.length < 8) {
      errors.contact_number = 'Enter a valid phone number with at least 8 digits';
    }
  }

  if (formData.email?.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      errors.email = 'Invalid email address';
    }
  }

  // Entity-specific validations
  if (customerType === 'Entity') {
    // Company name validation
    if (!formData.company_name?.trim()) {
      errors.company_name = 'Company name is required';
    } else if (formData.company_name.trim().length < 3) {
      errors.company_name = 'Company name must be at least 3 characters';
    }

    // Business registration number validation
    if (!formData.business_registration_no?.trim()) {
      errors.business_registration_no = 'Business registration number is required';
    } else {
      const regNoPattern = /^[A-Z0-9]{4,15}$/i;
      if (!regNoPattern.test(formData.business_registration_no.trim())) {
        errors.business_registration_no = 'Invalid format (4-15 alphanumeric characters)';
      }
    }

    // Industry validation
    if (!formData.industry?.trim()) {
      errors.industry = 'Industry is required';
    }

    // Number of employees validation
    if (formData.num_employees) {
      const numEmployees = parseInt(formData.num_employees, 10);
      if (isNaN(numEmployees) || numEmployees < 1) {
        errors.num_employees = 'Number of employees must be a positive number';
      } else if (numEmployees > 1000000) {
        errors.num_employees = 'Number of employees seems unrealistic';
      }
    }

    // Annual revenue validation
    if (formData.annual_revenue) {
      const revenue = parseFloat(formData.annual_revenue);
      if (isNaN(revenue) || revenue < 0) {
        errors.annual_revenue = 'Annual revenue must be a positive number';
      } else if (revenue > 999999999999) {
        errors.annual_revenue = 'Annual revenue seems unrealistic';
      }
    }

    // Keyman details validation (if present)
    if (formData.keyman_name?.trim()) {
      if (formData.keyman_name.trim().length < 2) {
        errors.keyman_name = 'Keyman name must be at least 2 characters';
      }
    }

    if (formData.keyman_email?.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.keyman_email.trim())) {
        errors.keyman_email = 'Invalid keyman email address';
      }
    }

    if (formData.keyman_contact?.trim()) {
      const digits = formData.keyman_contact.replace(/\D/g, '');
      if (digits.length < 8) {
        errors.keyman_contact = 'Keyman contact must have at least 8 digits';
      }
    }
  }

  return errors;
}

export function EntityCustomerForm({
  initialData,
  customerType: propCustomerType,
  onSubmit,
  onCancel,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    ...initialData,
    customer_type: propCustomerType || initialData?.customer_type || 'Individual',
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

  // Update customer_type when prop changes
  useEffect(() => {
    if (propCustomerType) {
      setFormData(prev => ({
        ...prev,
        customer_type: propCustomerType,
      }));
    }
  }, [propCustomerType]);

  const errors = useMemo(
    () => validateForm(formData, formData.customer_type),
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
      num_employees: formData.num_employees ? parseInt(formData.num_employees, 10) : null,
      annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
    };

    onSubmit(submitData);
  };

  const isEntityCustomer = formData.customer_type === 'Entity';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Type */}
      <div className="space-y-2">
        <Label htmlFor="customer_type">{t('customer.customerType')}</Label>
        <Select
          value={formData.customer_type}
          onValueChange={(value) => handleChange('customer_type', value)}
        >
          <SelectTrigger id="customer_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Individual">{t('customer.individual')}</SelectItem>
            <SelectItem value="Entity">{t('customer.entity')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entity-specific fields */}
      {isEntityCustomer && (
        <>
          <div className="space-y-2">
            <Label htmlFor="company_name">{t('customer.companyName')}</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              onBlur={() => handleBlur('company_name')}
              placeholder="Enter company name"
            />
            {touched.company_name && errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_registration_no">
              {t('customer.businessRegNo')}
            </Label>
            <Input
              id="business_registration_no"
              value={formData.business_registration_no}
              onChange={(e) => handleChange('business_registration_no', e.target.value)}
              onBlur={() => handleBlur('business_registration_no')}
              placeholder="Enter business registration number"
            />
            {touched.business_registration_no && errors.business_registration_no && (
              <p className="text-sm text-red-600">{errors.business_registration_no}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">{t('customer.industry')}</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              onBlur={() => handleBlur('industry')}
              placeholder="Enter industry"
            />
            {touched.industry && errors.industry && (
              <p className="text-sm text-red-600">{errors.industry}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_employees">{t('customer.numEmployees')}</Label>
              <Input
                id="num_employees"
                type="number"
                value={formData.num_employees}
                onChange={(e) => handleChange('num_employees', e.target.value)}
                onBlur={() => handleBlur('num_employees')}
                placeholder="Enter number of employees"
                min="0"
              />
              {touched.num_employees && errors.num_employees && (
                <p className="text-sm text-red-600">{errors.num_employees}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_revenue">{t('customer.annualRevenue')}</Label>
              <Input
                id="annual_revenue"
                type="number"
                value={formData.annual_revenue}
                onChange={(e) => handleChange('annual_revenue', e.target.value)}
                onBlur={() => handleBlur('annual_revenue')}
                placeholder="Enter annual revenue"
                min="0"
                step="0.01"
              />
              {touched.annual_revenue && errors.annual_revenue && (
                <p className="text-sm text-red-600">{errors.annual_revenue}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contact Person / Individual Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {isEntityCustomer ? t('customer.contactPerson') : t('common.name')}
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          placeholder={isEntityCustomer ? 'Enter contact person name' : 'Enter name'}
        />
        {touched.name && errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('common.email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          placeholder="Enter email address"
        />
        {touched.email && errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="contact_number">{t('common.phone')}</Label>
        <Input
          id="contact_number"
          type="tel"
          value={formData.contact_number}
          onChange={(e) => handleChange('contact_number', e.target.value)}
          onBlur={() => handleBlur('contact_number')}
          placeholder="Enter phone number"
        />
        {touched.contact_number && errors.contact_number && (
          <p className="text-sm text-red-600">{errors.contact_number}</p>
        )}
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
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export default EntityCustomerForm;
