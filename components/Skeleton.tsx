export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Skeleton className="mx-auto h-28 w-28 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="mx-auto h-3 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[false, true, false, true].map((isMe, index) => (
        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-10 rounded-2xl ${isMe ? 'w-44' : 'w-56'}`} />
        </div>
      ))}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="flex h-screen flex-col md:flex-row">
        <Skeleton className="h-72 shrink-0 rounded-none md:h-full md:flex-1" />
        <div className="w-full space-y-6 bg-white p-5 md:w-90">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
