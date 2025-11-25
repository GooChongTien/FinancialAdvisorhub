// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OurJourneyTimeline } from "@/admin/modules/customers/components/OurJourneyTimeline";
import "@/lib/i18n/config";

const milestones = [
  {
    id: "m1",
    title: "Kickoff",
    description: "Project kickoff with client",
    date: "2024-02-01",
    category: "general",
    status: "completed",
  },
  {
    id: "m2",
    title: "Policy Issued",
    description: "First policy issued",
    date: "2024-03-15",
    category: "policy",
    status: "completed",
  },
  {
    id: "m3",
    title: "Q2 Review",
    description: "Quarterly financial review",
    date: "2024-06-10",
    category: "financial_goal",
    status: "upcoming",
  },
];

describe("OurJourneyTimeline", () => {
  it("renders title and total count", () => {
    render(<OurJourneyTimeline milestones={milestones} />);

    expect(screen.getByText(/Our Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("shows empty state when no milestones", () => {
    render(<OurJourneyTimeline milestones={[]} emptyMessage="Nothing yet" />);

    expect(screen.getByTestId("timeline-empty")).toHaveTextContent("Nothing yet");
  });

  it("sorts milestones chronologically", () => {
    const shuffled = [milestones[2], milestones[0], milestones[1]];
    render(<OurJourneyTimeline milestones={shuffled} />);

    const items = screen.getAllByTestId(/timeline-item-/);
    expect(items[0]).toHaveTextContent("Kickoff");
    expect(items[1]).toHaveTextContent("Policy Issued");
    expect(items[2]).toHaveTextContent("Q2 Review");
  });

  it("marks active milestone", () => {
    render(<OurJourneyTimeline milestones={milestones} activeId="m2" />);

    const activeItem = screen.getByTestId("timeline-item-m2");
    const card = within(activeItem).getByTestId("milestone-card");
    expect(card.className).toMatch(/ring/);
  });

  it("invokes onSelect with clicked milestone", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<OurJourneyTimeline milestones={milestones} onSelect={onSelect} />);

    await user.click(screen.getByTestId("timeline-item-m3"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "m3" }));
  });

  it("falls back when date missing and keeps order stable", () => {
    const withMissing = [
      { id: "m4", title: "Undated milestone", description: "", category: "general", status: "upcoming" },
      ...milestones,
    ];
    render(<OurJourneyTimeline milestones={withMissing} />);

    const items = screen.getAllByTestId(/timeline-item-/);
    expect(items[items.length - 1]).toHaveTextContent("Undated milestone");
  });

  it("does not add interactive semantics when onSelect is not provided", () => {
    render(<OurJourneyTimeline milestones={milestones} />);
    const item = screen.getByTestId("timeline-item-m1");
    expect(item).not.toHaveAttribute("role");
    expect(item).not.toHaveAttribute("tabIndex");
  });

  it("invokes onSelect only once per click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<OurJourneyTimeline milestones={milestones} onSelect={onSelect} />);

    await user.click(screen.getByTestId("timeline-item-m1"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard activation for selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<OurJourneyTimeline milestones={milestones} onSelect={onSelect} />);

    const item = screen.getByTestId("timeline-item-m2");
    item.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("marks the active milestone for accessibility", () => {
    render(<OurJourneyTimeline milestones={milestones} activeId="m2" />);

    const item = screen.getByTestId("timeline-item-m2");
    expect(item).toHaveAttribute("aria-current", "step");
    expect(item.dataset.active).toBe("true");
  });

  it("applies custom className to wrapper", () => {
    render(<OurJourneyTimeline milestones={milestones} className="bg-slate-50" />);
    const wrapper = screen.getByTestId("journey-timeline");
    expect(wrapper.className).toMatch(/bg-slate-50/);
  });

  it("renders status summary counts", () => {
    render(<OurJourneyTimeline milestones={milestones} />);
    expect(screen.getByTestId("timeline-summary")).toHaveTextContent("Completed: 2");
    expect(screen.getByTestId("timeline-summary")).toHaveTextContent("Upcoming: 1");
  });

  it("keeps invalid dates at the end while preserving their relative order", () => {
    const data = [
      { id: "dated", title: "Dated", date: "2024-01-01" },
      { id: "invalid1", title: "Invalid One", date: "not-a-date" },
      { id: "invalid2", title: "Invalid Two", date: null },
    ];

    render(<OurJourneyTimeline milestones={data} />);
    const items = screen.getAllByTestId(/timeline-item-/);
    expect(items[0]).toHaveTextContent("Dated");
    expect(items[1]).toHaveTextContent("Invalid One");
    expect(items[2]).toHaveTextContent("Invalid Two");
  });

  it("maintains input order when dates are the same", () => {
    const sameDate = [
      { id: "a", title: "First", date: "2024-01-01" },
      { id: "b", title: "Second", date: "2024-01-01" },
      { id: "c", title: "Third", date: "2024-01-01" },
    ];

    render(<OurJourneyTimeline milestones={sameDate} />);
    const items = screen.getAllByTestId(/timeline-item-/);
    expect(items[0]).toHaveTextContent("First");
    expect(items[1]).toHaveTextContent("Second");
    expect(items[2]).toHaveTextContent("Third");
  });

  it("uses title as fallback identifier when id is missing", () => {
    const data = [{ title: "Fallback ID", date: "2024-02-02" }];
    render(<OurJourneyTimeline milestones={data} />);

    expect(screen.getByTestId("timeline-item-Fallback ID")).toBeInTheDocument();
  });
});
