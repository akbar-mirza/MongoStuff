import { LucideIcon } from "lucide-react";

type Props = {
  Title: string;
  Description?: string;
  Icon?: typeof LucideIcon;
};

export default function EmptyState(props: Props): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {props.Icon && props.Icon}
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-gray-300">{props.Title}</h1>
        {props.Description && (
          <p className="text-sm text-gray-400">{props.Description}</p>
        )}
      </div>
    </div>
  );
}
