// components/ui/label.tsx
import React, { ReactNode } from "react";

interface LabelProps {
  children: ReactNode;
  htmlFor: string;
}

export const Label = ({ children, ...props }: LabelProps) => {
  return (
    <label className="text-slate-100 font-medium" {...props}>
      {children}
    </label>
  );
};
