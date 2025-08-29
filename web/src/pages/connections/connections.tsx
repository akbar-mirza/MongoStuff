import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Activity,
  ArrowRight,
  Database,
  LinkIcon,
  Pen,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConnectionAPI, { TConnection } from "../../api/connection";
import EmptyState from "../../components/emptyState";
import { useConnectionStore } from "../../stores/connection.store";

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
      className="group relative overflow-hidden h-full flex flex-col w-full hover:-translate-y-1 transition-all duration-300 ease-out"
      shadow="sm"
      classNames={{
        base: "bg-content1 border-divider hover:border-primary hover:shadow-primary/20",
        body: "p-3 sm:p-4",
        header: "pb-2",
      }}
    >
      <Link
        to={`/connection/${props.connectionID}`}
        className="block h-full flex flex-col"
      >
        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-10">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse border-2 border-content1 shadow-small" />
        </div>

        {/* Header with enhanced styling */}
        <CardHeader className="flex gap-3 sm:gap-4 pb-2">
          <div className="relative flex-shrink-0 flex items-center gap-2">
            <Avatar
              isBordered
              name={props.name.slice(0, 2).toUpperCase()}
              size="md"
              className="group-hover:scale-110 transition-transform duration-300 bg-primary-50"
            />
            <h3 className="text-base sm:text-lg font-semibold group-hover:text-primary-foreground transition-colors duration-200 truncate">
              {props.name}
            </h3>
          </div>
        </CardHeader>

        {/* Enhanced body with statistics */}
        <CardBody className="pt-0 flex-grow flex flex-col">
          <div className="space-y-4 flex-grow">
            {/* Database and Collection stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-medium bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200 border border-primary/20">
                <Database
                  size={14}
                  className="sm:w-4 sm:h-4 text-primary flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-primary truncate font-medium">
                    Databases
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {getDatabaseCount()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-medium bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200 border border-primary/20">
                <Activity
                  size={14}
                  className="sm:w-4 sm:h-4 text-primary flex-shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-primary truncate font-medium">
                    Collections
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {getCollectionCount()}
                  </span>
                </div>
              </div>
            </div>

            {/* Database avatars with improved styling */}
            {props?.databases && props.databases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Recent Databases
                  </span>
                  <ArrowRight
                    size={12}
                    className="sm:w-3.5 sm:h-3.5 text-primary group-hover:text-primary-foreground group-hover:translate-x-1 transition-all duration-200"
                  />
                </div>
                <AvatarGroup isBordered max={3} className="justify-start px-2">
                  {props.databases.slice(0, 3).map((db, index) => (
                    <Tooltip
                      key={index}
                      content={db}
                      placement="top"
                      showArrow
                      classNames={{
                        content: "bg-default-900 text-default-50",
                      }}
                    >
                      <Avatar
                        isBordered
                        name={db[0].toUpperCase()}
                        size="sm"
                        color="default"
                        className="w-6 h-6 sm:w-8 sm:h-8 hover:scale-110 transition-transform duration-200 text-xs sm:text-sm"
                      />
                    </Tooltip>
                  ))}
                </AvatarGroup>
              </div>
            )}
          </div>
        </CardBody>

        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
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
        className="shadow-lg bg-primary-50"
        size="sm"
        startContent={
          !isLoading && <Plus size={18} className="sm:w-5 sm:h-5" />
        }
        variant="shadow"
        onPress={onOpen}
        isLoading={isLoading}
      >
        <span className="text-sm sm:text-base font-medium">Add Connection</span>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Connection
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  endContent={
                    <LinkIcon
                      size={20}
                      className="flex-shrink-0 pointer-events-none text-md text-default-400"
                    />
                  }
                  label="URI"
                  placeholder="Connection URI with username and password"
                  variant="bordered"
                  onChange={(e) => setConnectionURI(e.target.value)}
                />
                <Input
                  endContent={
                    <Pen
                      size={20}
                      className="flex-shrink-0 pointer-events-none text-default-400"
                    />
                  }
                  label="Name"
                  placeholder="Enter a name for this connection"
                  variant="bordered"
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>

                <Button
                  color="primary"
                  onPress={handleAddConnection}
                  isLoading={isLoading}
                >
                  Save
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Connections</h1>
        </div>
        <CreateConnectionModal RunOnSubmit={getConnections} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {connectionList.map((connection, index) => (
          <div
            key={index}
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ConnectionCard {...connection} />
          </div>
        ))}
      </div>
      {connectionList?.length === 0 && (
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
  );
}
