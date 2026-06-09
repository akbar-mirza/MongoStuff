import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Skeleton,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  Activity,
  ArrowRight,
  ArrowUpFromLine,
  Camera,
  Database,
  HardDrive,
  Layers,
  LinkIcon,
  Pen,
  Plus,
  Server,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConnectionAPI, { TConnection } from "../../api/connection";
import { TConnectionSummary } from "../../api/analytics";
import { useConnectionStore } from "../../stores/connection.store";
import { useAnalyticsStore } from "../../stores/analytics.store";
import { formatBytes } from "../../components/analytics/format";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import EmptyState from "../../components/emptyState";

type ConnectionCardProps = TConnection & {
  analytics?: TConnectionSummary;
  isAnalyticsLoading?: boolean;
};

export function ConnectionCard(props: ConnectionCardProps) {
  const { analytics, isAnalyticsLoading } = props;
  const showSkeleton = Boolean(isAnalyticsLoading && !analytics);

  const getDatabaseCount = () => {
    return props.databases?.length || 0;
  };

  const getCollectionCount = () => {
    return (
      props.collections?.reduce(
        (total, db) => total + db.collections.length,
        0
      ) || 0
    );
  };

  const storageBytes = analytics?.storageBytes ?? 0;
  const projectedBytes = analytics?.projectedStorageBytes ?? 0;
  const transferBytes = analytics?.monthlyTransferBytes ?? 0;
  const activePolicies = analytics?.activePolicies ?? 0;
  const storagePct =
    projectedBytes > 0
      ? Math.min(100, (storageBytes / projectedBytes) * 100)
      : storageBytes > 0
        ? 100
        : 0;

  const statTiles: {
    icon: typeof Database;
    label: string;
    value: number;
  }[] = [
    { icon: Database, label: "Databases", value: getDatabaseCount() },
    { icon: Layers, label: "Collections", value: getCollectionCount() },
    { icon: HardDrive, label: "Backups", value: analytics?.backups ?? 0 },
    { icon: Camera, label: "Snapshots", value: analytics?.snapshots ?? 0 },
  ];

  return (
    <Card
      isPressable
      className="group relative overflow-hidden h-full flex flex-col w-full hover:-translate-y-2 transition-all duration-500 ease-out"
      shadow="sm"
      classNames={{
        base: "bg-gradient-to-br from-background/80 to-background/60 border border-default-200/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 backdrop-blur-sm",
        body: "p-0",
        header: "p-0",
      }}
    >
      <Link
        to={`/connection/${props.connectionID}`}
        className="h-full flex flex-col w-full"
      >
        {/* Header */}
        <div className="relative p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar
              isBordered
              name={props.name.slice(0, 2).toUpperCase()}
              size="md"
              className="group-hover:scale-105 transition-transform duration-300 flex-shrink-0"
            />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate max-w-full">
                {props.name}
              </h3>
              <p className="text-xs text-default-400 truncate max-w-full font-mono">
                {props.host}
              </p>
            </div>
            {showSkeleton ? (
              <Skeleton className="rounded-full w-16 h-5 flex-shrink-0" />
            ) : (
              <Chip
                size="sm"
                variant="dot"
                color={activePolicies > 0 ? "success" : "default"}
                className="flex-shrink-0 border-default-200/50"
              >
                {activePolicies > 0
                  ? `${activePolicies} ${activePolicies === 1 ? "policy" : "policies"}`
                  : "No policies"}
              </Chip>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="w-full px-4">
          <div className="grid grid-cols-2 gap-2 mb-3 w-full">
            {statTiles.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2 p-2 rounded-lg bg-content2/50 border border-divider group-hover:bg-content2 transition-colors duration-200"
              >
                <stat.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                  <p className="text-xs text-default-500 truncate">
                    {stat.label}
                  </p>
                  {showSkeleton &&
                  (stat.label === "Backups" || stat.label === "Snapshots") ? (
                    <Skeleton className="rounded w-8 h-4 mt-0.5" />
                  ) : (
                    <p className="text-md font-semibold text-foreground">
                      {stat.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Storage & projections */}
          <div className="rounded-lg bg-content2/50 border border-divider p-2.5 mb-3 space-y-2 group-hover:bg-content2 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-default-500 uppercase tracking-wide">
                Storage
              </span>
              {showSkeleton ? (
                <Skeleton className="rounded w-14 h-4" />
              ) : (
                <span className="text-sm font-semibold text-foreground">
                  {formatBytes(storageBytes)}
                </span>
              )}
            </div>
            <Progress
              aria-label="Storage vs 30-day projection"
              size="sm"
              value={showSkeleton ? 0 : storagePct}
              color={storagePct >= 90 ? "warning" : "primary"}
              classNames={{ track: "bg-default-200/50" }}
            />
            <div className="flex items-center justify-between text-xs text-default-400">
              <Tooltip
                content="Projected storage in 30 days (backup policies)"
                placement="bottom"
                showArrow
              >
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-warning-500" />
                  {showSkeleton ? "—" : `${formatBytes(projectedBytes)} in 30d`}
                </span>
              </Tooltip>
              <Tooltip
                content="Estimated data transfer out of source DB per month"
                placement="bottom"
                showArrow
              >
                <span className="flex items-center gap-1">
                  <ArrowUpFromLine className="w-3 h-3 text-primary-500" />
                  {showSkeleton ? "—" : `${formatBytes(transferBytes)}/mo`}
                </span>
              </Tooltip>
            </div>
          </div>

          {/* Database preview footer */}
          {props?.databases && props.databases.length > 0 && (
            <div className="flex items-center justify-between px-1 pb-3">
              <div className="flex items-center gap-2">
                <AvatarGroup isBordered max={5} className="justify-start">
                  {props.databases.slice(0, 5).map((db, index) => (
                    <Tooltip key={index} content={db} placement="top" showArrow>
                      <Avatar
                        isBordered
                        name={db[0].toUpperCase()}
                        size="sm"
                        className="w-6 h-6 hover:scale-105 transition-transform duration-200 text-xs"
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {props.databases.length > 5 && (
                  <Chip size="sm" variant="flat" className="text-xs">
                    +{props.databases.length - 5}
                  </Chip>
                )}
              </div>
              <ArrowRight
                size={14}
                className="text-primary group-hover:translate-x-1 transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />
      </Link>
    </Card>
  );
}

export function CreateConnectionModal(props: { RunOnSubmit: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionURI, setConnectionURI] = useState("");
  const [connectionName, setConnectionName] = useState("");

  const handleAddConnection = async () => {
    setIsLoading(true);

    const { error } = await ConnectionAPI.CreateConnectionRequest({
      uri: connectionURI.trim(),
      name: connectionName,
      userID: "admin",
    });

    if (error) {
      console.error(error);
      return;
    }

    setConnectionURI("");
    setConnectionName("");
    onOpenChange();
    props.RunOnSubmit();
    setIsLoading(false);
  };

  return (
    <>
      <Button
        size="sm"
        startContent={!isLoading && <Plus size={16} />}
        variant="solid"
        onPress={onOpen}
        isLoading={isLoading}
        className="bg-primary-50 text-white hover:bg-primary-600"
      >
        <span className="text-sm font-medium">Add Connection</span>
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        size="lg"
        classNames={{
          base: "bg-background/95 backdrop-blur-md",
          header: "border-b border-divider",
          body: "py-6",
          footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-content2 rounded-lg">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Add New Connection
                    </h2>
                    <p className="text-sm text-default-500">
                      Connect to your MongoDB database
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <Divider />
              <ModalBody className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Connection URI
                    </label>
                    <Input
                      autoFocus
                      endContent={
                        <LinkIcon
                          size={20}
                          className="flex-shrink-0 pointer-events-none text-default-400"
                        />
                      }
                      placeholder="mongodb://username:password@host:port/database"
                      variant="bordered"
                      value={connectionURI}
                      onChange={(e) => setConnectionURI(e.target.value)}
                      classNames={{
                        input: "font-mono text-sm",
                        inputWrapper:
                          "border-default-200 hover:border-primary-300 focus-within:border-primary-500",
                      }}
                    />
                    <p className="text-xs text-default-400">
                      Include your username, password, and database details in
                      the URI
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Connection Name
                    </label>
                    <Input
                      endContent={
                        <Pen
                          size={20}
                          className="flex-shrink-0 pointer-events-none text-default-400"
                        />
                      }
                      placeholder="My Production Database"
                      variant="bordered"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      classNames={{
                        inputWrapper:
                          "border-default-200 hover:border-primary-300 focus-within:border-primary-500",
                      }}
                    />
                    <p className="text-xs text-default-400">
                      Choose a descriptive name for easy identification
                    </p>
                  </div>
                </div>
              </ModalBody>
              <Divider />
              <ModalFooter className="pt-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={onClose}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddConnection}
                  isLoading={isLoading}
                  className="font-semibold"
                  isDisabled={!connectionURI.trim() || !connectionName.trim()}
                >
                  {isLoading ? "Connecting..." : "Create Connection"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Connections() {
  const { getConnections, connectionList } = useConnectionStore();
  const { overview, getOverviewAnalytics, isLoadingOverview } =
    useAnalyticsStore();

  useEffect(() => {
    getConnections();
    getOverviewAnalytics();
  }, []);

  const analyticsByConnection = useMemo(() => {
    const map = new Map<string, TConnectionSummary>();
    overview?.actual.perConnection.forEach((summary) => {
      map.set(summary.connectionID, summary);
    });
    return map;
  }, [overview]);

  const totalDatabases = connectionList.reduce(
    (total, conn) => total + (conn.databases?.length || 0),
    0
  );
  const totalCollections = connectionList.reduce(
    (total, conn) =>
      total +
      (conn.collections?.reduce(
        (dbTotal, db) => dbTotal + db.collections.length,
        0
      ) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Compact Header */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-gradient-to-r from-primary-50/10 to-secondary-50/20 border border-primary-200/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-primary-100/50 rounded-lg">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">
                Database Connections
              </h1>
              <p className="text-xs text-default-500">
                Manage your MongoDB connections and monitor their status
              </p>
            </div>
          </div>

          {connectionList.length > 0 && (
            <div className="flex items-center gap-4 sm:gap-5 flex-wrap lg:ml-auto lg:mr-2">
              <Tooltip
                content={`${overview?.projections.totals.activePolicies ?? 0} active ${(overview?.projections.totals.activePolicies ?? 0) === 1 ? "policy" : "policies"}`}
                placement="bottom"
                showArrow
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {connectionList.length}
                    </p>
                    <p className="text-[11px] text-default-500 leading-tight">
                      Connections
                    </p>
                  </div>
                </div>
              </Tooltip>
              <Divider orientation="vertical" className="h-7" />
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-secondary-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {totalDatabases}
                  </p>
                  <p className="text-[11px] text-default-500 leading-tight">
                    Databases
                  </p>
                </div>
              </div>
              <Divider orientation="vertical" className="h-7" />
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-warning-500" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {totalCollections}
                  </p>
                  <p className="text-[11px] text-default-500 leading-tight">
                    Collections
                  </p>
                </div>
              </div>
              <Divider orientation="vertical" className="h-7" />
              <Tooltip
                content={`Projected ${formatBytes(overview?.projections.totals.projectedStorageBytes ?? 0)} in 30 days`}
                placement="bottom"
                showArrow
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-success-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {isLoadingOverview && !overview
                        ? "—"
                        : formatBytes(overview?.actual.storageBytes ?? 0)}
                    </p>
                    <p className="text-[11px] text-default-500 leading-tight">
                      Storage
                    </p>
                  </div>
                </div>
              </Tooltip>
            </div>
          )}

          <div className="flex-shrink-0">
            <CreateConnectionModal RunOnSubmit={getConnections} />
          </div>
        </div>

        {/* Connections Grid */}
        {connectionList?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {connectionList.map((connection, index) => (
              <div
                key={index}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 h-full"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <ConnectionCard
                  {...connection}
                  analytics={analyticsByConnection.get(connection.connectionID)}
                  isAnalyticsLoading={isLoadingOverview}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center justify-center h-60 sm:h-80 px-4">
              <EmptyState
                Icon={
                  <DotLottieReact
                    src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
                    loop
                    autoplay
                    backgroundColor="transparent"
                  />
                }
                Title="Nothing to see here....."
                Description="Add New Connection to see something here bruh!, meanwhile let me sleep."
                TitleClassName="-translate-y-16 sm:-translate-y-20"
                DescriptionClassName="-translate-y-16 sm:-translate-y-20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
