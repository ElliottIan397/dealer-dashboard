"use client";

import React from "react";
import type { Table3Row } from "./types";

type Props = {
  filtered: Table3Row[];
};

export default function Table3({ filtered }: Props) {
  const formatNumber = (val: number) => val.toLocaleString();
  const formatPercent = (val: number) => `${val.toFixed(1)}%`;

  const grouped = Object.entries(
    filtered.reduce((acc, row) => {
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {} as Record<string, Table3Row[]>)
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
                <td className="px-3 py-2 text-right">{formatNumber(row.Black_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Cyan_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Magenta_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Yellow_Pages_Left)}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row["Black_Page_Coverage_%"])}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row["Cyan_Page_Coverage_%"])}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row["Magenta_Page_Coverage_%"])}</td>
                <td className="px-3 py-2 text-right">{formatPercent(row["Yellow_Page_Coverage_%"])}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Black_Yield_Estimate)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Cyan_Yield_Estimate)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Magenta_Yield_Estimate)}</td>
                <td className="px-3 py-2 text-right">{formatNumber(row.Yellow_Yield_Estimate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
