import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import { useEffect, useState } from "react";
import ConnectionAPI from "../../../api/connection";
import { useConnectionStore } from "../../../stores/connection.store";
import { useStorageStore } from "../../../stores/storage.store";
import { toast } from "sonner";
import BackupAPI from "../../../api/backup";

export default function ConnectionSettings() {
  const { connection } = useConnectionStore();
  const { getStorages, storageList } = useStorageStore();
  const [defaultStorageID, setDefaultStorageID] = useState<Set<string>>(
    new Set([connection?.defaultStorageID!])
  );

  useEffect(() => {
    getStorages();
    setDefaultStorageID(new Set([connection?.defaultStorageID!]));
  }, [connection]);

  const handleSetDefaultStorage = async () => {
    // values
    const values = Array.from(defaultStorageID);
    const { connection: message, error } =
      await ConnectionAPI.SetDefaultStorageForConnectionRequest(
        connection?.connectionID!,
        values[0]
      );
    if (error) {
      toast.error(error.error);
      return;
    }
    toast.success(message);
  };

  const handleDeleteBackupsByRetention = async () => {
    const { message, error } =
      await BackupAPI.DeleteBackupByRetentionManualRequest(
        connection?.connectionID!
      );
    if (error) {
      toast.error(error.error);
      return;
    }
    toast.success(message);
  };

  return (
    <div>
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Default Storage</p>
            <p className="text-small text-default-500">
              The default storage for this connection.
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardFooter className="flex gap-3">
          <Select
            className="max-w-xs"
            label="Select storage"
            selectedKeys={defaultStorageID}
            onSelectionChange={setDefaultStorageID as any}
          >
            {storageList?.map((storage) => (
              <SelectItem key={storage.storageID}>{storage.name}</SelectItem>
            ))}
          </Select>
          <Button onPress={handleSetDefaultStorage} color="default">
            Save
          </Button>
        </CardFooter>
      </Card>
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Backups</p>
          </div>
        </CardHeader>
        <Divider />
        <CardFooter className="flex gap-3">
          <p className="text-small text-default-500">
            Delete backups by retention for this connection.
          </p>
          <Button onPress={handleDeleteBackupsByRetention} color="default">
            Delete Backups by Retention
          </Button>
        </CardFooter>
      </Card>
      {/* <div className="flex flex-col items-center justify-center h-96">
        <EmptyState
          Icon={<StareBackCat />}
          Title="Brace yourself"
          Description="I might just quite the project."
        />
      </div> */}
    </div>
  );
}
