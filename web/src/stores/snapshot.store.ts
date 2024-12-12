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
  getSnapshots: async (connectionID: string) => {
    const { snapshots, error } = await SnapShotAPI.ListSnapShotRequest(
      connectionID
    );
    if (error) {
      toast.error(error.error);
      return;
    }
    set({ snapshotList: snapshots });
  },
  clearSnapshot: () => set({ snapshot: null }),
  setSnapshot: (snapshot: TSnapShot | null) => {
    set({ snapshot });
  },
}));
