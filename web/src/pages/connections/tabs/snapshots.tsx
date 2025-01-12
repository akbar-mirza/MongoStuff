import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spacer,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  useDisclosure
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import SnapShotAPI, { TSnapShot } from "../../../api/snapshot";

import {
  Boxes,
  Camera,
  DatabaseBackup,
  Download,
  Pencil,
  Shrink,
  Terminal,
  Trash
} from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import EmptyState from "../../../components/emptyState";
import { useConnectionStore } from "../../../stores/connection.store";
import { useSnapshotStore } from "../../../stores/snapshot.store";
import RestoreAPI from '../../../api/restore';

export function TakeSnapshotModal() {
  const { connection } = useConnectionStore();
  const { getSnapshots } = useSnapshotStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [database, setDatabase] = useState("");
  const [isCluster, setIsCluster] = useState(false);
  const [compressSnapshot, setCompressSnapshot] = useState(true);

  const handleTakeSnapshot = async () => {
    setIsLoading(true);
    const { snapshot, error } = await SnapShotAPI.TakeSnapShotRequest(
      connection?.connectionID as string,
      {
        ...(!isCluster && {
          database,
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
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" scrollBehavior="inside">
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

  const { getSnapshot, setSnapshot, } = useSnapshotStore();
  const { connection } = useConnectionStore();

  const [isLoading, setIsLoading] = useState(false);
  const [allowUpdate, setAllowUpdate] = useState(false);

  const handleRestore = async () => {
    setIsLoading(true);
    const { error } = await RestoreAPI.RestoreSnapshot({
      connectionID: connection?.connectionID as string,
      snapshotID: snapshot_id as string,
      update: allowUpdate
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

  useEffect(() => {
    if (isOpen) {
      console.log("Snapshot ID:");
      getSnapshot(connection?.connectionID as string, snapshot_id as string);
    }
  }, [isOpen, snapshot_id]);

  return (
    <>
      <span
        className="text-lg cursor-pointer active:opacity-50"
        onClick={onOpen}
      >
        <Tooltip content="Restore">
          <DatabaseBackup size={20} className="text-primary"/>
        </Tooltip>
      </span>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex gap-2">
            <DatabaseBackup size={20} />
            <p className="text-sm text-bold">Restore</p>
          </ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            {
              !isLoading && (
                <div className="gap-2 flex flex-col">
                   <p className="text-bold text-lg"> 
              Are you sure you want to restore this snapshot?
            </p>
         
                   <div className="flex items-center justify-between ">
                  <div className="flex flex-col gap-2">
                    
                      <div className="flex gap-2 items-center">
                        <Pencil size={18} />
                         <p className="text-md text-bold">
                        Update Documents
                      </p>
                    
                      </div>
                        <p className="text-sm text-default-400">
                        (Update existing documents with the data from the snapshot)
                      </p>
                  </div>
                  <Switch
                    isSelected={allowUpdate}
                    onValueChange={setAllowUpdate}
                    size="sm"
                  ></Switch>
                </div>
                </div>
              )
           }
            
            {
              isLoading && (
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
                    <p className=" text-lg">
                    Grab a cup of coffee
                  </p>
                  <p className="text-sm animate-pulse">
                    Restoring snapshot....
                  </p>
                  </div>
                </div>
              )
            }
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

export type Props = {
  ConnectionID: string;
};
export default function ConnectionSnapshots() {
  const { getSnapshots, snapshotList } = useSnapshotStore();
  const { id } = useParams();

  const columns: {
    key: string;
    label: string;
  }[] = [
    { key: "snapshotID", label: "Snapshot ID" },
    { key: "database", label: "Database" },
    { key: "timestamp", label: "Timestamp" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "size", label: "Size" },
    { key: "actions", label: "Actions" },
  ];

  useEffect(() => {
    getSnapshots(id as string);
  }, [id]);

  const statusColorMap: { [key in TSnapShot["status"]]: string } = {
    Success: "success",
    Failed: "danger",
  };

  const renderCell = React.useCallback(
    (item: TSnapShot, columnKey: keyof TSnapShot | 'actions') => {
      if (columnKey === 'actions') {
        return (
          <div className="flex gap-3">
              <RestoreSnapshot snapshot_id={item.snapshotID} />
              <RenderLogs snapshot_id={item.snapshotID} />
            <Tooltip content="Download Snapshot">
              <span className="text-lg cursor-pointer text-sky-500 active:opacity-50 hover:text-sky-600">
                <Download size={20} onClick={() => {
                  SnapShotAPI.DownloadSnapShotRequest(item.connectionID, item.snapshotID);
                }}/>
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete Snapshot">
              <span className="text-lg cursor-pointer text-danger active:opacity-50 hover:text-danger">
                <Trash size={20} />
              </span>
            </Tooltip>
          </div>
        );
      }
      
      const cellValue = item[columnKey]?.toString() || "";

      switch (columnKey) {
        case "timestamp":
          return (
            <p className="text-sm capitalize text-bold">
              {new Date(parseInt(cellValue)).toLocaleDateString() +
                " " +
                new Date(parseInt(cellValue)).toLocaleTimeString()}
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
            <p className="text-sm text-bold">
              {parseInt(cellValue) / 1024 > 1024
                ? (parseInt(cellValue) / 1024 / 1024).toFixed(2) + " mb"
                : (parseInt(cellValue) / 1024).toFixed(2) + " kb"}
            </p>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[item.status] as "success" | "danger"}
              size="sm"
              variant="dot"
            >
              {cellValue}
            </Chip>
          );

        case "snapshotID":
          return (
            <Chip size="sm" variant="solid">
              {cellValue}
            </Chip>
          );

        case "database":
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

  const pages = Math.ceil(snapshotList?.length || 0 / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return snapshotList?.slice(start, end);
  }, [page, rowsPerPage, snapshotList]);

  return (
    <div className="w-full">
      <div className="flex justify-end w-full">
        <TakeSnapshotModal />
      </div>
      <Spacer y={4} />
      {
        snapshotList?.length > 0 && (
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
            })) || []
          }
        >
          {(item) => (
            <TableRow key={item?.snapshotID}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey as keyof TSnapShot)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>)
      }
      {
        snapshotList?.length === 0 &&( <div>
            <div className="flex flex-col items-center justify-center h-80">
              <EmptyState
                Icon={ <DotLottieReact
                src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
                loop
                autoplay
                backgroundColor="transparent"
              />}
                Title="Nothing to see here....."
              Description="Take a snapshot to get started"
              TitleClassName="-translate-y-20"
              DescriptionClassName="-translate-y-20"
            />
            
            </div>
          </div>)
    }
    </div>
  );
}
