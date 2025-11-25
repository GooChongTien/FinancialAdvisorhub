import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { createPageUrl } from "@/admin/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddEventDialog from "./AddEventDialog";
import CompanyDetailsCard from "./CompanyDetailsCard";
// Editing of personal details is disabled; updates should go via Service Request (customers)
// or through Fact Finding (leads). Edit dialog import removed.
import { useToast } from "@/admin/components/ui/toast";
export default function CustomerOverview({ lead }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEventDialog, setShowEventDialog] = useState(false);
  // Personal details are view-only on overview page
  const { showToast } = useToast();

  // Check for existing in-progress proposal for this lead
  const { data: linkedProposals = [] } = useQuery({
    queryKey: ["proposals-by-lead", lead.id],
    queryFn: () => adviseUAdminApi.entities.Proposal.filter({ lead_id: lead.id }),
    enabled: !!lead?.id,
  });
  const inProgressProposal = useMemo(
    () => (linkedProposals || []).find((p) => p.status === "In Progress"),
    [linkedProposals],
  );

  const updateCustomerMutation = useMutation({
    mutationFn: async (updates) => {
      const payload = {};
      if (updates.contact_number !== lead.contact_number)
        payload.contact_number = updates.contact_number;
      if (updates.email !== lead.email) payload.email = updates.email;
      if ((updates.address ?? "") !== (lead.address ?? ""))
        payload.address = updates.address;
      if (Object.keys(payload).length === 0) return lead;
      const updated = await adviseUAdminApi.entities.Lead.update(lead.id, payload);
      try {
        const changed_by = "advisor-001";
        for (const key of Object.keys(payload)) {
          await adviseUAdminApi.entities.LeadEditHistory.create({
            lead_id: lead.id,
            field: key,
            old_value: String(lead[key] ?? ""),
            new_value: String(payload[key] ?? ""),
            changed_by,
          });
        }
      } catch (_) { }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["lead", lead.id]);
      queryClient.invalidateQueries(["leads"]);
      showToast({
        type: "success",
        title: "Saved",
        description: "Customer information updated.",
      });
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save",
        description: error?.message ?? "Please try again.",
      });
    },
  });
  const createEventMutation = useMutation({
    mutationFn: (data) => adviseUAdminApi.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks-today"]);
      queryClient.invalidateQueries(["tasks"]);
      showToast({
        type: "success",
        title: "Event scheduled",
        description: "Your task has been added to the planner.",
      });
      setShowEventDialog(false);
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Unable to save event",
        description: error?.message ?? "Please review the details and try again.",
      });
    },
  });

  // Appointments: fetch tasks linked to this lead and of type 'Appointment'
  const { data: leadAppointments = [] } = useQuery({
    queryKey: ["appointments-by-lead", lead.id],
    queryFn: () =>
      adviseUAdminApi.entities.Task.filter({ linked_lead_id: lead.id, type: "Appointment" }),
    enabled: !!lead?.id,
  });
  const now = new Date();
  const [upcomingAppointments, pastAppointments] = useMemo(() => {
    const upcoming = [];
    const past = [];
    (leadAppointments || []).forEach((t) => {
      const d = t.date ? new Date(t.date) : null;
      if (d && d >= new Date(now.toDateString())) upcoming.push(t);
      else past.push(t);
    });
    const sortFn = (a, b) => new Date(a.date) - new Date(b.date);
    return [upcoming.sort(sortFn).slice(0, 5), past.sort(sortFn).slice(0, 5)];
  }, [leadAppointments]);

  // Lead Status Logic - System Determined:
  // 1. "Not Initiated" - No past appointments and no proposals
  // 2. "Contacted" - Past appointments exist, but no active proposal
  // 3. "Proposal" - Active proposal found
  const systemDeterminedStatus = useMemo(() => {
    if (inProgressProposal) {
      return { status: "Proposal", reason: "Active proposal in progress" };
    }
    if (leadAppointments && leadAppointments.length > 0) {
      return { status: "Contacted", reason: "Has scheduled appointments" };
    }
    return { status: "Not Initiated", reason: "No appointments or proposals yet" };
  }, [inProgressProposal, leadAppointments]);

  const handleStartProposal = () => {
    navigate(createPageUrl(`NewBusiness?action=new&leadId=${lead.id}`));
  };

  const handleResumeProposal = () => {
    if (inProgressProposal) {
      showToast({ type: "success", title: "Resume Proposal", description: `Resuming ${inProgressProposal.proposal_number}` });
      navigate(createPageUrl(`NewBusiness?leadId=${lead.id}`));
    }
  };
  return (
    <div className="space-y-6">
      {" "}
      {/* Lead Status (for non-customers) */}
      {!lead.is_client && (
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Lead Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Status</p>
                  <p className="text-2xl font-bold text-slate-900">{systemDeterminedStatus.status}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${systemDeterminedStatus.status === "Proposal" ? "bg-yellow-100 text-yellow-700" :
                  systemDeterminedStatus.status === "Contacted" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                  {systemDeterminedStatus.status}
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                {systemDeterminedStatus.reason}
              </p>
            </div>
            <div className="text-xs text-slate-500 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="font-semibold text-blue-900 mb-1">Status is automatically determined:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li><strong>Not Initiated:</strong> No past appointments or proposals</li>
                <li><strong>Contacted:</strong> Has appointments but no active proposal</li>
                <li><strong>Proposal:</strong> Active proposal in progress</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {lead.customer_type === "Entity" ? (
        <CompanyDetailsCard
          data={lead}
          currency={lead.currency || "USD"}
          className="shadow-lg border-slate-200"
        />
      ) : (
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-4 text-xs text-slate-500">
              {lead.is_client ? (
                <p>
                  For existing customers, update personal details via a Service Request.
                </p>
              ) : (
                <p>
                  For new leads, create/update details within the Fact Finding journey.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-semibold text-slate-900 mt-1">{lead.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Contact Number</p>
                <p className="font-semibold text-slate-900 mt-1">
                  {lead.contact_number}
                </p>
              </div>
              {lead.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.email}
                  </p>
                </div>
              )}
              {lead.national_id && (
                <div>
                  <p className="text-sm text-slate-500">National ID</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.national_id}
                  </p>
                </div>
              )}
              {lead.date_of_birth && (
                <div>
                  <p className="text-sm text-slate-500">Date of Birth</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {format(new Date(lead.date_of_birth), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {lead.gender && (
                <div>
                  <p className="text-sm text-slate-500">Gender</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.gender}
                  </p>
                </div>
              )}
              {lead.marital_status && (
                <div>
                  <p className="text-sm text-slate-500">Marital Status</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.marital_status}
                  </p>
                </div>
              )}
              {lead.occupation && (
                <div>
                  <p className="text-sm text-slate-500">Occupation</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.occupation}
                  </p>
                </div>
              )}
              {lead.nationality && (
                <div>
                  <p className="text-sm text-slate-500">Nationality</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {lead.nationality}
                  </p>
                </div>
              )}
              {lead.address && (
                <div className="md:col-span-3">
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium text-slate-900 mt-1 whitespace-pre-wrap">
                    {lead.address}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}{" "}
      <Card className="shadow-lg border-slate-200">
        {" "}
        <CardHeader className="border-b border-slate-100">
          {" "}
          <CardTitle>Quick Actions</CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent className="pt-6">
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {" "}
            <Button
              onClick={handleStartProposal}
              className="h-12 bg-primary-600 hover:bg-primary-700 justify-start"
            >
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  {" "}
                  <FileText className="w-4 h-4" />{" "}
                </div>{" "}
                <div className="text-left">
                  {" "}
                  <p className="font-semibold">New Proposal</p>{" "}
                  <p className="text-xs text-primary-100">
                    Start proposal journey
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </Button>{" "}
            {inProgressProposal && (
              <Button
                onClick={handleResumeProposal}
                className="h-12 bg-blue-600 hover:bg-blue-700 justify-start"
              >
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    {" "}
                    <FileText className="w-4 h-4" />{" "}
                  </div>{" "}
                  <div className="text-left">
                    {" "}
                    <p className="font-semibold">Resume Proposal</p>{" "}
                    <p className="text-xs text-blue-100">
                      Continue where you left off
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </Button>
            )}
            <Button
              onClick={() => setShowEventDialog(true)}
              variant="outline"
              className="h-12 justify-start border-2"
            >
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  {" "}
                  <Calendar className="w-4 h-4 text-slate-600" />{" "}
                </div>{" "}
                <div className="text-left">
                  {" "}
                  <p className="font-semibold text-slate-900">
                    Schedule Appointment
                  </p>{" "}
                  <p className="text-xs text-slate-500">Book a meeting</p>{" "}
                </div>{" "}
              </div>{" "}
            </Button>{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Appointments */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {leadAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Upcoming</p>
                <div className="space-y-2">
                  {upcomingAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate("/advisor/smart-plan")}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{a.title || "Appointment"}</p>
                        <p className="text-xs text-slate-500">
                          {a.date ? format(new Date(a.date), "dd MMM yyyy") : ""}
                          {a.time ? ` • ${a.time}` : ""}
                        </p>
                      </div>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                  {upcomingAppointments.length === 0 && (
                    <p className="text-xs text-slate-500">No upcoming appointments</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">Past</p>
                <div className="space-y-2">
                  {pastAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 border border-slate-200 rounded-lg flex items-center justify-between opacity-80 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate("/advisor/smart-plan")}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{a.title || "Appointment"}</p>
                        <p className="text-xs text-slate-500">
                          {a.date ? format(new Date(a.date), "dd MMM yyyy") : ""}
                          {a.time ? ` • ${a.time}` : ""}
                        </p>
                      </div>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                  {pastAppointments.length === 0 && (
                    <p className="text-xs text-slate-500">No past appointments</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <AddEventDialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        onSubmit={(data) => createEventMutation.mutate(data)}
        isLoading={createEventMutation.isPending}
        lead={lead}
      />{" "}
      {/** Edit dialog intentionally removed to enforce view-only */}
    </div>
  );
}
