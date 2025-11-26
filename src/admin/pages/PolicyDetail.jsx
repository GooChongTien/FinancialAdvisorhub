import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function PolicyDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const policyId = params.get("id");
  const { prefs } = usePreferences();
  const { t } = useTranslation();

  const { data: policy, isLoading } = useQuery({
    queryKey: ["policy", policyId],
    queryFn: async () => {
      const rows = await adviseUAdminApi.entities.Policy.filter({ id: policyId });
      return rows[0];
    },
    enabled: !!policyId,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-6 h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">{t("policyDetail.notFound")}</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
        </Button>
      </div>
    );
  }

  const statusClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Lapsed":
        return "bg-red-100 text-red-700";
      case "Surrendered":
        return "bg-yellow-100 text-yellow-700";
      case "Matured":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("policyDetail.backToCustomer")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> {t("policyDetail.print")}
          </Button>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white shadow-xl" data-print-card>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" /> {policy.product_name}
          </h1>
          <p className="text-primary-100 mt-1">{t("policyDetail.policyNumber", { number: policy.policy_number })}</p>
        </div>

        <Card className="shadow-lg border-slate-200" data-print-card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>{t("policyDetail.sections.policyDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.coverageType")}</p>
                <p className="font-medium text-slate-900">{policy.coverage_type}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.status")}</p>
                <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${statusClass(policy.status)}`}>
                  {policy.status}
                </span>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.effectiveDate")}</p>
                <p className="font-medium text-slate-900">{policy.policy_start_date ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.maturityDate")}</p>
                <p className="font-medium text-slate-900">{policy.policy_end_date ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.premiumAmount")}</p>
                <p className="font-medium text-slate-900">{formatCurrency(policy.premium_amount, prefs)}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.premiumFrequency")}</p>
                <p className="font-medium text-slate-900">{policy.premium_frequency ?? "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.sumAssured")}</p>
                <p className="font-medium text-slate-900">{formatCurrency(policy.sum_assured, prefs)}</p>
              </div>
              <div>
                <p className="text-slate-500">{t("policyDetail.labels.paymentStatus")}</p>
                <p className="font-medium text-slate-900">{policy.payment_status ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200" data-print-card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>{t("policyDetail.sections.beneficiaries")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {Array.isArray(policy.beneficiaries) && policy.beneficiaries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {policy.beneficiaries.map((b, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                    <p className="font-medium text-slate-900">{b.name ?? '-'}</p>
                    <p className="text-slate-600">{b.relationship ?? '-'}</p>
                    {b.percentage !== undefined && (
                      <p className="text-slate-600">{b.percentage}%</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">{t("policyDetail.empty.noBeneficiaries")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200" data-print-card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle>{t("policyDetail.sections.policyDocuments")}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {Array.isArray(policy.documents) && policy.documents.length > 0 ? (
              <ul className="space-y-2">
                {policy.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{doc.title ?? t("policyDetail.document.defaultTitle", { number: idx + 1 })}</p>
                      <p className="text-xs text-slate-500 break-all">{doc.url ?? '-'}</p>
                    </div>
                    {doc.url ? (
                      <a
                        className="no-print inline-flex items-center gap-2 text-primary-700 hover:text-primary-800"
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        <Download className="w-4 h-4" /> {t("policyDetail.document.download")}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">{t("policyDetail.empty.noDocuments")}</p>
            )}
          </CardContent>
        </Card>

        {/* Print overrides */}
        <style>{`
          @media print {
            [role="banner"], [role="complementary"], nav, .no-print { display: none !important; }
            body { background: white !important; }
            [data-print-card] { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
            .p-8 { padding: 0 !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
