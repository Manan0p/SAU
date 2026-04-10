import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#E0E3E5] bg-[#F7F9FB] px-4 py-2 text-sm text-[#191C1E] placeholder:text-[#C2C6D4]",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#005EB8]/30 focus:border-[#005EB8]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
