"use client";

import React from "react";

export type HighUsageProjectionConfig = {
  enabled: boolean;
  usagePercent: number;
  startDate: string;
  endDate: string;
};

interface Props {
  config: HighUsageProjectionConfig;
  setConfig: React.Dispatch<
    React.SetStateAction<HighUsageProjectionConfig>
  >;
}

export default function HighUsageProjectionControls({
  config,
  setConfig,
}: Props): React.JSX.Element {
  return (
    <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="highUsageEnabled"
            checked={config.enabled}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                enabled: e.target.checked,
              }))
            }
            className="h-4 w-4"
          />
          <label
            htmlFor="highUsageEnabled"
            className="font-semibold text-gray-800"
          >
            High Usage Projection
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Usage % of Normal
          </label>
          <input
            type="number"
            min="100"
            step="10"
            value={config.usagePercent}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                usagePercent: Number(e.target.value),
              }))
            }
            className="w-28 rounded border border-gray-300 bg-white px-2 py-1"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            From
          </label>
          <input
            type="date"
            value={config.startDate}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                startDate: e.target.value,
              }))
            }
            className="rounded border border-gray-300 bg-white px-2 py-1"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Through
          </label>
          <input
            type="date"
            value={config.endDate}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                endDate: e.target.value,
              }))
            }
            className="rounded border border-gray-300 bg-white px-2 py-1"
          />
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Applies only to devices designated High Usage. Projection settings do not
        modify source meter data.
      </div>
    </div>
  );
}