import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{value: string; onValueChange: (v: string) => void} | null>(null);

export function Tabs({ defaultValue, value, onValueChange, children, className }: any) {
  const [stateValue, setStateValue] = React.useState(defaultValue);
  const currentValue = value !== undefined ? value : stateValue;
  const changeHandler = onValueChange || setStateValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: changeHandler }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: any) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: any) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;
  return (
    <button
      type="button"
      onClick={() => context?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: any) {
  const context = React.useContext(TabsContext);
  if (context?.value !== value) return null;
  return <div className={cn("mt-2 ring-offset-white focus-visible:outline-none animate-in fade-in duration-300", className)}>{children}</div>
}