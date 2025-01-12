import { Get, Post, TErrorResp } from ".";

export type TRestore = {
  connectionID: string;
  type: "Snapshot" | "Backup";
  timestamp: number;
  snapshotID: string;
  restoreConnectionID: string;
  backupID: string;
  logs: string;
  status: string;
  duration: number;
  restoreID: string;
};

export const ListRestoreRequest = async (connectionID: string) => {
  const [restores, error] = await Get<
    {
      restores: TRestore[];
    },
    TErrorResp
  >(`restore/${connectionID}`);
  return { restores: restores?.restores, error };
};

export const GetRestoreRequest = async (
  connectionID: string,
  restoreID: string
) => {
  const [restore, error] = await Get<TRestore, TErrorResp>(
    `restore/${connectionID}/${restoreID}`
  );
  return { restore, error };
};

export const RestoreSnapshot = async (params: {
  connectionID: string;
  snapshotID: string;
  database?: string;
  collection?: string;
  update?: boolean;
}) => {
  const { connectionID, snapshotID, database, collection, update } = params;
  const [restore, error] = await Post<
    object,
    TErrorResp,
    {
      message: string;
      restore: TRestore;
    }
  >(`restore/${connectionID}/${snapshotID}`, {
    database,
    collection,
    update,
  });
  return { restore, error };
};

const RestoreAPI = {
  ListRestoreRequest,
  GetRestoreRequest,
  RestoreSnapshot,
};

export default RestoreAPI;
