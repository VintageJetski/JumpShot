import React from "react";

interface ProgressMetricProps {
  label: string;
  value: number;
  color: string;
  description?: string;
}

export default function ProgressMetric({
  label,
  value,
  color,
  description
}: ProgressMetricProps) {
  // Format the value to a percentage or decimal
  const displayValue = (value * 100).toFixed(0) + '%';
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
        <div 
          className={`${color} rounded-full h-2`}
          style={{ width: displayValue }}
        />
      </div>
      {description && (
        <div className="text-xs text-gray-500 mt-2">
          {description}
        </div>
      )}
    </div>
  );
}
