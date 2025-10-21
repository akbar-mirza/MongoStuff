import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  Activity,
  ArrowRight,
  Database,
  LinkIcon,
  Pen,
  Plus,
  Server,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConnectionAPI, { TConnection } from "../../api/connection";
import { useConnectionStore } from "../../stores/connection.store";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import EmptyState from "../../components/emptyState";

export function ConnectionCard(props: TConnection) {
  const getDatabaseCount = () => {
    return props.databases?.length || 0;
  };

  const getCollectionCount = () => {
    return (
      props.collections?.reduce(
        (total, db) => total + db.collections.length,
        0
      ) || 0
    );
  };

  return (
    <Card
      isPressable
      className="group relative overflow-hidden h-full flex flex-col w-full hover:-translate-y-2 transition-all duration-500 ease-out"
      shadow="sm"
      classNames={{
        base: "bg-gradient-to-br from-background/80 to-background/60 border border-default-200/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 backdrop-blur-sm",
        body: "p-0",
        header: "p-0",
      }}
    >
      <Link
        to={`/connection/${props.connectionID}`}
        className="block h-full flex flex-col w-full"
      >
        {/* Compact Header */}
        <div className="relative p-4">
          {/* Connection info - compact */}
          <div className="flex items-center gap-3">
            <Avatar
              isBordered
              name={props.name.slice(0, 2).toUpperCase()}
              size="md"
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
              {props.name}
            </h3>
          </div>
        </div>

        {/* Compact Stats section */}
        <div className="w-full px-4">
          <div className="grid grid-cols-2 gap-3 mb-3 w-full">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-content2/50 border border-divider group-hover:bg-content2 transition-colors duration-200">
              <Database className="w-4 h-4 text-primary" />
              <div className="flex flex-col items-start">
                <p className="text-xs text-default-500">Databases</p>
                <p className="text-md font-semibold text-foreground">
                  {getDatabaseCount()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-content2/50 border border-divider group-hover:bg-content2 transition-colors duration-200">
              <Activity className="w-4 h-4 text-primary" />
              <div className="flex flex-col items-start">
                <p className="text-xs text-default-500">Collections</p>
                <p className="text-md font-semibold text-foreground">
                  {getCollectionCount()}
                </p>
              </div>
            </div>
          </div>

          {/* Compact Database preview */}
          {props?.databases && props.databases.length > 0 && (
            <div className="space-y-2 p-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-default-500 uppercase tracking-wide">
                  Databases
                </span>
                <ArrowRight
                  size={12}
                  className="text-primary group-hover:translate-x-1 transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <AvatarGroup isBordered max={6} className="justify-start">
                  {props.databases.slice(0, 6).map((db, index) => (
                    <Tooltip key={index} content={db} placement="top" showArrow>
                      <Avatar
                        isBordered
                        name={db[0].toUpperCase()}
                        size="sm"
                        className="w-6 h-6 hover:scale-105 transition-transform duration-200 text-xs"
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
                {props.databases.length > 3 && (
                  <Chip size="sm" variant="flat" className="text-xs">
                    +{props.databases.length - 3}
                  </Chip>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />
      </Link>
    </Card>
  );
}

export function CreateConnectionModal(props: { RunOnSubmit: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionURI, setConnectionURI] = useState("");
  const [connectionName, setConnectionName] = useState("");

  const handleAddConnection = async () => {
    setIsLoading(true);

    const { error } = await ConnectionAPI.CreateConnectionRequest({
      uri: connectionURI.trim(),
      name: connectionName,
      userID: "admin",
    });

    if (error) {
      console.error(error);
      return;
    }

    setConnectionURI("");
    setConnectionName("");
    onOpenChange();
    props.RunOnSubmit();
    setIsLoading(false);
  };

  return (
    <>
      <Button
        size="md"
        startContent={
          !isLoading && <Plus size={18} className="sm:w-5 sm:h-5" />
        }
        variant="solid"
        onPress={onOpen}
        isLoading={isLoading}
        className="bg-primary-50 text-white hover:bg-primary-600"
      >
        <span className="text-sm sm:text-base font-semibold">
          Add Connection
        </span>
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        size="lg"
        classNames={{
          base: "bg-background/95 backdrop-blur-md",
          header: "border-b border-divider",
          body: "py-6",
          footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-content2 rounded-lg">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Add New Connection
                    </h2>
                    <p className="text-sm text-default-500">
                      Connect to your MongoDB database
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <Divider />
              <ModalBody className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Connection URI
                    </label>
                    <Input
                      autoFocus
                      endContent={
                        <LinkIcon
                          size={20}
                          className="flex-shrink-0 pointer-events-none text-default-400"
                        />
                      }
                      placeholder="mongodb://username:password@host:port/database"
                      variant="bordered"
                      value={connectionURI}
                      onChange={(e) => setConnectionURI(e.target.value)}
                      classNames={{
                        input: "font-mono text-sm",
                        inputWrapper:
                          "border-default-200 hover:border-primary-300 focus-within:border-primary-500",
                      }}
                    />
                    <p className="text-xs text-default-400">
                      Include your username, password, and database details in
                      the URI
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Connection Name
                    </label>
                    <Input
                      endContent={
                        <Pen
                          size={20}
                          className="flex-shrink-0 pointer-events-none text-default-400"
                        />
                      }
                      placeholder="My Production Database"
                      variant="bordered"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      classNames={{
                        inputWrapper:
                          "border-default-200 hover:border-primary-300 focus-within:border-primary-500",
                      }}
                    />
                    <p className="text-xs text-default-400">
                      Choose a descriptive name for easy identification
                    </p>
                  </div>
                </div>
              </ModalBody>
              <Divider />
              <ModalFooter className="pt-4">
                <Button
                  color="default"
                  variant="flat"
                  onPress={onClose}
                  className="font-medium"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddConnection}
                  isLoading={isLoading}
                  className="font-semibold"
                  isDisabled={!connectionURI.trim() || !connectionName.trim()}
                >
                  {isLoading ? "Connecting..." : "Create Connection"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Connections() {
  const { getConnections, connectionList } = useConnectionStore();

  useEffect(() => {
    getConnections();
  }, []);

  const totalDatabases = connectionList.reduce(
    (total, conn) => total + (conn.databases?.length || 0),
    0
  );
  const totalCollections = connectionList.reduce(
    (total, conn) =>
      total +
      (conn.collections?.reduce(
        (dbTotal, db) => dbTotal + db.collections.length,
        0
      ) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-content2 rounded-xl">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Database Connections
                  </h1>
                  <p className="text-sm text-default-500">
                    Manage your MongoDB connections and monitor their status
                  </p>
                </div>
              </div>
            </div>
            <CreateConnectionModal RunOnSubmit={getConnections} />
          </div>

          {/* Stats Overview */}
          {connectionList.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-divider bg-content1">
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <div className="p-2 bg-content2 rounded-lg">
                    <Server className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-default-500">
                      Active Connections
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {connectionList.length}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-divider bg-content1">
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <div className="p-2 bg-content2 rounded-lg">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Total Databases</p>
                    <p className="text-xl font-bold text-foreground">
                      {totalDatabases}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-divider bg-content1">
                <CardBody className="flex flex-row items-center gap-3 p-4">
                  <div className="p-2 bg-content2 rounded-lg">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-default-500">
                      Total Collections
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {totalCollections}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>

        {/* Connections Grid */}
        {connectionList?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {connectionList.map((connection, index) => (
              <div
                key={index}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 h-full"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <ConnectionCard {...connection} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center justify-center h-60 sm:h-80 px-4">
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
                Description="Add New Connection to see something here bruh!, meanwhile let me sleep."
                TitleClassName="-translate-y-16 sm:-translate-y-20"
                DescriptionClassName="-translate-y-16 sm:-translate-y-20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
