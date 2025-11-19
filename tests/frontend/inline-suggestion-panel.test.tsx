// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { InlineSuggestionPanel } from "@/admin/components/MiraCopilot/InlineSuggestionPanel.tsx";
import { MiraContextProvider } from "@/admin/state/providers/MiraContextProvider.jsx";

vi.mock("@/admin/api/agentClient.js", () => {
  return {
    requestAgentJson: vi.fn(),
  };
});

const { requestAgentJson } = await import("@/admin/api/agentClient.js");
const mockedRequestAgentJson = vi.mocked(requestAgentJson);

function renderPanel(onSelect = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={["/customer"]}>
      <MiraContextProvider>
        <InlineSuggestionPanel onSuggestionSelect={onSelect} />
      </MiraContextProvider>
    </MemoryRouter>,
  );
}

describe("InlineSuggestionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRequestAgentJson.mockReset();
  });

  it("renders suggestions returned by the backend", async () => {
    mockedRequestAgentJson.mockResolvedValue({
      suggestions: [
        {
          intent: "create_lead",
          title: "Add a new lead",
          description: "Prefill Customer 360",
          promptText: "Create a new lead for Jamie Tan.",
          module: "customer",
          confidence: 0.82,
        },
      ],
    });

    renderPanel();

    expect(await screen.findByText("Add a new lead")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockedRequestAgentJson).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "suggest", context: expect.objectContaining({ module: "customer" }) }),
        expect.any(Object),
      );
    });
  });

  it("shows an error state when suggestions fail to load", async () => {
    mockedRequestAgentJson.mockRejectedValue(new Error("Network down"));
    renderPanel();

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it("invokes onSuggestionSelect when a card is clicked", async () => {
    const onSelect = vi.fn();
    const suggestion = {
      intent: "create_lead",
      title: "Add lead",
      description: "desc",
      promptText: "Create a lead",
      module: "customer",
    };
    mockedRequestAgentJson.mockResolvedValue({ suggestions: [suggestion] });

    renderPanel(onSelect);
    const card = await screen.findByText("Add lead");
    await userEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(suggestion);
  });
});
