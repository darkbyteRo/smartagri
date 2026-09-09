import * as React from "react"
import { cn } from "@/lib/utils"

export interface DataLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
}

export function DataLabel({ label, value, className, ...props }: DataLabelProps) {
  return (
    <div className={cn("flex flex-col space-y-1", className)} {...props}>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  )
}
