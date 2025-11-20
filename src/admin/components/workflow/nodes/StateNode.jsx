import { Handle, Position } from "@xyflow/react";
import { Database } from "lucide-react";
import { memo } from "react";

const StateNode = memo(({ data }) => {
    return (
        <div className="bg-white border-2 border-teal-400 rounded-xl shadow-lg min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Database className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{data.label || "State"}</div>
                        <div className="text-xs text-slate-500">{data.operation || "Set"} state</div>
                    </div>
                </div>

                {data.stateKey && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 mb-1 font-mono">
                        Key: {data.stateKey}
                    </div>
                )}

                {data.scope && (
                    <div className="text-xs text-slate-500">
                        Scope: {data.scope}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
    );
});

StateNode.displayName = "StateNode";

export default StateNode;
