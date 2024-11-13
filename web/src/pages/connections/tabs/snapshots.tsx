import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
  useDisclosure,
} from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import SnapShotAPI, { TSnapShot } from "../../../api/snapshot";

import { Boxes, Camera, LinkIcon, Pen, Plus, Shrink } from "lucide-react";
import { useParams } from "react-router-dom";
import ConnectionAPI from "../../../api/connection";
import { useConnectionStore } from "../../../stores/connection.store";
import { useSnapshotStore } from "../../../stores/snapshot.store";
import { toast } from "sonner";

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
                <div className="flex items-center justify-between ">
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
  ];

  useEffect(() => {
    getSnapshots(id as string);
  }, [id]);

  const statusColorMap: { [key in TSnapShot["status"]]: string } = {
    Success: "success",
    Failed: "danger",
  };

  const renderCell = React.useCallback(
    (item: TSnapShot, columnKey: keyof TSnapShot) => {
      const cellValue = item[columnKey].toString();

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
  return (
    <div className="w-full">
      <div className="flex justify-end w-full">
        {/* <Button
          // color="primary"
          className="shadow-lg bg-primary-50"
          size="sm"
          startContent={!isLoading && <Camera size={18} />}
          variant="shadow"
          isLoading={isLoading}
          onClick={handleTakeSnapshot}
        >
          Take Snapshot
        </Button> */}
        <TakeSnapshotModal />
      </div>
      <Spacer y={4} />
      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={snapshotList || []}>
          {(item) => (
            <TableRow key={item?.snapshotID}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
