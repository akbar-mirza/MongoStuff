const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 B";
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 100 || exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${BYTE_UNITS[exponent]}`;
};

export const bytesToGB = (bytes: number): number => bytes / 1024 ** 3;

export const formatCost = (dollars: number): string => {
  if (!dollars || dollars <= 0) return "$0.00";
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const storageCost = (bytes: number, ratePerGBMonth: number): number =>
  bytesToGB(bytes) * ratePerGBMonth;

export const egressCost = (bytes: number, ratePerGB: number): number =>
  bytesToGB(bytes) * ratePerGB;

export const formatRuns = (runs: number): string => {
  if (!runs || runs <= 0) return "0";
  if (runs >= 100) return Math.round(runs).toLocaleString();
  return runs.toFixed(1);
};

export const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return "0s";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
};

export const formatMonth = (month: string): string => {
  // "2026-06" -> "Jun 26"
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  const date = new Date(year, m - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
};

export const formatInterval = (interval: number, timeUnit: string): string => {
  if (!interval) return "-";
  const unit = interval === 1 ? timeUnit.replace(/s$/, "") : timeUnit;
  return `Every ${interval} ${unit}`;
};
