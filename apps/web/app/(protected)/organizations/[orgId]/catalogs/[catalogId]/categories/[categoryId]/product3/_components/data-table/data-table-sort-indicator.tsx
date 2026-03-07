"use client"

import { ArrowDown, ArrowUp, X } from "lucide-react"
import { type SortingState } from "@tanstack/react-table"
import { Badge } from "@repo/ui/components/badge"

interface DataTableSortIndicatorProps {
  sorting: SortingState
  onClear: () => void
}

export function DataTableSortIndicator({
  sorting,
  onClear,
}: DataTableSortIndicatorProps) {
  if (sorting.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {sorting.map((sort) => (
        <Badge
          key={sort.id}
          variant="secondary"
          className="gap-1.5 rounded-md py-1 pl-2.5 pr-1 text-xs font-normal"
        >
          <span className="font-semibold uppercase tracking-wide text-primary">
            Sorted by
          </span>
          <span className="capitalize">{sort.id}</span>
          {sort.desc ? (
            <ArrowDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ArrowUp className="h-3 w-3 text-muted-foreground" />
          )}
          <button
            onClick={onClear}
            className="ml-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
