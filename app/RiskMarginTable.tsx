
"use client";

import React, { useState } from "react";
import { safeNumber, safeCurrency } from "./utils";
import type { McarpRow } from "./types";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
};

type Props = {
  filtered: McarpRow[];
  bias: "O" | "R" | "N";
};

const riskRank = (level: string): number => {
  switch (level) {
    case "Critical": return 4;
    case "High": return 3;
    case "Moderate": return 2;
    case "Low": return 1;
    default: return 0;
  }
};

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function isStale(lastUpdated: number, currentDate: Date, days: number): boolean {
  const last = excelDateToJSDate(lastUpdated);
  const diff = (currentDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff > days;
}

export default function RiskMarginTable({ filtered, bias }: Props) {
  const [offlineFilter, setOfflineFilter] = useState<"all" | "offline" | "online">("all");
  const latestDate = new Date();

  const enrichedRows = filtered.map(row => {
    const revenue = row.Contract_Status === "T"
  ? getBiasField(row, "Twelve_Month_Transactional_SP", bias)
  : row.Contract_Total_Revenue ?? 0;

const cost = getBiasField(row, "Twelve_Month_Fulfillment_Cost", bias);
    const gmDollar = revenue - cost;
    const offline = isStale(row.Last_Updated, latestDate, 5);

    return { ...row, revenue, cost, gmDollar, offline };
  });

  const filteredRows = enrichedRows
    .filter(row => {
      if (offlineFilter === "offline") return row.offline;
      if (offlineFilter === "online") return !row.offline;
      return true;
    })
    .sort((a, b) => {
      if (a.gmDollar === 0 && b.gmDollar !== 0) return 1;
      if (b.gmDollar === 0 && a.gmDollar !== 0) return -1;
      if (a.gmDollar !== b.gmDollar) return a.gmDollar - b.gmDollar;
      return riskRank(b.Final_Risk_Level) - riskRank(a.Final_Risk_Level);
    });

  const totals = filteredRows.reduce(
    (sum, row) => ({
      black: sum.black + row.Black_Annual_Volume,
      color: sum.color + row.Color_Annual_Volume,
      revenue: sum.revenue + row.revenue,
      cost: sum.cost + row.cost,
      gmDollar: sum.gmDollar + row.gmDollar,
    }),
    { black: 0, color: 0, revenue: 0, cost: 0, gmDollar: 0 }
  );

  return (
    <div className="overflow-x-auto w-full max-h-[600px] overflow-y-auto relative">
      <div className="flex items-center gap-4 mb-2">
        <label htmlFor="offlineFilter" className="text-sm font-medium">Offline Devices:</label>
        <select
          id="offlineFilter"
          className="border rounded px-2 py-1 text-sm"
          value={offlineFilter}
          onChange={(e) => setOfflineFilter(e.target.value as any)}
        >
          <option value="all">Show All</option>
          <option value="offline">Offline Only</option>
          <option value="online">Hide Offline</option>
        </select>
      </div>

      <table className="min-w-full border text-sm">
        <thead className="sticky top-0 bg-white z-20 shadow-md border-b border-gray-300">
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Serial Number</th>
            <th className="px-3 py-2">Printer Model</th>
            <th className="px-3 py-2 text-center">Status</th>
            <th className="px-3 py-2 text-center">Black Fcst Vol/Yr</th>
            <th className="px-3 py-2 text-center">Color Fcst Vol/Yr</th>
            <th className="px-3 py-2 text-center">Revenue</th>
            <th className="px-3 py-2 text-center">Cost</th>
            <th className="px-3 py-2 text-center">GM $</th>
            <th className="px-3 py-2 text-center">Risk</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {row.Monitor}
                  {row.offline && (
                    <span
                      className="w-2 h-2 bg-red-500 rounded-full"
                      title={`Last updated: ${excelDateToJSDate(row.Last_Updated).toLocaleDateString()}`}
                    ></span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">{row.Serial_Number}</td>
              <td className="px-3 py-2">{row.Printer_Model}</td>
              <td className="px-3 py-2">{row.Contract_Status}</td>
              <td className="px-3 py-2 text-right">{safeNumber(row.Black_Annual_Volume)}</td>
              <td className="px-3 py-2 text-right">{safeNumber(row.Color_Annual_Volume)}</td>
              <td className="px-3 py-2 text-right">{safeCurrency(row.revenue)}</td>
              <td className="px-3 py-2 text-right">{safeCurrency(row.cost)}</td>
              <td className="px-3 py-2 text-right">{safeCurrency(row.gmDollar)}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${row.Final_Risk_Level === "Critical"
                    ? "bg-red-500"
                    : row.Final_Risk_Level === "High"
                    ? "bg-orange-400"
                    : row.Final_Risk_Level === "Moderate"
                    ? "bg-yellow-400"
                    : row.Final_Risk_Level === "Low"
                    ? "bg-green-500"
                    : "bg-gray-400"
                  }`}
                  title={row.Final_Risk_Level}
                ></span>
                {row.Final_Risk_Level}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 bg-white z-20 shadow-md border-t border-gray-300">
          <tr className="border-t font-bold bg-gray-100">
            <td className="px-3 py-2" colSpan={4}>Grand Total</td>
            <td className="px-3 py-2 text-right">{safeNumber(totals.black)}</td>
            <td className="px-3 py-2 text-right">{safeNumber(totals.color)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.revenue)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.cost)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.gmDollar)}</td>
            <td className="px-3 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
