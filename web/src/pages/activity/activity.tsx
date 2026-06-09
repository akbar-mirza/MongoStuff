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
} from "@heroui/react";
import {
  Activity,
  ArrowUpFromLine,
  BarChart3,
  Cable,
  CalendarDays,
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
import { Link } from "react-router-dom";
import { useAnalyticsStore } from "../../stores/analytics.store";
import { useCostRatesStore } from "../../stores/costRates.store";
import StatCard from "../../components/analytics/statCard";
import SectionHeader from "../../components/analytics/sectionHeader";
import RateSettings from "../../components/analytics/rateSettings";
import {
  ConnectionStorageChart,
  MonthlyActivityChart,
  StorageGrowthChart,
} from "../../components/analytics/charts";
import {
  egressCost,
  formatBytes,
  formatCost,
  formatRuns,
  storageCost,
} from "../../components/analytics/format";
import EmptyState from "../../components/emptyState";

const timeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const statusColor = (
  status: string
): "success" | "danger" | "warning" | "default" => {
  if (status === "Success") return "success";
  if (status === "Failed") return "danger";
  if (status === "Running" || status === "Processing" || status === "Queued")
    return "warning";
  return "default";
};

export default function ActivityPage() {
  const { overview, isLoadingOverview, getOverviewAnalytics } =
    useAnalyticsStore();
  const { storageRatePerGBMonth, egressRatePerGB } = useCostRatesStore();

  useEffect(() => {
    getOverviewAnalytics();
  }, [getOverviewAnalytics]);

  if (isLoadingOverview && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner label="Loading analytics..." />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6">
        <EmptyState
          Icon={<BarChart3 className="w-12 h-12 text-default-400" />}
          Title="No analytics available"
          Description="Add a connection and run backups or snapshots to see analytics."
        />
      </div>
    );
  }

  const { actual, projections } = overview;

  const monthlyTransferCost = egressCost(
    projections.totals.monthlyTransferBytes,
    egressRatePerGB
  );
  const projectedStorageCost = storageCost(
    projections.totals.projectedStorageBytes,
    storageRatePerGBMonth
  );
  const totalMonthlyCost = monthlyTransferCost + projectedStorageCost;

  const storageChartData = actual.perConnection.map((conn) => ({
    name: conn.name || conn.connectionID,
    storageBytes: conn.storageBytes,
  }));

  return (
    <div className="px-6 space-y-6 pb-10 pt-4">
      {/* ====== Section 1: Actual On-System Metrics ====== */}
      <SectionHeader
        icon={Gauge}
        title="Actual Metrics"
        description="Measured on-system data across all connections"
        badge="On-System"
        badgeColor="success"
        endContent={
          <Button
            size="sm"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            isLoading={isLoadingOverview}
            onPress={() => getOverviewAnalytics()}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Cable}
          label="Connections"
          value={String(actual.connections)}
          tone="primary"
        />
        <StatCard
          icon={HardDrive}
          label="Total Backups"
          value={String(actual.backups)}
          tone="secondary"
        />
        <StatCard
          icon={Camera}
          label="Total Snapshots"
          value={String(actual.snapshots)}
          tone="warning"
        />
        <StatCard
          icon={Database}
          label="Total Storage Usage"
          value={formatBytes(actual.storageBytes)}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Backups This Month"
          value={String(actual.thisMonthBackups)}
          tone="primary"
        />
        <StatCard
          icon={CalendarDays}
          label="Snapshots This Month"
          value={String(actual.thisMonthSnapshots)}
          tone="secondary"
        />
        <StatCard
          icon={CalendarDays}
          label="Data Created This Month"
          value={formatBytes(actual.thisMonthBytes)}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-default-200/50 bg-background/50 backdrop-blur-sm">
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

        <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex items-center gap-3 pb-3">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-foreground">
              Recent Activity
            </h3>
          </CardHeader>
          <Divider />
          <CardBody className="pt-2 overflow-y-auto max-h-72">
            {actual.recentActivity.length === 0 ? (
              <p className="text-sm text-default-400 py-4 text-center">
                No recent backups or snapshots
              </p>
            ) : (
              <div className="flex flex-col">
                {actual.recentActivity.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-3 py-2 border-b border-default-100/50 last:border-b-0"
                  >
                    <div className="p-1.5 bg-default-100/50 rounded">
                      {item.type === "backup" ? (
                        <HardDrive className="w-4 h-4 text-primary-600" />
                      ) : (
                        <Camera className="w-4 h-4 text-secondary-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.type === "backup" ? "Backup" : "Snapshot"}
                        {item.connectionName && (
                          <span className="text-default-500">
                            {" "}
                            · {item.connectionName}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-default-400 truncate">
                        {timeAgo(item.timestamp)}
                        {item.sizeBytes > 0 &&
                          ` · ${formatBytes(item.sizeBytes)}`}
                        {item.detail && ` · ${item.detail}`}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={statusColor(item.status)}
                    >
                      {item.status}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="flex items-center gap-3 pb-3">
          <Database className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-foreground">
            Storage Usage By Connection
          </h3>
        </CardHeader>
        <Divider />
        <CardBody className="pt-4">
          {storageChartData.length === 0 ? (
            <p className="text-sm text-default-400 py-4 text-center">
              No connections yet
            </p>
          ) : (
            <ConnectionStorageChart data={storageChartData} />
          )}
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
            Per-Connection Breakdown
          </h3>
        </CardHeader>
        <Divider />
        <CardBody className="pt-2">
          <Table
            aria-label="Per-connection analytics breakdown"
            removeWrapper
            classNames={{ th: "bg-transparent" }}
          >
            <TableHeader>
              <TableColumn>CONNECTION</TableColumn>
              <TableColumn>BACKUPS</TableColumn>
              <TableColumn>SNAPSHOTS</TableColumn>
              <TableColumn>CURRENT STORAGE</TableColumn>
              <TableColumn>ACTIVE POLICIES</TableColumn>
              <TableColumn>TRANSFER / MO</TableColumn>
              <TableColumn>PROJECTED STORAGE</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No connections yet">
              {projections.perConnection.map((conn) => {
                const transferCost = egressCost(
                  conn.monthlyTransferBytes,
                  egressRatePerGB
                );
                const connStorageCost = storageCost(
                  conn.projectedStorageBytes,
                  storageRatePerGBMonth
                );
                return (
                  <TableRow key={conn.connectionID}>
                    <TableCell>
                      <Link
                        to={`/connection/${conn.connectionID}?tab=analytics`}
                        className="font-medium text-primary-500 hover:underline"
                      >
                        {conn.name || conn.connectionID}
                      </Link>
                    </TableCell>
                    <TableCell>{conn.backups}</TableCell>
                    <TableCell>{conn.snapshots}</TableCell>
                    <TableCell>{formatBytes(conn.storageBytes)}</TableCell>
                    <TableCell>{conn.activePolicies}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatBytes(conn.monthlyTransferBytes)}</span>
                        <span className="text-xs text-default-400">
                          ~{formatCost(transferCost)}/mo
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatBytes(conn.projectedStorageBytes)}</span>
                        <span className="text-xs text-default-400">
                          ~{formatCost(connStorageCost)}/mo
                        </span>
                      </div>
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
