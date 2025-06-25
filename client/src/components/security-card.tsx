import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SecurityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "passed" | "warning" | "critical" | "secure" | "failed";
  issueCount: number;
  onClick?: () => void;
}

const statusConfig = {
  passed: { label: "PASSED", className: "status-safe" },
  warning: { label: `ISSUES`, className: "status-warning" },
  critical: { label: "CRITICAL", className: "status-critical" },
  secure: { label: "SECURE", className: "status-safe" },
  failed: { label: "FAILED", className: "status-critical" },
};

export default function SecurityCard({ 
  icon: Icon, 
  title, 
  description, 
  status, 
  issueCount, 
  onClick 
}: SecurityCardProps) {
  const config = statusConfig[status];
  const displayLabel = issueCount > 0 && status === "warning" 
    ? `${issueCount} ${config.label}` 
    : config.label;

  return (
    <Card 
      className="p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-info" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
          </div>
          <Badge className={`text-xs px-2 py-1 rounded-full font-medium ${config.className}`}>
            {displayLabel}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
