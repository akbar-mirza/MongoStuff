import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Button,
  Chip,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spacer,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { Calendar, Clock, Terminal, Timer } from "lucide-react";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { TRestore } from "../../../api/restore";
import EmptyState from "../../../components/emptyState";
import { useConnectionStore } from "../../../stores/connection.store";
import { useRestoreStore } from "../../../stores/restore.store";

export function RenderLogs({ restore_id }: { restore_id: string }) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const { getRestore, restore, setRestore } = useRestoreStore();
  const { connection } = useConnectionStore();

  useEffect(() => {
    if (isOpen) {
      console.log("Snapshot ID:");
      getRestore(connection?.connectionID as string, restore_id as string);
    }
  }, [isOpen, restore_id]);

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
              {restore?.logs}
            </pre>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={() => {
                onClose();
                setRestore(null);
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

export type Props = {
  ConnectionID: string;
};
export default function ConnectionRestores() {
  const { getRestores, restoreList } = useRestoreStore();
  const { id } = useParams();

  const columns: {
    key: string;
    label: string;
  }[] = [
    { key: "restoreID", label: "Restore ID" },
    { key: "type", label: "Type" },
    { key: "restoreFrom", label: "Restore From" },
    { key: "database", label: "Database" },
    { key: "timestamp", label: "Timestamp" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "actions", label: "Actions" },
  ];

  useEffect(() => {
    getRestores(id as string);
  }, [id]);

  const statusColorMap: {
    [key: string]: "success" | "danger" | "warning" | "default";
  } = {
    Success: "success",
    Failed: "danger",
    Processing: "warning",
    Queued: "default",
  };

  const renderCell = React.useCallback(
    (item: TRestore, columnKey: keyof TRestore | "actions" | "restoreFrom") => {
      if (columnKey === "actions") {
        return (
          <div className="flex gap-3">
            <RenderLogs restore_id={item.restoreID} />
          </div>
        );
      }

      const cellValue = item[columnKey as keyof TRestore]?.toString() || "";

      switch (columnKey) {
        case "timestamp":
          return (
            <div className="flex flex-col">
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

        case "restoreFrom":
          return (
            <Link size="sm" className="text-primary" showAnchorIcon>
              {cellValue}
            </Link>
          );

        case "status":
          return (
            <Chip
              className="capitalize gap-1 border-0"
              color={statusColorMap[item.status]}
              size="md"
              variant="dot"
            >
              {item.status}
            </Chip>
          );

        case "restoreID":
          return (
            <div className="flex flex-col">
              <Chip
                size="sm"
                variant="light"
                className="text-sm text-foreground-600"
              >
                {item.restoreID.split("_")[1]}
              </Chip>
            </div>
          );

        case "type":
          return (
            <Chip
              className="capitalize"
              size="sm"
              variant={cellValue?.length ? "flat" : "dot"}
            >
              {cellValue?.length ? cellValue : "Cluster"}
            </Chip>
          );

        default:
          return cellValue;
      }
    },
    []
  );

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 8;

  const pages = Math.ceil((restoreList?.length || 0) / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return restoreList?.slice(start, end);
  }, [page, rowsPerPage, restoreList]);

  return (
    <div className="w-full">
      <Spacer y={4} />
      {restoreList?.length > 0 && (
        <Table
          aria-label="Restore Table"
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
                type: item?.snapshotID !== "" ? "Snapshot" : "Backup",
                restoreFrom: item?.snapshotID?.length
                  ? item?.snapshotID
                  : item?.backupID,
              })) || []
            }
          >
            {(item) => (
              <TableRow key={item?.restoreID}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(item as TRestore, columnKey as keyof TRestore)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {restoreList?.length === 0 && (
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
              Description="Start a restore to see something here, meanwhile let me sleep."
              TitleClassName="-translate-y-20"
              DescriptionClassName="-translate-y-20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
