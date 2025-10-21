import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Listbox,
  ListboxItem,
  Badge,
  Divider,
} from "@heroui/react";
import { useConnectionStore } from "../../../stores/connection.store";
import ConnectionAPI from "../../../api/connection";
import { toast } from "sonner";
import {
  Database,
  Server,
  RefreshCw,
  Activity,
  Shield,
  Clock,
  HardDrive,
  Globe,
  Info,
} from "lucide-react";

export type Props = {
  ConnectionID: string;
};
export default function ConnectionOverview() {
  const { connection, getConnection } = useConnectionStore();

  const handleSyncConnection = async () => {
    if (!connection) return;

    const { error } = await ConnectionAPI.SyncConnectionRequest(
      connection.connectionID
    );
    if (error) {
      toast.error(error.error);
      return;
    }
    toast.success("Connection synced successfully");
    getConnection(connection.connectionID);
  };

  const getConnectionStatus = () => {
    // Mock status - in real app, this would come from health check
    return {
      status: "connected",
      lastSync: "-",
      latency: "-",
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="space-y-6">
      {connection && (
        <>
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-gradient-to-r from-primary-50/10 to-secondary-50/20 border border-primary-200/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100/50 rounded-lg">
                <Database className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {connection.name}
                </h2>
                <p className="text-sm text-default-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {connection.host}:{connection.port}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                color={status.status === "connected" ? "success" : "danger"}
                variant="flat"
                className="text-xs"
              >
                {status.status === "connected" ? "Online" : "Offline"}
              </Badge>
              <Button
                size="sm"
                color="default"
                variant="flat"
                startContent={<RefreshCw className="w-4 h-4" />}
                onPress={handleSyncConnection}
                className="font-medium"
              >
                Sync Connection
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <div className="p-2 bg-success-100/50 rounded-lg">
                  <Database className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Databases</p>
                  <p className="text-lg font-semibold text-foreground">
                    {connection.databases.length}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <div className="p-2 bg-warning-100/50 rounded-lg">
                  <Activity className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Latency</p>
                  <p className="text-lg font-semibold text-foreground">
                    {status.latency}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <div className="p-2 bg-info-100/50 rounded-lg">
                  <Shield className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Security</p>
                  <p className="text-lg font-semibold text-foreground">
                    {connection.scheme.toUpperCase()}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardBody className="flex flex-row items-center gap-3 p-4">
                <div className="p-2 bg-secondary-100/50 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Last Sync</p>
                  <p className="text-lg font-semibold text-foreground">
                    {status.lastSync}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Connection Details */}
            <Card className="lg:col-span-2 border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="flex items-center gap-3 pb-3">
                <Server className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Connection Details
                </h3>
              </CardHeader>
              <Divider />
              <CardBody className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Connection ID
                      </span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="font-mono text-xs"
                      >
                        {connection.connectionID}
                      </Chip>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Name</span>
                      <span className="text-sm font-medium text-foreground">
                        {connection.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Cluster</span>
                      <span className="text-sm font-medium text-foreground">
                        {connection.host.split(".")[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Host</span>
                      <span className="text-sm font-medium text-foreground font-mono">
                        {connection.host}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Port</span>
                      <span className="text-sm font-medium text-foreground">
                        {connection.port}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-500">Protocol</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          connection.scheme === "mongodb+srv"
                            ? "success"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {connection.scheme}
                      </Chip>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Databases List */}
            <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
              <CardHeader className="flex items-center gap-3 pb-3">
                <HardDrive className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Databases
                </h3>
                <Badge color="primary" variant="flat" size="sm">
                  {connection.databases.length}
                </Badge>
              </CardHeader>
              <Divider />
              <CardBody className="pt-4">
                <Listbox
                  className="w-full"
                  aria-label="Database list"
                  variant="flat"
                >
                  {connection.databases.map((db, index) => (
                    <ListboxItem
                      key={index}
                      className="rounded-lg mb-1 hover:bg-default-100"
                      startContent={
                        <div className="p-1 bg-primary-100/50 rounded">
                          <Database className="w-4 h-4 text-primary-600" />
                        </div>
                      }
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {db.toUpperCase()}
                        </span>
                        <span className="text-xs text-default-500">
                          {connection.collections.find((c) => c.database === db)
                            ?.collections.length || 0}{" "}
                          collections
                        </span>
                      </div>
                    </ListboxItem>
                  ))}
                </Listbox>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
