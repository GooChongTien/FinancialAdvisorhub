import { Handle, Position } from "@xyflow/react";
import { RotateCw } from "lucide-react";
import { memo } from "react";

const WhileNode = memo(({ data }) => {
    return (
        <div className="bg-white border-2 border-blue-400 rounded-xl shadow-lg min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <RotateCw className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{data.label || "While Loop"}</div>
                        <div className="text-xs text-slate-500">Iterative process</div>
                    </div>
                </div>

                {data.condition && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 mb-2">
                        Condition: {data.condition}
                    </div>
                )}

                <div className="text-xs text-slate-500">
                    Max iterations: {data.maxIterations || 100}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="continue"
                style={{ left: "33%" }}
                className="w-3 h-3 bg-blue-500"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="break"
                style={{ left: "66%" }}
                className="w-3 h-3 bg-slate-500"
            />
        </div>
    );
});

WhileNode.displayName = "WhileNode";

export default WhileNode;
