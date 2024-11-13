import { Tab, Tabs } from "@nextui-org/react";
import {
  Camera,
  DatabaseBackup,
  HardDrive,
  LayoutDashboard,
  Settings,
} from "lucide-react";
// import { GalleryIcon } from "./GalleryIcon";
// import { MusicIcon } from "./MusicIcon";
// import { VideoIcon } from "./VideoIcon";

type Pages = "Overview" | "Snapshots" | "Backups" | "Restores" | "Settings";
type Props = {
  Pages: {
    [K in Pages]: React.FC;
  };
};

export default function ConnectionTabs(props: Props) {
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
        >
          <props.Pages.Snapshots />
        </Tab>
        <Tab
          key="backups"
          title={
            <div className="flex items-center space-x-2">
              <HardDrive size={18} />
              <span>Backups</span>
            </div>
          }
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
        >
          <props.Pages.Settings />
        </Tab>
      </Tabs>
    </div>
  );
}
