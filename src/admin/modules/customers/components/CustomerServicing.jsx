import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { supabase } from "@/admin/api/supabaseClient";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/admin/components/ui/dialog";
import { Label } from "@/admin/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { serviceRequestTypes } from "@/admin/modules/customers/constants/serviceRequestTypes.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Send,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function CustomerServicing({ lead }) {
  const filteredServiceTypes = useMemo(() => {
    if (lead?.customer_type === "Entity") {
      return serviceRequestTypes.filter(t => t.target === "entity" || ["other", "address_change", "premium_payment"].includes(t.id));
    }
    return serviceRequestTypes.filter(t => t.target !== "entity");
  }, [lead?.customer_type]);

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
    return () => { try { supabase.removeChannel(channel); } catch { } };
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
    member_details: "",
    rider_details: "",
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
      member_details: "",
      rider_details: "",
    });
    setShowRequestDialog(true);
  };

  const validateForm = () => {
    if (!selectedService) return false;
    const required = selectedService.fields || [];
    for (const key of required) {
      const val = requestForm[key];
      if (val === undefined || val === null || String(val).trim() === "") {
        setFormError(`Please fill in: ${key.replaceAll("_", " ")}`);
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
      const refNo = `SR-${new Date().toISOString().replace(/[-:TZ\\.]/g, "").slice(0, 14)}`;
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
          const body = `A new service request was submitted.\n\nCustomer: ${lead?.name || lead?.full_name || lead?.id}\nType: ${created?.type || selectedService?.id}\nRef: ${created?.payload?.ref_no || ''}\nPolicy: ${created?.policy_number || ''}\nSubmitted: ${new Date().toLocaleString()}`;
          await supabase.from("email_outbox").insert([{ to_email: advisorEmail, subject: `Service Request Submitted (${created?.payload?.ref_no || ''})`, body, template: "service_request_submitted", status: "queued" }]);
        }
      } catch (e) { }
      // Attempt customer email via Edge Function (uses service role within function)
      try {
        const customerEmail = lead?.email;
        if (customerEmail) {
          const customerBody = `Dear Customer,\n\nYour service request has been submitted.\n\nType: ${created?.type || selectedService?.id}\nReference: ${created?.payload?.ref_no || ''}\nPolicy: ${created?.policy_number || ''}\nSubmitted: ${new Date().toLocaleString()}\n\nWe will contact you shortly.`;
          await supabase.functions.invoke('email-sender', { body: { to_email: customerEmail, subject: `Your Service Request (${created?.payload?.ref_no || ''})`, body: customerBody, template: 'service_request_client' } });
        }
      } catch (e) { }
    },
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status, request }) => {
      const history = Array.isArray(request?.payload?.status_history) ? request.payload.status_history : [];
      const nextHistory = [...history, { status, changed_at: new Date().toISOString() }];
      return adviseUAdminApi.entities.ServiceRequest.update(id, {
        status,
        payload: { ...(request?.payload ?? {}), status_history: nextHistory },
      });
    },
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

  // Get customer's active policies
  const customerPolicies = lead?.policies || [
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
            {filteredServiceTypes.map((service) => (
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
                    {customerPolicies.map((policy) => (
                      <SelectItem key={policy.policy_number} value={policy.policy_number}>
                        {policy.policy_number} - {policy.product_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <p className="font-semibold">{selectedRequest.type}</p>
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

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Status History
                </p>
                <div className="space-y-2">
                  {(selectedRequest?.payload?.status_history || []).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                      <span className="font-medium">{String(entry.status || "").replace("_", " ").toUpperCase()}</span>
                      <span className="text-xs text-slate-500">
                        {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <div className="flex gap-2">
                  {["pending", "in_progress", "completed", "rejected"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedRequest.status === status ? "default" : "outline"}
                      onClick={() => updateStatus.mutate({ id: selectedRequest.id, status, request: selectedRequest })}
                    >
                      {status.replace("_", " ").toUpperCase()}
                    </Button>
                  ))}
                  <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}





