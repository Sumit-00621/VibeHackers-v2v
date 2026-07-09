import { Skeleton } from "./ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="pt-4 flex justify-between items-center">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}
