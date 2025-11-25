// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TemperatureBadge } from "@/admin/components/ui/TemperatureBadge";

describe("TemperatureBadge", () => {
  it("renders provided bucket label", () => {
    render(<TemperatureBadge bucket="hot" score={0.82} />);
    const badge = screen.getByTestId("temperature-badge");
    expect(badge).toHaveTextContent("Hot");
  });

  it("computes temperature from input when bucket not provided", () => {
    render(
      <TemperatureBadge
        input={{ lastInteractionAt: new Date().toISOString(), activeProposals: 2, recentInteractions: 10 }}
      />,
    );
    expect(screen.getByText(/Hot|Warm/)).toBeInTheDocument();
  });

  it("falls back to cold when invalid data", () => {
    render(<TemperatureBadge input={{ lastInteractionAt: "not-a-date" }} />);
    expect(screen.getByTestId("temperature-badge")).toHaveTextContent("Cold");
  });

  it("hides score when showScore is false", () => {
    render(<TemperatureBadge bucket="warm" score={0.5} showScore={false} />);
    const badge = screen.getByTestId("temperature-badge");
    expect(badge).toHaveTextContent("Warm");
    expect(badge).not.toHaveTextContent("%");
  });
});
