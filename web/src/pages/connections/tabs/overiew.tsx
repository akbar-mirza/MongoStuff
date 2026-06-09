import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Listbox,
  ListboxItem,
  Badge,
  Divider,
  Skeleton,
} from "@heroui/react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConnectionStore } from "../../../stores/connection.store";
import { useAnalyticsStore } from "../../../stores/analytics.store";
import { useCostRatesStore } from "../../../stores/costRates.store";
import ConnectionAPI from "../../../api/connection";
import { toast } from "sonner";
import {
  Database,
  Server,
  RefreshCw,
  ArrowRight,
  ArrowUpFromLine,
  BarChart3,
  Camera,
  CircleDollarSign,
  HardDrive,
  Globe,
  Info,
  Layers,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import StatCard from "../../../components/analytics/statCard";
import { MonthlyActivityChart } from "../../../components/analytics/charts";
import {
  egressCost,
  formatBytes,
  formatCost,
  storageCost,
} from "../../../components/analytics/format";

export type Props = {
  ConnectionID: string;
};

const successRate = (success: number, total: number): string => {
  if (total === 0) return "No runs yet";
  return `${Math.round((success / total) * 100)}% success rate`;
};

export default function ConnectionOverview() {
  const { connection, getConnection } = useConnectionStore();
  const { connectionAnalytics, isLoadingConnection, getConnectionAnalytics } =
    useAnalyticsStore();
  const { storageRatePerGBMonth, egressRatePerGB } = useCostRatesStore();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) getConnectionAnalytics(id);
  }, [id, getConnectionAnalytics]);

  const handleSyncConnection = async () => {
    if (!connection) return;

    const { error } = await ConnectionAPI.SyncConnectionRequest(
      connection.connectionID
    );
    if (error) {
      toast.error(error.error);
      return;
    }
    toast.success("Connection synced successfully");
    getConnection(connection.connectionID);
  };

  const actual = connectionAnalytics?.actual;
  const projections = connectionAnalytics?.projections;
  const showSkeleton = isLoadingConnection && !connectionAnalytics;

  const collectionCount =
    connection?.collections?.reduce(
      (total, db) => total + db.collections.length,
      0
    ) || 0;

  const transferBytes = projections?.totals.monthlyTransferBytes ?? 0;
  const projectedBytes = projections?.totals.projectedStorageBytes ?? 0;
  const estMonthlyCost =
    egressCost(transferBytes, egressRatePerGB) +
    storageCost(projectedBytes, storageRatePerGBMonth);

  const projectionHighlights = [
    {
      icon: ScrollText,
      label: "Active Policies",
      value: String(projections?.totals.activePolicies ?? 0),
      iconClass: "text-success-500",
    },
    {
      icon: ArrowUpFromLine,
      label: "Transfer / Month",
      value: formatBytes(transferBytes),
      iconClass: "text-primary-500",
    },
    {
      icon: TrendingUp,
      label: "Storage in 30 Days",
      value: formatBytes(projectedBytes),
      iconClass: "text-warning-500",
    },
    {
      icon: CircleDollarSign,
      label: "Est. Cost / Month",
      value: formatCost(estMonthlyCost),
      iconClass: "text-danger-500",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {connection && (
        <>
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-primary-50/10 to-secondary-50/20 border border-primary-200/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100/50 rounded-lg">
                <Database className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {connection.name}
                </h2>
                <p className="text-sm text-default-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {connection.host.includes(":")
                    ? connection.host
                    : `${connection.host}:${connection.port}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Chip
                size="sm"
                variant="flat"
                color={
                  connection.scheme === "mongodb+srv" ? "success" : "default"
                }
              >
                {connection.scheme}
              </Chip>
              <Badge color="success" variant="flat" className="text-xs">
                Online
              </Badge>
              <Button
                size="sm"
                color="default"
                variant="flat"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={handleSyncConnection}
                className="font-medium"
              >
                Sync Connection
              </Button>
            </div>
          </div>

          {/* Actual Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Database}
              label="Databases"
              value={String(connection.databases?.length ?? 0)}
              sub={`${collectionCount} collections`}
              tone="primary"
            />
            <StatCard
              icon={Layers}
              label="Storage Used"
              value={
                showSkeleton ? "—" : formatBytes(actual?.currentStorageBytes ?? 0)
              }
              sub={
                actual
                  ? `${formatBytes(actual.backups.storedBytes)} backups + ${formatBytes(actual.snapshots.storedBytes)} snapshots`
                  : undefined
              }
              tone="success"
            />
            <StatCard
              icon={HardDrive}
              label="Backups"
              value={showSkeleton ? "—" : String(actual?.backups.total ?? 0)}
              sub={
                actual
                  ? successRate(actual.backups.success, actual.backups.total)
                  : undefined
              }
              tone="secondary"
            />
            <StatCard
              icon={Camera}
              label="Snapshots"
              value={showSkeleton ? "—" : String(actual?.snapshots.total ?? 0)}
              sub={
                actual
                  ? successRate(
                      actual.snapshots.success,
                      actual.snapshots.total
                    )
                  : undefined
              }
              tone="warning"
            />
          </div>

          {/* Projections strip */}
          <Card className="border border-warning-200/30 bg-gradient-to-r from-warning-50/5 to-danger-50/5 backdrop-blur-sm">
            <CardBody className="p-4">
              <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="p-2 bg-warning-100/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Projections
                    </p>
                    <p className="text-xs text-default-400">Estimates</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  {projectionHighlights.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${item.iconClass}`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-default-500 truncate">
                          {item.label}
                        </p>
                        {showSkeleton ? (
                          <Skeleton className="rounded w-12 h-4 mt-0.5" />
                        ) : (
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  className="flex-shrink-0 font-medium"
                  endContent={<ArrowRight className="w-4 h-4" />}
                  onPress={() =>
                    navigate(
                      `/connection/${connection.connectionID}?tab=analytics`
                    )
                  }
                >
                  Full Analytics
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Activity chart */}
              <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
                <CardHeader className="flex items-center gap-3 pb-3">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Data Created Per Month
                  </h3>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4">
                  {actual ? (
                    <MonthlyActivityChart data={actual.monthlySeries} />
                  ) : (
                    <Skeleton className="rounded-lg w-full h-[260px]" />
                  )}
                </CardBody>
              </Card>

              {/* Connection Details */}
              <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
                <CardHeader className="flex items-center gap-3 pb-3">
                  <Server className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Connection Details
                  </h3>
                </CardHeader>
                <Divider />
                <CardBody className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Connection ID
                        </span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color="primary"
                          className="font-mono text-xs"
                        >
                          {connection.connectionID}
                        </Chip>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">Name</span>
                        <span className="text-sm font-medium text-foreground">
                          {connection.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">
                          Cluster
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {connection.host.split(".")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">Host</span>
                        <span className="text-sm font-medium text-foreground font-mono">
                          {connection.host}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">Port</span>
                        <span className="text-sm font-medium text-foreground">
                          {connection.port}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-default-500">
                          Protocol
                        </span>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            connection.scheme === "mongodb+srv"
                              ? "success"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {connection.scheme}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Databases List */}
            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm h-fit">
              <CardHeader className="flex items-center gap-3 pb-3">
                <HardDrive className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Databases
                </h3>
                <Badge color="primary" variant="flat" size="sm">
                  {connection.databases?.length ?? 0}
                </Badge>
              </CardHeader>
              <Divider />
              <CardBody className="pt-4 max-h-[560px] overflow-y-auto">
                <Listbox
                  className="w-full"
                  aria-label="Database list"
                  variant="flat"
                >
                  {(connection.databases ?? []).map((db, index) => (
                    <ListboxItem
                      key={index}
                      className="rounded-lg mb-1 hover:bg-default-100"
                      startContent={
                        <div className="p-1 bg-primary-100/50 rounded">
                          <Database className="w-4 h-4 text-primary-600" />
                        </div>
                      }
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {db.toUpperCase()}
                        </span>
                        <span className="text-xs text-default-500">
                          {connection.collections?.find(
                            (c) => c.database === db
                          )?.collections.length || 0}{" "}
                          collections
                        </span>
                      </div>
                    </ListboxItem>
                  ))}
                </Listbox>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
