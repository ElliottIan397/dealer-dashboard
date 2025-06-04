"use client";

import React from "react";
import { safeFixed, safePercent, safeNumber, safeCurrency } from "./utils";

import type { McarpRow } from "./types";

type Props = {
  filtered: McarpRow[];
};

export default function Table3({ filtered }: Props) {
  const formatNumber = (val: number) => val.toLocaleString();
  const formatPercent = (val: number | undefined) =>
    typeof val === "number" ? `${(val * 100).toFixed(1)}%` : "-";

  const renderColorField = (value: any, type: string) =>
    type === "Mono" ? <span className="text-gray-400">-</span> : safeNumber(value);

  const renderColorPercent = (value: any, type: string) =>
    type === "Mono" ? <span className="text-gray-400">-</span> : safePercent(value);

  const grouped = Object.entries(
    filtered.reduce((acc: Record<string, any[]>, row) => {
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {})
  );

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Serial Number</th>
            <th className="px-3 py-2">Printer Model</th>
            <th className="px-3 py-2">Device Type</th>
            <th className="px-3 py-2 text-right">Black Pages Left</th>
            <th className="px-3 py-2 text-right">Cyan</th>
            <th className="px-3 py-2 text-right">Magenta</th>
            <th className="px-3 py-2 text-right">Yellow</th>
            <th className="px-3 py-2 text-right">Black %</th>
            <th className="px-3 py-2 text-right">Cyan %</th>
            <th className="px-3 py-2 text-right">Magenta %</th>
            <th className="px-3 py-2 text-right">Yellow %</th>
            <th className="px-3 py-2 text-right">Black Yield</th>
            <th className="px-3 py-2 text-right">Cyan</th>
            <th className="px-3 py-2 text-right">Magenta</th>
            <th className="px-3 py-2 text-right">Yellow</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([customer, rows]) =>
            rows.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{row.Monitor}</td>
                <td className="px-3 py-2">{row.Serial_Number}</td>
                <td className="px-3 py-2">{row.Printer_Model}</td>
                <td className="px-3 py-2">{row.Device_Type}</td>
                <td className="px-3 py-2 text-right">{safeNumber(row.Black_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Cyan_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Magenta_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorField(row.Yellow_Pages_Left, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{safePercent(row.Black_Page_Coverage_Percent)}</td>
                <td className="px-3 py-2 text-right">{renderColorPercent(row.Cyan_Page_Coverage_Percent, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorPercent(row.Magenta_Page_Coverage_Percent, row.Device_Type)}</td>
                <td className="px-3 py-2 text-right">{renderColorPercent(row.Yellow_Page_Coverage_Percent, row.Device_Type)}</td>
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
