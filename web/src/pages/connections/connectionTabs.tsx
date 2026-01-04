import { Tab, Tabs } from "@heroui/react";
import {
  Camera,
  DatabaseBackup,
  HardDrive,
  LayoutDashboard,
  Scroll,
  Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConnectionStore } from "../../stores/connection.store";
import { toast } from "sonner";

type Pages =
  | "Overview"
  | "Snapshots"
  | "BackupsPolicies"
  | "Backups"
  | "Restores"
  | "Settings";
type Props = {
  Pages: {
    [K in Pages]: React.FC;
  };
};

export default function ConnectionTabs(props: Props) {
  const navigate = useNavigate();
  const { connection } = useConnectionStore();
  const activeTab = useLocation().search.split("=")[1] ?? "overview";

  const handleTabRoute = (tab: string) => {
    if (!connection) {
      toast.error("No connection selected");
      return;
    }
    navigate(`/connection/${connection.connectionID}?tab=${tab}`);
  };

  return (
    <div className="flex flex-col w-full px-6 relative">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        className="sticky top-14 z-10 bg-background"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:primary",
        }}
        selectedKey={activeTab}
        onSelectionChange={(key) => handleTabRoute(key.toString())}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <LayoutDashboard size={18} />
              <span>Overview</span>
            </div>
          }
        >
          <props.Pages.Overview />
        </Tab>
        <Tab
          key="snapshots"
          title={
            <div className="flex items-center space-x-2">
              <Camera size={18} />
              <span>Snapshots</span>
            </div>
          }
          value="snapshots"
        >
          <props.Pages.Snapshots />
        </Tab>
        <Tab
          key="backups-policies"
          title={
            <div className="flex items-center space-x-2">
              <Scroll size={18} />
              <span>Backups Policies</span>
            </div>
          }
          value="backups-policies"
        >
          <props.Pages.BackupsPolicies />
        </Tab>
        <Tab
          key="backups"
          title={
            <div className="flex items-center space-x-2">
              <HardDrive size={18} />
              <span>Backups</span>
            </div>
          }
          value="backups"
        >
          <props.Pages.Backups />
        </Tab>
        <Tab
          key="restores"
          title={
            <div className="flex items-center space-x-2">
              <DatabaseBackup size={18} />
              <span>Restores</span>
            </div>
          }
          value="restores"
        >
          <props.Pages.Restores />
        </Tab>
        <Tab
          key="settings"
          title={
            <div className="flex items-center space-x-2">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          }
          value="settings"
        >
          <props.Pages.Settings />
        </Tab>
      </Tabs>
    </div>
  );
}
