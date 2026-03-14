import { Skeleton } from "@/components/ui/skeleton";

/* ─── Reusable skeleton atoms ─── */
function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-border p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTableRows({ cols = 6, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="bg-white border border-border">
      <div className="px-5 py-3 border-b border-border flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-3.5 border-b border-border last:border-0 flex items-center gap-6">
          <div className="flex items-center gap-3 w-40">
            <Skeleton className="w-7 h-7" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className="h-3 w-16" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonHeader({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-40" />
      {hasButton && <Skeleton className="h-9 w-32" />}
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/* ─── Page-level skeletons ─── */

export function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <SkeletonHeader />
      <SkeletonStatCards count={4} />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border">
            <Skeleton className="h-3 w-32" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 border-b border-border last:border-0 flex items-center gap-3">
              <Skeleton className="w-8 h-8" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-border p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2">
              <Skeleton className="w-1.5 h-1.5 mt-1.5" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <SkeletonTableRows cols={6} rows={4} />
    </div>
  );
}

export function EmployeesSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <SkeletonHeader />
      <SkeletonTableRows cols={7} rows={6} />
    </div>
  );
}

export function SessionsSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <SkeletonHeader />
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>
      <SkeletonTableRows cols={7} rows={6} />
    </div>
  );
}

export function KnowledgeBaseSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <SkeletonHeader hasButton={false} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-1 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <SkeletonHeader hasButton={false} />
      <SkeletonTableRows cols={6} rows={5} />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <SkeletonHeader hasButton={false} />
      <SkeletonStatCards count={4} />
      <div className="bg-white border border-border p-6 space-y-4">
        <Skeleton className="h-3 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-1 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExportsSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <SkeletonHeader hasButton={false} />
      <div className="grid md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-border p-5 space-y-2">
            <Skeleton className="w-9 h-9" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 border-b border-border last:border-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <SkeletonStatCards count={4} />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-border p-5 space-y-4">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonSection />
          <SkeletonSection />
        </div>
      </div>
    </div>
  );
}

export function EmployeeDetailSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <SkeletonStatCards count={4} />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border">
          <div className="px-5 py-3.5 border-b border-border">
            <Skeleton className="h-3 w-20" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 border-b border-border last:border-0 space-y-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-24" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonSection />
          <SkeletonSection />
        </div>
      </div>
    </div>
  );
}

export function ReportDetailSkeleton() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="bg-white border border-border p-8 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-3 w-40" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryDetailSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="bg-white border border-border p-5 flex items-center gap-4">
        <Skeleton className="w-9 h-9" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-2 w-64" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TranscriptReviewSkeleton() {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
      <div className="w-80 border-l border-border p-5 space-y-5">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
        <Skeleton className="h-3 w-32 mt-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-border p-3 space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewSessionSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Skeleton className="h-6 w-40" />
      <div className="bg-white border border-border p-6 space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-3 flex items-center gap-3">
              <Skeleton className="w-9 h-9" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-border p-6 space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-3 space-y-2">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsFormSkeleton() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-64" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

export function SettingsToggleSkeleton() {
  return (
    <div className="bg-white border border-border p-6 space-y-4">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-64" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="w-9 h-5" />
        </div>
      ))}
    </div>
  );
}
