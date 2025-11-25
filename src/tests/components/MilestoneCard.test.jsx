// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MilestoneCard } from "@/admin/modules/customers/components/MilestoneCard";
import { Bell } from "lucide-react";
import "@/lib/i18n/config";

const baseMilestone = {
  title: "Policy Issued",
  description: "First policy was issued successfully",
  date: "2025-01-10",
  category: "policy",
  status: "completed",
};

describe("MilestoneCard", () => {
  it("renders title, description, and formatted date", () => {
    render(<MilestoneCard milestone={baseMilestone} />);

    expect(screen.getByText("Policy Issued")).toBeInTheDocument();
    expect(screen.getByText("First policy was issued successfully")).toBeInTheDocument();
    expect(screen.getByTestId("milestone-date").textContent).toMatch(/2025/);
  });

  it("shows category badge and default icon", () => {
    render(<MilestoneCard milestone={baseMilestone} />);

    expect(screen.getByTestId("milestone-category")).toHaveTextContent(/Policy/i);
    expect(screen.getByTestId("milestone-icon").querySelector("svg")).toBeInTheDocument();
  });

  it("renders status badge with label", () => {
    render(<MilestoneCard milestone={baseMilestone} />);

    expect(screen.getByTestId("milestone-status")).toHaveTextContent(/Completed/i);
  });

  it("falls back to default status label when unknown", () => {
    const milestone = { ...baseMilestone, status: "archived" };
    render(<MilestoneCard milestone={milestone} />);

    expect(screen.getByTestId("milestone-status")).toHaveTextContent(/Upcoming/i);
  });

  it("calls onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<MilestoneCard milestone={baseMilestone} onClick={onClick} />);

    await user.click(screen.getByTestId("milestone-card"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders celebration details when provided", () => {
    const milestone = {
      ...baseMilestone,
      celebrated: true,
      celebrationMethod: "Team dinner",
    };
    render(<MilestoneCard milestone={milestone} />);

    expect(screen.getByTestId("milestone-celebrated")).toHaveTextContent(/Celebrated/i);
    expect(screen.getByTestId("milestone-celebration-method")).toHaveTextContent(/Team dinner/);
  });

  it("falls back when description is missing", () => {
    const milestone = { ...baseMilestone, description: "" };
    render(<MilestoneCard milestone={milestone} />);

    expect(screen.getByText(/No description provided/i)).toBeInTheDocument();
  });

  it("shows fallback when date is missing", () => {
    const milestone = { ...baseMilestone, date: null };
    render(<MilestoneCard milestone={milestone} />);

    expect(screen.getByTestId("milestone-date")).toHaveTextContent(/Date not provided/i);
  });

  it("supports custom icon override", () => {
    const milestone = { ...baseMilestone, icon: Bell };
    render(<MilestoneCard milestone={milestone} />);

    const iconWrapper = screen.getByTestId("milestone-icon");
    expect(iconWrapper.getAttribute("data-icon-name")).toBe("bell");
  });

  it("applies active styles when active prop is true", () => {
    render(<MilestoneCard milestone={baseMilestone} active />);

    expect(screen.getByTestId("milestone-card").className).toMatch(/ring/);
  });
});
