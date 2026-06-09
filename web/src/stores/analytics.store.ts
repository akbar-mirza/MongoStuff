import { create } from "zustand";
import { toast } from "sonner";
import AnalyticsAPI, {
  TConnectionAnalytics,
  TOverviewAnalytics,
} from "../api/analytics";

type AnalyticsStore = {
  connectionAnalytics: TConnectionAnalytics | null;
  overview: TOverviewAnalytics | null;

  isLoadingConnection: boolean;
  isLoadingOverview: boolean;

  getConnectionAnalytics: (connectionID: string) => Promise<void>;
  getOverviewAnalytics: () => Promise<void>;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  connectionAnalytics: null,
  overview: null,
  isLoadingConnection: false,
  isLoadingOverview: false,

  getConnectionAnalytics: async (connectionID: string) => {
    set({ isLoadingConnection: true });
    const { analytics, error } =
      await AnalyticsAPI.GetConnectionAnalyticsRequest(connectionID);
    if (error) {
      toast.error(error.error);
      set({ isLoadingConnection: false });
      return;
    }
    set({ connectionAnalytics: analytics ?? null, isLoadingConnection: false });
  },

  getOverviewAnalytics: async () => {
    set({ isLoadingOverview: true });
    const { analytics, error } =
      await AnalyticsAPI.GetOverviewAnalyticsRequest();
    if (error) {
      toast.error(error.error);
      set({ isLoadingOverview: false });
      return;
    }
    set({ overview: analytics ?? null, isLoadingOverview: false });
  },
}));
