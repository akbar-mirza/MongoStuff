import { create } from "zustand";
import ConnectionAPI, { TConnection } from "../api/connection";
import { toast } from "sonner";

export const useConnectionStore = create<{
  connection: TConnection | null;
  connectionList: TConnection[];
  getConnection: (id: string) => void;
  setConnection: (connection: TConnection) => void;
  clearConnection: () => void;
  getConnections: () => void;
}>((set) => ({
  connection: null,
  connectionList: [],
  setConnection: (connection: TConnection) => set({ connection }),
  clearConnection: () => set({ connection: null }),
  getConnections: async () => {
    const { connections, error } = await ConnectionAPI.ListConnectionsRequest();
    if (error) {
      toast.error(error.error);
      return;
    }
    set({ connectionList: connections });
  },
  getConnection: async (id: string) => {
    const { connection, error } = await ConnectionAPI.GetConnectionRequest(id);
    if (error) {
      toast.error(error.error);
      return;
    }
    set({ connection });
  },
}));
