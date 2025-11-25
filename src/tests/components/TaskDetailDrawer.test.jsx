import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskDetailDrawer from "@/admin/modules/smart-plan/TaskDetailDrawer.jsx";

describe("TaskDetailDrawer", () => {
  const baseTask = {
    id: "task-1",
    title: "Review policy",
    type: "Task",
    notes: "",
  };

  it("saves notes from the Notes tab", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(<TaskDetailDrawer open task={baseTask} onSave={handleSave} onClose={() => {}} />);

    const notesInput = screen.getAllByLabelText(/notes/i, { selector: "textarea" })[0];
    await user.type(notesInput, "Follow up with client tomorrow");
    await user.click(screen.getByRole("button", { name: /save notes/i }));

    expect(handleSave).toHaveBeenCalledWith({ notes: "Follow up with client tomorrow" });
  });

  it("shows fallback summary when ai_summary is missing", () => {
    const task = { ...baseTask, notes: "Long note content", ai_summary: "" };
    render(<TaskDetailDrawer open task={task} onSave={() => {}} onClose={() => {}} />);

    expect(screen.getByText(/Long note content/)).toBeInTheDocument();
  });

  it("renders transcript tab for appointments", async () => {
    const user = userEvent.setup();
    const task = { ...baseTask, type: "Appointment", title: "Meet Sarah" };
    render(<TaskDetailDrawer open task={task} onSave={() => {}} onClose={() => {}} />);

    await user.click(screen.getByRole("tab", { name: /transcript/i }));

    expect(screen.getByLabelText(/meeting link/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/transcript/i, { selector: "textarea" })[0]).toBeInTheDocument();
  });
});
