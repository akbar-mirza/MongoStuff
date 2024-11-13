import { Get, Post, TErrorResp } from ".";

export type TSnapShot = {
  connectionID: string;
  isClusterSnapshot: boolean;
  snapshotID: string;
  database: string;
  timestamp: number;
  status: string;
  logs: string;
  duration: number;
  size: number;
};

const ListSnapShotRequest = async (connectionID: string) => {
  const [snapshots, error] = await Get<
    {
      snapshots: TSnapShot[];
    },
    TErrorResp
  >(`snapshot/${connectionID}`);
  return { snapshots: snapshots?.snapshots, error };
};

const GetSnapShotRequest = async (connectionID: string, snapshotID: string) => {
  const [snapshot, error] = await Get<TSnapShot, TErrorResp>(
    `snapshot/${connectionID}/${snapshotID}`,
  );
  return { snapshot, error };
};

const TakeSnapShotRequest = async (
  connectionID: string,
  params?: {
    database?: string;
    compression?: boolean;
  },
) => {
  const [snapshot, error] = await Post<
    {
      database?: string;
      compression?: boolean;
    },
    {
      message: string;
      snapshot: TSnapShot;
    },
    TErrorResp
  >(`snapshot/${connectionID}/`, {
    database: params?.database,
    compression: params?.compression,
  });
  return { snapshot: snapshot?.snapshot, error };
};

const SnapShotAPI = {
  ListSnapShotRequest,
  GetSnapShotRequest,
  TakeSnapShotRequest,
};

export default SnapShotAPI;
