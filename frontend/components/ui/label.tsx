// components/ui/label.tsx
import React, { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/util";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
}

export const Label = ({ children, className, ...props }: LabelProps) => {
  return (
    <label
      className={cn("text-slate-100 font-medium", className)}
      {...props}
    >
      {children}
    </label>
  );
};
