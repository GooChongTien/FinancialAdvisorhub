
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
    type: 'agent' | 'tool' | 'decision' | 'userApproval' | 'transform' | 'classify' | 'while' | 'state' | 'start' | 'end';
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

                // --- Agent/LLM Node ---
                if (node.type === 'agent' || node.type === 'llm') {
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

                // --- Decision Node ---
                if (node.type === 'decision') {
                    const condition = node.config.condition || '';

                    try {
                        // Evaluate condition expression against state
                        // For prototype, simple string check. Real impl would use safe eval or expression parser.
                        let result = false;

                        // Simple condition evaluation (can be enhanced with proper expression parser)
                        if (condition.includes('metadata.confidence')) {
                            const confidence = state.metadata?.confidence || 0;
                            if (condition.includes('>')) {
                                const threshold = parseFloat(condition.split('>')[1].trim());
                                result = confidence > threshold;
                            } else if (condition.includes('<')) {
                                const threshold = parseFloat(condition.split('<')[1].trim());
                                result = confidence < threshold;
                            }
                        }

                        return {
                            next_node: result ? node.config.true_branch : node.config.false_branch,
                            metadata: { ...state.metadata, last_decision: result }
                        };
                    } catch (e) {
                        return { messages: [{ role: 'system', content: `Decision evaluation failed: ${e}` }] };
                    }
                }

                // --- Transform Node ---
                if (node.type === 'transform') {
                    const field = node.config.field || '';
                    const expression = node.config.expression || '';
                    const outputField = node.config.outputField || field;

                    try {
                        // Simple transformation: get value from state and apply expression
                        const value = state[field] || state.context?.[field];

                        // For prototype, support simple transformations
                        let transformed = value;
                        if (expression.toLowerCase().includes('uppercase')) {
                            transformed = String(value || '').toUpperCase();
                        } else if (expression.toLowerCase().includes('lowercase')) {
                            transformed = String(value || '').toLowerCase();
                        } else if (expression.toLowerCase().includes('trim')) {
                            transformed = String(value || '').trim();
                        }

                        return {
                            [outputField]: transformed,
                            messages: [{ role: 'system', content: `Transformed ${field} -> ${outputField}` }]
                        };
                    } catch (e) {
                        return { messages: [{ role: 'system', content: `Transform failed: ${e}` }] };
                    }
                }

                // --- Classify Node ---
                if (node.type === 'classify') {
                    const field = node.config.field || '';
                    const categories = node.config.categories || [];

                    try {
                        const value = String(state[field] || state.context?.[field] || '').toLowerCase();

                        // Simple classification based on keyword matching
                        let selectedCategory = categories[0] || 'unknown';
                        for (const category of categories) {
                            if (value.includes(category.toLowerCase())) {
                                selectedCategory = category;
                                break;
                            }
                        }

                        return {
                            classification: selectedCategory,
                            messages: [{ role: 'system', content: `Classified as: ${selectedCategory}` }]
                        };
                    } catch (e) {
                        return { messages: [{ role: 'system', content: `Classification failed: ${e}` }] };
                    }
                }

                // --- While Node ---
                if (node.type === 'while') {
                    const condition = node.config.condition || '';
                    const maxIterations = node.config.maxIterations || 10;

                    try {
                        // Initialize iteration counter if not present
                        const iterations = state.while_iterations || 0;

                        // Simple condition check (enhance with proper expression parser)
                        let continueLoop = iterations < maxIterations;

                        if (condition) {
                            // Basic evaluation - can be enhanced
                            if (condition.includes('count <')) {
                                const threshold = parseInt(condition.split('<')[1].trim());
                                continueLoop = continueLoop && (state.count || 0) < threshold;
                            }
                        }

                        return {
                            while_iterations: iterations + 1,
                            continue_loop: continueLoop,
                            messages: [{ role: 'system', content: `Loop iteration ${iterations + 1}` }]
                        };
                    } catch (e) {
                        return { messages: [{ role: 'system', content: `While loop failed: ${e}` }] };
                    }
                }

                // --- State Node ---
                if (node.type === 'state') {
                    const stateKey = node.config.stateKey || '';
                    const operation = node.config.operation || 'set';
                    const valueExpression = node.config.valueExpression || '';

                    try {
                        let newValue: any;

                        // Parse value expression (simple literal or state reference)
                        if (valueExpression.startsWith('state.')) {
                            const path = valueExpression.substring(6);
                            newValue = state[path] || state.context?.[path];
                        } else {
                            // Try to parse as JSON, fallback to string
                            try {
                                newValue = JSON.parse(valueExpression);
                            } catch {
                                newValue = valueExpression;
                            }
                        }

                        let result: any = {};
                        const currentValue = state[stateKey];

                        switch (operation) {
                            case 'set':
                                result[stateKey] = newValue;
                                break;
                            case 'merge':
                                result[stateKey] = { ...(currentValue || {}), ...(newValue || {}) };
                                break;
                            case 'append':
                                result[stateKey] = [...(Array.isArray(currentValue) ? currentValue : []), newValue];
                                break;
                            case 'get':
                                result.retrieved_value = currentValue;
                                break;
                        }

                        return {
                            ...result,
                            messages: [{ role: 'system', content: `State ${operation}: ${stateKey}` }]
                        };
                    } catch (e) {
                        return { messages: [{ role: 'system', content: `State operation failed: ${e}` }] };
                    }
                }

                // --- User Approval Node ---
                if (node.type === 'userApproval') {
                    // For automated execution, we'll auto-approve
                    // In a real implementation, this would pause and wait for user input
                    return {
                        approval_status: 'auto_approved',
                        messages: [{ role: 'system', content: `User approval requested: ${node.config.message || 'Approve to continue'}` }]
                    };
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
                // Handle conditional edges (Decision nodes)
                if (sourceNode.type === 'decision') {
                    // For decision nodes, edges are conditional
                    // The decision node itself sets next_node in state
                    graph.addEdge(sourceNode.id, targetNode.id);
                } else if (sourceNode.type === 'while') {
                    // While nodes may loop back or continue forward
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

