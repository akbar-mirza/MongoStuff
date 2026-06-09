import { Card, CardBody } from "@heroui/react";
import { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "secondary" | "default";
};

const TONE_CLASSES: Record<NonNullable<Props["tone"]>, [string, string]> = {
  primary: ["bg-primary-100/50", "text-primary-600"],
  success: ["bg-success-100/50", "text-success-600"],
  warning: ["bg-warning-100/50", "text-warning-600"],
  danger: ["bg-danger-100/50", "text-danger-600"],
  secondary: ["bg-secondary-100/50", "text-secondary-600"],
  default: ["bg-default-100/50", "text-default-600"],
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "primary",
}: Props) {
  const [bgClass, textClass] = TONE_CLASSES[tone];
  return (
    <Card className="border border-default-200/50 bg-background/50 backdrop-blur-sm">
      <CardBody className="flex flex-row items-center gap-3 p-4">
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <Icon className={`w-5 h-5 ${textClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-default-500 truncate">{label}</p>
          <p className="text-lg font-semibold text-foreground truncate">
            {value}
          </p>
          {sub && <p className="text-xs text-default-400 truncate">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
