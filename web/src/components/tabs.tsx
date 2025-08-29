import { Tab, Tabs } from "@heroui/react";
import { Activity, Cable, HardDriveDownload, Settings } from "lucide-react";
// import { GalleryIcon } from "./GalleryIcon";
// import { MusicIcon } from "./MusicIcon";
// import { VideoIcon } from "./VideoIcon";
import { useLocation, useNavigate } from "react-router-dom";

export default function MainTabs() {
  const navigate = useNavigate();
  const path = useLocation().pathname;
  const activeTab = path.includes("storage") ? "storage" : "connections";

  return (
    <div className="flex flex-col w-full px-6">
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
      >
        <Tab
          key="connections"
          title={
            <div
              className="flex items-center space-x-2"
              onClick={() => {
                navigate("/");
              }}
            >
              <Cable size={18} />
              <span>Connections</span>
            </div>
          }
        />
        <Tab
          key="storage"
          title={
            <div
              className="flex items-center space-x-2"
              onClick={() => {
                navigate("/storage");
              }}
            >
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
