import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User-configurable pricing rates used to convert projected bytes into
 * dollar estimates. Defaults are S3-like pricing:
 * - Storage: $0.023 per GB-month
 * - Egress (data transfer out of the source database): $0.09 per GB
 */
export const DEFAULT_STORAGE_RATE_PER_GB_MONTH = 0.023;
export const DEFAULT_EGRESS_RATE_PER_GB = 0.09;

type CostRatesStore = {
  storageRatePerGBMonth: number;
  egressRatePerGB: number;

  setRates: (rates: {
    storageRatePerGBMonth: number;
    egressRatePerGB: number;
  }) => void;
  resetRates: () => void;
};

export const useCostRatesStore = create<CostRatesStore>()(
  persist(
    (set) => ({
      storageRatePerGBMonth: DEFAULT_STORAGE_RATE_PER_GB_MONTH,
      egressRatePerGB: DEFAULT_EGRESS_RATE_PER_GB,

      setRates: (rates) =>
        set({
          storageRatePerGBMonth: rates.storageRatePerGBMonth,
          egressRatePerGB: rates.egressRatePerGB,
        }),

      resetRates: () =>
        set({
          storageRatePerGBMonth: DEFAULT_STORAGE_RATE_PER_GB_MONTH,
          egressRatePerGB: DEFAULT_EGRESS_RATE_PER_GB,
        }),
    }),
    {
      name: "mongostuff-cost-rates",
    }
  )
);
