
"use client";

import React from "react";
import { safeFixed, safePercent, safeNumber, safeCurrency } from "./utils";

import type { McarpRow } from "./types";

type Props = {
  filtered: McarpRow[];
};

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function isStale(lastUpdated: number, currentDate: Date, days: number): boolean {
  const last = excelDateToJSDate(lastUpdated);
  const diff = (currentDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff > days;
}

export default function Table3({ filtered }: Props) {
  const renderColorField = (value: any, type: string) =>
    type === "Mono" ? <span className="text-gray-400">-</span> : safeNumber(value);

  const renderCoverageWithFlag = (value: number | undefined, type: string, colorKey?: string) => {
    if (typeof value !== "number") return <span className="text-gray-400">-</span>;
    if (type === "Mono" && colorKey) return <span className="text-gray-400">-</span>;
    const percent = value * 100;
    const flagColor =
      percent > 5.5 ? "bg-orange-400" : percent < 4.5 ? "bg-green-500" : null;
    return (
      <span className="flex items-center justify-end gap-1">
        {safePercent(value)}
        {flagColor && (
          <span
            className={`inline-block w-2 h-2 rounded-full ${flagColor}`}
            title={`${percent.toFixed(1)}%`}
          />
        )}
      </span>
    );
  };

  const grouped = Object.entries(
    filtered.reduce((acc: Record<string, any[]>, row) => {
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {})
  );

  const latestDate = new Date();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm text-gray-900">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-left">Serial Number</th>
            <th className="px-3 py-2 text-left">Printer Model</th>
            <th className="px-3 py-2 text-center">Device Type</th>
            <th className="px-3 py-2 text-center">BK Pages Left</th>
            <th className="px-3 py-2 text-center">CY Pages Left</th>
            <th className="px-3 py-2 text-center">MG Pages Left</th>
            <th className="px-3 py-2 text-center">YE Pages Left</th>
            <th className="px-3 py-2 text-center">BK % Coverage</th>
            <th className="px-3 py-2 text-center">CY % Coverage</th>
            <th className="px-3 py-2 text-center">MG % Coverage</th>
            <th className="px-3 py-2 text-center">YE % Coverage</th>
            <th className="px-3 py-2 text-center">BK Fcst Yield</th>
            <th className="px-3 py-2 text-center">CY Fcst Yield</th>
            <th className="px-3 py-2 text-center">MG Fcst Yield</th>
            <th className="px-3 py-2 text-center">YE Fcst Yield</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([customer, rows]) =>
            rows.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {row.Monitor}
                    {isStale(row.Last_Updated, latestDate, 5) && (
                      <span
                        className="w-2 h-2 bg-red-500 rounded-full"
                        title={`Last updated: ${excelDateToJSDate(row.Last_Updated).toLocaleDateString()}`}
                      ></span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">{row.Serial_Number}</td>
                <td className="px-3 py-2">{row.Printer_Model}</td>
                <td className="px-3 py-2">{row.Device_Type}</td>
                <td className="px-3 py-2 text-right">{safeNumber(row.Black_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Cyan_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Magenta_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Yellow_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderCoverageWithFlag(row.Black_Page_Coverage_Percent, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderCoverageWithFlag(row.Cyan_Page_Coverage_Percent, row.Device_Type, 'Cyan')}</td>
                <td className="px-3 py-2 text-right">{renderCoverageWithFlag(row.Magenta_Page_Coverage_Percent, row.Device_Type, 'Magenta')}</td>
                <td className="px-3 py-2 text-right">{renderCoverageWithFlag(row.Yellow_Page_Coverage_Percent, row.Device_Type, 'Yellow')}</td>
                <td className="px-3 py-2 text-right">{safeNumber(row.Black_Yield_Estimate)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Cyan_Yield_Estimate, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Magenta_Yield_Estimate, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Yellow_Yield_Estimate, row.Device_Type)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
