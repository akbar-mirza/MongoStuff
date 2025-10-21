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
  Spacer,
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
import React, { useEffect, useState } from "react";
import { TBackupPolicy } from "../../../api/backup";

import {
  Boxes,
  Calendar,
  Clock,
  Database,
  HardDrive,
  Pencil,
  Play,
  Plus,
  Settings,
  Shrink,
  Star,
  Trash,
  Zap,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import EmptyState from "../../../components/emptyState";
import { useBackupStore } from "../../../stores/backup.store";
import { useConnectionStore } from "../../../stores/connection.store";
import { useStorageStore } from "../../../stores/storage.store";

// Create/Edit Backup Policy Modal
export function CreateBackupPolicyModal({
  editPolicy,
  onClose,
}: {
  editPolicy?: TBackupPolicy;
  onClose?: () => void;
}) {
  const { connection } = useConnectionStore();
  const { storageList, getStorages } = useStorageStore();
  const { createBackupPolicy, updateBackupPolicy, isCreating, isUpdating } =
    useBackupStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [name, setName] = useState(editPolicy?.name || "");
  const [interval, setInterval] = useState(editPolicy?.interval || 1);
  const [timeUnit, setTimeUnit] = useState(editPolicy?.timeUnit || "hours");
  const [keep, setKeep] = useState(editPolicy?.keep || 5);
  const [retention, setRetention] = useState(editPolicy?.retention || 30);
  const [status, setStatus] = useState(editPolicy?.status || "Active");
  const [compression, setCompression] = useState(
    editPolicy?.compression ?? true
  );
  const [storageID, setStorageID] = useState<Set<string>>(
    new Set([connection?.defaultStorageID!])
  );
  const [isClusterBackup, setIsClusterBackup] = useState(
    editPolicy?.isClusterBackup ?? false
  );
  const [database, setDatabase] = useState(editPolicy?.database || "");
  const [collection, setCollection] = useState(editPolicy?.collection || "");

  useEffect(() => {
    if (isOpen) {
      getStorages();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Policy name is required");
      return;
    }

    if (!storageID) {
      toast.error("Storage selection is required");
      return;
    }

    const policyData = {
      name: name.trim(),
      interval,
      timeUnit,
      keep,
      retention,
      status,
      compression,
      storageID: Array.from(storageID)[0],
      isClusterBackup,
      database: isClusterBackup ? "" : database,
      collection: isClusterBackup ? "" : collection,
      nextRun: 0, // Will be calculated by the backend
    };

    let success = false;
    if (editPolicy) {
      success = await updateBackupPolicy(
        connection?.connectionID as string,
        editPolicy.backupPolicyID,
        policyData
      );
    } else {
      success = await createBackupPolicy(
        connection?.connectionID ?? "",
        policyData
      );
    }

    if (success) {
      onOpenChange();
      onClose?.();
      // Reset form
      setName("");
      setInterval(1);
      setTimeUnit("hours");
      setKeep(5);
      setRetention(30);
      setStatus("Active");
      setCompression(true);
      setStorageID(new Set([connection?.defaultStorageID!]));
      setIsClusterBackup(true);
      setDatabase("");
      setCollection("");
    }
  };

  const timeUnits = [
    { key: "minutes", label: "Minutes" },
    { key: "hours", label: "Hours" },
    { key: "days", label: "Days" },
  ];

  const statusOptions = [
    { key: "Active", label: "Active" },
    { key: "Inactive", label: "Inactive" },
  ];

  return (
    <>
      {!editPolicy && (
        <Button
          className="shadow-lg bg-primary-50"
          size="sm"
          startContent={!isCreating && <Plus size={20} />}
          variant="shadow"
          onPress={onOpen}
          isLoading={isCreating}
        >
          {isCreating ? "Creating Policy" : "Create Policy"}
        </Button>
      )}

      {editPolicy && (
        <Tooltip content="Edit Policy">
          <span
            className="text-lg cursor-pointer active:opacity-50"
            onClick={onOpen}
          >
            <Pencil size={20} className="text-blue-500" />
          </span>
        </Tooltip>
      )}

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        size="2xl"
        scrollBehavior="inside"
        className="max-h-[95vh]"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editPolicy ? "Edit Backup Policy" : "Create Backup Policy"}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                {/* Basic Information */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings size={20} />
                    Basic Information
                  </h3>

                  <Input
                    label="Policy Name"
                    placeholder="Enter backup policy name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                  />

                  <div className="flex gap-4">
                    <Input
                      label="Interval"
                      type="number"
                      min="1"
                      value={interval.toString()}
                      onChange={(e) =>
                        setInterval(parseInt(e.target.value) || 1)
                      }
                      className="flex-1"
                    />
                    <Select
                      label="Time Unit"
                      selectedKeys={[timeUnit]}
                      onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        setTimeUnit(selectedKey);
                      }}
                      className="flex-1"
                    >
                      {timeUnits.map((unit) => (
                        <SelectItem key={unit.key}>{unit.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div className="flex gap-4">
                    <Input
                      label="Keep Backups"
                      type="number"
                      min="1"
                      value={keep.toString()}
                      onChange={(e) => setKeep(parseInt(e.target.value) || 1)}
                      className="flex-1"
                      description="Number of backups to keep"
                    />
                    <Input
                      label="Retention (Days)"
                      type="number"
                      min="1"
                      value={retention.toString()}
                      onChange={(e) =>
                        setRetention(parseInt(e.target.value) || 1)
                      }
                      className="flex-1"
                      description="Days to keep backups"
                    />
                  </div>

                  <Select
                    label="Status"
                    selectedKeys={[status]}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      setStatus(selectedKey);
                    }}
                  >
                    {statusOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                </div>

                <Divider />

                {/* Storage Configuration */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <HardDrive size={20} />
                    Storage Configuration
                  </h3>

                  <Select
                    label="Storage"
                    placeholder="Select storage for backups"
                    selectedKeys={storageID}
                    onSelectionChange={setStorageID as any}
                    isRequired
                    endContent={
                      Array.from(storageID).includes(
                        connection?.defaultStorageID!
                      ) ? (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="success"
                          startContent={<Star size={12} />}
                        >
                          Default
                        </Chip>
                      ) : null
                    }
                  >
                    {storageList.map((storage) => (
                      <SelectItem key={storage.storageID}>
                        {storage.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Shrink size={20} />
                      <p className="text-sm text-bold">Enable Compression</p>
                    </div>
                    <Switch
                      isSelected={compression}
                      onValueChange={setCompression}
                      size="sm"
                      isDisabled={true}
                    />
                  </div>
                </div>

                <Divider />

                {/* Backup Scope */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database size={20} />
                    Backup Scope
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Boxes size={20} />
                      <p className="text-sm text-bold">Cluster Backup</p>
                    </div>
                    <Switch
                      isSelected={isClusterBackup}
                      onValueChange={setIsClusterBackup}
                      size="sm"
                    />
                  </div>

                  {!isClusterBackup && (
                    <>
                      <Select
                        label="Database"
                        placeholder="Select database"
                        selectedKeys={database ? [database] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;
                          setDatabase(selectedKey);
                          setCollection(""); // Reset collection when database changes
                        }}
                      >
                        {(connection?.databases || []).map((db) => (
                          <SelectItem key={db}>{db}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        label="Collection (Optional)"
                        placeholder="Select collection"
                        selectedKeys={collection ? [collection] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string;
                          setCollection(selectedKey);
                        }}
                      >
                        {(
                          connection?.collections?.find(
                            (coll) => coll.database === database
                          )?.collections || []
                        ).map((coll) => (
                          <SelectItem key={coll}>{coll}</SelectItem>
                        ))}
                      </Select>
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  onPress={handleSubmit}
                  className="bg-primary-50"
                  isLoading={isCreating || isUpdating}
                >
                  {editPolicy ? "Update Policy" : "Create Policy"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

// Delete Backup Policy Modal
export function DeleteBackupPolicyModal({ policy }: { policy: TBackupPolicy }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connection } = useConnectionStore();
  const { deleteBackupPolicy, isDeleting } = useBackupStore();

  const handleDelete = async () => {
    const success = await deleteBackupPolicy(
      connection?.connectionID as string,
      policy.backupPolicyID
    );
    if (success) {
      onClose();
    }
  };

  return (
    <>
      <Tooltip color="danger" content="Delete Policy">
        <span
          className="text-lg cursor-pointer text-danger active:opacity-50 hover:text-danger"
          onClick={onOpen}
        >
          <Trash size={20} />
        </span>
      </Tooltip>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Backup Policy</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the backup policy "{policy.name}"?
            </p>
            <p className="text-md text-red-500">
              This will stop all scheduled backups for this policy.
            </p>
            <p className="text-sm text-yellow-500">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button
              onPress={handleDelete}
              color="danger"
              isLoading={isDeleting}
            >
              Delete Policy
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Trigger Backup Modal
export function TriggerBackupModal({ policy }: { policy: TBackupPolicy }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { connection } = useConnectionStore();
  const { triggerBackup, isTriggeringBackup } = useBackupStore();

  const handleTrigger = async () => {
    const success = await triggerBackup(
      connection?.connectionID as string,
      policy.backupPolicyID
    );
    if (success) {
      onClose();
    }
  };

  return (
    <>
      <Tooltip content="Trigger Backup">
        <span
          className="text-lg cursor-pointer text-success active:opacity-50"
          onClick={onOpen}
        >
          <Play size={20} />
        </span>
      </Tooltip>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Zap size={20} />
            Trigger Backup
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to manually trigger a backup for "
              {policy.name}"?
            </p>
            <p className="text-sm text-default-500">
              This will start a backup process immediately, regardless of the
              scheduled interval.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button
              onPress={handleTrigger}
              className="bg-success-50"
              color="success"
              isLoading={isTriggeringBackup}
            >
              Trigger Backup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Main Backup Policies Component
export default function ConnectionBackupPolicies() {
  const { getBackupPolicies, backupPolicies, enablePolling, isLoading } =
    useBackupStore();
  const { id } = useParams();

  const columns = [
    { key: "name", label: "Policy Name" },
    { key: "schedule", label: "Schedule" },
    { key: "scope", label: "Scope" },
    { key: "retention", label: "Retention" },
    { key: "nextRun", label: "Next Run" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions" },
  ];

  const POLLING_INTERVAL = 30000; // 30 seconds

  useEffect(() => {
    if (id) {
      getBackupPolicies(id);
    }
  }, [id]);

  useEffect(() => {
    if (enablePolling && id) {
      const interval = setInterval(() => {
        getBackupPolicies(id);
      }, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [id, enablePolling]);

  const statusColorMap: {
    [key: string]: "success" | "danger" | "warning" | "default";
  } = {
    Active: "success",
    Inactive: "danger",
  };

  const renderCell = React.useCallback(
    (
      item: TBackupPolicy,
      columnKey:
        | keyof TBackupPolicy
        | "actions"
        | "schedule"
        | "scope"
        | "retention"
        | "nextRun"
    ) => {
      if (columnKey === "actions") {
        return (
          <div className="flex gap-3">
            <TriggerBackupModal policy={item} />
            <CreateBackupPolicyModal editPolicy={item} />
            <DeleteBackupPolicyModal policy={item} />
          </div>
        );
      }

      switch (columnKey) {
        case "name":
          return (
            <div className="flex flex-col">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-xs text-default-500">
                ID: {item.backupPolicyID}
              </p>
            </div>
          );

        case "schedule":
          return (
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span className="text-sm">
                Every {item.interval} {item.timeUnit}
              </span>
            </div>
          );

        case "scope":
          return (
            <div className="flex flex-col gap-1">
              <Chip
                size="sm"
                variant="flat"
                startContent={<Database size={12} />}
              >
                {item.isClusterBackup ? "Cluster" : item.database}
              </Chip>
              {item.collection && (
                <Chip size="sm" variant="flat" color="success">
                  {item.collection}
                </Chip>
              )}
            </div>
          );

        case "retention":
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span className="text-sm">{item.retention} days</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive size={14} />
                <span className="text-sm">{item.keep} backups</span>
              </div>
            </div>
          );

        case "nextRun":
          if (item.nextRun && item.nextRun > 0) {
            const nextRunDate = new Date(item.nextRun);
            const now = new Date();
            const timeDiff = nextRunDate.getTime() - now.getTime();
            const isOverdue = timeDiff < 0;

            return (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <p className="text-sm">
                    {new Date(item.nextRun).toDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <p className="text-xs text-default-500">
                    {new Date(item.nextRun).toLocaleTimeString()}
                  </p>
                </div>
                {isOverdue ? (
                  <Chip size="sm" variant="flat" color="danger">
                    Overdue
                  </Chip>
                ) : (
                  <Chip size="sm" variant="flat" color="success">
                    Scheduled
                  </Chip>
                )}
              </div>
            );
          }
          return (
            <Chip size="sm" variant="flat" color="default">
              Not scheduled
            </Chip>
          );

        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[item.status]}
              size="sm"
              variant="flat"
            >
              {item.status}
            </Chip>
          );

        default:
          return item[columnKey as keyof TBackupPolicy]?.toString() || "";
      }
    },
    []
  );

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 8;
  const pages = Math.ceil((backupPolicies?.length || 0) / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return backupPolicies?.slice(start, end) || [];
  }, [page, rowsPerPage, backupPolicies]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between w-full items-center">
        <div className="flex items-center justify-center">
          {enablePolling && (
            <Chip
              color="success"
              size="md"
              variant="light"
              startContent={<Spinner variant="spinner" size="sm" />}
            >
              Monitoring Active Policies
            </Chip>
          )}
        </div>
        <CreateBackupPolicyModal />
      </div>
      <Spacer y={4} />

      {backupPolicies && backupPolicies.length > 0 ? (
        <Table
          aria-label="Backup policies table"
          bottomContent={
            pages > 1 ? (
              <div className="flex justify-center w-full">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="default"
                  page={page}
                  total={pages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            ) : null
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={items}>
            {(item) => (
              <TableRow key={item.backupPolicyID}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(item, columnKey as keyof TBackupPolicy)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center h-80">
          <EmptyState
            Icon={
              <DotLottieReact
                src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
                loop
                autoplay
                backgroundColor="transparent"
              />
            }
            Title="No backup policies found"
            Description="Create your first backup policy to get started"
            TitleClassName="-translate-y-20"
            DescriptionClassName="-translate-y-20"
          />
        </div>
      )}
    </div>
  );
}
