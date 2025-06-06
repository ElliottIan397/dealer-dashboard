"use client";

import React from "react";
import { safeNumber, safeCurrency } from "./utils";
import type { McarpRow } from "./types";

type Props = {
  filtered: McarpRow[];
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

export default function RiskMarginTable({ filtered }: Props) {
  const rows = [...filtered].map(row => {
    const revenue = row.Contract_Status === "T"
      ? row.Twelve_Month_Transactional_SP ?? 0
      : row.Contract_Total_Revenue ?? 0;

    const cost = row.Twelve_Month_Fulfillment_Cost ?? 0;
    const gmDollar = revenue - cost;

    return { ...row, revenue, cost, gmDollar };
  }).sort((a, b) => {
    if (a.gmDollar === 0 && b.gmDollar !== 0) return 1;
    if (b.gmDollar === 0 && a.gmDollar !== 0) return -1;
    if (a.gmDollar !== b.gmDollar) return a.gmDollar - b.gmDollar;
    return riskRank(b.Final_Risk_Level) - riskRank(a.Final_Risk_Level);
  });

  const totals = rows.reduce(
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
    <div className="overflow-x-auto w-full">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Serial Number</th>
            <th className="px-3 py-2">Printer Model</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Black Vol</th>
            <th className="px-3 py-2 text-right">Color Vol</th>
            <th className="px-3 py-2 text-right">Revenue</th>
            <th className="px-3 py-2 text-right">Cost</th>
            <th className="px-3 py-2 text-right">GM $</th>
            <th className="px-3 py-2">Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{row.Monitor}</td>
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
                  className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${
                    row.Final_Risk_Level === "Critical" ? "bg-red-500" :
                    row.Final_Risk_Level === "High" ? "bg-orange-400" :
                    row.Final_Risk_Level === "Moderate" ? "bg-yellow-400" :
                    row.Final_Risk_Level === "Low" ? "bg-green-500" :
                    "bg-gray-400"
                  }`}
                  title={row.Final_Risk_Level}
                ></span>
                {row.Final_Risk_Level}
              </td>
            </tr>
          ))}
          <tr className="border-t font-bold bg-gray-100">
            <td className="px-3 py-2" colSpan={4}>Grand Total</td>
            <td className="px-3 py-2 text-right">{safeNumber(totals.black)}</td>
            <td className="px-3 py-2 text-right">{safeNumber(totals.color)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.revenue)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.cost)}</td>
            <td className="px-3 py-2 text-right">{safeCurrency(totals.gmDollar)}</td>
            <td className="px-3 py-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
