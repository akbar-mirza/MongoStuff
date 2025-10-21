import { create } from "zustand";
import BackupAPI, {
  TBackupPolicy,
  TBackup,
  TBackupWithPolicyName,
} from "../api/backup";
import { toast } from "sonner";

type BackupStore = {
  // Backup Policies
  backupPolicy: TBackupPolicy | null;
  backupPolicies: TBackupPolicy[];

  // Backup Logs
  backups: (TBackup | TBackupWithPolicyName)[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isTriggeringBackup: boolean;

  // Polling for active backups
  enablePolling: boolean;

  // Actions for Backup Policies
  getBackupPolicy: (
    connectionID: string,
    backupPolicyID: string
  ) => Promise<void>;
  getBackupPolicies: (connectionID: string) => Promise<void>;
  getAllBackupPolicies: () => Promise<void>;
  createBackupPolicy: (
    connectionID: string,
    policy: Omit<TBackupPolicy, "backupPolicyID" | "connectionID" | "isDeleted">
  ) => Promise<boolean>;
  updateBackupPolicy: (
    connectionID: string,
    backupPolicyID: string,
    policy: Partial<Omit<TBackupPolicy, "backupPolicyID" | "connectionID">>
  ) => Promise<boolean>;
  deleteBackupPolicy: (
    connectionID: string,
    backupPolicyID: string
  ) => Promise<boolean>;
  triggerBackup: (
    connectionID: string,
    backupPolicyID: string
  ) => Promise<boolean>;

  // Actions for Backup Logs
  getBackupsForPolicy: (
    connectionID: string,
    backupPolicyID: string
  ) => Promise<void>;
  getBackupsForConnection: (connectionID: string) => Promise<void>;

  // Utility actions
  clearBackupPolicy: () => void;
  setBackupPolicy: (policy: TBackupPolicy | null) => void;
  findBackupPolicy: (backupPolicyID: string) => TBackupPolicy | undefined;
};

export const useBackupStore = create<BackupStore>((set, get) => ({
  // Initial state
  backupPolicy: null,
  backupPolicies: [],
  backups: [],
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isTriggeringBackup: false,
  enablePolling: false,

  // Backup Policy Actions
  getBackupPolicy: async (connectionID: string, backupPolicyID: string) => {
    set({ isLoading: true });
    const { backupPolicy, error } = await BackupAPI.GetBackupPolicyRequest(
      connectionID,
      backupPolicyID
    );
    if (error) {
      toast.error(error.error);
      set({ isLoading: false });
      return;
    }
    set({ backupPolicy, isLoading: false });
  },

  getBackupPolicies: async (connectionID: string) => {
    set({ isLoading: true });
    const { backupPolicies, error } = await BackupAPI.GetBackupPoliciesRequest(
      connectionID
    );
    if (error) {
      toast.error(error.error);
      set({ isLoading: false });
      return;
    }

    // Check if any backup policies have active status for polling
    const enablePolling = backupPolicies?.some(
      (policy) => policy.status === "Active"
    );

    set({
      backupPolicies: backupPolicies ?? [],
      enablePolling,
      isLoading: false,
    });
  },

  getAllBackupPolicies: async () => {
    set({ isLoading: true });
    const { backupPolicies, error } =
      await BackupAPI.GetAllBackupPoliciesRequest();
    if (error) {
      toast.error(error.error);
      set({ isLoading: false });
      return;
    }
    set({ backupPolicies: backupPolicies ?? [], isLoading: false });
  },

  createBackupPolicy: async (
    connectionID: string,
    policy: Omit<TBackupPolicy, "backupPolicyID" | "connectionID" | "isDeleted">
  ) => {
    set({ isCreating: true });
    const { error } = await BackupAPI.CreateBackupPolicyRequest(
      connectionID,
      policy
    );
    if (error) {
      toast.error(error.error);
      set({ isCreating: false });
      return false;
    }

    toast.success("Backup policy created successfully");

    // Refresh the backup policies list
    get().getBackupPolicies(connectionID);
    set({ isCreating: false });
    return true;
  },

  updateBackupPolicy: async (
    connectionID: string,
    backupPolicyID: string,
    policy: Partial<Omit<TBackupPolicy, "backupPolicyID" | "connectionID">>
  ) => {
    set({ isUpdating: true });
    const { error } = await BackupAPI.UpdateBackupPolicyRequest(
      connectionID,
      backupPolicyID,
      policy
    );
    if (error) {
      toast.error(error.error);
      set({ isUpdating: false });
      return false;
    }

    toast.success("Backup policy updated successfully");

    // Refresh the backup policies list
    get().getBackupPolicies(connectionID);
    set({ isUpdating: false });
    return true;
  },

  deleteBackupPolicy: async (connectionID: string, backupPolicyID: string) => {
    set({ isDeleting: true });
    const { error } = await BackupAPI.DeleteBackupPolicyRequest(
      connectionID,
      backupPolicyID
    );
    if (error) {
      toast.error(error.error);
      set({ isDeleting: false });
      return false;
    }

    toast.success("Backup policy deleted successfully");

    // Refresh the backup policies list
    get().getBackupPolicies(connectionID);
    set({ isDeleting: false });
    return true;
  },

  triggerBackup: async (connectionID: string, backupPolicyID: string) => {
    set({ isTriggeringBackup: true });
    const { error } = await BackupAPI.TriggerBackupRequest(
      connectionID,
      backupPolicyID
    );
    if (error) {
      toast.error(error.error);
      set({ isTriggeringBackup: false });
      return false;
    }

    toast.success("Backup triggered successfully");
    set({ isTriggeringBackup: false });
    return true;
  },

  // Backup Logs Actions
  getBackupsForPolicy: async (connectionID: string, backupPolicyID: string) => {
    set({ isLoading: true });
    const { backups, error } = await BackupAPI.GetBackupsForPolicyRequest(
      connectionID,
      backupPolicyID
    );
    if (error) {
      toast.error(error.error);
      set({ isLoading: false });
      return;
    }

    // Check if any backups are in processing state for polling
    const enablePolling = backups?.some(
      (backup) => backup.status === "Processing" || backup.status === "Queued"
    );

    set({ backups: backups ?? [], enablePolling, isLoading: false });
  },

  getBackupsForConnection: async (connectionID: string) => {
    set({ isLoading: true });
    const { backups, error } = await BackupAPI.GetBackupsForConnectionRequest(
      connectionID
    );
    if (error) {
      toast.error(error.error);
      set({ isLoading: false });
      return;
    }

    // Check if any backups are in processing state for polling
    const enablePolling = backups?.some(
      (backup) => backup.status === "Processing" || backup.status === "Queued"
    );

    set({ backups: backups ?? [], enablePolling, isLoading: false });
  },

  // Utility actions
  clearBackupPolicy: () => set({ backupPolicy: null }),

  setBackupPolicy: (policy: TBackupPolicy | null) => {
    set({ backupPolicy: policy });
  },

  findBackupPolicy: (backupPolicyID: string): TBackupPolicy | undefined => {
    return get().backupPolicies.find(
      (policy) => policy.backupPolicyID === backupPolicyID
    );
  },
}));
