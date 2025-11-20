
import { StateGraph } from "npm:@langchain/langgraph@0.0.10";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { toolRegistry } from "../tools/registry.ts";
import type { MiraContext, UIAction } from "../types.ts";

// --- Types ---

export interface AgentState {
    messages: any[];
    context: MiraContext;
    behavioral_context?: any; // [NEW] From client tracker
    ui_actions: UIAction[];
    metadata?: {
        intent?: string;
        confidence?: number;
        confidence_tier?: string;
        [key: string]: any;
    };
    next_node?: string;
    [key: string]: any;
}

interface WorkflowNode {
    id: string;
    type: 'llm' | 'tool' | 'router' | 'start' | 'end';
    name: string;
    config: any;
}

interface WorkflowEdge {
    source_node_id: string;
    target_node_id: string;
    condition_label?: string;
}

// --- Engine ---

export class GraphExecutor {
    private supabase;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async buildGraph(workflowId: string) {
        // 1. Fetch Definition from DB
        const { data: nodes } = await this.supabase
            .from('mira_workflow_nodes')
            .select('*')
            .eq('workflow_id', workflowId);

        const { data: edges } = await this.supabase
            .from('mira_workflow_edges')
            .select('*')
            .eq('workflow_id', workflowId);

        if (!nodes || !edges) throw new Error(`Workflow ${workflowId} not found`);

        // 2. Initialize Graph
        const graph = new StateGraph<AgentState>({
            channels: {
                messages: { value: (x: any[], y: any[]) => x.concat(y), default: () => [] },
                context: { value: (x: any, y: any) => ({ ...x, ...y }), default: () => ({} as MiraContext) },
                behavioral_context: { value: (x: any, y: any) => y, default: () => undefined },
                ui_actions: { value: (x: any[], y: any[]) => x.concat(y), default: () => [] },
                metadata: { value: (x: any, y: any) => ({ ...x, ...y }), default: () => ({}) },
                next_node: { value: (x: any, y: any) => y, default: () => undefined }
            }
        });

        // 3. Add Nodes
        const nodeMap = new Map<string, WorkflowNode>();
        nodes.forEach((node: any) => {
            nodeMap.set(node.id, node);

            if (node.type === 'start') return; // Virtual node

            graph.addNode(node.id, async (state: AgentState) => {
                console.log(`Executing Node: ${node.name} (${node.type})`);

                // --- LLM Node ---
                if (node.type === 'llm') {
                    const prompt = node.config.prompt_template || "You are a helpful assistant.";
                    const systemPrompt = node.config.system_prompt || "You are Mira, an intelligent insurance advisor assistant.";

                    // Get OpenAI Key
                    const denoEnv = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
                    const apiKey = typeof denoEnv?.get === "function" ? denoEnv.get("OPENAI_API_KEY") ?? "" : "";
                    const model = node.config.model || (typeof denoEnv?.get === "function" ? denoEnv.get("OPENAI_MODEL") ?? "gpt-4o-mini" : "gpt-4o-mini");

                    if (!apiKey) {
                        return {
                            messages: [{ role: 'assistant', content: `[Stub: OpenAI Key Missing] Response from ${node.name}` }]
                        };
                    }

                    try {
                        // Construct messages
                        const messages = [
                            { role: "system", content: systemPrompt },
                            ...state.messages,
                            { role: "user", content: prompt } // In a real graph, prompt might be injected or templated
                        ];

                        const response = await fetch("https://api.openai.com/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${apiKey}`,
                            },
                            body: JSON.stringify({
                                model,
                                messages,
                                // Tools would be injected here if configured for this node
                            }),
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            return { messages: [{ role: 'system', content: `Error calling LLM: ${errorText}` }] };
                        }

                        const data = await response.json();
                        const content = data.choices[0]?.message?.content || "";

                        return {
                            messages: [{ role: 'assistant', content }],
                            metadata: {
                                intent: "processed_by_graph",
                                confidence: 0.95,
                                confidence_tier: "high"
                            }
                        };

                    } catch (e) {
                        return { messages: [{ role: 'system', content: `LLM Execution Failed: ${e}` }] };
                    }
                }

                // --- Tool Node ---
                if (node.type === 'tool') {
                    const toolName = node.config.tool_name;
                    const toolInput = node.config.inputs || {}; // Should map from state

                    try {
                        const result = await toolRegistry.executeTool(toolName, {
                            args: toolInput,
                            context: state.context,
                            user: { id: 'system' } // Mock user
                        });

                        if (!result.success) {
                            return { messages: [{ role: 'system', content: `Error: ${result.error?.message}` }] };
                        }

                        // If tool returns UI Actions (custom logic needed here if toolRegistry doesn't return them directly)
                        // Assuming result.data might contain ui_actions or we synthesize them
                        const output: Partial<AgentState> = {
                            messages: [{ role: 'system', content: `Tool executed: ${toolName}` }]
                        };

                        if (result.data && typeof result.data === 'object' && 'ui_actions' in result.data) {
                            output.ui_actions = (result.data as any).ui_actions;
                        }

                        return output;

                    } catch (e) {
                        return { messages: [{ role: 'system', content: `Tool execution failed: ${e}` }] };
                    }
                }

                return {};
            });
        });

        // 4. Add Edges
        edges.forEach((edge: any) => {
            const sourceNode = nodeMap.get(edge.source_node_id);
            const targetNode = nodeMap.get(edge.target_node_id);

            if (!sourceNode || !targetNode) return;

            if (sourceNode.type === 'start') {
                graph.setEntryPoint(targetNode.id);
            } else {
                // Handle conditional edges (Router)
                if (sourceNode.type === 'router') {
                    // For prototype, direct edge. Real impl needs conditional logic.
                    graph.addEdge(sourceNode.id, targetNode.id);
                } else {
                    graph.addEdge(sourceNode.id, targetNode.id);
                }
            }
        });

        return graph.compile();
    }

    async execute(workflowId: string, input: Partial<AgentState>) {
        const runnable = await this.buildGraph(workflowId);
        return await runnable.invoke(input);
    }

    /**
     * Execute a workflow by looking it up via its trigger_intent
     */
    async executeByIntent(triggerIntent: string, input: Partial<AgentState>) {
        // Look up workflow by trigger_intent
        const { data, error } = await this.supabase
            .from('mira_workflows')
            .select('id, name')
            .eq('trigger_intent', triggerIntent)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            console.log(`[GraphExecutor] No workflow found for intent: ${triggerIntent}`);
            return null;
        }

        console.log(`[GraphExecutor] Found workflow: ${data.name} (${data.id})`);
        const runnable = await this.buildGraph(data.name);
        return await runnable.invoke(input);
    }
}

