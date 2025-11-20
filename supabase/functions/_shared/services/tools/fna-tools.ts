
import { z } from "https://esm.sh/zod@3.25.76";
import { executeSafely } from "./error-handling.ts";
import type { ToolContext } from "./types.ts";

// --- Tool: fna.update_field ---
// Purpose: Returns a UI action to update a field in the FNA form on the frontend.
// Note: Since there is no backend FNA table yet, this relies on client-side state handling.

const fnaUpdateFieldSchema = z.object({
    path: z.string().describe("The dot-notation path of the field to update (e.g., 'fna.income.monthly')"),
    value: z.union([z.string(), z.number(), z.boolean()]).describe("The new value for the field"),
    description: z.string().optional().describe("A description of what is being updated for the user"),
});

async function fnaUpdateField(ctx: ToolContext, args: z.infer<typeof fnaUpdateFieldSchema>) {
    const { path, value, description } = fnaUpdateFieldSchema.parse(args);

    return executeSafely(
        "fna.update_field",
        async () => {
            // Return the UI action directly. The GraphExecutor will extract this.
            return {
                success: true,
                message: description || `Updating ${path} to ${value}`,
                ui_actions: [
                    {
                        type: "update_field",
                        path,
                        value,
                    },
                ],
            };
        },
        args
    );
}

// --- Tool: fna.get_overview ---
// Purpose: Returns a summary of the client's FNA status (mocked for now or reading from context).

const fnaGetOverviewSchema = z.object({
    customerId: z.string().optional(),
});

async function fnaGetOverview(ctx: ToolContext, args: z.infer<typeof fnaGetOverviewSchema>) {
    return executeSafely(
        "fna.get_overview",
        async () => {
            // In a real implementation, this would fetch from a table.
            // For now, we return a structured summary that the LLM can use.
            return {
                summary: "Client has basic protection but significant gaps in Critical Illness coverage.",
                details: {
                    income: "Not set",
                    dependents: "Unknown",
                    protection_gap: "High"
                },
                ui_actions: [
                    { type: "navigate", route: "/fna" }
                ]
            };
        },
        args
    );
}

// Export tools for registration in registry.ts
export const fnaTools = {
    "fna.update_field": { handler: fnaUpdateField, schema: fnaUpdateFieldSchema },
    "fna.get_overview": { handler: fnaGetOverview, schema: fnaGetOverviewSchema }
};
