export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-4 pt-20">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-56 rounded-md bg-muted" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
          <div className="h-44 rounded-xl bg-muted" />
          <div className="h-44 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
