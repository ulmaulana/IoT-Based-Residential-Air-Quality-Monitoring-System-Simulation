"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import {
  DATASET_INTERVAL_MS,
  createTelemetryPoint,
  formatNumber,
  statusStyles,
} from "@/lib/air-quality";
import type { AirQualityRow, TelemetryPoint } from "@/types/air-quality";

const speedOptions = [
  { label: "1x", value: DATASET_INTERVAL_MS },
  { label: "2x", value: 1500 },
  { label: "4x", value: 750 },
];

const INITIAL_HISTORY_SIZE = 24;

const chartLines = [
  { key: "temperature", label: "Suhu", color: "#26251e" },
  { key: "humidity", label: "Kelembapan", color: "#9fbbe0" },
  { key: "gasPPM", label: "Gas PPM", color: "#f54e00" },
  { key: "lightLux", label: "Cahaya", color: "#c08532" },
] as const;

const timelineStages = [
  ["READ", "Dataset", "bg-[var(--timeline-read)] text-[var(--ink)]"],
  ["GREP", "Ambang", "bg-[var(--timeline-grep)] text-[var(--ink)]"],
  ["EDIT", "Loop", "bg-[var(--timeline-edit)] text-[var(--ink)]"],
  ["DONE", "Render", "bg-[var(--timeline-done)] text-white"],
] as const;

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 260;
const CHART_TOP = 8;
const CHART_DRAW_HEIGHT = CHART_HEIGHT - CHART_TOP * 2;
const CHART_BOTTOM = CHART_TOP + CHART_DRAW_HEIGHT;
const CHART_GRID_ROWS = 4;
const CHART_GRID_COLS = 4;

