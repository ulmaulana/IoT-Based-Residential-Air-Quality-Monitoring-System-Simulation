export type AirQualityRow = {
  index: number;
  temperature: number;
  humidity: number;
  gasPPM: number;
  lightLux: number;
};

export type AirStatus = "BAIK" | "WASPADA" | "BAHAYA";

export type TelemetryPoint = AirQualityRow & {
  sequence: number;
  timestamp: string;
  status: AirStatus;
};
