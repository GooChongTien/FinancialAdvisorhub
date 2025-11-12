import { cn } from "@/lib/utils";
function Alert({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-slate-50 text-slate-700 border-slate-200",
    success: "bg-green-50 text-green-700 border-green-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}
function AlertDescription({ className, ...props }) {
  return (
    <div className={cn("text-sm leading-relaxed", className)} {...props} />
  );
}
export { Alert, AlertDescription };
