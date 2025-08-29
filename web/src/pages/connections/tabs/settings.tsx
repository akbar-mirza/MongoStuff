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

export default function ConnectionSettings() {
  const { connection } = useConnectionStore();
  const { getStorages, storageList } = useStorageStore();
  const [defaultStorageID, setDefaultStorageID] = useState<Set<string>>(
    new Set([connection?.defaultStorageID!])
  );

  useEffect(() => {
    getStorages();
  }, []);

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
