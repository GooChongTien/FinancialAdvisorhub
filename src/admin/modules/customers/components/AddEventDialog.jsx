import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Textarea } from "@/admin/components/ui/textarea";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const getInitialForm = (lead, existingEvent) => {
  // If editing an existing event, populate from it
  if (existingEvent) {
    return {
      title: existingEvent.title || "",
      type: existingEvent.type || "Appointment",
      date: existingEvent.date || "",
      time: existingEvent.time || "",
      duration: String(existingEvent.duration || "60"),
      linked_lead_id: existingEvent.linked_lead_id || "",
      linked_lead_name: existingEvent.linked_lead_name || "",
      notes: existingEvent.notes || "",
    };
  }

  // Creating new event
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultDate = format(oneHourLater, "yyyy-MM-dd");
  const defaultTime = oneHourLater.getDate() === now.getDate()
    ? `${String(oneHourLater.getHours()).padStart(2, "0")}:00`
    : "09:00";

  return {
    title: lead ? `Appointment with ${lead.name}` : "",
    type: "Appointment",
    date: defaultDate,
    time: defaultTime,
    duration: "60",
    linked_lead_id: lead?.id || "",
    linked_lead_name: lead?.name || "",
    notes: "",
  };
};

function validateEvent(formData) {
  const errors = {};
  if (!formData.title.trim()) {
    errors.title = "Title is required.";
  }
  if (!formData.date) {
    errors.date = "Date is required.";
  }
  if (!formData.time) {
    errors.time = "Time is required.";
  }

  if (formData.date && formData.time) {
    const candidate = new Date(`${formData.date}T${formData.time}`);
    if (Number.isNaN(candidate.getTime())) {
      errors.time = "Enter a valid time.";
    }
    // Note: Removed future date validation to allow editing past events
  }

  if (formData.duration) {
    const minutes = Number(formData.duration);
    if (Number.isNaN(minutes) || minutes <= 0) {
      errors.duration = "Duration must be greater than zero.";
    }
  }

  return errors;
}

export default function AddEventDialog({
  open,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  lead,
  existingEvent = null, // Pass this when editing
}) {
  const isEditMode = !!existingEvent;
  const baseForm = useMemo(() => getInitialForm(lead, existingEvent), [lead, existingEvent]);
  const [formData, setFormData] = useState(baseForm);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => validateEvent(formData), [formData]);
  const isFormValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (open) {
      setFormData(getInitialForm(lead, existingEvent));
      setTouched({});
    }
  }, [lead, existingEvent, open]);

  const handleSubmit = () => {
    setTouched({
      title: true,
      date: true,
      time: true,
      duration: true,
    });
    if (!isFormValid) {
      return;
    }
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(getInitialForm(lead, existingEvent));
    setTouched({});
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && existingEvent) {
      onDelete(existingEvent);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-600" />
            {isEditMode ? "Edit Event" : "Add Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
              className={cn(
                touched.title && errors.title
                  ? "border-red-400 focus-visible:outline-red-500"
                  : undefined,
              )}
              aria-invalid={Boolean(touched.title && errors.title)}
              aria-describedby={
                touched.title && errors.title ? "event-title-error" : undefined
              }
            />
            {touched.title && errors.title ? (
              <p id="event-title-error" className="text-sm text-red-600">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Appointment">Appointment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, date: true }))}
                className={cn(
                  touched.date && errors.date
                    ? "border-red-400 focus-visible:outline-red-500"
                    : undefined,
                )}
                aria-invalid={Boolean(touched.date && errors.date)}
                aria-describedby={
                  touched.date && errors.date ? "event-date-error" : undefined
                }
              />
              {touched.date && errors.date ? (
                <p id="event-date-error" className="text-sm text-red-600">
                  {errors.date}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, time: true }))}
                className={cn(
                  touched.time && errors.time
                    ? "border-red-400 focus-visible:outline-red-500"
                    : undefined,
                )}
                aria-invalid={Boolean(touched.time && errors.time)}
                aria-describedby={
                  touched.time && errors.time ? "event-time-error" : undefined
                }
              />
              {touched.time && errors.time ? (
                <p id="event-time-error" className="text-sm text-red-600">
                  {errors.time}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, duration: true }))
              }
              className={cn(
                touched.duration && errors.duration
                  ? "border-red-400 focus-visible:outline-red-500"
                  : undefined,
              )}
              aria-invalid={Boolean(touched.duration && errors.duration)}
              aria-describedby={
                touched.duration && errors.duration
                  ? "event-duration-error"
                  : undefined
              }
            />
            {touched.duration && errors.duration ? (
              <p id="event-duration-error" className="text-sm text-red-600">
                {errors.duration}
              </p>
            ) : null}
          </div>

          {formData.linked_lead_name && (
            <div className="space-y-2">
              <Label>Linked Customer</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm font-medium text-slate-900">
                  {formData.linked_lead_name}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Add any additional details or reminders..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditMode && onDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
