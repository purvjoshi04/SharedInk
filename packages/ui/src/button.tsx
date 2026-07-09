import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const buttonVariants = cva(
  "rounded-lg relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-hand text-lg whitespace-nowrap transition-all duration-200 disabled:opacity-70 cursor-pointer active:translate-y-[2px] active:shadow-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground border-2 border-black dark:border-gray-600 shadow-hand dark:shadow-hand-dark hover:bg-primary-hover hover:shadow-hand-hover dark:hover:shadow-hand-hover-dark",
        outline:
          "bg-white dark:bg-transparent text-gray-900 dark:text-white border-2 border-black dark:border-gray-600 shadow-hand dark:shadow-hand-dark hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-hand-hover dark:hover:shadow-hand-hover-dark",
        ghost:
          "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50",
        custom: "",
      },
      size: {
        default: "",
        sm: "px-4 py-2 text-base",
        lg: "px-8 py-3.5 text-lg",
        icon: "p-2.5 aspect-square",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  asChild?: boolean;
  variant?: "primary" | "outline" | "ghost" | "custom";
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size, isLoading, icon, disabled, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading}
        {!isLoading && icon}
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };