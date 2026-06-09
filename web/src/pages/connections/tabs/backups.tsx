import {
  Button,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import React, { useEffect, useState, useMemo } from "react";
import BackupAPI, { TBackup, TBackupWithPolicyName } from "../../../api/backup";

import {
  Calendar,
  Clock,
  Database,
  DatabaseBackup,
  Filter,
  HardDrive,
  Hammer,
  Pencil,
  Terminal,
  Timer,
  Trash,
  X,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import EmptyState from "../../../components/emptyState";
import { useConnectionStore } from "../../../stores/connection.store";
import { useBackupStore } from "../../../stores/backup.store";
import RestoreAPI from "../../../api/restore";

// Component for live duration display during processing
function LiveDuration({ startTimestamp }: { startTimestamp: number }) {
  const [liveDuration, setLiveDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const duration = currentTime - startTimestamp;
      setLiveDuration(duration);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTimestamp]);

  const formatDuration = (duration: number) => {
    if (duration > 60000) {
      return (duration / 60000).toFixed(1) + "m";
    }
    return (duration / 1000).toFixed(0) + "s";
  };

  return (
    <p className="text-sm text-bold text-warning">
      {formatDuration(liveDuration)}
    </p>
  );
}

// Restore Backup Modal
export function RestoreBackup({ backup }: { backup: TBackup }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { connection, connectionList, getConnections } = useConnectionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [allowUpdate, setAllowUpdate] = useState(false);
  const [selectConnection, setSelectConnection] = useState<string | null>(null);
  const [database, setDatabase] = useState("");

  const handleRestore = async () => {
    setIsLoading(true);
    const { error } = await RestoreAPI.RestoreBackup({
      connectionID: selectConnection ?? (connection?.connectionID as string),
      backupID: backup.backupID,
      update: allowUpdate,
      database,
    });
    if (error) {
      toast.error("Error Restoring Backup");
      setIsLoading(false);
      return;
    }
    toast.success("Backup Restored");
    setIsLoading(false);
    onClose();
  };

  if (connectionList.length === 0) {
    getConnections();
  }

  return (
    <>
      <span className="cursor-pointer active:opacity-50" onClick={onOpen}>
        <Tooltip content="Restore">
          <DatabaseBackup size={20} className="text-primary" />
        </Tooltip>
      </span>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex gap-2">
            <DatabaseBackup size={20} />
            <p className="text-sm text-bold">Restore Backup</p>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            {!isLoading && (
              <div className="gap-4 flex flex-col">
                <p className="text-bold text-lg">
                  Are you sure you want to restore this backup?
                </p>
                <div className="flex items-center justify-between ">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <Pencil size={18} />
                      <p className="text-md text-bold">Update Documents</p>
                    </div>
                    <p className="text-sm text-default-400">
                      Update existing documents with the data from the backup
                    </p>
                  </div>
                  <Switch
                    isSelected={allowUpdate}
                    onValueChange={setAllowUpdate}
                    size="sm"
                  ></Switch>
                </div>
                <Divider className="mt-4" />
                <div className="flex items-center justify-center text-primary gap-2">
                  <Hammer size={20} />
                  <h1 className="text-lg">Advanced Toolings</h1>
                </div>
                <div className="flex items-center justify-between ">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <Database size={18} />
                      <p className="text-md text-bold">Restore To Connection</p>
                    </div>
                    <p className="text-sm text-default-400">
                      Restore backup to different cluster
                    </p>
                  </div>
                </div>
                <Select
                  label="Select Connection"
                  onChange={(e) => setSelectConnection(e.target.value)}
                >
                  {(connectionList || []).map((connection) => (
                    <SelectItem key={connection.connectionID}>
                      {connection.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Select DB"
                  onChange={(e) => setDatabase(e.target.value)}
                >
                  {(
                    connectionList.find(
                      (connection) =>
                        connection.connectionID === selectConnection
                    )?.databases || []
                  )?.map((db) => (
                    <SelectItem key={db}>{db}</SelectItem>
                  ))}
                </Select>
              </div>
            )}

            {isLoading && (
              <div className="m-auto flex items-center flex-col gap-2">
                <div className="animate-levitate">
                  <DotLottieReact
                    src="https://lottie.host/8f027789-05c4-4553-a9c4-60cc13bdfdce/jCxtRmqwcd.lottie"
                    loop
                    autoplay
                    backgroundColor="transparent"
                    style={{ width: "300px", height: "150px" }}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <p className=" text-lg">Grab a cup of coffee</p>
                  <p className="text-sm animate-pulse">Restoring backup....</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                onClose();
              }}
            >
              Close
            </Button>
            <Button
              onPress={() => {
                handleRestore();
              }}
              className="bg-primary-50"
              isLoading={isLoading}
            >
              Restore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Render Backup Logs Modal
export function RenderBackupLogs({ backup }: { backup: TBackup }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { connection } = useConnectionStore();
  const [backupData, setBackupData] = useState<TBackup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchLogs = async () => {
    setIsLoading(true);
    const { backup: backupData, error } = await BackupAPI.GetBackupByIdRequest(
      connection?.connectionID as string,
      backup.backupID!
    );
    if (backupData && !error) {
      setBackupData(backupData);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  return (
    <>
      <Tooltip content="View Logs">
        <span
          className="text-lg cursor-pointer active:opacity-50"
          onClick={onOpen}
        >
          <Terminal size={20} />
        </span>
      </Tooltip>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex gap-2">
            <Terminal size={20} />
            <div className="flex flex-col">
              <p className="text-sm text-bold">Backup Logs</p>
              <p className="text-xs text-default-500">
                Backup ID: {backup.backupID.split("_")[1]}
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <div className="flex gap-4 mb-4">
              <Chip
                size="sm"
                variant="flat"
                color={
                  backup.status === "Success"
                    ? "success"
                    : backup.status === "Failed"
                    ? "danger"
                    : "warning"
                }
              >
                {backup.status}
              </Chip>
              <Chip size="sm" variant="flat">
                Duration:{" "}
                {backup.duration > 60000
                  ? (backup.duration / 60000).toFixed(2) + "m"
                  : (backup.duration / 1000).toFixed(2) + "s"}
              </Chip>
              <Chip size="sm" variant="flat">
                Size:{" "}
                {backup.size / 1024 > 1024
                  ? (backup.size / 1024 / 1024).toFixed(2) + " MB"
                  : (backup.size / 1024).toFixed(2) + " KB"}
              </Chip>
            </div>
            <pre className="whitespace-pre-wrap break-words text-small bg-default-100 p-4 rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : (
                backupData?.logs || "No logs available for this backup."
              )}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Main Backup Logs Component
const BACKUP_PAGE_SIZE = 10;

export default function ConnectionBackups() {
  const {
    getBackupsForConnection,
    getBackupPolicies,
    backupPolicies,
    backups,
    backupsTotal,
    enablePolling,
    isLoading,
  } = useBackupStore();
  const { connection } = useConnectionStore();
  const { id } = useParams();

  // Filter states
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedPolicy, setSelectedPolicy] = useState<string>("all");
  const [expiredFilter, setExpiredFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = React.useState(1);

  const hasActiveFilters =
    dateFilter !== "all" || selectedPolicy !== "all" || expiredFilter !== "all";

  const fetchBackups = React.useCallback(
    (connectionID: string, currentPage: number) => {
      if (hasActiveFilters) {
        getBackupsForConnection(connectionID, { fetchAll: true });
        return;
      }

      getBackupsForConnection(connectionID, {
        page: currentPage,
        pageSize: BACKUP_PAGE_SIZE,
      });
    },
    [getBackupsForConnection, hasActiveFilters]
  );

  const columns = [
    { key: "backupID", label: "Backup ID" },
    { key: "policy", label: "Policy" },
    { key: "timestamp", label: "Timestamp" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "size", label: "Size" },
    { key: "deletion", label: "Deletion" },
    { key: "actions", label: "Actions" },
  ];

  const POLLING_INTERVAL = 10000; // 10 seconds

  useEffect(() => {
    if (id) {
      getBackupPolicies(id);
    }
  }, [id, getBackupPolicies]);

  useEffect(() => {
    if (id) {
      fetchBackups(id, page);
    }
  }, [id, page, fetchBackups]);

  useEffect(() => {
    if (enablePolling && id) {
      const interval = setInterval(() => {
        fetchBackups(id, page);
      }, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [id, enablePolling, page, fetchBackups]);

  const uniquePolicies = useMemo(() => {
    return (backupPolicies ?? []).map((policy) => ({
      id: policy.backupPolicyID,
      name: policy.name,
    }));
  }, [backupPolicies]);

  // Filter backups based on selected filters
  const filteredBackups = useMemo(() => {
    if (!backups) return [];

    let filtered = [...backups];

    // Date filter
    if (dateFilter !== "all") {
      if (dateFilter === "custom") {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).getTime();
          const end = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000; // Include full end date
          filtered = filtered.filter(
            (backup) => backup.timestamp >= start && backup.timestamp <= end
          );
        }
      } else {
        const now = Date.now();
        let startDate: number;

        switch (dateFilter) {
          case "last7":
            startDate = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case "last30":
            startDate = now - 30 * 24 * 60 * 60 * 1000;
            break;
          case "lastWeek": {
            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const lastMonday = new Date(today);
            lastMonday.setDate(today.getDate() - daysToMonday - 7);
            lastMonday.setHours(0, 0, 0, 0);
            startDate = lastMonday.getTime();
            break;
          }
          default:
            startDate = 0;
            break;
        }

        filtered = filtered.filter((backup) => backup.timestamp >= startDate);
      }
    }

    // Policy filter
    if (selectedPolicy !== "all") {
      filtered = filtered.filter(
        (backup) => backup.backupPolicyID === selectedPolicy
      );
    }

    // Expired status filter
    if (expiredFilter !== "all") {
      const now = Date.now();
      filtered = filtered.filter((backup) => {
        if (expiredFilter === "expired") {
          return backup.toBeDeletedAt > 0 && backup.toBeDeletedAt <= now;
        } else if (expiredFilter === "notExpired") {
          return backup.toBeDeletedAt === 0 || backup.toBeDeletedAt > now;
        }
        return true;
      });
    }

    return filtered;
  }, [
    backups,
    dateFilter,
    customStartDate,
    customEndDate,
    selectedPolicy,
    expiredFilter,
    hasActiveFilters,
  ]);

  const pages = hasActiveFilters
    ? Math.ceil((filteredBackups?.length || 0) / BACKUP_PAGE_SIZE)
    : Math.ceil(backupsTotal / BACKUP_PAGE_SIZE);

  const items = React.useMemo(() => {
    if (hasActiveFilters) {
      const start = (page - 1) * BACKUP_PAGE_SIZE;
      const end = start + BACKUP_PAGE_SIZE;
      return filteredBackups?.slice(start, end) || [];
    }

    return backups ?? [];
  }, [page, filteredBackups, backups, hasActiveFilters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    dateFilter,
    customStartDate,
    customEndDate,
    selectedPolicy,
    expiredFilter,
  ]);

  const statusColorMap: {
    [key: string]: "success" | "danger" | "warning" | "default";
  } = {
    Success: "success",
    Failed: "danger",
    Processing: "warning",
    Queued: "default",
  };

  const renderCell = React.useCallback(
    (
      item: TBackupWithPolicyName,
      columnKey: keyof TBackup | "actions" | "policy" | "deletion"
    ) => {
      if (columnKey === "actions") {
        return (
          <div className="flex gap-3">
            <RestoreBackup backup={item} />
            <RenderBackupLogs backup={item} />
          </div>
        );
      }

      switch (columnKey) {
        case "backupID":
          return (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">
                {item.backupID.split("_")[1]}
              </p>
            </div>
          );

        case "policy":
          return (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {item.policyName || "Unknown Policy"}
              </p>
              <p className="text-xs text-default-500">
                ID: {item.backupPolicyID}
              </p>
            </div>
          );

        case "timestamp":
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <p className="text-sm">
                  {new Date(item.timestamp).toDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <p className="text-xs text-default-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          );

        case "duration":
          // Show live duration for processing backups
          if (item.status === "Processing") {
            return <LiveDuration startTimestamp={item.timestamp} />;
          }
          // Show static duration for completed backups
          return (
            <div className="flex items-center gap-1">
              <Timer size={14} />
              <p className="text-sm">
                {item.duration > 60000
                  ? (item.duration / 60000).toFixed(2) + "m"
                  : (item.duration / 1000).toFixed(2) + "s"}
              </p>
            </div>
          );

        case "size":
          return (
            <div className="flex items-center gap-1">
              <HardDrive size={14} />
              <p className="text-sm">
                {item.size / 1024 > 1024
                  ? (item.size / 1024 / 1024).toFixed(2) + " MB"
                  : (item.size / 1024).toFixed(2) + " KB"}
              </p>
            </div>
          );

        case "deletion":
          if (item.toBeDeletedAt && item.toBeDeletedAt > 0) {
            const now = Date.now();
            const deletionTime = item.toBeDeletedAt;
            const timeRemaining = deletionTime - now;

            if (timeRemaining > 0) {
              const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
              const hours = Math.floor(
                (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              );
              const minutes = Math.floor(
                (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
              );

              return (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <Trash size={14} />
                    <p className="text-sm">
                      {new Date(deletionTime).toDateString()}
                    </p>
                  </div>
                  <Chip size="sm" variant="flat" color="warning">
                    {days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`}{" "}
                    left
                  </Chip>
                </div>
              );
            } else {
              return (
                <Chip size="sm" variant="flat" color="danger">
                  Expired
                </Chip>
              );
            }
          }
          return (
            <Chip size="sm" variant="flat" color="success">
              Permanent
            </Chip>
          );

        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[item.status]}
              size="sm"
              variant="flat"
              startContent={
                item.status === "Processing" ? (
                  <Spinner
                    className="w-3 h-3"
                    variant="simple"
                    color={statusColorMap[item.status]}
                  />
                ) : null
              }
            >
              {item.status}
            </Chip>
          );

        default:
          return item[columnKey as keyof TBackup]?.toString() || "";
      }
    },
    []
  );

  const clearFilters = React.useCallback(() => {
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedPolicy("all");
    setExpiredFilter("all");
  }, []);

  const displayedTotal = hasActiveFilters
    ? filteredBackups.length
    : backupsTotal;

  const hasTableData = hasActiveFilters
    ? filteredBackups.length > 0
    : backupsTotal > 0;

  const tableTopContent = React.useMemo(
    () => (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Database size={18} />
              <span className="text-base font-semibold">
                {connection?.name} Backup History
              </span>
            </div>
            {enablePolling && (
              <Chip
                color="success"
                size="sm"
                variant="light"
                startContent={<Spinner variant="spinner" size="sm" />}
              >
                Monitoring Active Backups
              </Chip>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={showFilters ? "solid" : "flat"}
              color={showFilters ? "primary" : "default"}
              onPress={() => setShowFilters(!showFilters)}
              startContent={<Filter size={16} />}
            >
              Filters
            </Button>
            {hasActiveFilters && (
              <Chip
                size="sm"
                variant="flat"
                color="primary"
                onClose={clearFilters}
              >
                {filteredBackups.length} of {backups?.length || 0}
              </Chip>
            )}
            {!hasActiveFilters && backupsTotal > 0 && (
              <Chip size="sm" variant="flat" color="default">
                {backupsTotal} total
              </Chip>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-default-200 bg-default-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={18} />
                <p className="text-sm font-semibold">Filter Backups</p>
              </div>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={clearFilters}
                  startContent={<X size={14} />}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  selectedKeys={[dateFilter]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setDateFilter(value);
                    if (value !== "custom") {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }
                  }}
                  label="Select Date Range"
                  size="sm"
                >
                  <SelectItem key="all">All Time</SelectItem>
                  <SelectItem key="last7">Last 7 Days</SelectItem>
                  <SelectItem key="last30">Last 30 Days</SelectItem>
                  <SelectItem key="lastWeek">Last Week</SelectItem>
                  <SelectItem key="custom">Custom Range</SelectItem>
                </Select>
                {dateFilter === "custom" && (
                  <div className="mt-2 flex flex-col gap-2">
                    <Input
                      type="date"
                      label="Start Date"
                      size="sm"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      label="End Date"
                      size="sm"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Backup Policy</label>
                <Select
                  selectedKeys={[selectedPolicy]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setSelectedPolicy(value);
                  }}
                  label="Select Policy"
                  size="sm"
                >
                  <SelectItem key="all">All Policies</SelectItem>
                  {
                    uniquePolicies?.map((policy) => (
                      <SelectItem key={policy.id}>{policy.name}</SelectItem>
                    )) as any
                  }
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Expiration Status</label>
                <Select
                  selectedKeys={[expiredFilter]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setExpiredFilter(value);
                  }}
                  label="Select Status"
                  size="sm"
                >
                  <SelectItem key="all">All</SelectItem>
                  <SelectItem key="expired">Expired</SelectItem>
                  <SelectItem key="notExpired">Not Expired</SelectItem>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    [
      connection?.name,
      enablePolling,
      showFilters,
      hasActiveFilters,
      filteredBackups.length,
      backups?.length,
      backupsTotal,
      dateFilter,
      customStartDate,
      customEndDate,
      selectedPolicy,
      expiredFilter,
      uniquePolicies,
      clearFilters,
    ]
  );

  const tableEmptyContent = hasActiveFilters ? (
    <div className="flex flex-col items-center justify-center py-16">
      <EmptyState
        Icon={
          <DotLottieReact
            src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
            loop
            autoplay
            backgroundColor="transparent"
          />
        }
        Title="No backups match your filters"
        Description="Try adjusting your filter criteria to see more results"
        TitleClassName="-translate-y-20"
        DescriptionClassName="-translate-y-20"
      />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-16">
      <EmptyState
        Icon={
          <DotLottieReact
            src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
            loop
            autoplay
            backgroundColor="transparent"
          />
        }
        Title="No backup logs found"
        Description="Backup logs will appear here once backup policies are executed"
        TitleClassName="-translate-y-20"
        DescriptionClassName="-translate-y-20"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table
        aria-label="Backup logs table"
        topContent={tableTopContent}
        topContentPlacement="outside"
        bottomContent={
          hasTableData && pages > 1 ? (
            <div className="flex w-full flex-col items-center gap-2">
              <Pagination
                isCompact
                showControls
                showShadow
                color="default"
                page={page}
                total={pages}
                onChange={(nextPage) => setPage(nextPage)}
              />
              <p className="text-xs text-default-500">
                Page {page} of {pages} ({displayedTotal} backups)
              </p>
            </div>
          ) : null
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={tableEmptyContent} items={items}>
          {(item) => (
            <TableRow key={item.backupID}>
              {(columnKey) => (
                <TableCell>
                  {renderCell(
                    item as unknown as TBackupWithPolicyName,
                    columnKey as keyof (TBackupWithPolicyName | TBackup)
                  )}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
