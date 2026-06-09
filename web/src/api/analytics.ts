/**
 * Analytics API Handler Functions
 *
 * Corresponds to src/controllers/analytics.controller.go
 *
 * - GetConnectionAnalyticsRequest: actual metrics + projections for one connection
 * - GetOverviewAnalyticsRequest: aggregate metrics + projections across all connections
 */

import { Get, TErrorResp } from ".";

export type TBackupStats = {
  total: number;
  success: number;
  failed: number;
  storedBytes: number;
  avgSizeBytes: number;
  avgDurationMs: number;
};

export type TSnapshotStats = {
  total: number;
  success: number;
  failed: number;
  storedBytes: number;
};

export type TMonthlyPoint = {
  month: string; // YYYY-MM
  backupBytes: number;
  snapshotBytes: number;
  backupCount: number;
  snapshotCount: number;
};

export type TPolicyProjection = {
  backupPolicyID: string;
  name: string;
  status: string;
  interval: number;
  timeUnit: string;
  retentionDays: number;
  runsPerMonth: number;
  avgBackupBytes: number;
  currentStoredBytes: number;
  monthlyTransferBytes: number;
  projectedStorageBytes: number;
  steadyStateBytes: number; // 0 = unbounded growth (no retention)
  hasSizeData: boolean;
};

export type TGrowthPoint = {
  month: string; // YYYY-MM
  storageBytes: number;
};

export type TProjectionTotals = {
  activePolicies: number;
  runsPerMonth: number;
  monthlyTransferBytes: number;
  projectedStorageBytes: number;
};

export type TConnectionAnalytics = {
  actual: {
    backups: TBackupStats;
    snapshots: TSnapshotStats;
    currentStorageBytes: number;
    monthlySeries: TMonthlyPoint[];
  };
  projections: {
    policies: TPolicyProjection[];
    totals: TProjectionTotals;
    growthSeries: TGrowthPoint[];
  };
};

export type TConnectionSummary = {
  connectionID: string;
  name: string;
  backups: number;
  snapshots: number;
  storageBytes: number;
  activePolicies: number;
  monthlyTransferBytes: number;
  projectedStorageBytes: number;
};

export type TActivityItem = {
  type: "backup" | "snapshot";
  id: string;
  connectionID: string;
  connectionName: string;
  status: string;
  timestamp: number;
  sizeBytes: number;
  detail: string;
};

export type TOverviewAnalytics = {
  actual: {
    connections: number;
    backups: number;
    snapshots: number;
    storageBytes: number;
    thisMonthBackups: number;
    thisMonthSnapshots: number;
    thisMonthBytes: number;
    perConnection: TConnectionSummary[];
    recentActivity: TActivityItem[];
    monthlySeries: TMonthlyPoint[];
  };
  projections: {
    totals: TProjectionTotals;
    perConnection: TConnectionSummary[];
    growthSeries: TGrowthPoint[];
  };
};

const GetConnectionAnalyticsRequest = async (connectionID: string) => {
  const [response, error] = await Get<
    { analytics: TConnectionAnalytics },
    TErrorResp
  >(`analytics/${connectionID}`);
  return { analytics: response?.analytics, error };
};

const GetOverviewAnalyticsRequest = async () => {
  const [response, error] = await Get<
    { analytics: TOverviewAnalytics },
    TErrorResp
  >(`analytics/overview`);
  return { analytics: response?.analytics, error };
};

const AnalyticsAPI = {
  GetConnectionAnalyticsRequest,
  GetOverviewAnalyticsRequest,
};

export default AnalyticsAPI;
