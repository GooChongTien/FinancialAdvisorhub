import {
  Building2,
  DollarSign,
  FileText,
  MessageSquare,
  RefreshCw,
  Shield,
  TrendingUp,
  Users
} from "lucide-react";

/**
 * Central list of supported service request types so both the Servicing tab
 * and the standalone Servicing module stay in sync.
 */
export const serviceRequestTypes = [
  {
    id: "claim",
    name: "Submit Claim",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "File a new insurance claim",
    fields: ["claim_type", "incident_date", "claim_amount", "description", "documents"],
  },
  {
    id: "renewal",
    name: "Renew Policy",
    icon: RefreshCw,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Request policy renewal",
    fields: ["policy_number", "renewal_date", "notes"],
  },
  {
    id: "reinstate",
    name: "Reinstate Policy",
    icon: Shield,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "Reinstate lapsed policy",
    fields: ["policy_number", "lapse_date", "reason", "payment_info"],
  },
  {
    id: "fund_switch",
    name: "Fund Switching",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Switch investment funds",
    fields: ["policy_number", "from_fund", "to_fund", "switch_percentage"],
  },
  {
    id: "premium_payment",
    name: "Premium Payment",
    icon: DollarSign,
    color: "text-primary-600",
    bgColor: "bg-primary-50",
    description: "Make premium payment",
    fields: ["policy_number", "payment_amount", "payment_method"],
  },
  {
    id: "address_change",
    name: "Change Customer Details",
    icon: Building2,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "Update contact or company address",
    fields: ["new_address", "effective_date"],
  },
  {
    id: "beneficiary_change",
    name: "Change Beneficiary",
    icon: Users,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    description: "Update policy beneficiaries",
    fields: ["policy_number", "beneficiary_details", "reason"],
  },
  {
    id: "other",
    name: "Other Service Request",
    icon: MessageSquare,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    description: "General service request",
    fields: ["subject", "description"],
  },
  {
    id: "change_members",
    name: "Change Members",
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    description: "Add or remove members from group policy",
    fields: ["policy_number", "member_details", "effective_date"],
    target: "entity",
  },
  {
    id: "change_rider",
    name: "Change Rider",
    icon: Shield,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    description: "Add or remove riders for group policy",
    fields: ["policy_number", "rider_details", "effective_date"],
    target: "entity",
  },
];

export default serviceRequestTypes;
