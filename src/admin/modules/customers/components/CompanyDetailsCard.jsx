import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/admin/components/ui/card';
import { Button } from '@/admin/components/ui/button';
import { Building2, Edit, Users, DollarSign, Briefcase, Hash, User, Mail, Phone } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { usePreferences } from '@/admin/state/PreferencesContext.jsx';

/**
 * Formats a number with thousand separators
 */
function formatNumber(num) {
  if (num === null || num === undefined) return null;
  return num.toLocaleString('en-US');
}

/**
 * InfoRow component for displaying label-value pairs
 */
function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <dt className="text-sm font-medium text-slate-500 mb-0.5">{label}</dt>
        <dd className="text-sm text-slate-900 font-medium">{value}</dd>
      </div>
    </div>
  );
}

export function CompanyDetailsCard({ data = {}, currency, onEdit, className }) {
  const { t } = useTranslation();
  const { prefs } = usePreferences?.() ?? { prefs: { currency: "SGD" } };
  const currencyCode = currency || prefs?.currency || "SGD";

  const {
    company_name,
    business_registration_no,
    industry,
    num_employees,
    annual_revenue,
    name: contact_name,
    contact_number,
    email,
  } = data;

  // Determine if we have company data
  const hasCompanyData = company_name || business_registration_no || industry;

  return (
    <Card className={cn('', className)} data-testid="company-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl">
              {company_name || <span className="text-slate-400">N/A</span>}
            </CardTitle>
            {business_registration_no && (
              <p className="text-sm text-slate-500 mt-1">
                {t('customer.businessRegNo')}: {business_registration_no}
              </p>
            )}
          </div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="flex-shrink-0"
          >
            <Edit className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Company Information */}
        {hasCompanyData && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              {t('customer.companyName')}
            </h4>
            <dl className="space-y-1">
              <InfoRow
                icon={Briefcase}
                label={t('customer.industry')}
                value={industry}
              />
              <InfoRow
                icon={Users}
                label={t('customer.numEmployees')}
                value={num_employees !== null && num_employees !== undefined ? formatNumber(num_employees) : null}
              />
              <InfoRow
                icon={DollarSign}
                label={t('customer.annualRevenue')}
                value={
                  annual_revenue !== null && annual_revenue !== undefined
                    ? formatCurrency(annual_revenue, { currency: currencyCode, language: prefs?.language })
                    : null
                }
              />
            </dl>
          </div>
        )}

        {/* Contact Person */}
        {(contact_name || email || contact_number) && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              {t('customer.contactPerson')}
            </h4>
            <dl className="space-y-1">
              <InfoRow
                icon={User}
                label={t('common.name')}
                value={contact_name}
              />
              <InfoRow
                icon={Mail}
                label={t('common.email')}
                value={email}
              />
              <InfoRow
                icon={Phone}
                label={t('common.phone')}
                value={contact_number}
              />
            </dl>
          </div>
        )}

        {/* Empty state */}
        {!hasCompanyData && !contact_name && !email && !contact_number && (
          <div className="text-center py-8 text-slate-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t('messages.noData')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompanyDetailsCard;
