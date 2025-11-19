import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ClarificationPrompt } from "@/admin/components/ui/clarification-prompt.jsx";
import { intentLabel } from "@/lib/mira/intentLabels.ts";

describe("ClarificationPrompt", () => {
  it("renders nothing when prompt is null", () => {
    const { container } = render(
      <ClarificationPrompt prompt={null} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows confirm/cancel buttons for medium confidence and fires callbacks", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const promptData = {
      assistantText: "Confirm action?",
      metadata: {
        intent: "create_lead",
        confidenceTier: "medium",
      },
    };

    render(<ClarificationPrompt prompt={promptData} onConfirm={onConfirm} onCancel={onCancel} />);

    const label = intentLabel("create_lead");
    expect(screen.getByText(new RegExp(`would you like me to ${label.replace(/\?/g, "\\?")}`))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: /Yes, go ahead/i }));
    await userEvent.click(screen.getByRole("button", { name: /No, I’ll change it/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows low-confidence text without confirm button", () => {
    const onCancel = vi.fn();
    const promptData = {
      assistantText: "Need more info",
      metadata: {
        intent: "view_ytd_progress",
        confidenceTier: "low",
      },
    };

    render(<ClarificationPrompt prompt={promptData} onConfirm={vi.fn()} onCancel={onCancel} />);

    expect(screen.getByText("Need more info")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Yes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clarify/i })).toBeVisible();
  });
});
afterEach(() => {
  cleanup();
});
