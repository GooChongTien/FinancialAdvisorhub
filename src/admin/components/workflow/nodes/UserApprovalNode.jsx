import { Handle, Position } from "@xyflow/react";
import { Clock, User } from "lucide-react";
import { memo } from "react";

const UserApprovalNode = memo(({ data }) => {
    return (
        <div className="bg-white border-2 border-amber-400 rounded-xl shadow-lg min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900">{data.label || "User Approval"}</div>
                        <div className="text-xs text-slate-500">Human review required</div>
                    </div>
                </div>

                {data.approvalMessage && (
                    <div className="text-xs text-slate-600 bg-slate-50 rounded p-2 mb-2">
                        {data.approvalMessage}
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>Timeout: {data.timeout || 3600}s</span>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="approved"
                style={{ left: "33%" }}
                className="w-3 h-3 bg-emerald-500"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="rejected"
                style={{ left: "66%" }}
                className="w-3 h-3 bg-red-500"
            />
        </div>
    );
});

UserApprovalNode.displayName = "UserApprovalNode";

export default UserApprovalNode;
