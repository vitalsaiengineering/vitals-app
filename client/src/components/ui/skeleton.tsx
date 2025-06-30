import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
}

// Specific skeleton components for different report layouts
export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      
      {/* Chart skeleton */}
      <Skeleton className="h-80" />
      
      {/* Insights skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Table skeleton for reports with tables
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((j) => (
            <Skeleton key={j} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart-specific skeleton
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

// KPI Cards skeleton
export function KPICardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

// Left side filter panel skeleton
export function FilterSidebarSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" /> {/* Filter icon */}
            <Skeleton className="h-6 w-16" /> {/* "Filters" title */}
          </div>
          <Skeleton className="h-8 w-8 rounded" /> {/* Reset button */}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" /> {/* Calendar icon */}
            <Skeleton className="h-4 w-20" /> {/* "Date Range" label */}
          </div>
          <Skeleton className="h-10 w-full" /> {/* Select dropdown */}
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Advisor Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" /> {/* Users icon */}
            <Skeleton className="h-4 w-16" /> {/* "Advisor" label */}
          </div>
          <Skeleton className="h-10 w-full" /> {/* Select dropdown */}
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Client Segment Filter */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" /> {/* Target icon */}
            <Skeleton className="h-4 w-24" /> {/* "Client Segment" label */}
          </div>
          <Skeleton className="h-10 w-full" /> {/* Select dropdown */}
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="p-4 border-t border-border space-y-2">
        <Skeleton className="h-3 w-20" /> {/* "Active Filters:" label */}
        <div className="flex flex-wrap gap-1">
          <Skeleton className="h-6 w-16 rounded-full" /> {/* Badge 1 */}
          <Skeleton className="h-6 w-20 rounded-full" /> {/* Badge 2 */}
        </div>
      </div>
    </div>
  );
}

// For reports with filters and search
export function FilteredReportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* KPI Cards */}
      <KPICardsSkeleton />

      {/* Chart and Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
