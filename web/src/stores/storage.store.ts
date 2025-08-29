import { create } from "zustand";
import { toast } from "sonner";
import {
  TStorage,
  TAddStorageParams,
  AddStorage,
  ListStorage,
  GetStorage,
  UpdateStorage,
  DeleteStorage,
  SetDefaultStorage,
} from "../api/storage";

type StorageStore = {
  storage: TStorage | null;
  storageList: TStorage[];
  isLoading: boolean;
  setStorage: (storage: TStorage) => void;
  clearStorage: () => void;
  getStorages: () => Promise<void>;
  getStorage: (storageID: string) => Promise<void>;
  addStorage: (params: TAddStorageParams) => Promise<boolean>;
  updateStorage: (
    storageID: string,
    params: TAddStorageParams
  ) => Promise<boolean>;
  deleteStorage: (storageID: string) => Promise<boolean>;
  setDefaultStorage: (storageID: string) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
};

export const useStorageStore = create<StorageStore>((set, get) => ({
  storage: null,
  storageList: [],
  isLoading: false,

  setStorage: (storage: TStorage) => set({ storage }),
  clearStorage: () => set({ storage: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  getStorages: async () => {
    set({ isLoading: true });
    try {
      const { storages, error } = await ListStorage();
      if (error) {
        toast.error(error.error || "Failed to fetch storages");
        return;
      }
      set({ storageList: storages || [] });
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to fetch storages:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  getStorage: async (storageID: string) => {
    set({ isLoading: true });
    try {
      const { storage, error } = await GetStorage(storageID);
      if (error) {
        toast.error(error.error || "Failed to fetch storage");
        return;
      }
      set({ storage });
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to fetch storage:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  addStorage: async (params: TAddStorageParams) => {
    set({ isLoading: true });
    try {
      const { storage, error } = await AddStorage(params);
      if (error) {
        toast.error(error.error || "Failed to add storage");
        return false;
      }
      if (storage) {
        const currentList = get().storageList;
        set({ storageList: [...currentList, storage] });
        toast.success("Storage added successfully");
      }
      return true;
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to add storage:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateStorage: async (storageID: string, params: TAddStorageParams) => {
    set({ isLoading: true });
    try {
      const { storage, error } = await UpdateStorage(storageID, params);
      if (error) {
        toast.error(error.error || "Failed to update storage");
        return false;
      }
      if (storage) {
        const currentList = get().storageList;
        const updatedList = currentList.map((s) =>
          s.storageID === storageID ? storage : s
        );
        set({ storageList: updatedList });
        if (get().storage?.storageID === storageID) {
          set({ storage });
        }
        toast.success("Storage updated successfully");
      }
      return true;
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to update storage:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteStorage: async (storageID: string) => {
    set({ isLoading: true });
    try {
      const { error } = await DeleteStorage(storageID);
      if (error) {
        toast.error(error.error || "Failed to delete storage");
        return false;
      }
      const currentList = get().storageList;
      const updatedList = currentList.filter((s) => s.storageID !== storageID);
      set({ storageList: updatedList });
      if (get().storage?.storageID === storageID) {
        set({ storage: null });
      }
      toast.success("Storage deleted successfully");
      return true;
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to delete storage:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  setDefaultStorage: async (storageID: string) => {
    set({ isLoading: true });
    try {
      const { storage, error } = await SetDefaultStorage(storageID);
      if (error) {
        toast.error(error.error || "Failed to set default storage");
        return false;
      }
      if (storage) {
        const currentList = get().storageList;
        const updatedList = currentList.map((s) => ({
          ...s,
          isDefault: s.storageID === storageID,
        }));
        set({ storageList: updatedList });
        if (get().storage?.storageID === storageID) {
          set({ storage: { ...get().storage!, isDefault: true } });
        }
        toast.success("Default storage updated successfully");
      }
      return true;
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Failed to set default storage:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
