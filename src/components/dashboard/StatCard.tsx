
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  trend,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
}: StatCardProps) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`${iconBgColor} p-3 rounded-full`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        {trend && (
          <p
            className={`text-xs mt-2 ${
              trend.positive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.value} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
