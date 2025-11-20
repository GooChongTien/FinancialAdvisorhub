import { Handle, Position } from "@xyflow/react";
import { Brain } from "lucide-react";
import { memo } from "react";

const ClassifyNode = memo(({ data }) => {
    const categories = data.categories || [];

    return (
        <div className="bg-white border-2 border-indigo-400 rounded-xl shadow-lg min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{data.label || "Classify"}</div>
                        <div className="text-xs text-slate-500">Intent classification</div>
                    </div>
                </div>

                {categories.length > 0 && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 mb-1">
                        {categories.length} categories
                    </div>
                )}

                {data.confidenceThreshold && (
                    <div className="text-xs text-slate-500">
                        Threshold: {data.confidenceThreshold}
                    </div>
                )}
            </div>

            {/* Dynamic handles based on categories */}
            {categories.map((category, index) => {
                const position = (index + 1) / (categories.length + 1);
                return (
                    <Handle
                        key={category}
                        type="source"
                        position={Position.Bottom}
                        id={category}
                        style={{ left: `${position * 100}%` }}
                        className="w-3 h-3 bg-indigo-500"
                    />
                );
            })}

            {/* Fallback handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="fallback"
                className="w-3 h-3 bg-slate-400"
            />
        </div>
    );
});

ClassifyNode.displayName = "ClassifyNode";

export default ClassifyNode;
