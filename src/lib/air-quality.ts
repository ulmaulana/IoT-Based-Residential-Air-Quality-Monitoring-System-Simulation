import type { AirQualityRow, AirStatus, TelemetryPoint } from "@/types/air-quality";

export const DATASET_INTERVAL_MS = 3000;

export function getAirStatus(row: Pick<AirQualityRow, "temperature" | "humidity" | "gasPPM">): AirStatus {
  if (row.gasPPM > 700 || row.temperature > 35 || row.humidity > 80) {
    return "BAHAYA";
  }

  if (row.gasPPM > 400 || row.temperature > 30 || row.humidity > 70) {
    return "WASPADA";
  }

  return "BAIK";
}

export function statusStyles(status: AirStatus) {
  if (status === "BAHAYA") {
    return {
      label: "Bahaya",
      text: "text-[var(--semantic-error)]",
      surface: "bg-[#fff1f3]",
      border: "border-[var(--hairline)]",
      dot: "bg-[var(--semantic-error)]",
      chart: "#cf2d56",
    };
  }

  if (status === "WASPADA") {
    return {
      label: "Waspada",
      text: "text-[var(--primary)]",
      surface: "bg-[#fff4eb]",
      border: "border-[var(--hairline)]",
      dot: "bg-[var(--primary)]",
      chart: "#f54e00",
    };
  }

  return {
    label: "Baik",
    text: "text-[var(--semantic-success)]",
    surface: "bg-[#ecf7f2]",
    border: "border-[var(--hairline)]",
    dot: "bg-[var(--semantic-success)]",
    chart: "#1f8a65",
  };
}

export function formatNumber(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function createTelemetryPoint(
  row: AirQualityRow,
  sequence: number,
  timestamp = new Date(),
): TelemetryPoint {
  return {
    ...row,
    sequence,
    timestamp: timestamp.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    status: getAirStatus(row),
  };
}
