import EmptyState from "../../../components/emptyState";
import StareBackCat from "../../../icons/stareBackCat";

export default function ConnectionSettings() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-96">
        <EmptyState
          Icon={<StareBackCat />}
          Title="Brace yourself"
          Description="I might just quite the project."
        />
      </div>
    </div>
  );
}
