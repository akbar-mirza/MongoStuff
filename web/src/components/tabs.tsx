import { Tab, Tabs } from "@heroui/react";
import { Activity, Cable, HardDriveDownload, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MainTabs() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const activeTab = path.includes("storage")
    ? "storage"
    : path.includes("activity")
      ? "activity"
      : "connections";

  const handleTabRoute = (key: string) => {
    navigate(`/${key}`);
  };

  return (
    <div className="flex flex-col w-full px-6 sticky top-14 z-10 bg-background">
      <Tabs
        aria-label="Options"
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:primary",
        }}
        selectedKey={activeTab}
        onSelectionChange={(key) =>
          key === "connections"
            ? handleTabRoute("")
            : handleTabRoute(key.toString())
        }
      >
        <Tab
          key="connections"
          title={
            <div className="flex items-center space-x-2">
              <Cable size={18} />
              <span>Connections</span>
            </div>
          }
        />
        <Tab
          key="storage"
          title={
            <div className="flex items-center space-x-2">
              <HardDriveDownload size={18} />
              <span>Storage</span>
            </div>
          }
        />
        <Tab
          key="activity"
          title={
            <div className="flex items-center space-x-2">
              <Activity size={18} />
              <span>Activity</span>
            </div>
          }
        />
        <Tab
          key="settings"
          title={
            <div className="flex items-center space-x-2">
              <Settings size={18} />
              <span>Settings</span>
            </div>
          }
        />
      </Tabs>
    </div>
  );
}
