import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import BusinessOverview from "@/admin/modules/analytics/components/BusinessOverview";
import Customers from "@/admin/modules/analytics/components/Customers";
import Proposals from "@/admin/modules/analytics/components/Proposals";
import Servicing from "@/admin/modules/analytics/components/Servicing";

export default function Analytics() {
  const { t } = useTranslation();
  const modules = [
    { value: "Business Overview", label: t("analytics.modules.businessOverview") },
    { value: "Customers", label: t("analytics.modules.customers") },
    { value: "Proposals", label: t("analytics.modules.proposals") },
    { value: "Servicing", label: t("analytics.modules.servicing") },
  ];
  const [module, setModule] = useState(modules[0].value);

  const renderModule = () => {
    switch (module) {
      case "Business Overview":
        return <BusinessOverview />;
      case "Customers":
        return <Customers />;
      case "Proposals":
        return <Proposals />;
      case "Servicing":
        return <Servicing />;
      default:
        return <BusinessOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-6">
          <PageHeader
            title={t("analytics.title")}
            subtitle={t("analytics.subtitle")}
            icon={BarChart3}
          />

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">
              {t("analytics.moduleLabel")}
            </span>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder={t("analytics.modulePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {modules.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderModule()}
        </div>
      </div>
    </div>
  );
}
