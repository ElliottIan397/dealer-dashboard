"use client";

import React from "react";
import type { Table2Row } from "./types";

type Props = {
  filtered: any[];
};

export default function Table2({ filtered }: Props) {
  const formatNumber = (val: number) => val.toLocaleString();
  const formatCurrency = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  const grouped = Object.entries(
  filtered.reduce((acc: Record<string, any[]>, row) => {
    acc[row.Monitor] = acc[row.Monitor] || [];
    acc[row.Monitor].push(row);
    return acc;
  }, {})
);

  const grandTotals = filtered.reduce(
    (totals, row) => ({
      Contract_Base_Charge_Annual: totals.Contract_Base_Charge_Annual + row.Contract_Base_Charge_Annual,
      Included_Mono_Volume: totals.Included_Mono_Volume + row.Included_Mono_Volume,
      Included_Color_Volume: totals.Included_Color_Volume + row.Included_Color_Volume,
      Billable_Mono_Pages: totals.Billable_Mono_Pages + row.Billable_Mono_Pages,
      Billable_Color_Pages: totals.Billable_Color_Pages + row.Billable_Color_Pages,
    }),
    {
      Contract_Base_Charge_Annual: 0,
      Included_Mono_Volume: 0,
      Included_Color_Volume: 0,
      Billable_Mono_Pages: 0,
      Billable_Color_Pages: 0,
    }
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
            <th className="px-3 py-2 text-right">Mono CPP</th>
            <th className="px-3 py-2 text-right">Color CPP</th>
            <th className="px-3 py-2 text-right">Base Charge</th>
            <th className="px-3 py-2 text-right">Included Mono</th>
            <th className="px-3 py-2 text-right">Included Color</th>
            <th className="px-3 py-2 text-right">Billable Mono</th>
            <th className="px-3 py-2 text-right">Billable Color</th>
            <th className="px-3 py-2">Contract End</th>
            <th className="px-3 py-2 text-right">Age (Yrs)</th>
            <th className="px-3 py-2 text-right">Usage (%)</th>
            <th className="px-3 py-2 text-right">Engine Cycles</th>
            <th className="px-3 py-2">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([customer, rows]) => {
            const subtotal = rows.reduce(
              (sum, row) => ({
                Contract_Base_Charge_Annual: sum.Contract_Base_Charge_Annual + row.Contract_Base_Charge_Annual,
                Included_Mono_Volume: sum.Included_Mono_Volume + row.Included_Mono_Volume,
                Included_Color_Volume: sum.Included_Color_Volume + row.Included_Color_Volume,
                Billable_Mono_Pages: sum.Billable_Mono_Pages + row.Billable_Mono_Pages,
                Billable_Color_Pages: sum.Billable_Color_Pages + row.Billable_Color_Pages,
              }),
              {
                Contract_Base_Charge_Annual: 0,
                Included_Mono_Volume: 0,
                Included_Color_Volume: 0,
                Billable_Mono_Pages: 0,
                Billable_Color_Pages: 0,
              }
            );

            return (
              <React.Fragment key={customer}>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{row.Monitor}</td>
                    <td className="px-3 py-2">{row.Serial_Number}</td>
                    <td className="px-3 py-2">{row.Printer_Model}</td>
                    <td className="px-3 py-2">{row.Device_Type}</td>
                    <td className="px-3 py-2 text-right">{row.Contract_Mono_CPP.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">{row.Contract_Color_CPP.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Base_Charge_Annual)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.Included_Mono_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.Included_Color_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.Billable_Mono_Pages)}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.Billable_Color_Pages)}</td>
                    <td className="px-3 py-2">{row.contract_end}</td>
                    <td className="px-3 py-2 text-right">{row["Recalculated_Age_(Years)"].toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">{row["Usage_(%)"].toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right">{formatNumber(row.Engine_Cycles)}</td>
                    <td className="px-3 py-2">{row.Final_Risk_Level}</td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-100 font-semibold">
                  <td className="px-3 py-2" colSpan={6}>{customer} Subtotals</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(subtotal.Contract_Base_Charge_Annual)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(subtotal.Included_Mono_Volume)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(subtotal.Included_Color_Volume)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(subtotal.Billable_Mono_Pages)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(subtotal.Billable_Color_Pages)}</td>
                  <td colSpan={5}></td>
                </tr>
              </React.Fragment>
            );
          })}
          <tr className="border-t bg-yellow-100 font-bold">
            <td className="px-3 py-2" colSpan={6}>Grand Totals</td>
            <td className="px-3 py-2 text-right">{formatCurrency(grandTotals.Contract_Base_Charge_Annual)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(grandTotals.Included_Mono_Volume)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(grandTotals.Included_Color_Volume)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(grandTotals.Billable_Mono_Pages)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(grandTotals.Billable_Color_Pages)}</td>
            <td colSpan={5}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
