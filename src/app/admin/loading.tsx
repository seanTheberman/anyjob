export default function AdminLoading() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-600">Operations console</p>
          <div className="mt-2 h-9 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-9 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 w-full animate-pulse rounded bg-slate-200" />
          ))}
        </div>
      </section>
    </main>
  );
}
