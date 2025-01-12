import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Listbox,
  ListboxItem,
} from "@nextui-org/react";
import { useConnectionStore } from "../../../stores/connection.store";

export type Props = {
  ConnectionID: string;
};
export default function ConnectionOverview() {
  const { connection } = useConnectionStore();

  return (
    <>
      {connection && (
        <div className="flex gap-4">
          <Card
            isBlurred
            className="w-8/12 border-1 border-slate-500 bg-background/100 dark:bg-default-100/50"
            shadow="sm"
          >
            <CardHeader className="flex gap-3">
              <p className="text-md text-slate-300">Connection Details</p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">ConnectionID</p>
                  <p className="text-sm text-slate-300">
                    <Chip className="bg-primary-50">
                      {connection.connectionID}
                    </Chip>
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">Name</p>
                  <p className="text-sm text-slate-300">{connection.name}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">Cluster Name</p>
                  <p className="text-sm text-slate-300">
                    {connection.host.split(".")[0]}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">Host</p>
                  <p className="text-sm text-slate-300">{connection.host}</p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">Port</p>
                  <p className="text-sm text-slate-300">{connection.port}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-default-500">Scheme</p>
                  <p className="text-sm text-slate-300">{connection.scheme}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card
            isBlurred
            className="w-4/12 border-1 border-slate-500 bg-background/100 dark:bg-default-100/50 max-h-[300px] overflow-y-auto"
            shadow="sm"
          >
            <CardHeader>
              <p className="text-md text-slate-300">Databases</p>
            </CardHeader>
            <CardBody>
              <Listbox className="w-full">
                {connection.databases.map((db, index) => (
                  <ListboxItem key={index}>
                    {db.toLocaleUpperCase()}
                  </ListboxItem>
                ))}
              </Listbox>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
