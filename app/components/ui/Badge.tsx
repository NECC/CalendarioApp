import * as React from "react";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline";
  color?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors",
          variant === "default" ? "bg-accent/10 text-accent" : "border border-border",
          className
        )}
        style={color ? { backgroundColor: color, color: 'inherit' } : undefined}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, cn };
