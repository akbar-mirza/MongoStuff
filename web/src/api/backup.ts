/**
 * Backup API Handler Functions
 *
 * This file implements all API handler functions corresponding to the backup controller
 * endpoints defined in src/controllers/backup.controller.go
 *
 * Implemented Functions:
 * - CreateBackupPolicyRequest: Create a new backup policy
 * - GetBackupPolicyRequest: Get a specific backup policy by ID
 * - GetBackupPoliciesRequest: Get all backup policies for a connection
 * - GetAllBackupPoliciesRequest: Get all backup policies (requires route)
 * - UpdateBackupPolicyRequest: Update an existing backup policy
 * - DeleteBackupPolicyRequest: Delete a backup policy
 * - TriggerBackupRequest: Manually trigger a backup (requires route)
 * - GetBackupsForPolicyRequest: Get all backups for a policy (requires route)
 * - GetBackupsForConnectionRequest: Get all backups for a connection (requires route)
 *
 * Note: Some functions require additional routes to be added to main.go as indicated
 * in the comments above each function.
 */

import { Delete, Get, Patch, Post, Put, TErrorResp } from ".";

export type TBackupPolicy = {
  interval: number;
  timeUnit: string;
  keep: number;
  retention: number;
  name: string;
  status: string;
  compression: boolean;
  connectionID: string;
  storageID: string;
  backupPolicyID: string;
  isClusterBackup: boolean;
  database: string;
  collection: string;
  isDeleted: boolean;
  nextRun: number;
};

export type TBackup = {
  backupID: string;
  timestamp: number;
  status: string;
  backupPolicyID: string;
  logs: string;
  duration: number;
  size: number;
  artifact: {
    [key: string]: any;
  };
  storageID: string;
  isDeleted: boolean;
  toBeDeletedAt: number;
  isTriggered: boolean;
};

export type TBackupWithPolicyName = TBackup & {
  policyName: string;
};

const CreateBackupPolicyRequest = async (
  connectionID: string,
  policy: Omit<TBackupPolicy, "backupPolicyID" | "connectionID" | "isDeleted">
) => {
  const [response, error] = await Post<
    Omit<TBackupPolicy, "backupPolicyID" | "connectionID" | "isDeleted">,
    {
      message: string;
      backupPolicy: TBackupPolicy;
    },
    TErrorResp
  >(`backup-policy/${connectionID}`, policy);
  return { backupPolicy: response?.backupPolicy, error };
};

const GetBackupPolicyRequest = async (
  connectionID: string,
  backupPolicyID: string
) => {
  const [response, error] = await Get<
    {
      backupPolicy: TBackupPolicy;
    },
    TErrorResp
  >(`backup-policy/${connectionID}/${backupPolicyID}`);
  return { backupPolicy: response?.backupPolicy, error };
};

const GetBackupPoliciesRequest = async (connectionID: string) => {
  const [response, error] = await Get<
    {
      backupPolicies: TBackupPolicy[];
    },
    TErrorResp
  >(`backup-policy/${connectionID}`);
  return { backupPolicies: response?.backupPolicies, error };
};

// Note: This endpoint is not currently routed in main.go
// You may need to add: backupPolicyGroup.Get("/", controllers.GetAllBackupPolicies)
const GetAllBackupPoliciesRequest = async () => {
  const [response, error] = await Get<
    {
      backupPolicies: TBackupPolicy[];
    },
    TErrorResp
  >(`backup-policy`);
  return { backupPolicies: response?.backupPolicies, error };
};

const UpdateBackupPolicyRequest = async (
  connectionID: string,
  backupPolicyID: string,
  policy: Partial<Omit<TBackupPolicy, "backupPolicyID" | "connectionID">>
) => {
  const [response, error] = await Patch<
    Partial<Omit<TBackupPolicy, "backupPolicyID" | "connectionID">>,
    {
      message: string;
      backupPolicy: TBackupPolicy;
    },
    TErrorResp
  >(`backup-policy/${connectionID}/${backupPolicyID}`, policy);
  return { backupPolicy: response?.backupPolicy, error };
};

const DeleteBackupPolicyRequest = async (
  connectionID: string,
  backupPolicyID: string
) => {
  const [response, error] = await Delete<
    null,
    {
      message: string;
      backupPolicy: TBackupPolicy;
    },
    TErrorResp
  >(`backup-policy/${connectionID}/${backupPolicyID}`, null);
  return { backupPolicy: response?.backupPolicy, error };
};

// Note: This endpoint is not currently routed in main.go
// You may need to add: backupPolicyGroup.Post("/:ConnID/:BackupPolicyID/trigger", middlewares.IsConnectionBelongToUser, controllers.TriggerBackup)
const TriggerBackupRequest = async (
  connectionID: string,
  backupPolicyID: string
) => {
  const [response, error] = await Put<
    null,
    {
      message: string;
    },
    TErrorResp
  >(`backup-policy/${connectionID}/${backupPolicyID}/trigger`, null);
  return { message: response?.message, error };
};

// Note: This endpoint is not currently routed in main.go
// You may need to add: backupPolicyGroup.Get("/:ConnID/:BackupPolicyID/backups", middlewares.IsConnectionBelongToUser, controllers.BackupsForPolicy)
const GetBackupsForPolicyRequest = async (
  connectionID: string,
  backupPolicyID: string
) => {
  const [response, error] = await Get<
    {
      backups: TBackup[];
    },
    TErrorResp
  >(`backup-policy/${connectionID}/${backupPolicyID}/backups`);
  return { backups: response?.backups, error };
};

// Note: This endpoint is not currently routed in main.go
// You may need to add a new backup group: backupGroup.Get("/:ConnID", middlewares.IsConnectionBelongToUser, controllers.BackupsForConnection)
const GetBackupsForConnectionRequest = async (connectionID: string) => {
  const [response, error] = await Get<
    {
      backups: TBackupWithPolicyName[];
    },
    TErrorResp
  >(`backup/${connectionID}`);
  return { backups: response?.backups, error };
};

const BackupAPI = {
  CreateBackupPolicyRequest,
  GetBackupPolicyRequest,
  GetBackupPoliciesRequest,
  GetAllBackupPoliciesRequest,
  UpdateBackupPolicyRequest,
  DeleteBackupPolicyRequest,
  TriggerBackupRequest,
  GetBackupsForPolicyRequest,
  GetBackupsForConnectionRequest,
};

export default BackupAPI;
