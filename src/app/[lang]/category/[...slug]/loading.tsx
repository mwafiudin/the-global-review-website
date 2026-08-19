export default function CategoryLoading() {
  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-14 md:py-20 lg:px-6">
          <div className="h-3 w-52 rounded bg-surface" />
          <div className="mt-4 h-10 w-64 rounded bg-surface" />
          <div className="mt-4 h-4 w-24 rounded bg-surface" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
          <div className="animate-pulse divide-y divide-line">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid gap-5 py-8 sm:grid-cols-[220px_1fr]">
                <div className="aspect-[3/2] w-full rounded-xl bg-surface" />
                <div className="space-y-3">
                  <div className="h-3 w-20 rounded bg-surface" />
                  <div className="h-6 w-full rounded bg-surface" />
                  <div className="h-6 w-3/4 rounded bg-surface" />
                  <div className="h-4 w-full rounded bg-surface" />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden animate-pulse space-y-4 lg:block">
            <div className="h-3 w-28 rounded bg-surface" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
