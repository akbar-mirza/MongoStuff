import EmptyState from "../../../components/emptyState";
import LazyCat from "../../../icons/lazyCat";

export default function ConnectionBackups() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-96">
        <EmptyState
          Icon={<LazyCat />}
          Title="Good things take time"
          Description="But i'm lazy, so it might take a while."
        />
      </div>
    </div>
  );
}
