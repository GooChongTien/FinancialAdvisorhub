import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Alert, AlertDescription } from "@/admin/components/ui/alert";
import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Checkbox } from "@/admin/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/admin/components/ui/select";
import { Switch } from "@/admin/components/ui/switch";
import { useToast } from "@/admin/components/ui/toast";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import useMiraPopupListener from "@/admin/hooks/useMiraPopupListener.js";
import AddEventDialog from "@/admin/modules/customers/components/AddEventDialog";
import { createPageUrl } from "@/admin/utils";
import { MIRA_POPUP_TARGETS } from "@/lib/mira/popupTargets.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, parseISO, startOfDay, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ArrowUpDown, Cake, Calendar, CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, Filter, List, Plus, Undo2, User } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const VIEW_MODE_STORAGE_KEY = "advisorhub:smart-plan-view-mode";
const LEGACY_VIEW_MODE_STORAGE_KEY = "advisorhub:todo-view-mode";
const FILTER_STORAGE_KEY = "advisorhub:smart-plan-filters";
const LEGACY_FILTER_STORAGE_KEY = "advisorhub:todo-filters";
const COMPLETED_STORAGE_KEY = "advisorhub:smart-plan-completed-map";
const LEGACY_COMPLETED_STORAGE_KEY = "advisorhub:task-completed-map";
const BIRTHDAY_TOGGLE_KEY = "advisorhub:smart-plan-show-birthdays";
const LEGACY_BIRTHDAY_TOGGLE_KEY = "advisorhub:todo-show-birthdays";
const COMPLETED_TOGGLE_KEY = "advisorhub:smart-plan-show-completed";
const LEGACY_COMPLETED_TOGGLE_KEY = "advisorhub:todo-show-completed";

