import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { supabase } from "@/admin/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Textarea } from "@/admin/components/ui/textarea";
import { Badge } from "@/admin/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import {
  FileText,
  RefreshCw,
  Shield,
  DollarSign,
  TrendingUp,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Eye,
  MessageSquare,
  Plus,
} from "lucide-react";

const serviceRequestTypes = [
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
    name: "Address Change",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "Update contact address",
    fields: ["new_address", "effective_date"],
  },
  {
    id: "beneficiary_change",
    name: "Beneficiary Change",
    icon: FileText,
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
];

export default function CustomerServicing({ lead }) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [formError, setFormError] = useState("");
  const queryClient = useQueryClient();
  const { data: serviceRequests = [] } = useQuery({
    queryKey: ["service-requests", lead?.id],
    queryFn: () => adviseUAdminApi.entities.ServiceRequest.list({ lead_id: lead.id }),
    enabled: !!lead?.id,
  });

  useEffect(() => {
    if (!lead?.id) return;
    const channel = supabase
      .channel(`sr-${lead.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests", filter: `lead_id=eq.${lead.id}` },
        () => queryClient.invalidateQueries(["service-requests", lead.id])
      )
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, [lead?.id, queryClient]);

  const [requestForm, setRequestForm] = useState({
    policy_number: "",
    claim_type: "",
    incident_date: "",
    claim_amount: "",
    description: "",
    documents: [],
    from_fund: "",
    to_fund: "",
    switch_percentage: "100",
    payment_amount: "",
    payment_method: "",
    new_address: "",
    effective_date: "",
    beneficiary_details: "",
    reason: "",
    subject: "",
    renewal_date: "",
    lapse_date: "",
    payment_info: "",
    notes: "",
  });

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setRequestForm({
      policy_number: "",
      claim_type: "",
      incident_date: "",
      claim_amount: "",
      description: "",
      documents: [],
      from_fund: "",
      to_fund: "",
      switch_percentage: "100",
      payment_amount: "",
      payment_method: "",
      new_address: "",
      effective_date: "",
      beneficiary_details: "",
      reason: "",
      subject: "",
      renewal_date: "",
      lapse_date: "",
      payment_info: "",
      notes: "",
    });
    setShowRequestDialog(true);
  };

  const validateForm = () => {
    if (!selectedService) return false;
    const required = selectedService.fields || [];
    for (const key of required) {
      const val = requestForm[key];
      if (val === undefined || val === null || String(val).trim() === "") {
        setFormError(`Please fill in: ${key.replaceAll("_"," ")}`);
        return false;
      }
    }
    if (selectedService.id === "fund_switch") {
      const pct = parseFloat(requestForm.switch_percentage || "0");
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) {
        setFormError("Switch percentage must be between 1 and 100");
        return false;
      }
    }
    setFormError("");
    return true;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) throw new Error("Validation failed");
      const refNo = `SR-${new Date().toISOString().replace(/[-:TZ\\.]/g, "").slice(0,14)}`;
      const payload = {
        lead_id: lead.id,
        type: selectedService.id,
        status: "pending",
        subject: requestForm.subject || selectedService.name,
        policy_number: requestForm.policy_number || null,
        payload: { ...requestForm, ref_no: refNo },
      };
      return adviseUAdminApi.entities.ServiceRequest.create(payload);
    },
    onSuccess: async (created) => {
      queryClient.invalidateQueries(["service-requests", lead?.id]);
      setShowRequestDialog(false);
      setSelectedService(null);
      setFormError("");
      try {
        const prof = await adviseUAdminApi.auth.me();
        const advisorEmail = prof?.email;
        if (advisorEmail) {
          const body = `A new service request was submitted.\n\nClient: ${lead?.name || lead?.full_name || lead?.id}\nType: ${created?.type || selectedService?.id}\nRef: ${created?.payload?.ref_no || ''}\nPolicy: ${created?.policy_number || ''}\nSubmitted: ${new Date().toLocaleString()}`;
          await supabase.from("email_outbox").insert([{ to_email: advisorEmail, subject: `Service Request Submitted (${created?.payload?.ref_no || ''})`, body, template: "service_request_submitted", status: "queued" }]);
        }
      } catch (e) { }
      // Attempt client email via Edge Function (uses service role within function)
      try {
        const clientEmail = lead?.email;
        if (clientEmail) {
          const clientBody = `Dear Client,\n\nYour service request has been submitted.\n\nType: ${created?.type || selectedService?.id}\nReference: ${created?.payload?.ref_no || ''}\nPolicy: ${created?.policy_number || ''}\nSubmitted: ${new Date().toLocaleString()}\n\nWe will contact you shortly.`;
          await supabase.functions.invoke('email-sender', { body: { to_email: clientEmail, subject: `Your Service Request (${created?.payload?.ref_no || ''})`, body: clientBody, template: 'service_request_client' } });
        }
      } catch (e) { }
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => adviseUAdminApi.entities.ServiceRequest.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries(["service-requests", lead?.id]),
  });

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filteredRequests = (serviceRequests || []).filter((req) => {
    if (filterStatus === "all") return true;
    return req.status === filterStatus;
  });

  // Get client's active policies
  const clientPolicies = lead?.policies || [
    { policy_number: "POL-12345", product_name: "LifeShield Plus" },
    { policy_number: "POL-67890", product_name: "InvestGrow Fund" },
  ];

  return (
    <div className="space-y-6">
      {/* E06-S04: Service Request Types */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Available Service Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceRequestTypes.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all text-left group"
              >
                <div
                  className={`w-12 h-12 ${service.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <service.icon className={`w-6 h-6 ${service.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600">{service.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* E06-S06: Track Service Requests */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle>Service Request History</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No service requests found</p>
              <p className="text-sm mt-2">
                {filterStatus !== "all"
                  ? `No ${filterStatus} requests`
                  : "Click a service type above to create your first request"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getStatusColor(request.status)}`}
                        >
                          {getStatusIcon(request.status)}
                          {request.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm font-mono text-slate-600">
                          {request.id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(request.created_at || request.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1">
                        {request.type}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        {request.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {request.policy_number && (
                          <span>Policy: {request.policy_number}</span>
                        )}
                        <span>Assigned to: {request.assignee}</span>
                        <span>Updated: {new Date(request.updated_at || request.last_updated).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E06-S05: Submit Service Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedService && (
                <>
                  <selectedService.icon className={selectedService.color} />
                  {selectedService.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {formError && (<p className="text-sm text-red-600">{formError}</p>)}
          <div className="space-y-4">
            {selectedService?.fields.includes("policy_number") && (
              <div className="space-y-2">
                <Label>Policy Number *</Label>
                <Select
                  value={requestForm.policy_number}
                  onValueChange={(val) =>
                    setRequestForm({ ...requestForm, policy_number: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientPolicies.map((policy) => (
                      <SelectItem key={policy.policy_number} value={policy.policy_number}>
                        {policy.policy_number} - {policy.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedService?.fields.includes("claim_type") && (
              <div className="space-y-2">
                <Label>Claim Type *</Label>
                <Select
                  value={requestForm.claim_type}
                  onValueChange={(val) =>
                    setRequestForm({ ...requestForm, claim_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospitalization">Hospitalization</SelectItem>
                    <SelectItem value="death">Death Claim</SelectItem>
                    <SelectItem value="critical_illness">Critical Illness</SelectItem>
                    <SelectItem value="disability">Disability</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedService?.fields.includes("incident_date") && (
              <div className="space-y-2">
                <Label>Incident Date *</Label>
                <Input
                  type="date"
                  value={requestForm.incident_date}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, incident_date: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("claim_amount") && (
              <div className="space-y-2">
                <Label>Claim Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={requestForm.claim_amount}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, claim_amount: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("from_fund") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Fund *</Label>
                  <Select
                    value={requestForm.from_fund}
                    onValueChange={(val) =>
                      setRequestForm({ ...requestForm, from_fund: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative Fund</SelectItem>
                      <SelectItem value="balanced">Balanced Fund</SelectItem>
                      <SelectItem value="growth">Growth Fund</SelectItem>
                      <SelectItem value="aggressive">Aggressive Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Fund *</Label>
                  <Select
                    value={requestForm.to_fund}
                    onValueChange={(val) =>
                      setRequestForm({ ...requestForm, to_fund: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative Fund</SelectItem>
                      <SelectItem value="balanced">Balanced Fund</SelectItem>
                      <SelectItem value="growth">Growth Fund</SelectItem>
                      <SelectItem value="aggressive">Aggressive Fund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedService?.fields.includes("switch_percentage") && (
              <div className="space-y-2">
                <Label>Switch Percentage</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={requestForm.switch_percentage}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, switch_percentage: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("payment_amount") && (
              <div className="space-y-2">
                <Label>Payment Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={requestForm.payment_amount}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, payment_amount: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("payment_method") && (
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={requestForm.payment_method}
                  onValueChange={(val) =>
                    setRequestForm({ ...requestForm, payment_method: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedService?.fields.includes("new_address") && (
              <div className="space-y-2">
                <Label>New Address *</Label>
                <Textarea
                  rows={3}
                  value={requestForm.new_address}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, new_address: e.target.value })
                  }
                  placeholder="Enter your new address"
                />
              </div>
            )}

            {selectedService?.fields.includes("effective_date") && (
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={requestForm.effective_date}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, effective_date: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("beneficiary_details") && (
              <div className="space-y-2">
                <Label>Beneficiary Details *</Label>
                <Textarea
                  rows={4}
                  value={requestForm.beneficiary_details}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, beneficiary_details: e.target.value })
                  }
                  placeholder="Provide details of new beneficiaries (Name, NRIC, Relationship, Percentage)"
                />
              </div>
            )}

            {selectedService?.fields.includes("renewal_date") && (
              <div className="space-y-2">
                <Label>Preferred Renewal Date</Label>
                <Input
                  type="date"
                  value={requestForm.renewal_date}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, renewal_date: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("lapse_date") && (
              <div className="space-y-2">
                <Label>Lapse Date</Label>
                <Input
                  type="date"
                  value={requestForm.lapse_date}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, lapse_date: e.target.value })
                  }
                />
              </div>
            )}

            {selectedService?.fields.includes("payment_info") && (
              <div className="space-y-2">
                <Label>Payment Information</Label>
                <Textarea
                  rows={2}
                  value={requestForm.payment_info}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, payment_info: e.target.value })
                  }
                  placeholder="Provide payment details for reinstatement"
                />
              </div>
            )}

            {selectedService?.fields.includes("subject") && (
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={requestForm.subject}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, subject: e.target.value })
                  }
                  placeholder="Brief subject of your request"
                />
              </div>
            )}

            {(selectedService?.fields.includes("description") ||
              selectedService?.fields.includes("reason") ||
              selectedService?.fields.includes("notes")) && (
              <div className="space-y-2">
                <Label>
                  {selectedService?.fields.includes("description")
                    ? "Description"
                    : selectedService?.fields.includes("reason")
                    ? "Reason"
                    : "Notes"}{" "}
                  *
                </Label>
                <Textarea
                  rows={5}
                  value={
                    requestForm.description ||
                    requestForm.reason ||
                    requestForm.notes
                  }
                  onChange={(e) => {
                    if (selectedService?.fields.includes("description")) {
                      setRequestForm({ ...requestForm, description: e.target.value });
                    } else if (selectedService?.fields.includes("reason")) {
                      setRequestForm({ ...requestForm, reason: e.target.value });
                    } else {
                      setRequestForm({ ...requestForm, notes: e.target.value });
                    }
                  }}
                  placeholder="Provide detailed information..."
                />
              </div>
            )}

            {selectedService?.fields.includes("documents") && (
              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <Input type="file" multiple className="max-w-xs mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">
                    Upload relevant documents (medical reports, receipts, etc.)
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Request Details</DialogTitle>
          </DialogHeader>
          {formError && (<p className="text-sm text-red-600">{formError}</p>)}
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Request ID</p>
                  <p className="font-mono font-semibold">{selectedRequest.id}</p>
                {selectedRequest.payload?.ref_no && (<p className="text-xs text-slate-500">Ref: {selectedRequest.payload.ref_no}</p>)}
                </div>
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${getStatusColor(selectedRequest.status)}`}
                >
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-600">Request Type</p>
                  <p className="font-semibold">{selectedrequest.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Created Date</p>
                  <p className="font-semibold">
                    {new Date((selectedRequest.created_at || selectedRequest.created_date)).toLocaleDateString()}
                  </p>
                </div>
                {selectedRequest.policy_number && (
                  <div>
                    <p className="text-xs text-slate-600">Policy Number</p>
                    <p className="font-semibold">{selectedRequest.policy_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600">Assigned To</p>
                  <p className="font-semibold">{selectedRequest.assignee}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Last Updated</p>
                  <p className="font-semibold">
                    {new Date((selectedRequest.updated_at || selectedRequest.last_updated)).toLocaleDateString()}
                  </p>
                </div>
                {selectedRequest.claim_amount && (
                  <div>
                    <p className="text-xs text-slate-600">Claim Amount</p>
                    <p className="font-semibold">${selectedRequest.claim_amount}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Description
                </p>
                <p className="text-sm text-slate-600">{selectedRequest.description}</p>
              </div>

              {selectedRequest.resolution && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    Resolution
                  </p>
                  <p className="text-sm text-green-800">
                    {selectedRequest.resolution}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}





