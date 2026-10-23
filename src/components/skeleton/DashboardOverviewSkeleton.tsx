import { Skeleton } from "./Skeleton";

/** KPI cards + daily journal chart placeholders (dashboard overview). */
export function DashboardOverviewSkeleton() {
  return (
    <div className="wdash-skeleton" aria-hidden>
      <div className="wdash-kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <article key={i} className="wdash-kpi wdash-skel-card">
            <div className="wdash-kpi-top">
              <Skeleton size="icon" />
              <Skeleton size="pill" />
            </div>
            <Skeleton size="label" block />
            <Skeleton size="value" block />
            <Skeleton size="spark" block />
          </article>
        ))}
      </div>
      <section className="wdash-chart-card wdash-skel-card">
        <div className="wdash-chart-head">
          <Skeleton size="title" />
          <Skeleton size="meta" />
        </div>
        <div className="wdash-bars wdash-skel-bars">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="wdash-bar-col">
              <Skeleton size="xs" />
              <Skeleton size="bar" style={{ height: `${40 + ((i * 17) % 50)}%` }} block />
              <Skeleton size="xs" />
            </div>
          ))}
        </div>
        <div className="wdash-chart-foot">
          <Skeleton size="value" />
          <Skeleton size="legend" />
        </div>
      </section>
    </div>
  );
}
