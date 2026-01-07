import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export const Select = ({ value, onValueChange, children }: any) => {
  const [open, setOpen] = React.useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = ({ className, children }: any) => {
  const context = React.useContext(SelectContext)
  return (
    <button
      type="button"
      onClick={() => context?.setOpen(!context.open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export const SelectValue = ({ placeholder, displayValue }: any) => {
  const context = React.useContext(SelectContext)
  // displayValueが指定されている場合はそれを使用、そうでなければvalueを表示
  // displayValueが関数の場合は、context.valueを引数として呼び出す
  const displayText = typeof displayValue === 'function' 
    ? displayValue(context?.value || '') 
    : (displayValue || context?.value || placeholder)
  return <span className="block truncate">{displayText}</span>
}

export const SelectContent = ({ className, children }: any) => {
  const context = React.useContext(SelectContext)
  if (!context?.open) return null
  return (
    <div
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1 bg-white max-h-[300px]",
        className
      )}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

export const SelectItem = ({ value, children, className }: any) => {
  const context = React.useContext(SelectContext)
  const isSelected = context?.value === value
  return (
    <div
      onClick={() => {
        context?.onValueChange(value)
        context?.setOpen(false)
      }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer hover:bg-slate-100",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  )
}