import { Post, TErrorResp, Get, Put, Delete, Patch } from ".";

export type TStorageType = "s3" | "r2" | "local";

export type TStorageConfig = {
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  folder: string;
};

export type TStorage = {
  name: string;
  storageID: string;
  type: TStorageType;
  createdAt: string;
  userID: string;
  isDefault?: boolean;
  storage: TStorageConfig;
};

export type TAddStorageParams = {
  Name: string;
  Type: TStorageType;
  Storage: {
    Bucket: string;
    Region: string;
    AccessKey: string;
    SecretKey: string;
    Folder: string;
  };
  isDefault?: boolean;
};

// Helper function to transform API response to frontend model
const transformStorageResponse = (storage: any): TStorage => {
  return {
    name: storage.name,
    storageID: storage.storageID,
    type: storage.type,
    createdAt: storage.createdAt,
    userID: storage.userID,
    isDefault: storage.isDefault || false,
    storage: {
      bucket: storage.storage.bucket,
      region: storage.storage.region,
      accessKey: storage.storage.accessKey,
      secretKey: storage.storage.secretKey,
      folder: storage.storage.folder,
    }
  };
};

const AddStorage = async (params: TAddStorageParams) => {
  const [response, error] = await Post<
    TAddStorageParams,
    {
      message: string;
      storage: any;
    },
    TErrorResp
  >(`storage/`, params);
  
  return { 
    storage: response?.storage ? transformStorageResponse(response.storage) : null, 
    error 
  };
};

const ListStorage = async () => {
  const [storagesResponse, error] = await Get<any[], TErrorResp>(`storage`);
  const storages = storagesResponse?.map(storage => transformStorageResponse(storage)) || [];
  return { storages, error };
};

const GetStorage = async (storageID: string) => {
  const [storageResponse, error] = await Get<any, TErrorResp>(
    `storage/${storageID}`
  );
  
  const storage = storageResponse ? transformStorageResponse(storageResponse) : null;
  return { storage, error };
};

const UpdateStorage = async (storageID: string, params: TAddStorageParams) => {
  const [response, error] = await Patch<
    TAddStorageParams,
    { storage: any },
    TErrorResp
  >(`storage/${storageID}`, params);
  
  return { 
    storage: response?.storage ? transformStorageResponse(response.storage) : null, 
    error 
  };
};

const DeleteStorage = async (storageID: string) => {
  const [storage, error] = await Delete<{}, { message: string }, TErrorResp>(
    `storage/${storageID}`,
    {}
  );
  return { storage, error };
};

const SetDefaultStorage = async (storageID: string) => {
  const [response, error] = await Patch<
    {
      isDefault: boolean;
    },
    { storage: any },
    TErrorResp
  >(`storage/${storageID}/default`, {
    isDefault: true,
  });
  
  return { 
    storage: response?.storage ? transformStorageResponse(response.storage) : null, 
    error 
  };
};

export {
  AddStorage,
  ListStorage,
  GetStorage,
  UpdateStorage,
  DeleteStorage,
  SetDefaultStorage,
};
