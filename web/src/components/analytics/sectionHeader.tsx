import { Chip } from "@heroui/react";
import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  badgeColor?: "success" | "warning";
  endContent?: React.ReactNode;
};

export default function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  badgeColor = "success",
  endContent,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-default-100/50 rounded-lg">
          <Icon className="w-5 h-5 text-default-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {badge && (
              <Chip size="sm" variant="flat" color={badgeColor}>
                {badge}
              </Chip>
            )}
          </div>
          {description && (
            <p className="text-sm text-default-500">{description}</p>
          )}
        </div>
      </div>
      {endContent}
    </div>
  );
}
