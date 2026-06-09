import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import {
  Activity,
  ArrowUpFromLine,
  BarChart3,
  Camera,
  CircleDollarSign,
  Database,
  Gauge,
  HardDrive,
  Info,
  LineChart,
  RefreshCw,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAnalyticsStore } from "../../../stores/analytics.store";
import { useCostRatesStore } from "../../../stores/costRates.store";
import StatCard from "../../../components/analytics/statCard";
import SectionHeader from "../../../components/analytics/sectionHeader";
import RateSettings from "../../../components/analytics/rateSettings";
import {
  MonthlyActivityChart,
  StorageGrowthChart,
} from "../../../components/analytics/charts";
import {
  egressCost,
  formatBytes,
  formatCost,
  formatDuration,
  formatInterval,
  formatRuns,
  storageCost,
} from "../../../components/analytics/format";
import EmptyState from "../../../components/emptyState";

export default function ConnectionAnalytics() {
  const { connectionAnalytics, isLoadingConnection, getConnectionAnalytics } =
    useAnalyticsStore();
  const { storageRatePerGBMonth, egressRatePerGB } = useCostRatesStore();
  const { id } = useParams();

  useEffect(() => {
    if (id) getConnectionAnalytics(id);
  }, [id, getConnectionAnalytics]);

  if (isLoadingConnection && !connectionAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner label="Loading analytics..." />
      </div>
    );
  }

  if (!connectionAnalytics) {
    return (
      <EmptyState
        Icon={<BarChart3 className="w-12 h-12 text-default-400" />}
        Title="No analytics available"
        Description="Analytics will appear once backups or snapshots exist for this connection."
      />
    );
  }

  const { actual, projections } = connectionAnalytics;

  const monthlyTransferCost = egressCost(
    projections.totals.monthlyTransferBytes,
    egressRatePerGB
  );
  const projectedStorageCost = storageCost(
    projections.totals.projectedStorageBytes,
    storageRatePerGBMonth
  );
  const totalMonthlyCost = monthlyTransferCost + projectedStorageCost;

  return (
    <div className="space-y-6 pb-10">
      {/* ====== Section 1: Actual On-System Metrics ====== */}
      <SectionHeader
        icon={Gauge}
        title="Actual Metrics"
        description="Measured on-system data for this connection"
        badge="On-System"
        badgeColor="success"
        endContent={
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            isLoading={isLoadingConnection}
            onPress={() => id && getConnectionAnalytics(id)}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={HardDrive}
          label="Backups"
          value={String(actual.backups.total)}
          sub={`${actual.backups.success} success / ${actual.backups.failed} failed`}
          tone="primary"
        />
        <StatCard
          icon={Camera}
          label="Snapshots"
          value={String(actual.snapshots.total)}
          sub={`${actual.snapshots.success} success / ${actual.snapshots.failed} failed`}
          tone="secondary"
        />
        <StatCard
          icon={Database}
          label="Current Storage Usage"
          value={formatBytes(actual.currentStorageBytes)}
          sub={`${formatBytes(actual.backups.storedBytes)} backups + ${formatBytes(actual.snapshots.storedBytes)} snapshots`}
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Avg Backup Size"
          value={formatBytes(actual.backups.avgSizeBytes)}
          sub={`Avg duration ${formatDuration(actual.backups.avgDurationMs)}`}
          tone="warning"
        />
      </div>

      <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex items-center gap-3 pb-3">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-foreground">
            Data Created Per Month
          </h3>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          <MonthlyActivityChart data={actual.monthlySeries} />
        </CardBody>
      </Card>

      {/* ====== Section 2: Future Projections ====== */}
      <SectionHeader
        icon={TrendingUp}
        title="Future Projections"
        description="Estimated data transfer & storage cost based on active backup policies"
        badge="Estimates"
        badgeColor="warning"
        endContent={<RateSettings />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ArrowUpFromLine}
          label="Data Transfer Out / Month"
          value={formatBytes(projections.totals.monthlyTransferBytes)}
          sub={`~${formatCost(monthlyTransferCost)}/mo egress`}
          tone="warning"
        />
        <StatCard
          icon={Database}
          label="Projected Storage (1 mo)"
          value={formatBytes(projections.totals.projectedStorageBytes)}
          sub={`~${formatCost(projectedStorageCost)}/mo storage`}
          tone="primary"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Est. Monthly Cost"
          value={formatCost(totalMonthlyCost)}
          sub="Storage + data transfer"
          tone="danger"
        />
        <StatCard
          icon={Repeat}
          label="Scheduled Runs / Month"
          value={formatRuns(projections.totals.runsPerMonth)}
          sub={`${projections.totals.activePolicies} active ${projections.totals.activePolicies === 1 ? "policy" : "policies"}`}
          tone="secondary"
        />
      </div>

      <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex items-center gap-3 pb-3">
          <LineChart className="w-5 h-5 text-warning-600" />
          <h3 className="text-lg font-semibold text-foreground">
            Projected Storage Growth
          </h3>
          <Chip size="sm" variant="flat" color="warning">
            Next 3 months
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          <StorageGrowthChart data={projections.growthSeries} />
        </CardBody>
      </Card>

      <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex items-center gap-3 pb-3">
          <TrendingUp className="w-5 h-5 text-warning-600" />
          <h3 className="text-lg font-semibold text-foreground">
            Per-Policy Projections
          </h3>
        </CardHeader>
        <Divider />
        <CardBody className="pt-2">
          <Table
            aria-label="Backup policy projections"
            removeWrapper
            classNames={{ th: "bg-transparent" }}
          >
            <TableHeader>
              <TableColumn>POLICY</TableColumn>
              <TableColumn>SCHEDULE</TableColumn>
              <TableColumn>AVG SIZE</TableColumn>
              <TableColumn>RUNS / MO</TableColumn>
              <TableColumn>TRANSFER / MO</TableColumn>
              <TableColumn>PROJECTED STORAGE</TableColumn>
              <TableColumn>RETENTION</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No backup policies for this connection">
              {projections.policies.map((policy) => {
                const transferCost = egressCost(
                  policy.monthlyTransferBytes,
                  egressRatePerGB
                );
                const policyStorageCost = storageCost(
                  policy.projectedStorageBytes,
                  storageRatePerGBMonth
                );
                return (
                  <TableRow key={policy.backupPolicyID}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {policy.name}
                        </span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            policy.status === "Active" ? "success" : "default"
                          }
                        >
                          {policy.status}
                        </Chip>
                        {!policy.hasSizeData && (
                          <Tooltip content="No sized backups yet — estimate uses connection-wide average">
                            <Chip
                              size="sm"
                              variant="flat"
                              color="warning"
                              startContent={<Info className="w-3 h-3" />}
                            >
                              Low confidence
                            </Chip>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatInterval(policy.interval, policy.timeUnit)}
                    </TableCell>
                    <TableCell>{formatBytes(policy.avgBackupBytes)}</TableCell>
                    <TableCell>{formatRuns(policy.runsPerMonth)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatBytes(policy.monthlyTransferBytes)}</span>
                        <span className="text-xs text-default-400">
                          ~{formatCost(transferCost)}/mo
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatBytes(policy.projectedStorageBytes)}
                          {policy.steadyStateBytes === 0 &&
                            policy.status === "Active" && (
                              <span className="text-xs text-warning-500 ml-1">
                                (unbounded)
                              </span>
                            )}
                        </span>
                        <span className="text-xs text-default-400">
                          ~{formatCost(policyStorageCost)}/mo
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {policy.retentionDays > 0
                        ? `${policy.retentionDays} days`
                        : "None"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-default-400 mt-3 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Projections assume each backup reads the full dataset from the
            source database (vendor egress billing). Rates: $
            {storageRatePerGBMonth}/GB-mo storage, ${egressRatePerGB}/GB
            transfer.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
