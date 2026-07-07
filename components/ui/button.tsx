import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        // Dunkle Karte aus dem Screenshot ("Formular-Link kopieren")
        primary: "bg-ink text-white hover:bg-black",
        // Helle Karte ("Formular-Vorschau öffnen")
        secondary: "bg-card border border-line text-ink hover:bg-surface shadow-card",
        ghost: "text-ink-soft hover:bg-line/60 hover:text-ink",
        danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
      },
      size: {
        // Daumenfreundlich: min. 48px Höhe auf Mobil
        default: "h-12 px-5 text-[15px]",
        lg: "h-14 px-6 text-base",
        sm: "h-9 px-3 text-sm",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
