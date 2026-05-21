import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string;
  unit: string;
  detail: string;
  icon: LucideIcon;
};

export function MetricCard({ title, value, unit, detail, icon: Icon }: MetricCardProps) {
  return (
    <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{title}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[30px] font-normal leading-none tracking-[-0.5px] text-[var(--ink)]">{value}</span>
            <span className="text-sm font-medium text-[var(--body)]">{unit}</span>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] p-2 text-[var(--primary)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-5 text-[var(--body)]">{detail}</p>
    </section>
  );
}
