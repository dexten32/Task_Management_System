// components/ui/card.tsx
import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={` shadow-lg rounded-lg ${className} border border-gray-300`}
    >
      {children}
    </div>
  );
};

export const CardContent = ({ children }: CardProps) => {
  return <div className="p-6 border-t border-slate-100">{children}</div>;
};

export const CardHeader = ({ children }: CardProps) => {
  return <div className="p-6 border-b border-gray-300">{children}</div>;
};

export const CardTitle = ({ children }: CardProps) => {
  return (
    <h2 className="text-xl md:text-4xl font-bold text-gray-600">{children}</h2>
  );
};
