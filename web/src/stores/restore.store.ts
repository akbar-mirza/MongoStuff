import { create } from "zustand";
import RestoreAPI, { TRestore } from "../api/restore";

export const useRestoreStore = create<{
  restore: TRestore | null;
  restoreList: TRestore[];
  getRestore: (connID: string, restoreID: string) => void;
  setRestore: (restore: TRestore | null) => void;
  clearRestore: () => void;
  getRestores: (connID: string) => void;
}>((set) => ({
  restore: null,
  restoreList: [],
  getRestore: async (connID: string, restoreID: string) => {
    const { restore, error } = await RestoreAPI.GetRestoreRequest(
      connID,
      restoreID
    );
    if (error) {
      console.error(error);
      return;
    }
    set({ restore });
  },
  setRestore: (restore: TRestore | null) => set({ restore }),
  clearRestore: () => set({ restore: null }),
  getRestores: async (connID: string) => {
    const { restores, error } = await RestoreAPI.ListRestoreRequest(connID);
    if (error) {
      console.error(error);
      return;
    }
    set({ restoreList: (restores as TRestore[]) || [] });
  },
}));
