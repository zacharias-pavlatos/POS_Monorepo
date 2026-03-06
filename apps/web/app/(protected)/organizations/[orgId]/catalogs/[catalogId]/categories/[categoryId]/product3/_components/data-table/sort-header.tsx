import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { type Column } from "@tanstack/react-table"
import { Button } from "@repo/ui/components/button"

interface SortHeaderProps<TData> {
  column: Column<TData>
  children: React.ReactNode
}

export function SortHeader<TData>({
  column,
  children,
}: SortHeaderProps<TData>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </Button>
  )
}
