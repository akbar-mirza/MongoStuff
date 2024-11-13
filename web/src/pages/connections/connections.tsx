import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spacer,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { LinkIcon, Pen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConnectionAPI, { TConnection } from "../../api/connection";
import { useConnectionStore } from "../../stores/connection.store";

export function ConnectionCard(props: TConnection) {
  return (
    <Card
      isBlurred
      className="cursor-pointer border-1 border-slate-500 bg-background/100 dark:bg-default-100/50 hover:border-1 hover:border-primary hover:shadow-lg"
      shadow="sm"
    >
      <Link to={`/connection/${props.connectionID}`}>
        <CardHeader className="flex gap-3">
          <Avatar
            isBordered
            name={props.name.slice(0, 2).toUpperCase()}
            size="md"
            className="bg-primary-50"
          />
          <div className="flex flex-col">
            <p className="text-md">{props.name}</p>
            <p className="text-small text-default-500">
              {props.host.split(".")[0]}
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-default-500">Databases</p>
            <AvatarGroup isBordered max={3}>
              {props?.databases?.map((db, index) => (
                <Tooltip content={db}>
                  <Avatar
                    isBordered
                    key={index}
                    name={db[0].toUpperCase()}
                    size="sm"
                    color="primary"
                  />
                </Tooltip>
              ))}
            </AvatarGroup>
          </div>
        </CardBody>
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

    const { connection, error } = await ConnectionAPI.CreateConnectionRequest({
      uri: connectionURI,
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
        // color="primary"
        className="shadow-lg bg-primary-50"
        size="sm"
        startContent={!isLoading && <Plus size={20} />}
        variant="shadow"
        onPress={onOpen}
        isLoading={isLoading}
      >
        Add Connection
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
                  onPress={handleAddConnection}
                  className="bg-primary-50"
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
    <div className="p-6">
      <div className="flex justify-end w-full">
        <CreateConnectionModal RunOnSubmit={getConnections} />
      </div>
      <Spacer y={2} />
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 md:grid-cols-2">
        {connectionList.map((connection, index) => (
          <ConnectionCard key={index} {...connection} />
        ))}
      </div>
    </div>
  );
}
