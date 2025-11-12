import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

/**
 * Button Component - AdvisorHub Design System
 *
 * Semantic variants following color system guidelines:
 * - default/filled: Primary CTAs (Save, Submit, Create) - Primary Blue
 * - secondary: Secondary actions (Cancel, Back) - Neutral Gray
 * - outline: Tertiary actions, less emphasis - White with border
 * - ghost: Minimal emphasis, inline actions - Transparent
 * - link: Link-style buttons - Primary Blue underline
 * - destructive: Delete, Remove actions - Red
 * - success: Approve, Confirm positive actions - Green
 * - warning: Caution actions - Orange
 *
 * @see docs/COLOR_SYSTEM_GUIDELINES.md for complete usage guidelines
 */

const variantStyles = {
  default:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500",
  filled:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-500 capitalize",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400",
  outline:
    "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-slate-300",
  ghost:
    "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
  link:
    "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-500",
  success:
    "bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-500",
  warning:
    "bg-orange-500 text-white hover:bg-orange-600 focus-visible:outline-orange-500",
};

const sizeStyles = {
  default: "h-10 px-4 py-2 gap-1.5",
  sm: "h-8 px-2 py-0.5 gap-1.5 min-h-8 rounded-sm",
  s: "h-8 px-2 py-0.5 gap-1.5 min-h-8 rounded-sm",
  lg: "h-11 rounded-md px-8 gap-2",
  icon: "h-10 w-10",
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(
          // Base styles: semibold font for all buttons per design system
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-label-l-semibold font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant] ?? variantStyles.default,
          sizeStyles[size] ?? sizeStyles.default,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
