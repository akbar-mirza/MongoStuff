import { useEffect } from "react";
import ConnectionTabs from "./connectionTabs";
import ConnectionBackups from "./tabs/backups";
import ConnectionOverview from "./tabs/overiew";
import ConnectionRestores from "./tabs/restores";
import ConnectionSettings from "./tabs/settings";
import ConnectionSnapshots from "./tabs/snapshots";
import { useConnectionStore } from "../../stores/connection.store";
import { useParams } from "react-router-dom";

export type Props = {
  ConnectionID: string;
};
export default function ConnectionFullView() {
  const { getConnection } = useConnectionStore();
  const { id } = useParams();
  useEffect(() => {
    if (id) getConnection(id);
  }, [id]);
  return (
    <>
      <ConnectionTabs
        Pages={{
          Overview: ConnectionOverview,
          Snapshots: ConnectionSnapshots,
          Backups: ConnectionBackups,
          Restores: ConnectionRestores,
          Settings: ConnectionSettings,
        }}
      />
    </>
  );
}
