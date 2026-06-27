import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  loading?: boolean;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color = "bg-blue-100 text-[#1B3A6B]",
  loading,
  trend,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.positive ? "text-green-600" : "text-red-500"}`}>
                {trend.positive ? "↑" : "↓"} {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
