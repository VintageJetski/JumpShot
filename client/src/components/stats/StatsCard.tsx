import React from "react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  metric: string;
  metricColor: string;
  bgColor: string;
  icon: React.ReactNode;
  subtext: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  metric,
  metricColor,
  bgColor,
  icon,
  subtext
}: StatsCardProps) {
  return (
    <Card className="bg-background-light rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-xl font-bold mt-1">{value}</p>
          <div className={`${bgColor} ${metricColor} inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-1`}>
            {metric}
          </div>
        </div>
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
      </div>
      {typeof subtext === "string" ? (
        <div className="mt-2 flex items-center">
          <span className="text-sm text-gray-400">
            {subtext}
          </span>
        </div>
      ) : (
        <div className="mt-2">
          {subtext}
        </div>
      )}
    </Card>
  );
}
