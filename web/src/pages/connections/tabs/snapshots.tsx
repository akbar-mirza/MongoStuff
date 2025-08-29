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
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import SnapShotAPI, { TSnapShot } from "../../../api/snapshot";

import {
  Boxes,
  Cable,
  Camera,
  Database,
  DatabaseBackup,
  Download,
  GitBranch,
  Hammer,
  Pencil,
  Shrink,
  Tags,
  Terminal,
  Trash,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import RestoreAPI from "../../../api/restore";
import EmptyState from "../../../components/emptyState";
import { useConnectionStore } from "../../../stores/connection.store";
import { useSnapshotStore } from "../../../stores/snapshot.store";

export function TakeSnapshotModal() {
  const { connection } = useConnectionStore();
  const { getSnapshots } = useSnapshotStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [database, setDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [isCluster, setIsCluster] = useState(false);
  const [compressSnapshot, setCompressSnapshot] = useState(true);

  const handleTakeSnapshot = async () => {
    setIsLoading(true);
    const { snapshot, error } = await SnapShotAPI.TakeSnapShotRequest(
      connection?.connectionID as string,
      {
        ...(!isCluster && {
          database,
          collection,
        }),
        compression: compressSnapshot,
      }
    );
    if (error) {
      toast.error("Error Taking Snapshot");
      setIsLoading(false);
      return;
    }
    if (!snapshot) return;

    getSnapshots(connection?.connectionID as string);
    setIsLoading(false);
  };

  return (
    <>
      <Button
        className="shadow-lg bg-primary-50"
        size="sm"
        startContent={!isLoading && <Camera size={20} />}
        variant="shadow"
        onPress={onOpen}
        isLoading={isLoading}
      >
        {isLoading ? "Taking Snapshot" : "Take Snapshot"}
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {isLoading ? "Taking Snapshot" : "Take Snapshot"}
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Boxes size={20} />
                    <p className="text-sm text-bold">Cluster Snapshot</p>
                  </div>
                  <Switch
                    isSelected={isCluster}
                    onValueChange={setIsCluster}
                    size="sm"
                  ></Switch>
                </div>

                <div className="flex items-center">
                  <Select
                    label="Select DB"
                    isDisabled={isCluster}
                    onChange={(e) => setDatabase(e.target.value)}
                  >
                    {(connection?.databases || [])?.map((db) => (
                      <SelectItem key={db}>{db}</SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center">
                  <Select
                    label="Select Collection"
                    isDisabled={isCluster}
                    onChange={(e) => setCollection(e.target.value)}
                  >
                    {(
                      connection?.collections?.find(
                        (collection) => collection.database === database
                      )?.collections || []
                    )?.map((collection) => (
                      <SelectItem key={collection}>{collection}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center justify-between ">
                  <div className="flex gap-2">
                    <Shrink size={20} />
                    <p className="text-sm text-bold">Compress Output</p>
                  </div>
                  <Switch
                    isSelected={compressSnapshot}
                    onValueChange={setCompressSnapshot}
                    size="sm"
                  ></Switch>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>

                <Button
                  onPress={() => {
                    handleTakeSnapshot();
                    onClose();
                  }}
                  className="bg-primary-50"
                  isLoading={isLoading}
                >
                  Capture
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export function RenderLogs({ snapshot_id }: { snapshot_id: string }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { getSnapshot, snapshot, setSnapshot } = useSnapshotStore();
  const { connection } = useConnectionStore();

  useEffect(() => {
    if (isOpen) {
      console.log("Snapshot ID:");
      getSnapshot(connection?.connectionID as string, snapshot_id as string);
    }
  }, [isOpen, snapshot_id]);

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
            <p className="text-sm text-bold">Logs</p>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-4">
            <pre className="whitespace-pre-wrap break-before-right text-medium">
              {snapshot?.logs}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                onClose();
                setSnapshot(null);
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export function RestoreSnapshot({ snapshot_id }: { snapshot_id: string }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { setSnapshot, findSnapshot } = useSnapshotStore();
  const snapshot = findSnapshot(snapshot_id);
  const { connection, connectionList } = useConnectionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [allowUpdate, setAllowUpdate] = useState(false);
  const [selectConnection, setSelectConnection] = useState<string | null>(null);
  const [database, setDatabase] = useState("");

  const handleRestore = async () => {
    setIsLoading(true);
    const { error } = await RestoreAPI.RestoreSnapshot({
      connectionID: selectConnection ?? (connection?.connectionID as string),
      snapshotID: snapshot_id as string,
      update: allowUpdate,
      database,
    });
    if (error) {
      toast.error("Error Restoring Snapshot");
      setIsLoading(false);
      return;
    }
    toast.success("Snapshot Restored");
    setIsLoading(false);
    onClose();
  };

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
            <p className="text-sm text-bold">Restore</p>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            {!isLoading && (
              <div className="gap-4 flex flex-col">
                <p className="text-bold text-lg">
                  Are you sure you want to restore this snapshot?
                </p>
                <div className="flex items-center justify-between ">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <Pencil size={18} />
                      <p className="text-md text-bold">Update Documents</p>
                    </div>
                    <p className="text-sm text-default-400">
                      Update existing documents with the data from the snapshot
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
                  <h1 className="text-lg">Advance Toolings</h1>
                </div>
                <div className="flex items-center justify-between ">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <Cable size={18} />
                      <p className="text-md text-bold">Restore To Connection</p>
                    </div>
                    <p className="text-sm text-default-400">
                      Restore snapshot to different cluster
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
                  isDisabled={snapshot?.isClusterSnapshot}
                  onChange={(e) => setDatabase(e.target.value)}
                >
                  {(
                    connectionList
                      .find(
                        (connection) =>
                          connection.connectionID === selectConnection
                      )
                      ?.databases.filter(
                        (db) =>
                          db.toLowerCase() !== snapshot?.database?.toLowerCase()
                      ) || []
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
                  <p className="text-sm animate-pulse">
                    Restoring snapshot....
                  </p>
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
                setSnapshot(null);
              }}
            >
              Close
            </Button>
            <Button
              onPress={() => {
                handleRestore();
                setSnapshot(null);
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

export function EditSnapshotTags({ snapshot_id }: { snapshot_id: string }) {
  const { findSnapshot, getSnapshots } = useSnapshotStore();
  const { connection } = useConnectionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(
    findSnapshot(snapshot_id)?.tags ?? []
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [tag, setTag] = useState("");

  const handleUpdateTags = async () => {
    setIsLoading(true);
    const { error } = await SnapShotAPI.UpdateSnapshotTagsRequest(
      connection?.connectionID as string,
      snapshot_id as string,
      tags
    );
    if (error) {
      toast.error("Error Updating Tags");
      setIsLoading(false);
      return;
    }
    toast.success("Tags Updated");
    setIsLoading(false);
    getSnapshots(connection?.connectionID as string);
    setIsOpen(false);
  };

  return (
    <>
      <Popover
        showArrow
        offset={10}
        isOpen={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
        backdrop="opaque"
      >
        <PopoverTrigger>
          <span className="text-lg cursor-pointer active:opacity-50">
            <Tooltip content="Edit Tags">
              <Tags size={20} className="text-violet-400" />
            </Tooltip>
          </span>
        </PopoverTrigger>
        <PopoverContent className="flex gap-2 p-4 flex-col">
          <div className="flex gap-2 items-center max-w-92">
            <Input
              label="Tags"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
              }}
              // on enter add tag
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setTags([...tags, tag]);
                  setTag("");
                }
              }}
            />
            <Button
              onPress={() => {
                setTags([...tags, tag]);
                setTag("");
                handleUpdateTags();
              }}
              isLoading={isLoading}
              className="bg-primary-50"
              size="md"
            >
              Save
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap max-w-sm">
            {tags?.map((tag) => (
              <Chip
                onClose={() => {
                  setTags(tags.filter((t) => t !== tag));
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export const DeleteSnapshot = ({ snapshot_id }: { snapshot_id: string }) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { connection } = useConnectionStore();
  const { getSnapshots } = useSnapshotStore();
  const handleDeleteSnapshot = async () => {
    const { error } = await SnapShotAPI.DeleteSnapShotRequest(
      connection?.connectionID as string,
      snapshot_id as string
    );
    if (error) {
      toast.error("Error Deleting Snapshot");
      return;
    }
    toast.success("Snapshot Deleted");
    getSnapshots(connection?.connectionID as string);
    onClose();
  };
  return (
    <>
      <Tooltip color="danger" content="Delete Snapshot">
        <span
          className="text-lg cursor-pointer text-danger active:opacity-50 hover:text-danger"
          onClick={onOpen}
        >
          <Trash size={20} />
        </span>
      </Tooltip>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Snapshot</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this snapshot?</p>
            <p className="text-md text-red-500">
              All data associated with this snapshot will be permanently
              deleted.
            </p>
            <p className="text-sm text-yellow-500">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Close
            </Button>
            <Button onPress={handleDeleteSnapshot} className="bg-primary-50">
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export type Props = {
  ConnectionID: string;
};
export default function ConnectionSnapshots() {
  const { getSnapshots, snapshotList, enablePolling } = useSnapshotStore();
  const { id } = useParams();

  const columns: {
    key: string;
    label: string;
  }[] = [
    { key: "snapshotID", label: "Snapshot" },
    { key: "scope", label: "Scope" },
    { key: "timestamp", label: "Timestamp" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "size", label: "Size" },
    { key: "actions", label: "Actions" },
  ];

  const POLLING_INTERVAL = 10000; // 10 seconds

  useEffect(() => {
    getSnapshots(id as string);
    if (enablePolling) {
      const interval = setInterval(() => {
        toast.info("Updating Snapshots...");
        getSnapshots(id as string);
      }, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [id, enablePolling]);

  const statusColorMap: { [key in TSnapShot["status"]]: string } = {
    Success: "success",
    Failed: "danger",
    Processing: "warning",
    Queued: "info",
  };

  const renderCell = React.useCallback(
    (item: TSnapShot, columnKey: keyof TSnapShot | "actions" | "scope") => {
      if (columnKey === "actions") {
        return (
          <div className="flex gap-3">
            <RestoreSnapshot snapshot_id={item.snapshotID} />
            <RenderLogs snapshot_id={item.snapshotID} />
            <Tooltip content="Download Snapshot">
              <span className="text-lg cursor-pointer text-sky-500 active:opacity-50 hover:text-sky-600">
                <Download
                  size={20}
                  onClick={() => {
                    SnapShotAPI.DownloadSnapShotRequest(
                      item.connectionID,
                      item.snapshotID
                    );
                  }}
                />
              </span>
            </Tooltip>
            <EditSnapshotTags snapshot_id={item.snapshotID} />
            <DeleteSnapshot snapshot_id={item.snapshotID} />
          </div>
        );
      }

      const cellValue = item[columnKey as keyof TSnapShot]?.toString() || "";

      switch (columnKey) {
        case "timestamp":
          return (
            <p className="text-sm capitalize text-bold">
              {new Date(parseInt(cellValue)).toDateString() +
                " " +
                "(" +
                new Date(parseInt(cellValue)).toLocaleTimeString() +
                ")"}
            </p>
          );
        case "duration":
          return (
            <p className="text-sm text-bold">
              {parseInt(cellValue) > 60000
                ? parseInt(cellValue) / 60000 + "m"
                : parseInt(cellValue) / 1000 + "s"}
            </p>
          );

        case "size":
          return (
            <span className="flex gap-1 items-center">
              <p className="text-sm text-bold">
                {parseInt(cellValue) / 1024 > 1024
                  ? (parseInt(cellValue) / 1024 / 1024).toFixed(2) + " mb"
                  : (parseInt(cellValue) / 1024).toFixed(2) + " kb"}
              </p>
              {item?.compression && <Chip size="sm">gzip</Chip>}
            </span>
          );
        case "status":
          return (
            <Chip
              className="capitalize gap-1 border-0"
              color={statusColorMap[item.status] as "success" | "danger"}
              size="md"
              variant="dot"
              startContent={
                item.status === "Processing" ? (
                  <Spinner
                    className="w-4 h-4"
                    variant="simple"
                    color={statusColorMap[item.status] as "success" | "danger"}
                  />
                ) : null
              }
            >
              {cellValue}
            </Chip>
          );

        case "snapshotID":
          return (
            <span className="flex flex-col gap-1 flex-wrap">
              <Chip
                size="sm"
                variant="light"
                className="text-sm text-foreground-600"
              >
                {cellValue.split("_")[1]}
              </Chip>
              {item?.tags?.length
                ? item.tags.map((tag) => (
                    <Tooltip content="Tags">
                      <Chip
                        variant="flat"
                        className="capitalize text-violet-400 text-xs"
                      >
                        {tag}
                      </Chip>
                    </Tooltip>
                  ))
                : null}
            </span>
          );

        case "scope":
          return (
            <span className="flex flex-col gap-1 flex-wrap">
              <Chip
                className="capitalize"
                size="md"
                variant={cellValue?.length ? "flat" : "shadow"}
                startContent={
                  cellValue?.length ? (
                    <Database size={12} />
                  ) : (
                    <Boxes size={12} />
                  )
                }
              >
                {cellValue?.length ? cellValue : "Cluster"}
              </Chip>
              {item?.collection?.length ? (
                <Tooltip content="Collection">
                  <Chip
                    size="sm"
                    variant="flat"
                    color="success"
                    className="capitalize"
                    startContent={<GitBranch size={12} />}
                  >
                    {item?.collection?.length && item?.collection}
                  </Chip>
                </Tooltip>
              ) : null}
            </span>
          );
        default:
          return cellValue;
      }
    },
    []
  );

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 8;

  const pages = Math.ceil(snapshotList?.length || 0 / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return snapshotList?.slice(start, end);
  }, [page, rowsPerPage, snapshotList]);

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
              Caputuring Snapshot Updates
            </Chip>
          )}
        </div>
        <TakeSnapshotModal />
      </div>
      <Spacer y={4} />
      {snapshotList?.length > 0 && (
        <Table
          aria-label="Example table with dynamic content"
          bottomContent={
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
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={
              items.map((item) => ({
                ...item,
                actions: "",
                scope: item?.database?.length ? item?.database : null,
              })) || []
            }
          >
            {(item) => (
              <TableRow key={item?.snapshotID}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(item, columnKey as keyof TSnapShot)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {snapshotList?.length === 0 && (
        <div>
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
              Title="Nothing to see here....."
              Description="Take a snapshot to get started"
              TitleClassName="-translate-y-20"
              DescriptionClassName="-translate-y-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