function getChartPoint(data: TelemetryPoint[], key: (typeof chartLines)[number]["key"], index: number) {
  if (data.length === 0) return "";

  const values = data.map((item) => item[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const item = data[index];
  const x = data.length === 1 ? 0 : (index / (data.length - 1)) * CHART_WIDTH;
  const y = CHART_TOP + (1 - (item[key] - min) / span) * CHART_DRAW_HEIGHT;

  return { x, y };
}

function createLinePoints(data: TelemetryPoint[], key: (typeof chartLines)[number]["key"]) {
  if (data.length === 0) return "";

  return data
    .map((_, index) => {
      const point = getChartPoint(data, key, index);
      if (!point) return "";
      const { x, y } = point;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function TelemetryChart({ data }: { data: TelemetryPoint[] }) {
  const latest = data.at(-1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = hoverIndex ?? (data.length > 0 ? data.length - 1 : null);
  const activePoint = activeIndex !== null ? data[activeIndex] : undefined;
  const activeX = activeIndex !== null && data.length > 1 ? (activeIndex / (data.length - 1)) * CHART_WIDTH : 0;

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (data.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const index = Math.max(0, Math.min(data.length - 1, Math.round((x / CHART_WIDTH) * (data.length - 1))));
    setHoverIndex(index);
  }

  return (
    <div className="relative h-full w-full font-mono">
      <svg
        className="absolute inset-0 h-full w-full cursor-crosshair"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Grafik telemetry kualitas udara"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <rect x="0" y="0" width={CHART_WIDTH} height={CHART_HEIGHT} rx="10" fill="var(--canvas-soft)" />
        {Array.from({ length: CHART_GRID_ROWS - 1 }, (_, line) => {
          const y = CHART_TOP + ((line + 1) * CHART_DRAW_HEIGHT) / CHART_GRID_ROWS;
          return (
            <line
              key={`row-${line}`}
              x1="0"
              x2={CHART_WIDTH}
              y1={y}
              y2={y}
              stroke="var(--hairline)"
              strokeDasharray="5 9"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {Array.from({ length: CHART_GRID_COLS + 1 }, (_, line) => {
          const x = (line * CHART_WIDTH) / CHART_GRID_COLS;
          return (
            <line
              key={`col-${line}`}
              x1={x}
              x2={x}
              y1={CHART_TOP}
              y2={CHART_BOTTOM}
              stroke="var(--hairline-soft)"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {chartLines.map((line) => (
          <polyline
            key={line.key}
            points={createLinePoints(data, line.key)}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {activePoint ? (
          <g data-testid="chart-hover-layer">
            <line
              x1={activeX}
              x2={activeX}
              y1={CHART_TOP - 8}
              y2={CHART_BOTTOM + 8}
              stroke="var(--primary)"
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
            {chartLines.map((line) => {
              const point = getChartPoint(data, line.key, activeIndex ?? 0);
              if (!point) return null;
              return (
                <circle
                  key={line.key}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="var(--surface-card)"
                  stroke={line.color}
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>
        ) : null}
      </svg>
      {activePoint ? (
        <div
          data-testid="chart-tooltip"
          className="pointer-events-none absolute top-3 w-[230px] rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-3 text-[12px] text-[var(--body)]"
          style={{
            left: `min(max(${(activeX / CHART_WIDTH) * 100}%, 124px), calc(100% - 124px))`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline-soft)] pb-2">
            <span className="font-semibold text-[var(--ink)]">#{activePoint.sequence}</span>
            <span>{activePoint.timestamp}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            <span>Suhu</span>
            <span className="text-right text-[var(--ink)]">{formatNumber(activePoint.temperature)} C</span>
            <span>Kelembapan</span>
            <span className="text-right text-[var(--ink)]">{formatNumber(activePoint.humidity)}%</span>
            <span>Gas</span>
            <span className="text-right text-[var(--ink)]">{formatNumber(activePoint.gasPPM, 0)} ppm</span>
            <span>Cahaya</span>
            <span className="text-right text-[var(--ink)]">{formatNumber(activePoint.lightLux, 0)} lux</span>
          </div>
          <div className="mt-2 rounded-md bg-[var(--canvas-soft)] px-2 py-1 text-center font-semibold text-[var(--primary)]">
            {activePoint.status}
          </div>
        </div>
      ) : latest ? (
        <div className="absolute bottom-3 left-3 rounded-md border border-[var(--hairline)] bg-[var(--surface-card)] px-3 py-2 text-[12px] text-[var(--body)]">
          #{latest.sequence} · {latest.timestamp}
        </div>
      ) : null}
    </div>
  );
}

function trendLabel(
  history: TelemetryPoint[],
  key: keyof Pick<TelemetryPoint, "temperature" | "humidity" | "gasPPM" | "lightLux">,
) {
  if (history.length < 2) return "menunggu data";

  const latest = history.at(-1)?.[key] ?? 0;
  const previous = history.at(-2)?.[key] ?? latest;
  const delta = latest - previous;

  if (Math.abs(delta) < 0.01) return "stabil dari pembacaan sebelumnya";

  return `${delta > 0 ? "naik" : "turun"} ${formatNumber(Math.abs(delta), 2)} dari pembacaan sebelumnya`;
}

export function AirQualityDashboard() {
  const [dataset, setDataset] = useState<AirQualityRow[]>([]);
  const [cursor, setCursor] = useState(0);
  const [sequence, setSequence] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(DATASET_INTERVAL_MS);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    function createInitialHistory(rows: AirQualityRow[]) {
      const seedRows = rows.slice(0, INITIAL_HISTORY_SIZE);
      const now = Date.now();

      return seedRows.map((row, index) =>
        createTelemetryPoint(
          row,
          index + 1,
          new Date(now - (seedRows.length - index - 1) * DATASET_INTERVAL_MS),
        ),
      );
    }

    async function loadDataset() {
      try {
        const response = await fetch("/data/air-quality.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const rows = (await response.json()) as AirQualityRow[];
        if (!ignore) {
          setDataset(rows);
          if (rows.length > 0) {
            const initialHistory = createInitialHistory(rows);
            setHistory(initialHistory);
            setCursor(initialHistory.length % rows.length);
            setSequence(initialHistory.length);
          }
        }
      } catch (error) {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : "Dataset gagal dimuat");
        }
      }
    }

    loadDataset();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isRunning || dataset.length === 0) return;

    const timer = window.setInterval(() => {
      setHistory((current) => {
        const row = dataset[cursor];
        const nextSequence = sequence + 1;
        return [...current, createTelemetryPoint(row, nextSequence)].slice(-120);
      });
      setCursor((current) => (current + 1) % dataset.length);
      setSequence((current) => current + 1);
    }, speed);

    return () => window.clearInterval(timer);
  }, [cursor, dataset, isRunning, sequence, speed]);

  const current = history.at(-1);
  const status = current?.status ?? "BAIK";
  const statusTheme = statusStyles(status);
  const chartData = useMemo(() => history.slice(-40), [history]);
  const logRows = useMemo(() => history.slice(-8).reverse(), [history]);
  const progress = dataset.length > 0 ? (cursor / dataset.length) * 100 : 0;
  const StatusIcon = status === "BAIK" ? CheckCircle2 : AlertTriangle;

  function resetSimulation() {
    if (dataset.length === 0) return;

    const seedRows = dataset.slice(0, INITIAL_HISTORY_SIZE);
    const now = Date.now();
    const initialHistory = seedRows.map((row, index) =>
      createTelemetryPoint(
        row,
        index + 1,
        new Date(now - (seedRows.length - index - 1) * DATASET_INTERVAL_MS),
      ),
    );
    setCursor(initialHistory.length % dataset.length);
    setSequence(initialHistory.length);
    setHistory(initialHistory);
    setIsRunning(true);
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-6 text-[var(--ink)]">
        <section className="max-w-lg rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">Dataset tidak terbaca</p>
          <h1 className="mt-3 text-[26px] font-normal tracking-[-0.325px]">Simulasi tidak dapat dimulai</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--body)]">
            File <code className="rounded-md bg-[var(--canvas-soft)] px-1.5 py-0.5 font-mono">public/data/air-quality.json</code>{" "}
            tidak berhasil dimuat. Detail: {loadError}.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <nav className="h-16 border-b border-[var(--hairline)]">
        <div className="flex h-full items-center justify-between px-5">
          <div className="flex items-center">
            <p className="whitespace-nowrap text-lg font-semibold leading-6 tracking-[-0.2px] text-[var(--ink)] md:text-xl">
              Sistem Monitoring Kualitas Udara Perumahan Berbasis IoT
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-card)] px-3 py-2 text-xs text-[var(--body)] sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              {isRunning ? "Simulasi aktif" : "Simulasi dijeda"}
            </span>
            <button
              type="button"
              data-testid="toggle-simulation"
              onClick={() => setIsRunning((value) => !value)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--ink)] px-4 text-sm font-medium text-[var(--canvas)]"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isRunning ? "Jeda" : "Mulai"}
            </button>
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-card)] px-3 text-sm font-medium text-[var(--ink)]"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)] flex-col gap-3 overflow-hidden p-4">
        <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_260px]">
          <MetricCard
            title="Suhu"
            value={formatNumber(current?.temperature ?? 0)}
            unit="C"
            detail={trendLabel(history, "temperature")}
            icon={Thermometer}
          />
          <MetricCard
            title="Kelembapan"
            value={formatNumber(current?.humidity ?? 0)}
            unit="%"
            detail={trendLabel(history, "humidity")}
            icon={Waves}
          />
          <MetricCard
            title="Gas"
            value={formatNumber(current?.gasPPM ?? 0, 0)}
            unit="PPM"
            detail={trendLabel(history, "gasPPM")}
            icon={Wind}
          />
          <MetricCard
            title="Cahaya"
            value={formatNumber(current?.lightLux ?? 0, 0)}
            unit="lux"
            detail={trendLabel(history, "lightLux")}
            icon={Zap}
          />
          <section className="hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4 xl:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Dataset</p>
                <p className="mt-3 text-[30px] font-normal leading-none tracking-[-0.5px]">
                  {dataset.length.toLocaleString("id-ID")}
                </p>
                <p className="mt-3 text-sm text-[var(--body)]">baris data.h</p>
              </div>
              <Database className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
            </div>
          </section>
        </section>

        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-h-0 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="hidden min-h-0 border-r border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 font-mono text-[12px] text-[var(--body)] lg:block">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <Radio className="h-3.5 w-3.5" /> stream
              </div>
              <div className="space-y-2 overflow-hidden">
                {logRows.slice(0, 5).map((row) => (
                  <div key={`stream-${row.sequence}`} className="rounded-lg border border-[var(--hairline-soft)] bg-[var(--surface-card)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span>#{row.index.toLocaleString("id-ID")}</span>
                      <span className="text-[var(--muted)]">{row.timestamp}</span>
                    </div>
                    <p className="mt-2 text-[var(--ink)]">
                      gas={formatNumber(row.gasPPM, 0)} · temp={formatNumber(row.temperature)}
                    </p>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex min-h-0 min-w-0 flex-col p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {timelineStages.map(([stage, label, className]) => (
                    <span key={stage} className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${className}`}>
                      {stage} · {label}
                    </span>
                  ))}
                </div>
                <div className="flex h-9 w-fit rounded-lg border border-[var(--hairline-strong)] bg-[var(--surface-card)] p-1">
                  {speedOptions.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      data-testid={`speed-${option.label}`}
                      onClick={() => setSpeed(option.value)}
                      className={`rounded-md px-3 text-sm font-medium ${
                        speed === option.value ? "bg-[var(--primary)] text-white" : "text-[var(--body)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pb-3 text-xs text-[var(--body)]">
                {chartLines.map((line) => (
                  <span key={line.key} className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.label}
                  </span>
                ))}
              </div>

              <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--canvas-soft)]">
                <TelemetryChart data={chartData} />
              </div>
            </div>
          </div>

          <aside className="grid min-h-0 gap-3 xl:grid-rows-[auto_auto_minmax(0,1fr)]">
            <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Status Udara</p>
                  <h2 className={`mt-2 text-[32px] font-normal tracking-[-0.55px] ${statusTheme.text}`}>{status}</h2>
                </div>
                <div className={`rounded-lg border border-[var(--hairline)] bg-[var(--canvas-soft)] p-3 ${statusTheme.text}`}>
                  <StatusIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] p-4">
              <h2 className="text-base font-semibold">Ambang Klasifikasi</h2>
              <div className="mt-3 grid gap-2 font-mono text-[12px]">
                <div className="rounded-lg border border-[var(--hairline-soft)] bg-[var(--canvas-soft)] p-2">
                  <p className="font-sans text-sm font-semibold text-[var(--semantic-success)]">BAIK</p>
                  <p className="mt-1 text-[var(--body)]">gas &lt;= 400, temp &lt;= 30, rh &lt;= 70</p>
                </div>
                <div className="rounded-lg border border-[var(--hairline-soft)] bg-[var(--canvas-soft)] p-2">
                  <p className="font-sans text-sm font-semibold text-[var(--primary)]">WASPADA</p>
                  <p className="mt-1 text-[var(--body)]">gas &gt; 400 atau temp &gt; 30</p>
                </div>
                <div className="rounded-lg border border-[var(--hairline-soft)] bg-[var(--canvas-soft)] p-2">
                  <p className="font-sans text-sm font-semibold text-[var(--semantic-error)]">BAHAYA</p>
                  <p className="mt-1 text-[var(--body)]">gas &gt; 700 atau temp &gt; 35</p>
                </div>
              </div>
            </section>

            <section className="min-h-0 overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
              <div className="flex items-center justify-between border-b border-[var(--hairline)] px-4 py-3">
                <h2 className="text-base font-semibold">Log</h2>
                <span data-testid="sequence-value" className="font-mono text-sm text-[var(--body)]">
                  #{sequence.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="min-h-0 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-[var(--hairline)] bg-[var(--canvas-soft)] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-2">Waktu</th>
                      <th className="px-4 py-2">Gas</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline-soft)] font-mono text-[12px] text-[var(--body)]">
                    {logRows.map((row) => {
                      const theme = statusStyles(row.status);
                      return (
                        <tr key={`${row.sequence}-${row.index}`}>
                          <td className="px-4 py-2 text-[var(--ink)]">{row.timestamp}</td>
                          <td className="px-4 py-2">{formatNumber(row.gasPPM, 0)}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded-full px-2 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.08em] ${theme.surface} ${theme.text}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
