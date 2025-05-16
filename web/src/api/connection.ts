import { Get, Post, TErrorResp } from ".";

export type TConnection = {
  _id: string;
  connectionID: string;
  databases: string[];
  host: string;
  name: string;
  password: string;
  port: string;
  scheme: string;
  uri: string;
  collections: {
    database: string;
    collections: string[];
  }[];
};
const ListConnectionsRequest = async () => {
  const [connections, error] = await Get<
    {
      connections: TConnection[];
    },
    TErrorResp
  >("connection");
  return { connections: connections?.connections, error };
};

const GetConnectionRequest = async (connectionID: string) => {
  const [connection, error] = await Get<TConnection, TErrorResp>(
    `connection/${connectionID}`
  );
  return { connection, error };
};

const CreateConnectionRequest = async (body: {
  uri: string;
  name: string;
  userID: string;
}) => {
  const [connection, error] = await Post<
    {
      uri: string;
      name: string;
      userID: string;
    },
    {
      connection: TConnection;
    },
    TErrorResp
  >("connection", body);
  return { connection: connection?.connection, error };
};

const SyncConnectionRequest = async (connectionID: string) => {
  const [connection, error] = await Get<
    {
      connection: TConnection;
    },
    TErrorResp
  >(`connection/${connectionID}/sync-db`);
  return { connection: connection?.connection, error };
};

const ConnectionAPI = {
  ListConnectionsRequest,
  GetConnectionRequest,
  CreateConnectionRequest,
  SyncConnectionRequest,
};

export default ConnectionAPI;
