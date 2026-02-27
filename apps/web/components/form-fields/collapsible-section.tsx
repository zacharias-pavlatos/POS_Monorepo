'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/components/collapsible';

type CollapsibleSectionProps = {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({
  label,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group bg-background text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 text-xs transition-colors"
            >
              <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              {label}
            </button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <div className="mt-4 grid gap-5 p-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
