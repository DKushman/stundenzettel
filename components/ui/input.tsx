import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Große, antappbare Eingabefelder (min. 52px Höhe, 16px Schrift gegen iOS-Zoom). */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-[52px] w-full rounded-xl border border-line bg-card px-4 text-base",
        "placeholder:text-ink-faint shadow-card",
        "focus:border-ink focus:outline-none",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
