import { supabase } from "@/admin/api/supabaseClient";
import { Button } from "@/admin/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { useToast } from "@/admin/components/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Plus, Save } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    addEdge,
    useEdgesState,
    useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom Node Components
function AgentNode({ data }) {
    return (
        <div className="px-4 py-3 bg-blue-50 border-2 border-blue-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "Agent"}</div>
            </div>
            {data.instructions && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">{data.instructions}</div>
            )}
        </div>
    );
}

function ToolNode({ data }) {
    return (
        <div className="px-4 py-3 bg-green-50 border-2 border-green-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "Tool"}</div>
            </div>
            {data.toolName && (
                <div className="text-xs text-slate-600 mt-1">Tool: {data.toolName}</div>
            )}
        </div>
    );
}

function DecisionNode({ data }) {
    return (
        <div className="px-4 py-3 bg-amber-50 border-2 border-amber-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "Decision"}</div>
            </div>
            {data.condition && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">{data.condition}</div>
            )}
        </div>
    );
}

function UserApprovalNode({ data }) {
    return (
        <div className="px-4 py-3 bg-purple-50 border-2 border-purple-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "User Approval"}</div>
            </div>
            {data.approvalMessage && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">{data.approvalMessage}</div>
            )}
        </div>
    );
}

function TransformNode({ data }) {
    return (
        <div className="px-4 py-3 bg-cyan-50 border-2 border-cyan-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "Transform"}</div>
            </div>
            {data.expression && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2 font-mono">{data.expression}</div>
            )}
        </div>
    );
}

function ClassifyNode({ data }) {
    return (
        <div className="px-4 py-3 bg-rose-50 border-2 border-rose-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "Classify"}</div>
            </div>
            {data.confidence && (
                <div className="text-xs text-slate-600 mt-1">Confidence: {data.confidence}</div>
            )}
        </div>
    );
}

function StartNode({ data }) {
    return (
        <div className="px-4 py-2 bg-slate-100 border-2 border-slate-400 rounded-xl shadow-sm min-w-[120px] text-center">
            <div className="font-medium text-sm text-slate-900">{data.label || "Start"}</div>
        </div>
    );
}

function EndNode({ data }) {
    return (
        <div className="px-4 py-2 bg-slate-100 border-2 border-slate-400 rounded-xl shadow-sm min-w-[120px] text-center">
            <div className="font-medium text-sm text-slate-900">{data.label || "End"}</div>
        </div>
    );
}

function WhileNode({ data }) {
    return (
        <div className="px-4 py-3 bg-indigo-50 border-2 border-indigo-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "While Loop"}</div>
            </div>
            {data.condition && (
                <div className="text-xs text-slate-600 mt-1 line-clamp-2">while {data.condition}</div>
            )}
            {data.maxIterations && (
                <div className="text-xs text-slate-500 mt-0.5">Max: {data.maxIterations} iterations</div>
            )}
        </div>
    );
}

function StateNode({ data }) {
    return (
        <div className="px-4 py-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-sm min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="font-medium text-sm text-slate-900">{data.label || "State"}</div>
            </div>
            {data.stateKey && (
                <div className="text-xs text-slate-600 mt-1 font-mono">{data.stateKey}</div>
            )}
        </div>
    );
}

