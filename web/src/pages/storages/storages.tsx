import {
  Avatar,
  Button,
  Card,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  Cloud,
  Copy,
  Edit,
  FolderOpen,
  HelpCircle,
  MoreVertical,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { TAddStorageParams, TStorage, TStorageType } from "../../api/storage";
import EmptyState from "../../components/emptyState";
import { useStorageStore } from "../../stores/storage.store";

export function StorageCard(
  props: TStorage & { onEdit: (storage: TStorage) => void }
) {
  const { deleteStorage, setDefaultStorage } = useStorageStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteStorage(props.storageID);
    setIsDeleting(false);
    onDeleteOpenChange();
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);
    await setDefaultStorage(props.storageID);
    setIsSettingDefault(false);
  };

  const handleEdit = () => {
    props.onEdit(props);
  };

  return (
    <>
      <Card
        isPressable
        className="group h-full flex flex-col w-full hover:-translate-y-1 transition-all duration-300 ease-out"
        shadow="sm"
        classNames={{
          base: "bg-content1 border-divider hover:border-primary hover:shadow-primary/20",
          body: "p-0",
          header: "p-0",
        }}
      >
        {/* Header Section with Status and Actions */}
        <div className="flex items-start justify-between p-3 sm:p-4 pb-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar isBordered icon={props.type.toUpperCase()} size="md" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors duration-200 truncate">
                  {props.name}
                </h3>
                {props.isDefault && (
                  <Chip
                    startContent={<Star size={10} />}
                    size="sm"
                    color="warning"
                    variant="flat"
                    className="text-xs"
                  >
                    Default
                  </Chip>
                )}
              </div>
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="flex-shrink-0 ml-2">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Storage actions" closeOnSelect={true}>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  className="text-default-500"
                  onPress={handleEdit}
                >
                  Edit
                </DropdownItem>
                {!props.isDefault ? (
                  <DropdownItem
                    key="default"
                    startContent={<Star size={16} />}
                    className="text-warning-500"
                    onPress={handleSetDefault}
                    isDisabled={isSettingDefault}
                  >
                    {isSettingDefault ? "Setting..." : "Set as Default"}
                  </DropdownItem>
                ) : null}
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 size={16} />}
                  className="text-danger-500"
                  color="danger"
                  onPress={onDeleteOpen}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Body Section with Storage Details */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex-grow flex flex-col">
          <div className="space-y-4 flex-grow">
            {/* Storage stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-medium bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200 border border-primary/20">
                <FolderOpen size={14} className="text-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-primary truncate font-medium">
                    Bucket
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">
                    {props.storage.bucket}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 rounded-medium bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200 border border-primary/20">
                <Cloud size={14} className="text-primary flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-primary truncate font-medium">
                    Region
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">
                    {props.storage.region || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage configuration details */}
            {props.storage.folder && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Configuration
                  </span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-medium bg-default-100/50 border border-divider">
                  <FolderOpen
                    size={12}
                    className="text-default-600 flex-shrink-0"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs text-default-600 font-medium">
                      Folder
                    </span>
                    <span className="text-xs font-medium text-foreground truncate">
                      {props.storage.folder}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Created date */}
          <div className="text-xs text-default-500 pt-3 mt-auto border-divider">
            Created: {new Date(props.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Subtle hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-danger-100">
                    <Trash2 size={20} className="text-danger-600" />
                  </div>
                  <span>Delete Storage</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <p className="text-default-600">
                    Are you sure you want to delete{" "}
                    <strong>"{props.name}"</strong>?
                  </p>
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-medium">
                    <p className="text-sm text-danger-700">
                      <strong>Warning:</strong> This action cannot be undone.
                      Any backups using this storage will be affected.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDelete}
                  isLoading={isDeleting}
                  startContent={!isDeleting && <Trash2 size={16} />}
                >
                  {isDeleting ? "Deleting..." : "Delete Storage"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export function EditStorageModal(props: {
  storage: TStorage | null;
  isOpen: boolean;
  onClose: () => void;
  RunOnSubmit: () => void;
}) {
  const { updateStorage, isLoading } = useStorageStore();

  const [formData, setFormData] = useState<TAddStorageParams>({
    Name: "",
    Type: "s3",
    Storage: {
      Bucket: "",
      Folder: "",
      Region: "",
      AccessKey: "",
      SecretKey: "",
    },
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when storage prop changes
  useEffect(() => {
    if (props.storage) {
      setFormData({
        Name: props.storage.name,
        Type: props.storage.type,
        isDefault: props.storage.isDefault,
        Storage: {
          Bucket: props.storage.storage.bucket,
          Folder: props.storage.storage.folder || "",
          Region: props.storage.storage.region || "",
          AccessKey: props.storage.storage.accessKey || "",
          SecretKey: props.storage.storage.secretKey || "",
        },
      });
    }
  }, [props.storage]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.Name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.Storage.Bucket.trim()) {
      newErrors.bucket = "Bucket is required";
    }

    if (formData.Type !== "local") {
      if (!formData.Storage.AccessKey.trim()) {
        newErrors.accessKey = "Access Key is required";
      }
      if (!formData.Storage.SecretKey.trim()) {
        newErrors.secretKey = "Secret Key is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !props.storage) return;

    const success = await updateStorage(props.storage.storageID, formData);
    if (success) {
      setErrors({});
      props.onClose();
      props.RunOnSubmit();
    }
  };

  const updateStorageField = (
    field: keyof TAddStorageParams["Storage"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      Storage: {
        ...prev.Storage,
        [field]: value,
      },
    }));
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onOpenChange={props.onClose}
      placement="top-center"
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Edit Storage Configuration
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Storage Name"
                  placeholder="Enter storage name"
                  variant="bordered"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, Name: e.target.value }))
                  }
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                />

                <Select
                  label="Storage Type"
                  variant="bordered"
                  selectedKeys={[formData.Type]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as TStorageType;
                    setFormData((prev) => ({ ...prev, Type: selected }));
                  }}
                >
                  <SelectItem key="s3">Amazon S3</SelectItem>
                  <SelectItem key="r2">Cloudflare R2</SelectItem>
                  <SelectItem key="local">Local Storage</SelectItem>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bucket Name"
                  placeholder="Enter bucket name"
                  variant="bordered"
                  value={formData.Storage.Bucket}
                  onChange={(e) => updateStorageField("Bucket", e.target.value)}
                  isInvalid={!!errors.bucket}
                  errorMessage={errors.bucket}
                />

                <Input
                  label="Folder Path"
                  placeholder="Enter folder path (optional)"
                  variant="bordered"
                  value={formData.Storage.Folder}
                  onChange={(e) => updateStorageField("Folder", e.target.value)}
                />
              </div>

              {formData.Type !== "local" && (
                <>
                  <Input
                    label="Region"
                    placeholder="Enter region (e.g., us-east-1)"
                    variant="bordered"
                    value={formData.Storage.Region}
                    onChange={(e) =>
                      updateStorageField("Region", e.target.value)
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Access Key"
                      placeholder="Enter access key"
                      variant="bordered"
                      value={formData.Storage.AccessKey}
                      onChange={(e) =>
                        updateStorageField("AccessKey", e.target.value)
                      }
                      isInvalid={!!errors.accessKey}
                      errorMessage={errors.accessKey}
                    />

                    <Input
                      label="Secret Key"
                      type="password"
                      placeholder="Enter secret key"
                      variant="bordered"
                      value={formData.Storage.SecretKey}
                      onChange={(e) =>
                        updateStorageField("SecretKey", e.target.value)
                      }
                      isInvalid={!!errors.secretKey}
                      errorMessage={errors.secretKey}
                    />
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                startContent={!isLoading && <Edit size={16} />}
              >
                {isLoading ? "Updating..." : "Update Storage"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export function CreateStorageModal(props: { RunOnSubmit: () => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { addStorage, isLoading } = useStorageStore();

  const [formData, setFormData] = useState<TAddStorageParams>({
    Name: "",
    Type: "s3",
    Storage: {
      Bucket: "",
      Folder: "",
      Region: "",
      AccessKey: "",
      SecretKey: "",
    },
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.Name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.Storage.Bucket.trim()) {
      newErrors.bucket = "Bucket is required";
    }

    if (formData.Type !== "local") {
      if (!formData.Storage.AccessKey.trim()) {
        newErrors.accessKey = "Access Key is required";
      }
      if (!formData.Storage.SecretKey.trim()) {
        newErrors.secretKey = "Secret Key is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = await addStorage(formData);
    if (success) {
      setFormData({
        Name: "",
        Type: "s3",
        Storage: {
          Bucket: "",
          Folder: "",
          Region: "",
          AccessKey: "",
          SecretKey: "",
        },
        isDefault: false,
      });
      setErrors({});
      onOpenChange();
      props.RunOnSubmit();
    }
  };

  const updateStorageField = (
    field: keyof TAddStorageParams["Storage"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      Storage: {
        ...prev.Storage,
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Button
        className="shadow-lg bg-primary-50"
        size="sm"
        startContent={
          !isLoading && <Plus size={18} className="sm:w-5 sm:h-5" />
        }
        variant="shadow"
        onPress={onOpen}
        isLoading={isLoading}
      >
        <span className="text-sm sm:text-base font-medium">Add Storage</span>
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Storage Configuration
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Storage Name"
                    placeholder="Enter storage name"
                    variant="bordered"
                    value={formData.Name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, Name: e.target.value }))
                    }
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                  />

                  <Select
                    label="Storage Type"
                    variant="bordered"
                    selectedKeys={[formData.Type]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as TStorageType;
                      setFormData((prev) => ({ ...prev, Type: selected }));
                    }}
                  >
                    <SelectItem key="s3">Amazon S3</SelectItem>
                    <SelectItem key="r2">Cloudflare R2</SelectItem>
                    <SelectItem key="local">Local Storage</SelectItem>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Bucket Name"
                    placeholder="Enter bucket name"
                    variant="bordered"
                    value={formData.Storage.Bucket}
                    onChange={(e) =>
                      updateStorageField("Bucket", e.target.value)
                    }
                    isInvalid={!!errors.bucket}
                    errorMessage={errors.bucket}
                  />

                  <Input
                    label="Folder Path"
                    placeholder="Enter folder path (optional)"
                    variant="bordered"
                    value={formData.Storage.Folder}
                    onChange={(e) =>
                      updateStorageField("Folder", e.target.value)
                    }
                  />
                </div>

                {formData.Type !== "local" && (
                  <>
                    <Input
                      label="Region"
                      placeholder="Enter region (e.g., us-east-1)"
                      variant="bordered"
                      value={formData.Storage.Region}
                      onChange={(e) =>
                        updateStorageField("Region", e.target.value)
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Access Key"
                        placeholder="Enter access key"
                        variant="bordered"
                        value={formData.Storage.AccessKey}
                        onChange={(e) =>
                          updateStorageField("AccessKey", e.target.value)
                        }
                        isInvalid={!!errors.accessKey}
                        errorMessage={errors.accessKey}
                      />

                      <Input
                        label="Secret Key"
                        type="password"
                        placeholder="Enter secret key"
                        variant="bordered"
                        value={formData.Storage.SecretKey}
                        onChange={(e) =>
                          updateStorageField("SecretKey", e.target.value)
                        }
                        isInvalid={!!errors.secretKey}
                        errorMessage={errors.secretKey}
                      />
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  startContent={!isLoading && <Plus size={16} />}
                >
                  {isLoading ? "Adding..." : "Add Storage"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export function IntegrationGuideModal() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // State for user inputs
  const [variables, setVariables] = useState({
    bucketName: "mongostuff.prod",
    region: "us-east-1",
    folderName: "stuffs",
    iamUserArn: "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USERNAME",
  });

  const [copySuccess, setCopySuccess] = useState(false);

  // Generate dynamic policy based on user inputs
  const generatePolicy = () => {
    return `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowProjectAFolderAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::${variables.bucketName}/${variables.folderName}/*",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalArn": "${variables.iamUserArn}"
        }
      }
    }
  ]
}`;
  };

  // Copy policy to clipboard
  const copyPolicy = async () => {
    try {
      await navigator.clipboard.writeText(generatePolicy());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy policy:", err);
    }
  };

  // Update variable helper
  const updateVariable = (key: keyof typeof variables, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Button
        startContent={<HelpCircle size={16} />}
        variant="light"
        size="sm"
        onPress={onOpen}
        className="text-primary"
      >
        Integration Guide
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        placement="top-center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">AWS S3 Integration Guide</h1>
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="space-y-6">
                  <section className="bg-default-100/50 p-4 rounded-lg border border-divider">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      1. AWS Account Setup
                    </h2>
                    <p className="mb-2 text-default-700">
                      To integrate MongoStuff with AWS S3, you'll need an AWS
                      account with appropriate IAM permissions.
                    </p>
                    <ol className="list-decimal ml-5 space-y-2 text-default-600">
                      <li>
                        Sign in to your AWS Management Console or create a new
                        account
                      </li>
                      <li>Navigate to the IAM service</li>
                      <li>
                        Create a new IAM user for MongoStuff with programmatic
                        access
                      </li>
                      <li>
                        Note down the Access Key ID and Secret Access Key when
                        created
                      </li>
                    </ol>
                  </section>

                  <section className="bg-default-100/50 p-4 rounded-lg border border-divider">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      2. S3 Bucket Configuration
                    </h2>
                    <p className="mb-2 text-default-700">
                      Create an S3 bucket with the following settings:
                    </p>
                    <ol className="list-decimal ml-5 space-y-2 text-default-600">
                      <li>Navigate to the S3 service in AWS Console</li>
                      <li>Create a new bucket (e.g., "mongostuff.prod")</li>
                      <li>
                        Configure bucket settings according to your security
                        requirements
                      </li>
                      <li>Create a folder named "stuffs" inside the bucket</li>
                    </ol>
                  </section>

                  <section className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      3. Configuration Variables
                    </h2>
                    <p className="mb-4 text-default-700">
                      Customize the values below to generate your personalized
                      IAM policy:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Bucket Name"
                        placeholder="Enter your S3 bucket name"
                        variant="bordered"
                        value={variables.bucketName}
                        onChange={(e) =>
                          updateVariable("bucketName", e.target.value)
                        }
                        description="The name of your S3 bucket"
                      />
                      <Input
                        label="Region"
                        placeholder="Enter AWS region"
                        variant="bordered"
                        value={variables.region}
                        onChange={(e) =>
                          updateVariable("region", e.target.value)
                        }
                        description="AWS region where your bucket is located"
                      />
                      <Input
                        label="Folder Name"
                        placeholder="Enter folder name"
                        variant="bordered"
                        value={variables.folderName}
                        onChange={(e) =>
                          updateVariable("folderName", e.target.value)
                        }
                        description="Folder inside your bucket for backups"
                      />
                      <Input
                        label="IAM User ARN"
                        placeholder="Enter IAM user ARN"
                        variant="bordered"
                        value={variables.iamUserArn}
                        onChange={(e) =>
                          updateVariable("iamUserArn", e.target.value)
                        }
                        description="ARN of your IAM user"
                        className="md:col-span-2"
                      />
                    </div>
                  </section>

                  <section className="bg-default-100/50 p-4 rounded-lg border border-divider">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      4. IAM Policy Configuration
                    </h2>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-default-700">
                        Apply the following bucket policy to restrict access:
                      </p>
                      <Button
                        size="sm"
                        variant={copySuccess ? "solid" : "bordered"}
                        color={copySuccess ? "success" : "primary"}
                        startContent={<Copy size={14} />}
                        onPress={copyPolicy}
                        className="ml-2"
                      >
                        {copySuccess ? "Copied!" : "Copy Policy"}
                      </Button>
                    </div>
                    <div className="bg-content1 border border-divider p-4 rounded-medium overflow-auto">
                      <pre className="text-sm text-foreground font-mono">
                        {generatePolicy()}
                      </pre>
                    </div>
                    <p className="mt-3 text-sm text-default-600">
                      This policy restricts access to only the specified IAM
                      user and only for the "stuffs" folder in your bucket.
                    </p>
                  </section>

                  <section className="bg-default-100/50 p-4 rounded-lg border border-divider">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      5. MongoStuff Integration
                    </h2>
                    <p className="mb-2 text-default-700">
                      Configure your storage in MongoStuff with these settings:
                    </p>
                    <ul className="list-disc ml-5 space-y-2 text-default-600">
                      <li>
                        <strong className="text-foreground">
                          Storage Type:
                        </strong>{" "}
                        S3
                      </li>
                      <li>
                        <strong className="text-foreground">Bucket:</strong>{" "}
                        <span className="font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary border border-primary/20">
                          {variables.bucketName}
                        </span>
                      </li>
                      <li>
                        <strong className="text-foreground">Region:</strong>{" "}
                        <span className="font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary border border-primary/20">
                          {variables.region}
                        </span>
                      </li>
                      <li>
                        <strong className="text-foreground">Folder:</strong>{" "}
                        <span className="font-mono bg-primary/10 px-1.5 py-0.5 rounded text-primary border border-primary/20">
                          {variables.folderName}
                        </span>
                      </li>
                      <li>
                        <strong className="text-foreground">Access Key:</strong>{" "}
                        Your IAM user's Access Key ID
                      </li>
                      <li>
                        <strong className="text-foreground">Secret Key:</strong>{" "}
                        Your IAM user's Secret Access Key
                      </li>
                    </ul>
                  </section>

                  <section className="bg-default-100/50 p-4 rounded-lg border border-divider">
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      6. Security Considerations
                    </h2>
                    <ul className="list-disc ml-5 space-y-2 text-default-600">
                      <li>
                        Use IAM roles instead of access keys when possible
                      </li>
                      <li>Regularly rotate your access keys</li>
                      <li>Enable bucket versioning for data protection</li>
                      <li>
                        Consider enabling server-side encryption for your S3
                        bucket
                      </li>
                      <li>Monitor S3 access using AWS CloudTrail</li>
                    </ul>
                  </section>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Storages() {
  const { storageList, isLoading, getStorages } = useStorageStore();
  const [editingStorage, setEditingStorage] = useState<TStorage | null>(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
  } = useDisclosure();

  useEffect(() => {
    getStorages();
  }, []);

  const handleEdit = (storage: TStorage) => {
    setEditingStorage(storage);
    onEditOpen();
  };

  const handleEditClose = () => {
    setEditingStorage(null);
    onEditOpenChange();
  };

  if (isLoading && storageList.length === 0) {
    return (
      <div className="flex items-center justify-center h-60">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Storage Configurations
          </h1>
          <p className="text-sm text-default-600 mt-1">
            Manage your backup storage destinations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <IntegrationGuideModal />
          <CreateStorageModal RunOnSubmit={() => getStorages()} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {storageList.map((storage, index) => (
          <div
            key={storage.storageID}
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StorageCard {...storage} onEdit={handleEdit} />
          </div>
        ))}
      </div>

      {storageList?.length === 0 && !isLoading && (
        <div>
          <div className="flex flex-col items-center justify-center h-60 sm:h-80 px-4">
            <EmptyState
              Icon={
                <DotLottieReact
                  src="https://lottie.host/281813e4-12ea-4257-a041-69fc069edafe/dQopTPxL06.lottie"
                  loop
                  autoplay
                  backgroundColor="transparent"
                />
              }
              Title="No storage configurations found"
              Description="Add your first storage configuration to start backing up your data securely."
              TitleClassName="-translate-y-16 sm:-translate-y-20"
              DescriptionClassName="-translate-y-16 sm:-translate-y-20"
            />
          </div>
        </div>
      )}

      {/* Edit Storage Modal */}
      <EditStorageModal
        storage={editingStorage}
        isOpen={isEditOpen}
        onClose={handleEditClose}
        RunOnSubmit={() => getStorages()}
      />
    </div>
  );
}
