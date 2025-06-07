
"use client";

import React from "react";
import { safeFixed, safePercent, safeNumber, safeCurrency } from "./utils";
import type { McarpRow } from "./types";

type Table2Row = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Contract_Mono_CPP: number;
  Contract_Color_CPP: number;
  Contract_Base_Charge_Annual: number;
  Included_Mono_Volume: number;
  Included_Color_Volume: number;
  Billable_Mono_Pages: number;
  Billable_Color_Pages: number;
  contract_end: string;
  Recalculated_Age_Years: number;
  Usage_Percent: number;
  Engine_Cycles: number;
  Final_Risk_Level: string;
  Last_Updated: number;
};

type Props = {
  data: Table2Row[];
};

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function isStale(lastUpdated: number, currentDate: Date, days: number): boolean {
  const last = excelDateToJSDate(lastUpdated);
  const diff = (currentDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff > days;
}

export default function Table2({ data }: Props) {
  const renderColorField = (val: any, type: string) =>
    type === "Mono" ? <span className="text-gray-400">-</span> : safeNumber(val);

  const renderColorFixed = (val: any, type: string, digits = 4) =>
    type === "Mono" ? <span className="text-gray-400">-</span> : safeFixed(val, digits);

  const grouped = Object.entries(
    data.reduce((acc: Record<string, Table2Row[]>, row) => {
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {})
  );

  const latestDate = new Date();

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
                Contract_Base_Charge_Annual: sum.Contract_Base_Charge_Annual + (row.Contract_Base_Charge_Annual || 0),
                Included_Mono_Volume: sum.Included_Mono_Volume + (row.Included_Mono_Volume || 0),
                Included_Color_Volume: sum.Included_Color_Volume + (row.Included_Color_Volume || 0),
                Billable_Mono_Pages: sum.Billable_Mono_Pages + (row.Billable_Mono_Pages || 0),
                Billable_Color_Pages: sum.Billable_Color_Pages + (row.Billable_Color_Pages || 0),
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
                    <td className="px-3 py-2 text-right">{safeFixed(row.Contract_Mono_CPP, 4)}</td>
                    <td className="px-3 py-2 text-right">{renderColorFixed(row.Contract_Color_CPP, row.Device_Type)}</td>
                    <td className="px-3 py-2 text-right">{safeCurrency(row.Contract_Base_Charge_Annual)}</td>
                    <td className="px-3 py-2 text-right">{safeNumber(row.Included_Mono_Volume)}</td>
                    <td className="px-3 py-2 text-right">{renderColorField(row.Included_Color_Volume, row.Device_Type)}</td>
                    <td className="px-3 py-2 text-right">{safeNumber(row.Billable_Mono_Pages)}</td>
                    <td className="px-3 py-2 text-right">{renderColorField(row.Billable_Color_Pages, row.Device_Type)}</td>
                    <td className="px-3 py-2">{row.contract_end}</td>
                    <td className="px-3 py-2 text-right">{safeFixed(row.Recalculated_Age_Years, 1)}</td>
                    <td className="px-3 py-2 text-right">{safePercent(row.Usage_Percent)}</td>
                    <td className="px-3 py-2 text-right">{safeNumber(row.Engine_Cycles)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 align-middle ${
                          row.Final_Risk_Level === "Critical"
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
                <tr className="border-t bg-gray-100 font-semibold">
                  <td className="px-3 py-2" colSpan={6}>{customer} Totals</td>
                  <td className="px-3 py-2 text-right">{safeCurrency(subtotal.Contract_Base_Charge_Annual)}</td>
                  <td className="px-3 py-2 text-right">{safeNumber(subtotal.Included_Mono_Volume)}</td>
                  <td className="px-3 py-2 text-right">{safeNumber(subtotal.Included_Color_Volume)}</td>
                  <td className="px-3 py-2 text-right">{safeNumber(subtotal.Billable_Mono_Pages)}</td>
                  <td className="px-3 py-2 text-right">{safeNumber(subtotal.Billable_Color_Pages)}</td>
                  <td colSpan={5}></td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}