export default function WorkflowEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchPalette, setSearchPalette] = useState("");
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [testInput, setTestInput] = useState("");
    const [testResult, setTestResult] = useState(null);

    // Node types registry
    const nodeTypes = useMemo(
        () => ({
            agent: AgentNode,
            tool: ToolNode,
            decision: DecisionNode,
            userApproval: UserApprovalNode,
            transform: TransformNode,
            classify: ClassifyNode,
            while: WhileNode,
            state: StateNode,
            start: StartNode,
            end: EndNode,
        }),
        []
    );

    // Categorized node palette
    const nodeCategories = useMemo(() => ({
        core: [
            { type: "start", label: "Start", icon: "▶", color: "slate" },
            { type: "agent", label: "Agent", icon: "🤖", color: "blue" },
            { type: "end", label: "End", icon: "⏹", color: "slate" },
        ],
        tools: [
            { type: "tool", label: "Tool Call", icon: "🔧", color: "green" },
        ],
        logic: [
            { type: "decision", label: "Decision", icon: "◆", color: "amber" },
            { type: "userApproval", label: "User Approval", icon: "✓", color: "purple" },
            { type: "classify", label: "Classify", icon: "🏷", color: "rose" },
            { type: "while", label: "While Loop", icon: "🔄", color: "indigo" },
        ],
        data: [
            { type: "transform", label: "Transform", icon: "⚡", color: "cyan" },
            { type: "state", label: "State", icon: "💾", color: "emerald" },
        ],
    }), []);

    // Filter nodes based on search
    const filteredCategories = useMemo(() => {
        if (!searchPalette) return nodeCategories;

        const search = searchPalette.toLowerCase();
        const filtered = {};

        Object.entries(nodeCategories).forEach(([category, nodes]) => {
            const matchingNodes = nodes.filter(node =>
                node.label.toLowerCase().includes(search) ||
                node.type.toLowerCase().includes(search)
            );
            if (matchingNodes.length > 0) {
                filtered[category] = matchingNodes;
            }
        });

        return filtered;
    }, [searchPalette, nodeCategories]);

    // Fetch workflow data
    const { data: workflow, isLoading } = useQuery({
        queryKey: ["workflow", id],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke(`admin-workflows/${id}`, {
                method: "GET",
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            // Initialize nodes and edges from DB
            if (data.nodes) {
                setNodes(
                    data.nodes.map((n) => ({
                        id: n.id,
                        type: n.type,
                        position: n.position || { x: 0, y: 0 },
                        data: n.config || {},
                    }))
                );
            }
            if (data.edges) {
                setEdges(
                    data.edges.map((e) => ({
                        id: e.id,
                        source: e.source_id,
                        target: e.target_id,
                        label: e.condition,
                    }))
                );
            }
        },
    });

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const onNodeClick = useCallback((_, node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Add node function
    const addNode = useCallback(
        (nodeType, label) => {
            const id = `node-${Date.now()}`;
            const newNode = {
                id,
                type: nodeType,
                position: {
                    x: Math.random() * 400 + 100,
                    y: Math.random() * 400 + 100,
                },
                data: { label },
            };
            setNodes((nds) => [...nds, newNode]);
        },
        [setNodes]
    );

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.functions.invoke(`admin-workflows/${id}`, {
                method: "PATCH",
                body: { nodes, edges },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            showToast({
                type: "success",
                title: "Workflow saved",
                description: `${data.nodes_saved} nodes and ${data.edges_saved} edges saved`,
            });
            queryClient.invalidateQueries({ queryKey: ["workflow", id] });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Failed to save", description: error.message });
        },
    });

    // Test workflow mutation
    const testMutation = useMutation({
        mutationFn: async (input) => {
            const { data, error } = await supabase.functions.invoke(`admin-workflows/${id}/test`, {
                method: "POST",
                body: { input, nodes, edges },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setTestResult(data);
            showToast({ type: "success", title: "Test completed" });
        },
        onError: (error) => {
            showToast({ type: "error", title: "Test failed", description: error.message });
        },
    });

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading workflow...</div>;
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/admin/workflows")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-lg">{workflow?.name}</h1>
                        <p className="text-xs text-slate-500">
                            {workflow?.status} • v{workflow?.version}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                            setIsTestDialogOpen(true);
                            setTestResult(null);
                            setTestInput("");
                        }}
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Test Run
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background color="#f1f5f9" gap={16} />
                    <Controls />
                    <MiniMap className="bg-white border border-slate-200" />

                    {/* Node Palette */}
                    <Panel position="top-left" className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 w-72">
                        <div className="mb-3">
                            <Input
                                placeholder="Search nodes..."
                                value={searchPalette}
                                onChange={(e) => setSearchPalette(e.target.value)}
                                className="text-sm"
                            />
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {Object.entries(filteredCategories).map(([category, nodes]) => (
                                <div key={category}>
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                        {category}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {nodes.map((node) => (
                                            <Button
                                                key={node.type}
                                                size="sm"
                                                variant="outline"
                                                className="justify-start text-xs"
                                                onClick={() => addNode(node.type, node.label)}
                                            >
                                                <span className="mr-2">{node.icon}</span>
                                                {node.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </ReactFlow>

                {/* Node Config Panel (Right Sidebar) */}
                {selectedNode && (
                    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-slate-200 z-10 max-h-[calc(100vh-2rem)] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 rounded-t-lg">
                            <h3 className="font-semibold text-sm">
                                {selectedNode.data.label || "Node Configuration"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Configure node settings and behavior</p>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Basic Settings */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-700 mb-1.5 block">Name</label>
                                    <Input
                                        value={selectedNode.data.label || ""}
                                        onChange={(e) => {
                                            setNodes((nds) =>
                                                nds.map((n) => {
                                                    if (n.id === selectedNode.id) {
                                                        return { ...n, data: { ...n.data, label: e.target.value } };
                                                    }
                                                    return n;
                                                })
                                            );
                                        }}
                                        placeholder="Enter node name..."
                                        className="text-sm"
                                    />
                                </div>

                                {/* Type-specific configuration */}
                                {selectedNode.type === "agent" && (
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                            Instructions
                                        </label>
                                        <textarea
                                            value={selectedNode.data.instructions || ""}
                                            onChange={(e) => {
                                                setNodes((nds) =>
                                                    nds.map((n) => {
                                                        if (n.id === selectedNode.id) {
                                                            return {
                                                                ...n,
                                                                data: { ...n.data, instructions: e.target.value },
                                                            };
                                                        }
                                                        return n;
                                                    })
                                                );
                                            }}
                                            placeholder="You are a helpful assistant..."
                                            className="w-full min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {selectedNode.type === "tool" && (
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                            Tool Name
                                        </label>
                                        <Input
                                            value={selectedNode.data.toolName || ""}
                                            onChange={(e) => {
                                                setNodes((nds) =>
                                                    nds.map((n) => {
                                                        if (n.id === selectedNode.id) {
                                                            return {
                                                                ...n,
                                                                data: { ...n.data, toolName: e.target.value },
                                                            };
                                                        }
                                                        return n;
                                                    })
                                                );
                                            }}
                                            placeholder="Enter tool name..."
                                            className="text-sm"
                                        />
                                    </div>
                                )}

                                {selectedNode.type === "decision" && (
                                    <div>
                                        <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                            Condition
                                        </label>
                                        <textarea
                                            value={selectedNode.data.condition || ""}
                                            onChange={(e) => {
                                                setNodes((nds) =>
                                                    nds.map((n) => {
                                                        if (n.id === selectedNode.id) {
                                                            return {
                                                                ...n,
                                                                data: { ...n.data, condition: e.target.value },
                                                            };
                                                        }
                                                        return n;
                                                    })
                                                );
                                            }}
                                            placeholder="if confidence > 0.8..."
                                            className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                {selectedNode.type === "userApproval" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Approval Message
                                            </label>
                                            <textarea
                                                value={selectedNode.data.approvalMessage || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        approvalMessage: e.target.value,
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="Please approve this action..."
                                                className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Timeout (seconds)
                                            </label>
                                            <Input
                                                type="number"
                                                value={selectedNode.data.timeout || 3600}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        timeout: parseInt(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="text-sm"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedNode.type === "transform" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Transform Expression
                                            </label>
                                            <textarea
                                                value={selectedNode.data.expression || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, expression: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="data.map(item => ({ ...item, newField: true }))"
                                                className="w-full min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                JavaScript expression to transform data
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Output Field (optional)
                                            </label>
                                            <Input
                                                value={selectedNode.data.outputField || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, outputField: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="transformedData"
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Store result in this field name
                                            </p>
                                        </div>
                                    </>
                                )}

                                {selectedNode.type === "classify" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Classification Categories
                                            </label>
                                            <textarea
                                                value={selectedNode.data.categories || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, categories: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="urgent, normal, low_priority"
                                                className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Comma-separated list of categories
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Confidence Threshold
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={selectedNode.data.confidence || 0.7}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        confidence: parseFloat(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Minimum confidence score (0.0 - 1.0)
                                            </p>
                                        </div>
                                    </>
                                )}

                                {selectedNode.type === "while" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Loop Condition
                                            </label>
                                            <textarea
                                                value={selectedNode.data.condition || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, condition: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="retryCount < maxRetries && !success"
                                                className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Loop continues while this condition is true
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Max Iterations
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={selectedNode.data.maxIterations || 10}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        maxIterations: parseInt(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Maximum number of loop iterations (safety limit)
                                            </p>
                                        </div>
                                    </>
                                )}

                                {selectedNode.type === "state" && (
                                    <>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                State Key
                                            </label>
                                            <Input
                                                value={selectedNode.data.stateKey || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, stateKey: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder="customerData"
                                                className="text-sm"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                Unique identifier for this state variable
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Operation
                                            </label>
                                            <select
                                                value={selectedNode.data.operation || "set"}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, operation: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="set">Set (overwrite)</option>
                                                <option value="merge">Merge (update fields)</option>
                                                <option value="append">Append (add to array)</option>
                                                <option value="get">Get (read only)</option>
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">
                                                How to modify the state
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Value Expression (optional)
                                            </label>
                                            <textarea
                                                value={selectedNode.data.valueExpression || ""}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: { ...n.data, valueExpression: e.target.value },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                placeholder='{ name: "John", age: 30 }'
                                                className="w-full min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                JavaScript expression for the value to store
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Model Parameters (for agent nodes) */}
                            {selectedNode.type === "agent" && (
                                <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-xs font-semibold text-slate-900 mb-3">Model Parameters</h4>
                                    <div className="space-y-4">
                                        {/* Temperature */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-slate-700">
                                                    Temperature
                                                </label>
                                                <span className="text-xs text-slate-500">
                                                    {selectedNode.data.temperature ?? 1.0}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={selectedNode.data.temperature ?? 1.0}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        temperature: parseFloat(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                                <span>Precise</span>
                                                <span>Creative</span>
                                            </div>
                                        </div>

                                        {/* Max Tokens */}
                                        <div>
                                            <label className="text-xs font-medium text-slate-700 mb-1.5 block">
                                                Max Tokens
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="4096"
                                                value={selectedNode.data.maxTokens ?? 2048}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        maxTokens: parseInt(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="text-sm"
                                            />
                                        </div>

                                        {/* Top P */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-slate-700">Top P</label>
                                                <span className="text-xs text-slate-500">
                                                    {selectedNode.data.topP ?? 1.0}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={selectedNode.data.topP ?? 1.0}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        topP: parseFloat(e.target.value),
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat UI (for agent nodes) */}
                            {selectedNode.type === "agent" && (
                                <div className="border-t border-slate-200 pt-4">
                                    <h4 className="text-xs font-semibold text-slate-900 mb-3">Chat UI</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-xs text-slate-700">Display response in chat</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedNode.data.displayInChat ?? true}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        displayInChat: e.target.checked,
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-11 h-6 bg-slate-200 rounded-full peer appearance-none cursor-pointer checked:bg-blue-600 relative after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all checked:after:left-[22px]"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-xs text-slate-700">Show in-progress messages</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedNode.data.showProgressMessages ?? false}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        showProgressMessages: e.target.checked,
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-11 h-6 bg-slate-200 rounded-full peer appearance-none cursor-pointer checked:bg-blue-600 relative after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all checked:after:left-[22px]"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Advanced Settings */}
                            <div className="border-t border-slate-200 pt-4">
                                <button
                                    onClick={() => {
                                        setNodes((nds) =>
                                            nds.map((n) => {
                                                if (n.id === selectedNode.id) {
                                                    return {
                                                        ...n,
                                                        data: { ...n.data, _showAdvanced: !n.data._showAdvanced },
                                                    };
                                                }
                                                return n;
                                            })
                                        );
                                    }}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    {selectedNode.data._showAdvanced ? "Less" : "Advanced"}
                                    <svg
                                        className={`w-3 h-3 transition-transform ${
                                            selectedNode.data._showAdvanced ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {selectedNode.data._showAdvanced && (
                                    <div className="mt-3 space-y-3">
                                        <label className="flex items-center justify-between">
                                            <span className="text-xs text-slate-700">Continue on error</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedNode.data.continueOnError ?? false}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        continueOnError: e.target.checked,
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-11 h-6 bg-slate-200 rounded-full peer appearance-none cursor-pointer checked:bg-blue-600 relative after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all checked:after:left-[22px]"
                                            />
                                        </label>
                                        <label className="flex items-center justify-between">
                                            <span className="text-xs text-slate-700">Write to conversation history</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedNode.data.writeToHistory ?? true}
                                                onChange={(e) => {
                                                    setNodes((nds) =>
                                                        nds.map((n) => {
                                                            if (n.id === selectedNode.id) {
                                                                return {
                                                                    ...n,
                                                                    data: {
                                                                        ...n.data,
                                                                        writeToHistory: e.target.checked,
                                                                    },
                                                                };
                                                            }
                                                            return n;
                                                        })
                                                    );
                                                }}
                                                className="w-11 h-6 bg-slate-200 rounded-full peer appearance-none cursor-pointer checked:bg-blue-600 relative after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all checked:after:left-[22px]"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-slate-200 pt-4">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                                        setSelectedNode(null);
                                    }}
                                >
                                    Delete Node
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Test Workflow Dialog */}
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Test Workflow</DialogTitle>
                        <DialogDescription>
                            Enter test input to execute the workflow and view results.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Test Input */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Test Input (JSON)
                            </label>
                            <textarea
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                placeholder='{"message": "Hello, test workflow!"}'
                                className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Test Results */}
                        {testResult && (
                            <div className="border-t border-slate-200 pt-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">Results</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs font-medium text-slate-600 mb-1">Status</div>
                                        <div
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                testResult.status === "success"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {testResult.status}
                                        </div>
                                    </div>

                                    {testResult.output && (
                                        <div>
                                            <div className="text-xs font-medium text-slate-600 mb-1">Output</div>
                                            <pre className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono overflow-x-auto">
                                                {JSON.stringify(testResult.output, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {testResult.trace && (
                                        <div>
                                            <div className="text-xs font-medium text-slate-600 mb-1">
                                                Execution Trace
                                            </div>
                                            <pre className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                                                {JSON.stringify(testResult.trace, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {testResult.error && (
                                        <div>
                                            <div className="text-xs font-medium text-red-600 mb-1">Error</div>
                                            <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
                                                {testResult.error}
                                            </div>
                                        </div>
                                    )}

                                    {testResult.duration && (
                                        <div>
                                            <div className="text-xs font-medium text-slate-600 mb-1">Duration</div>
                                            <div className="text-sm text-slate-700">{testResult.duration}ms</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                try {
                                    const parsedInput = testInput ? JSON.parse(testInput) : {};
                                    testMutation.mutate(parsedInput);
                                } catch (e) {
                                    showToast({
                                        type: "error",
                                        title: "Invalid JSON",
                                        description: "Please enter valid JSON input",
                                    });
                                }
                            }}
                            disabled={testMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {testMutation.isPending ? "Running..." : "Run Test"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
