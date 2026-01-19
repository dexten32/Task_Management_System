// components/ui/input.tsx
import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      {...props}
      className={` rounded-md p-2 w-full ${className} text-gray-800 focus:outline-none border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
    />
  );
};
