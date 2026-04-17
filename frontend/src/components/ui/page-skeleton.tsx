import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <div className="space-y-6 w-full p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>
      
      {/* Table / Content Area Skeleton */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex gap-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full hidden md:block" />
          <Skeleton className="h-6 w-full hidden lg:block" />
          <Skeleton className="h-6 w-full" />
        </div>
        
        {/* Table Rows */}
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full hidden md:block" />
              <Skeleton className="h-12 w-full hidden lg:block" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        ))}
      </div>
      
      {/* Middle Section Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-[300px]">
          <Skeleton className="h-6 w-[150px] mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 h-[300px]">
           <Skeleton className="h-6 w-[150px] mb-6" />
          <div className="space-y-4 flex flex-col items-center justify-center h-full pb-10">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
