import { cn } from "@/lib/utils";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Base skeleton component
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <ShadcnSkeleton
      data-testid="skeleton"
      className={cn("animate-pulse", className)}
      {...props}
    />
  );
}

// Card skeleton for kanban cards
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 space-y-3",
        className
      )}
    >
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

// Column skeleton for kanban columns
export function ColumnSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-72 rounded-lg border border-border bg-muted/50 p-3 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-6 rounded-full" />
      </div>
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

// Board skeleton for the entire kanban board
export function BoardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  );
}

// Sidebar skeleton
export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4", className)}>
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === 0 ? "w-1/3" : "w-1/6")}
        />
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0 divide-y divide-border", className)}>
      {/* Header */}
      <TableRowSkeleton columns={columns} className="font-medium" />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}

// Page skeleton
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      <TableSkeleton />
    </div>
  );
}

// Dashboard widget skeleton
export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
