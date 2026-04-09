import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/25 focus-visible:ring-violet-500",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 focus-visible:ring-red-500",
        outline:
          "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 backdrop-blur-sm",
        secondary:
          "bg-slate-700 text-slate-100 hover:bg-slate-600",
        ghost:
          "text-slate-300 hover:bg-white/10 hover:text-white",
        link:
          "text-violet-400 underline-offset-4 hover:underline",
        success:
          "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 focus-visible:ring-emerald-500",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
