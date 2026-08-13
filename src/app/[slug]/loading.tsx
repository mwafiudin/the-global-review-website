export default function ArticleLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 md:py-20 lg:px-6">
      <div className="grid gap-14 lg:grid-cols-[1fr_320px]">
        <div className="animate-pulse">
          <div className="h-3 w-24 rounded bg-surface" />
          <div className="mt-5 space-y-3">
            <div className="h-9 w-full rounded bg-surface" />
            <div className="h-9 w-4/5 rounded bg-surface" />
          </div>
          <div className="mt-6 h-4 w-56 rounded bg-surface" />
          <div className="mt-8 aspect-video w-full rounded-xl bg-surface" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 rounded bg-surface"
                style={{ width: `${88 - (i % 3) * 12}%` }}
              />
            ))}
          </div>
        </div>
        <div className="hidden animate-pulse space-y-4 lg:block">
          <div className="h-3 w-28 rounded bg-surface" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
