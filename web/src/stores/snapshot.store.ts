import { create } from "zustand";
import SnapShotAPI, { TSnapShot } from "../api/snapshot";
import { toast } from "sonner";

type Props = {
  snapshot: TSnapShot | null;
  snapshotList: TSnapShot[];
  getSnapshot: (connectionID: string, snapshotID: string) => void;
  getSnapshots: (connectionID: string) => void;
  clearSnapshot: () => void;
  setSnapshot: (snapshot: TSnapShot | null) => void;
  findSnapshot: (snapshotID: string) => TSnapShot | undefined;
  enablePolling: boolean; // when any snapshot is in Queued or Processing state, enable polling
};
export const useSnapshotStore = create<Props>((set) => ({
  snapshot: null,
  snapshotList: [],
  getSnapshot: async (connectionID: string, snapshotID: string) => {
    const { snapshot, error } = await SnapShotAPI.GetSnapShotRequest(
      connectionID,
      snapshotID
    );
    if (error) {
      toast.error(error.error);
      return;
    }
    set({ snapshot });
  },
  findSnapshot: (snapshotID: string): TSnapShot | undefined => {
    return (
      useSnapshotStore
        .getState()
        .snapshotList.find((s) => s.snapshotID === snapshotID) ?? undefined
    );
  },
  getSnapshots: async (connectionID: string) => {
    const { snapshots, error } = await SnapShotAPI.ListSnapShotRequest(
      connectionID
    );
    if (error) {
      toast.error(error.error);
      return;
    }
    const enablePolling = snapshots?.some(
      (s) => s.status === "Queued" || s.status === "Processing"
    );
    set({ enablePolling });
    set({ snapshotList: snapshots ?? [] });
  },
  clearSnapshot: () => set({ snapshot: null }),
  setSnapshot: (snapshot: TSnapShot | null) => {
    set({ snapshot });
  },
  enablePolling: false,
}));
