import { Handle, Position } from "@xyflow/react";
import { Code2 } from "lucide-react";
import { memo } from "react";

const TransformNode = memo(({ data }) => {
    return (
        <div className="bg-white border-2 border-purple-400 rounded-xl shadow-lg min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{data.label || "Transform"}</div>
                        <div className="text-xs text-slate-500">Data transformation</div>
                    </div>
                </div>

                {data.expression && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 font-mono">
                        {data.expression.length > 50 ? `${data.expression.slice(0, 50)}...` : data.expression}
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
    );
});

TransformNode.displayName = "TransformNode";

export default TransformNode;
