import { cn } from "@heroui/theme";

type Props = {
  Title: string;
  Description?: string;
  Icon?: React.ReactNode;
  TitleClassName?: string;
  DescriptionClassName?: string;
};

export default function EmptyState(props: Props): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {props.Icon && props.Icon}
      <div className="flex flex-col gap-2 text-center">
        <h1 className={cn("text-2xl font-semibold text-gray-300", props.TitleClassName)}>{props.Title}</h1>
        {props.Description && (
          <p className={cn("text-sm text-gray-400", props.DescriptionClassName)}>{props.Description}</p>
        )}
      </div>
    </div>
  );
}