export default function SmartPlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // Main view mode: "list" or "calendar"
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    const stored =
      window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_VIEW_MODE_STORAGE_KEY);
    return stored ?? "list";
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");

  // Local completion state (fallback if schema has no 'completed' column)
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      if (typeof window === "undefined") return {};
      const raw =
        window.localStorage.getItem(COMPLETED_STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_COMPLETED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedMap));
        window.localStorage.removeItem(LEGACY_COMPLETED_STORAGE_KEY);
      }
    } catch { }
  }, [completedMap]);

  // Detect if backend provides a 'completed' column (defined after tasks query)

  // E14-S02: Add Event Dialog State
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const addEventDialogOpenRef = React.useRef(showAddEventDialog);
  React.useEffect(() => {
    addEventDialogOpenRef.current = showAddEventDialog;
  }, [showAddEventDialog]);

  // E14-S03: Edit Event Dialog State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  // Simple filter state (advanced panel removed)
  const [filters, setFilters] = useState(() => {
    try {
      if (typeof window === 'undefined') return { timeRange: 'all', eventType: 'all', linkedClient: '' };
      const raw =
        window.localStorage.getItem(FILTER_STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_FILTER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const initial = parsed || { timeRange: 'all', eventType: 'all', linkedClient: 'all' };
      // Coerce legacy empty string to 'all'
      if (!initial.linkedClient || initial.linkedClient === '') initial.linkedClient = 'all';
      return initial;
    } catch {
      return { timeRange: 'all', eventType: 'all', linkedClient: 'all' };
    }
  });
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
        window.localStorage.removeItem(LEGACY_FILTER_STORAGE_KEY);
      }
    } catch { }
  }, [filters]);

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  useMiraPopupListener(MIRA_POPUP_TARGETS.SMART_PLAN_NEW_TASK, () => {
    const autoOpened = !addEventDialogOpenRef.current;
    if (!addEventDialogOpenRef.current) {
      setShowAddEventDialog(true);
    }
    return () => {
      if (autoOpened) {
        setShowAddEventDialog(false);
      }
    };
  });
  const [lastMove, setLastMove] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Export dialog state
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectForm, setConnectForm] = useState({
    provider: "google",
    email: "",
    syncMode: "two-way",
    includePast: "30",
  });
  // Legacy export calendar state retained for future use (hidden in UI for now)
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportDateRange, setExportDateRange] = useState("all");
  const [exportStartDate, setExportStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportEndDate, setExportEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));

  const [calendarConnections, setCalendarConnections] = useState(() => {
    try {
      if (typeof window === "undefined") return { google: false, outlook: false, apple: false };
      const raw = window.localStorage.getItem("advisorhub:smart-plan-calendar-connections");
      return raw ? JSON.parse(raw) : { google: false, outlook: false, apple: false };
    } catch {
      return { google: false, outlook: false, apple: false };
    }
  });

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("advisorhub:smart-plan-calendar-connections", JSON.stringify(calendarConnections));
      }
    } catch { }
  }, [calendarConnections]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    window.localStorage.removeItem(LEGACY_VIEW_MODE_STORAGE_KEY);
  }, [viewMode]);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => adviseUAdminApi.entities.Task.list('-date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => adviseUAdminApi.entities.Lead.list(),
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => adviseUAdminApi.entities.Proposal.list("-updated_date"),
  });

  const hasCompletedField = React.useMemo(
    () => Array.isArray(tasks) && tasks.some((t) => Object.prototype.hasOwnProperty.call(t || {}, 'completed')),
    [tasks],
  );

  // Birthday reminders toggle
  const [showBirthdays, setShowBirthdays] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      const raw =
        window.localStorage.getItem(BIRTHDAY_TOGGLE_KEY) ??
        window.localStorage.getItem(LEGACY_BIRTHDAY_TOGGLE_KEY);
      return raw ? raw === '1' : false;
    } catch { return false; }
  });
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(BIRTHDAY_TOGGLE_KEY, showBirthdays ? '1' : '0');
        window.localStorage.removeItem(LEGACY_BIRTHDAY_TOGGLE_KEY);
      }
    } catch { }
  }, [showBirthdays]);

  // Show completed toggle (persisted)
  const [showCompleted, setShowCompleted] = useState(() => {
    try {
      if (typeof window === 'undefined') return true;
      const raw =
        window.localStorage.getItem(COMPLETED_TOGGLE_KEY) ??
        window.localStorage.getItem(LEGACY_COMPLETED_TOGGLE_KEY);
      return raw ? raw === '1' : true;
    } catch { return true; }
  });
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COMPLETED_TOGGLE_KEY, showCompleted ? '1' : '0');
        window.localStorage.removeItem(LEGACY_COMPLETED_TOGGLE_KEY);
      }
    } catch { }
  }, [showCompleted]);

  // Compute birthday tasks within active time range
  const birthdayTasks = React.useMemo(() => {
    if (!showBirthdays || !Array.isArray(leads) || leads.length === 0) return [];
    const now = new Date();
    let start;
    let end;
    if (activeFilter === 'today') {
      start = startOfDay(now); end = start;
    } else if (activeFilter === 'week') {
      start = startOfWeek(now); end = endOfWeek(now);
    } else { // month or all
      start = startOfMonth(now); end = endOfMonth(now);
    }
    const items = [];
    for (const lead of leads) {
      if (!lead?.date_of_birth || !lead?.name) continue;
      const dob = new Date(lead.date_of_birth);
      if (Number.isNaN(dob.getTime())) continue;
      const occ = new Date(start.getFullYear(), dob.getMonth(), dob.getDate());
      // If week spans year end, also consider next year
      const candidates = [occ];
      if (occ < start) {
        candidates.push(new Date(start.getFullYear() + 1, dob.getMonth(), dob.getDate()));
      }
      for (const dt of candidates) {
        if (dt >= start && dt <= end) {
          const dateStr = format(dt, 'yyyy-MM-dd');
          items.push({
            id: `birthday:${lead.id}:${dateStr}`,
            title: `Birthday: ${lead.name}`,
            type: 'Task',
            date: dateStr,
            linked_lead_id: lead.id,
            linked_lead_name: lead.name,
            notes: 'Wish customer happy birthday',
            synthetic: 'birthday',
          });
        }
      }
    }
    return items;
  }, [showBirthdays, leads, activeFilter]);

  const allTasks = React.useMemo(() => {
    const base = Array.isArray(tasks) ? tasks : [];
    return showBirthdays ? base.concat(birthdayTasks) : base;
  }, [tasks, birthdayTasks, showBirthdays]);

  const tasksCount = allTasks.length;

  useMiraPageData(
    () => ({
      view: "smart_plan_manager",
      mode: viewMode,
      activeFilter,
      searchQuery,
      sortBy,
      showBirthdays,
      showCompleted,
      tasksCount,
    }),
    [viewMode, activeFilter, searchQuery, sortBy, showBirthdays, showCompleted, tasksCount],
  );

  const createTaskMutation = useMutation({
    mutationFn: (data) => adviseUAdminApi.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowAddEventDialog(false);
      setIsCreatingEvent(false);
      showToast({ type: 'success', title: 'Event Created', description: 'Your event has been added successfully.' });
    },
    onError: (error) => {
      setIsCreatingEvent(false);
      showToast({ type: 'error', title: 'Failed to create event', description: error?.message || 'Please try again.' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => adviseUAdminApi.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowEditDialog(false);
      setSelectedEvent(null);
      showToast({ type: 'success', title: 'Event Updated', description: 'Your changes have been saved.' });
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'Failed to update event', description: error?.message || 'Please try again.' });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => adviseUAdminApi.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowDeleteConfirm(false);
      setEventToDelete(null);
      setShowDetailDrawer(false);
      setDetailTask(null);
      showToast({ type: 'success', title: 'Event Deleted', description: 'The event has been removed.' });
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'Failed to delete event', description: error?.message || 'Please try again.' });
    },
  });

  const toggleTaskCompletion = (task) => {
    if (task?.synthetic) {
      const current = Boolean(completedMap?.[task.id]);
      const nextVal = !current;
      setCompletedMap((prev) => ({ ...prev, [task.id]: nextVal }));
      return;
    }
    if (hasCompletedField) {
      updateTaskMutation.mutate({ id: task.id, data: { completed: !task.completed } });
      return;
    }
    const current = Boolean(completedMap?.[task.id]);
    const nextVal = !current;
    setCompletedMap((prev) => ({ ...prev, [task.id]: nextVal }));
  };

  const displayedTasks = React.useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];

    let result = [...allTasks];

    // Apply time filter
    const now = startOfDay(new Date());
    if (activeFilter === "today") {
      result = result.filter(task => {
        if (!task.date) return false;
        try {
          return isToday(parseISO(task.date));
        } catch (e) {
          console.error('Error parsing date for task:', task);
          return false;
        }
      });
    } else if (activeFilter === "week") {
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      result = result.filter(task => {
        if (!task.date) return false;
        try {
          const taskDate = parseISO(task.date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        } catch (e) {
          console.error('Error parsing date for task:', task);
          return false;
        }
      });
    } else if (activeFilter === "month") {
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      result = result.filter(task => {
        if (!task.date) return false;
        try {
          const taskDate = parseISO(task.date);
          return taskDate >= monthStart && taskDate <= monthEnd;
        } catch (e) {
          console.error('Error parsing date for task:', task);
          return false;
        }
      });
    }

    // Apply additional filters from quick filters
    if (filters.eventType !== "all") {
      result = result.filter(task => task.type === filters.eventType);
    }

    if (filters.linkedClient && filters.linkedClient !== 'all') {
      result = result.filter(task => (task.linked_lead_name || '') === filters.linkedClient);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query) ||
        task.linked_lead_name?.toLowerCase().includes(query)
      );
    }

    // Hide completed if toggled off
    if (!showCompleted) {
      result = result.filter(task => {
        const done = task.synthetic
          ? Boolean(completedMap?.[task.id])
          : (hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]));
        return !done;
      });
    }

    // Apply sorting
    if (sortBy === "date-asc") {
      result.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      });
    } else if (sortBy === "date-desc") {
      result.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      });
    } else if (sortBy === "title-asc") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "type") {
      result.sort((a, b) => (a.type || "").localeCompare(b.type || ""));
    }

    return result;
  }, [allTasks, activeFilter, filters, searchQuery, showCompleted, hasCompletedField, completedMap, sortBy]);

  const getTaskTypeIcon = (type) => {
    return type === "Appointment" ? Calendar : CheckCircle2;
  };

  const getTaskTypeColor = (type) => {
    return type === "Appointment" ? "bg-blue-600 text-white" : "bg-green-600 text-white";
  };

  const handleAddEvent = (formData) => {
    setIsCreatingEvent(true);
    const payload = hasCompletedField ? { ...formData, completed: false } : { ...formData };
    createTaskMutation.mutate(payload);
  };

  const openTaskDetail = (task) => {
    if (!task?.id) return;
    navigate(createPageUrl(`SmartPlanDetail?id=${task.id}`));
  };

  const handleConnectCalendar = () => {
    const provider = connectForm.provider;
    setCalendarConnections((prev) => ({ ...prev, [provider]: true }));
    showToast({
      type: 'success',
      title: `${provider === 'google' ? 'Google' : provider === 'outlook' ? 'Outlook' : 'Apple'} connected`,
      description: `Sync mode: ${connectForm.syncMode === "two-way" ? "Two-way" : "One-way (pull)"}. (Simulated)`,
    });
    setShowConnectDialog(false);
  };

  const handleEditEvent = (task) => {
    setSelectedEvent(task);
    setShowEditDialog(true);
  };

  const handleUpdateEvent = (formData) => {
    if (!selectedEvent) return;
    const payload = hasCompletedField ? { ...formData, completed: Boolean(selectedEvent.completed) } : { ...formData };
    updateTaskMutation.mutate({ id: selectedEvent.id, data: payload });
  };

  const handleDeleteEvent = (task) => {
    setEventToDelete(task);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!eventToDelete) return;
    deleteTaskMutation.mutate(eventToDelete.id);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";

    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = "0.5";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e, date) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e, newDate) => {
    e.preventDefault();

    if (!draggedTask || !newDate) return;

    const formattedNewDate = format(newDate, 'yyyy-MM-dd');
    const oldDate = draggedTask.date;

    if (formattedNewDate === oldDate) {
      setDraggedTask(null);
      setDragOverDate(null);
      return;
    }

    setLastMove({
      taskId: draggedTask.id,
      oldDate: oldDate,
      newDate: formattedNewDate,
    });

    updateTaskMutation.mutate({
      id: draggedTask.id,
      data: { ...draggedTask, date: formattedNewDate }
    });

    setShowUndoToast(true);
    setTimeout(() => setShowUndoToast(false), 5000);

    setDraggedTask(null);
    setDragOverDate(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverDate(null);
  };

  const detectProposalIntent = (text) => {
    if (!text) return false;
    const normalized = text.toLowerCase();
    return /proposal|quote|apply|application|upgrade|policy|plan/i.test(normalized);
  };

  const createProposalIntentMutation = useMutation({
    mutationFn: async (leadId) => {
      const lead = leads.find((l) => l.id === leadId);
      const proposalNumber = `PRO-${Date.now()}`;
      return adviseUAdminApi.entities.Proposal.create({
        proposal_number: proposalNumber,
        lead_id: leadId,
        proposer_name: lead?.name || "Unknown",
        stage: "Fact Finding",
        status: "In Progress",
        completion_percentage: 0,
        last_updated: new Date().toISOString(),
      });
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries(["proposals"]);
      showToast({
        type: "success",
        title: "Draft proposal created",
        description: "We detected intent and started a proposal draft.",
      });
      navigate(createPageUrl(`ProposalDetail?id=${proposal.id}`));
    },
    onError: (error) => {
      showToast({
        type: "error",
        title: "Proposal creation failed",
        description: error?.message || "Unable to create proposal from task intent.",
      });
    },
  });

  const maybeCreateProposalFromIntent = (task, updates) => {
    if (!task?.linked_lead_id) return;
    const notesText = updates?.notes ?? task?.notes ?? "";
    const transcriptText =
      (updates?.transcript && updates.transcript.text) ||
      updates?.transcript_text ||
      (task?.transcript && task.transcript.text) ||
      task?.transcript_text ||
      "";
    const combined = `${notesText} ${transcriptText}`;
    if (!detectProposalIntent(combined)) return;

    const existing = proposals.find(
      (p) => p.lead_id === task.linked_lead_id && p.status === "In Progress",
    );
    if (existing) {
      showToast({
        type: "info",
        title: "Existing draft found",
        description: "Opening the current in-progress proposal.",
      });
      navigate(createPageUrl(`ProposalDetail?id=${existing.id}`));
      return;
    }
    createProposalIntentMutation.mutate(task.linked_lead_id);
  };

  const handleUndo = () => {
    if (!lastMove) return;

    const task = tasks.find(t => t.id === lastMove.taskId);
    if (task) {
      updateTaskMutation.mutate({
        id: task.id,
        data: { ...task, date: lastMove.oldDate }
      });
    }

    setLastMove(null);
    setShowUndoToast(false);
  };

  const generateICS = () => {
    let tasksToExport = tasks;

    if (exportDateRange === "custom") {
      const start = new Date(exportStartDate);
      const end = new Date(exportEndDate);
      tasksToExport = tasks.filter(task => {
        const taskDate = parseISO(task.date);
        return taskDate >= start && taskDate <= end;
      });
    } else if (exportDateRange === "month") {
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      tasksToExport = tasks.filter(task => {
        const taskDate = parseISO(task.date);
        return taskDate >= monthStart && taskDate <= monthEnd;
      });
    } else if (exportDateRange === "week") {
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());
      tasksToExport = tasks.filter(task => {
        const taskDate = parseISO(task.date);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
    }

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AdvisorHub//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:AdvisorHub Tasks & Appointments',
      'X-WR-TIMEZONE:Asia/Singapore',
    ];

    tasksToExport.forEach(task => {
      const dateStr = task.date.replace(/-/g, '');
      const timeStr = task.time ? task.time.replace(/:/g, '') + '00' : '000000';
      const dtStart = `${dateStr}T${timeStr}`;

      const durationMins = task.duration || (task.type === 'Appointment' ? 60 : 30);
      const endDate = new Date(parseISO(task.date));
      if (task.time) {
        const [hours, minutes] = task.time.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes) + durationMins);
      }
      const dtEnd = format(endDate, "yyyyMMdd'T'HHmmss");

      const uid = `${task.id}@advisorhub.app`;

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeICS(task.title)}`,
        `DESCRIPTION:${escapeICS(task.notes || '')}`,
        `STATUS:${(hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id])) ? 'COMPLETED' : 'CONFIRMED'}`,
        `CATEGORIES:${task.type}`,
      );

      if (task.linked_lead_name) {
        icsLines.push(`ATTENDEE;CN=${escapeICS(task.linked_lead_name)}:MAILTO:customer@example.com`);
      }

      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\r\n');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `advisorhub-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setShowExportDialog(false);
    showToast({ type: 'success', title: 'Calendar Exported', description: 'ICS file downloaded successfully.' });
  };

  const escapeICS = (str) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  // Advanced panel removed; clearFilters/activeFilterCount not needed

  const TaskCard = ({ task, isOverdue = false }) => {
    const Icon = getTaskTypeIcon(task.type);
    const isTask = task.type === "Task";
    const isCompleted = hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]);

    return (
      <Card
        className={`border-slate-200 shadow-lg transition-colors cursor-pointer hover:bg-slate-50 ${isOverdue ? 'border-l-4 border-l-red-500' : ''
          } ${isCompleted ? 'opacity-60' : ''}`}
        onClick={() => openTaskDetail(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {isTask && (
              <div className="pt-1">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={(checked) => {
                    // Radix onCheckedChange passes boolean or "indeterminate", not an event
                    toggleTaskCompletion(task);
                  }}
                  className="w-5 h-5"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={`text-sm font-semibold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''
                  }`}>
                  <span className="inline-flex items-center gap-1">
                    {task.synthetic === 'birthday' && (
                      <Cake className="w-3 h-3 text-pink-600" />
                    )}
                    {task.title}
                  </span>
                </h3>
                <Badge className={getTaskTypeColor(task.type)}>
                  {task.type}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary-600" />
                  <span>{task.time}</span>
                </div>
                {task.duration && (
                  <span>• {task.duration} mins</span>
                )}
              </div>

              {task.linked_lead_name && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                  <User className="w-3 h-3" />
                  <span>{task.linked_lead_name}</span>
                </div>
              )}

              {task.notes && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-2">{task.notes}</p>
              )}

              {isOverdue && (
                <Badge variant="outline" className="mt-2 text-red-600 border-red-300 bg-red-50">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTasksForDate = (date) => {
    // For calendar view, use all tasks (not filtered by time), but apply search and other filters
    if (!allTasks || allTasks.length === 0) return [];

    let result = [...allTasks];

    if (filters.eventType !== "all") {
      result = result.filter(task => task.type === filters.eventType);
    }

    if (filters.linkedClient && filters.linkedClient !== 'all') {
      result = result.filter(task => (task.linked_lead_name || '') === filters.linkedClient);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.notes?.toLowerCase().includes(query) ||
        task.linked_lead_name?.toLowerCase().includes(query)
      );
    }

    result = result.filter(task => {
      if (!task.date) return false;
      try {
        return isSameDay(parseISO(task.date), date);
      } catch (e) {
        console.error('Error parsing date for task:', task);
        return false;
      }
    });
    if (!showCompleted) {
      result = result.filter(task => {
        const done = task.synthetic
          ? Boolean(completedMap?.[task.id])
          : (hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]));
        return !done;
      });
    }
    return result;
  };

  const renderCalendarHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="hover:bg-slate-100 border-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 font-medium"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="hover:bg-slate-100 border-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderTodayView = () => {
    const todayDate = new Date();
    const todayItems = getTasksForDate(todayDate);
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    const getEventsForHour = (hour) => {
      return todayItems.filter(task => {
        if (!task.time) return false;
        try {
          const [taskHour] = task.time.split(':').map(Number);
          return taskHour === hour;
        } catch (e) {
          console.error('Error parsing time for task:', task);
          return false;
        }
      });
    };

    const allDayEvents = todayItems.filter(task => !task.time);

    return (
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg font-semibold">
            {format(todayDate, 'EEEE, MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* All-day events */}
          {allDayEvents.length > 0 && (
            <div className="border-b border-slate-200 p-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 mb-2">ALL DAY</p>
              <div className="space-y-1">
                {allDayEvents.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleEditEvent(task)}
                    className={`text-xs px-2 py-1 rounded cursor-pointer ${task.type === 'Appointment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time slots */}
          <div className="divide-y divide-slate-100">
            {hours.map(hour => {
              const events = getEventsForHour(hour);
              const timeLabel = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

              return (
                <div key={hour} className="flex min-h-[60px]">
                  <div className="w-20 flex-shrink-0 p-2 text-right border-r border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">{timeLabel}</span>
                  </div>
                  <div className="flex-1 p-2">
                    {events.length > 0 ? (
                      <div className="space-y-1">
                        {events.map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleEditEvent(task)}
                            className={`text-xs px-2 py-1.5 rounded cursor-pointer border-l-2 ${task.type === 'Appointment'
                              ? 'bg-blue-50 border-blue-500 text-blue-900'
                              : (hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]))
                                ? 'bg-green-50 border-green-500 text-green-900 opacity-60'
                                : 'bg-green-50 border-green-500 text-green-900'
                              }`}
                          >
                            <p className="font-semibold">{task.title}</p>
                            {task.linked_lead_name && (
                              <p className="text-xs opacity-75 mt-0.5">{task.linked_lead_name}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(weekDay => (
              <div key={weekDay} className="text-center font-semibold text-slate-600 text-sm py-2 bg-slate-50 rounded-lg border border-slate-100">
                {weekDay.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayTasks = getTasksForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-3 rounded-lg border-2 transition-all ${isCurrentDay
                    ? 'bg-primary-50 border-primary-500 shadow-lg'
                    : isCurrentMonth
                      ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                      : 'bg-slate-50 border-slate-100 opacity-50'
                    } ${isDragOver ? 'border-primary-400 bg-primary-100 shadow-lg' : ''}`}
                  onDragOver={(e) => handleDragOver(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-semibold ${isCurrentDay
                        ? 'text-primary-700'
                        : isCurrentMonth
                          ? 'text-slate-900'
                          : 'text-slate-400'
                        }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => {
                      const Icon = getTaskTypeIcon(task.type);
                      const isCompleted = Boolean(completedMap?.[task.id]);
                      return (
                        <div
                          key={task.id}
                          className={`text-xs px-2 py-1 rounded border-l-2 cursor-move hover:shadow-sm transition-all duration-150 ${(hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]))
                            ? 'bg-green-50 border-green-500 text-green-800 line-through opacity-60'
                            : task.type === 'Appointment'
                              ? 'bg-blue-50 border-blue-500 text-blue-900'
                              : 'bg-green-50 border-green-500 text-green-900'
                            } truncate`}
                          title={`${task.time ? task.time + ' - ' : ''}${task.title}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(task);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            {task.synthetic === 'birthday' && (
                              <Cake className="w-3 h-3 text-pink-600" />
                            )}
                            {task.time && <span className="font-semibold">{task.time}</span>}
                            <span className="truncate">{task.title}</span>
                          </div>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-slate-500 text-center pt-1 font-medium">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentMonth);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    const getEventsForDayAndHour = (day, hour) => {
      const dayTasks = getTasksForDate(day);
      return dayTasks.filter(task => {
        if (!task.time) return false;
        try {
          const [taskHour] = task.time.split(':').map(Number);
          return taskHour === hour;
        } catch (e) {
          console.error('Error parsing time for task:', task);
          return false;
        }
      });
    };

    const getAllDayEventsForDay = (day) => {
      const dayTasks = getTasksForDate(day);
      return dayTasks.filter(task => !task.time);
    };

    return (
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg font-semibold">
            Week of {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* All-day events row */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex">
              <div className="w-20 flex-shrink-0 p-2 text-right border-r border-slate-100">
                <span className="text-xs text-slate-500 font-medium">ALL DAY</span>
              </div>
              <div className="flex-1 grid grid-cols-7">
                {days.map((day, index) => {
                  const allDayEvents = getAllDayEventsForDay(day);
                  return (
                    <div key={index} className="border-r border-slate-100 last:border-r-0 p-2 min-h-[60px]">
                      <div className="space-y-1">
                        {allDayEvents.map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleEditEvent(task)}
                            className={`text-xs px-2 py-1 rounded cursor-pointer truncate ${task.type === 'Appointment' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Week header with day names and dates */}
          <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
            <div className="w-20 flex-shrink-0 border-r border-slate-100"></div>
            <div className="flex-1 grid grid-cols-7">
              {days.map((day, index) => {
                const isCurrentDay = isToday(day);
                return (
                  <div
                    key={index}
                    className={`border-r border-slate-100 last:border-r-0 p-3 text-center ${isCurrentDay ? 'bg-primary-50' : ''
                      }`}
                  >
                    <div className={`text-xs font-semibold ${isCurrentDay ? 'text-primary-700' : 'text-slate-600'}`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-bold ${isCurrentDay ? 'text-primary-700' : 'text-slate-900'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time grid */}
          <div className="divide-y divide-slate-100">
            {hours.map(hour => {
              const timeLabel = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

              return (
                <div key={hour} className="flex min-h-[60px]">
                  <div className="w-20 flex-shrink-0 p-2 text-right border-r border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">{timeLabel}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-7">
                    {days.map((day, dayIndex) => {
                      const events = getEventsForDayAndHour(day, hour);
                      return (
                        <div key={dayIndex} className="border-r border-slate-100 last:border-r-0 p-2">
                          {events.length > 0 && (
                            <div className="space-y-1">
                              {events.map(task => (
                                <div
                                  key={task.id}
                                  onClick={() => handleEditEvent(task)}
                                  className={`text-xs px-2 py-1.5 rounded cursor-pointer border-l-2 ${task.type === 'Appointment'
                                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                                    : Boolean(completedMap?.[task.id])
                                      ? 'bg-green-50 border-green-500 text-green-900 opacity-60'
                                      : 'bg-green-50 border-green-500 text-green-900'
                                    }`}
                                >
                                  <p className="font-semibold truncate" title={task.title}>{task.title}</p>
                                  {task.linked_lead_name && (
                                    <p className="text-xs opacity-75 mt-0.5 truncate" title={task.linked_lead_name}>{task.linked_lead_name}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 space-y-6">
          <PageHeader
            title="Smart Plan"
            subtitle="Plan every follow-up with AI-powered tasks & appointments"
            icon={Calendar}
            className="mb-0"
            actions={(
              <Button onClick={() => setShowAddEventDialog(true)} className="!bg-primary-600 !text-white hover:!bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            )}
          />

          {/* Unified Search/Filter/Sort Bar */}
          <SearchFilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filterButton={(
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={filters.eventType !== "all" || filters.linkedClient !== "all" || activeFilter !== "all" || showBirthdays || !showCompleted ? "default" : "outline"}
                    size="icon"
                    className={filters.eventType !== "all" || filters.linkedClient !== "all" || activeFilter !== "all" || showBirthdays || !showCompleted ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title="Filter"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900">Filters</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFilters({ timeRange: 'all', eventType: 'all', linkedClient: 'all' });
                          setActiveFilter('all');
                          setShowBirthdays(false);
                          setShowCompleted(true);
                        }}
                      >
                        Clear All
                      </Button>
                    </div>

                    {/* Time Range */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">Time Range</Label>
                      <Select value={activeFilter} onValueChange={setActiveFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Event Type */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">Event Type</Label>
                      <Select value={filters.eventType} onValueChange={(val) => setFilters({ ...filters, eventType: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="Appointment">Appointment</SelectItem>
                          <SelectItem value="Task">Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Linked Customer */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-700 mb-2">Customer</Label>
                      <Select value={filters.linkedClient} onValueChange={(val) => setFilters({ ...filters, linkedClient: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          {Array.from(new Set((leads || []).map((l) => l.name).filter(Boolean)))
                            .sort((a, b) => a.localeCompare(b))
                            .map((name) => (
                              <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cake className="w-4 h-4 text-pink-600" />
                          <Label className="text-sm text-slate-700">Show Birthdays</Label>
                        </div>
                        <Switch checked={showBirthdays} onCheckedChange={setShowBirthdays} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <Label className="text-sm text-slate-700">Show Completed</Label>
                        </div>
                        <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            sortButton={(
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={sortBy !== "date-asc" ? "default" : "outline"}
                    size="icon"
                    className={sortBy !== "date-asc" ? "bg-primary-600 text-white hover:bg-primary-700" : ""}
                    title="Sort"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-slate-900 mb-3">Sort by</h4>
                    <div className="space-y-2">
                      <Button
                        variant={sortBy === "date-asc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("date-asc")}
                      >
                        Date (Earliest First)
                      </Button>
                      <Button
                        variant={sortBy === "date-desc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("date-desc")}
                      >
                        Date (Latest First)
                      </Button>
                      <Button
                        variant={sortBy === "title-asc" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("title-asc")}
                      >
                        Title (A-Z)
                      </Button>
                      <Button
                        variant={sortBy === "type" ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSortBy("type")}
                      >
                        By Type
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            rightActions={(
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    aria-pressed={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <List className="w-4 h-4" /> List
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === 'calendar'}
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <CalendarIcon className="w-4 h-4" /> Calendar
                  </button>
                </div>

                {/* Connect Calendar button (replaces export; export dialog hidden for now) */}
                <Button
                  variant="outline"
                  onClick={() => setShowConnectDialog(true)}
                >
                  Connect Your Calendar
                </Button>
              </div>
            )}
          />
        </div>

        {/* Enhanced Filter Panel removed for simplicity */}


        {/* Undo Toast */}
        {showUndoToast && lastMove && (
          <Alert className="bg-slate-900 text-white border-0 fixed bottom-8 right-8 w-auto max-w-md shadow-2xl z-50 rounded-2xl">
            <AlertDescription className="flex items-center gap-4 p-2">
              <span className="font-medium">Event moved to {format(parseISO(lastMove.newDate), 'MMM d, yyyy')}</span>
              <Button
                size="sm"
                onClick={handleUndo}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-lg"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* View Content */}
        {viewMode === "calendar" ? (
          <div>
            {/* Calendar header for week/month views */}
            {(activeFilter === "week" || activeFilter === "month" || activeFilter === "all") && renderCalendarHeader()}

            {/* Render appropriate calendar view based on filter */}
            {activeFilter === "today" && renderTodayView()}
            {activeFilter === "week" && renderWeekView()}
            {(activeFilter === "month" || activeFilter === "all") && renderMonthView()}

            {/* Pro Tips for month view */}
            {(activeFilter === "month" || activeFilter === "all") && (
              <Card className="mt-6 border-blue-200 shadow-lg bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Pro Tips</h4>
                      <p className="text-sm text-blue-800">
                        <strong>Drag & drop</strong> events to reschedule • <strong>Click</strong> any event to view details • <strong>Check the box</strong> to mark tasks complete
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {isLoading ? (
              <Card className="border-slate-200 shadow-lg">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-600">Loading...</p>
                </CardContent>
              </Card>
            ) : displayedTasks.length === 0 ? (
              <Card className="border-slate-200 shadow-lg">
                <CardContent className="py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                  <p className="text-slate-600">
                    {searchQuery ? "No tasks match your search" : "No tasks found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              displayedTasks.map(task => {
                let isOverdue = false;
                try {
                  if (task.date) {
                    const taskDate = startOfDay(parseISO(task.date));
                    const now = startOfDay(new Date());
                    const done = hasCompletedField ? Boolean(task.completed) : Boolean(completedMap?.[task.id]);
                    isOverdue = task.type === "Task" && !done && taskDate < now && !isToday(taskDate);
                  }
                } catch (e) {
                  console.error('Error checking overdue status for task:', task);
                }

                return <TaskCard key={task.id} task={task} isOverdue={isOverdue} />;
              })
            )}
          </div>
        )}
      </div>

      {/* Connect Calendar dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect Your Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Provider</Label>
                <Select
                  value={connectForm.provider}
                  onValueChange={(provider) => setConnectForm((prev) => ({ ...prev, provider }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="apple">Apple Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Sync mode</Label>
                <Select
                  value={connectForm.syncMode}
                  onValueChange={(syncMode) => setConnectForm((prev) => ({ ...prev, syncMode }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two-way">Two-way sync</SelectItem>
                    <SelectItem value="pull">One-way (pull events)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Account email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={connectForm.email}
                onChange={(e) => setConnectForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-sm">Sync past events</Label>
              <Select
                value={connectForm.includePast}
                onValueChange={(includePast) => setConnectForm((prev) => ({ ...prev, includePast }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert className="bg-slate-50 border-slate-200 text-slate-700">
              <AlertDescription>
                This is a simulated connection. OAuth and real sync will be added later.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>Cancel</Button>
            <Button onClick={handleConnectCalendar}>Save connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export calendar dialog (hidden/not used) */}
      <AddEventDialog
        open={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onSubmit={handleAddEvent}
        isLoading={isCreatingEvent}
        lead={null}
      />

      <AddEventDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        isLoading={updateTaskMutation.isLoading}
        lead={selectedEvent?.linked_lead_id ? { id: selectedEvent.linked_lead_id, name: selectedEvent.linked_lead_name } : null}
        existingEvent={selectedEvent}
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600">
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={deleteTaskMutation.isLoading}
            >
              {deleteTaskMutation.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Calendar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={exportDateRange === "all" ? "default" : "outline"}
                  onClick={() => setExportDateRange("all")}
                  className={exportDateRange === "all" ? "bg-primary-600 hover:bg-primary-700" : ""}
                >
                  All Events
                </Button>
                <Button
                  variant={exportDateRange === "week" ? "default" : "outline"}
                  onClick={() => setExportDateRange("week")}
                  className={exportDateRange === "week" ? "bg-primary-600 hover:bg-primary-700" : ""}
                >
                  This Week
                </Button>
                <Button
                  variant={exportDateRange === "month" ? "default" : "outline"}
                  onClick={() => setExportDateRange("month")}
                  className={exportDateRange === "month" ? "bg-primary-600 hover:bg-primary-700" : ""}
                >
                  This Month
                </Button>
                <Button
                  variant={exportDateRange === "custom" ? "default" : "outline"}
                  onClick={() => setExportDateRange("custom")}
                  className={exportDateRange === "custom" ? "bg-primary-600 hover:bg-primary-700" : ""}
                >
                  Custom
                </Button>
              </div>
            </div>

            {exportDateRange === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Format: .ICS Calendar File
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                The exported file can be imported into:
              </p>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Google Calendar</li>
                <li>• Microsoft Outlook</li>
                <li>• Apple Calendar</li>
                <li>• Other calendar applications</li>
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-2">
                How to Import:
              </h4>
              <ol className="space-y-2 text-sm text-slate-600">
                <li><strong>Google Calendar:</strong> Settings → Import & Export → Select file</li>
                <li><strong>Outlook:</strong> File → Open & Export → Import/Export → iCalendar</li>
                <li><strong>Apple Calendar:</strong> File → Import → Select .ics file</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateICS}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download .ICS File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
