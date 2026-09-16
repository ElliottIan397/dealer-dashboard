"use client";

import React, { useState } from "react";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  const biasKey = `${bias}_${field}`;
  if (row?.[biasKey] != null) return row[biasKey];
  if (row?.[field] != null) return row[field];
  return 0;
};

import { safeCurrency as formatCurrency, safePercent as formatPercent } from "./utils";
import type { McarpRow } from "./types";

type Table1Row = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Device_Class?: string;
  Black_Annual_Volume: number;
  Color_Annual_Volume: number;
  Black_Full_Cartridges_Required_365d: number;
  Cyan_Full_Cartridges_Required_365d: number;
  Magenta_Full_Cartridges_Required_365d: number;
  Yellow_Full_Cartridges_Required_365d: number;
  Contract_Status: string;
  Last_Updated: number;
  Twelve_Month_Fulfillment_Cost: number;
  Twelve_Month_Transactional_SP: number;
  Contract_Total_Revenue: number;
};

interface Props {
  data: Table1Row[];
  bias: "O" | "R" | "N";
  selectedMonths: number;
}

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function isStale(lastUpdated: number, currentDate: Date, days: number): boolean {
  const last = excelDateToJSDate(lastUpdated);
  const diff = (currentDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff > days;
}

export default function Table1({ data, bias, selectedMonths }: Props) {
  const [deviceFilter, setDeviceFilter] = useState<
    "all" | "highUsage" | "stale" | "both"
  >("all");
  const computeGM = (sp: number, cost: number) => (sp > 0 ? (sp - cost) / sp : 0);
  const computeContractGM = (cost: number, rev: number) => (rev > 0 ? (rev - cost) / rev : 0);

  const formatCell = (value: number) =>
    value === 0 ? <span className="text-gray-400">-</span> : value.toLocaleString();

  const latestDate = new Date();

  const displayedData = data.filter((row) => {
    const stale = isStale(row.Last_Updated, latestDate, 5);
    const highUsage = row.Device_Class?.includes("High Usage") ?? false;

    if (deviceFilter === "highUsage") return highUsage;
    if (deviceFilter === "stale") return stale;
    if (deviceFilter === "both") return highUsage && stale;

    return true;
  });

  const grouped = Object.entries(
    displayedData.reduce((acc: Record<string, Table1Row[]>, row) => {
      if (!row) return acc;
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {})
  );

return (
    <div>
      <div className="mb-4 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Device Filter:
          </label>

          <select
            value={deviceFilter}
            onChange={(e) =>
              setDeviceFilter(
                e.target.value as "all" | "highUsage" | "stale" | "both"
              )
            }
            className="p-2 border border-gray-300 rounded w-56"
          >
            <option value="all">All Devices</option>
            <option value="highUsage">High Usage (Purple)</option>
            <option value="stale">Stale Data (Red)</option>
            <option value="both">High Usage + Stale</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm text-gray-900">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-left">Serial Number</th>
            <th className="px-3 py-2 text-left">Printer Model</th>
            <th className="px-3 py-2 text-center">Device Type</th>
            <th className="px-3 py-2 text-center">Black Vol Fcst</th>
            <th className="px-3 py-2 text-center">Color Vol Fcst</th>
            <th className="px-3 py-2 text-center">Black Ctgs</th>
            <th className="px-3 py-2 text-center">Cyan Ctgs</th>
            <th className="px-3 py-2 text-center">Magenta Ctgs</th>
            <th className="px-3 py-2 text-center">Yellow Ctgs</th>
            <th className="px-3 py-2 text-center">Contract Status</th>
            <th className="px-3 py-2 text-center">Transact Rev</th>           
            <th className="px-3 py-2 text-center">Fulfillment Cost</th>
            <th className="px-3 py-2 text-center">Trans GM%</th>
            <th className="px-3 py-2 text-center">Contract Rev</th>
            <th className="px-3 py-2 text-center">Contract GM%</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([customer, rows]) => {
            const totals = rows.reduce(
              (sum, row) => ({
                Black_Annual_Volume: sum.Black_Annual_Volume + row.Black_Annual_Volume,
                Color_Annual_Volume: sum.Color_Annual_Volume + row.Color_Annual_Volume,
                Fulfillment: sum.Fulfillment + getBiasField(row, "Twelve_Month_Fulfillment_Cost", bias),
                SP: sum.SP + (row.Twelve_Month_Transactional_SP ?? 0),
                Revenue: sum.Revenue + row.Contract_Total_Revenue,
                Black: sum.Black + getBiasField(row, "Black_Full_Cartridges_Required_365d", bias),
                Cyan: sum.Cyan + getBiasField(row, "Cyan_Full_Cartridges_Required_365d", bias),
                Magenta: sum.Magenta + getBiasField(row, "Magenta_Full_Cartridges_Required_365d", bias),
                Yellow: sum.Yellow + getBiasField(row, "Yellow_Full_Cartridges_Required_365d", bias),
              }),
              {
                Black_Annual_Volume: 0,
                Color_Annual_Volume: 0,
                Fulfillment: 0,
                SP: 0,
                Revenue: 0,
                Black: 0,
                Cyan: 0,
                Magenta: 0,
                Yellow: 0,
              }
            );

            const transactionalGM = computeGM(totals.SP, totals.Fulfillment);
            const contractGM = computeContractGM(totals.Fulfillment, totals.Revenue);

            return (
              <React.Fragment key={customer}>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {row.Monitor}
                        {isStale(row.Last_Updated, latestDate, 5) && (
                          <span
                            className="w-2 h-2 bg-red-500 rounded-full"
                            title={`Last updated: ${excelDateToJSDate(
                              row.Last_Updated
                            ).toLocaleDateString()}`}
                          ></span>
                        )}

                        {row.Device_Class?.includes("High Usage") && (
                          <span
                            className="w-2 h-2 bg-purple-500 rounded-full"
                            title="High Usage Device"
                          ></span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.Serial_Number}</td>
                    <td className="px-3 py-2">{row.Printer_Model}</td>
                    <td className="px-3 py-2 text-center">{row.Device_Type}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Black_Annual_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Color_Annual_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(getBiasField(row, "Black_Full_Cartridges_Required_365d", bias))}</td>
                    <td className="px-3 py-2 text-right">{formatCell(getBiasField(row, "Cyan_Full_Cartridges_Required_365d", bias))}</td>
                    <td className="px-3 py-2 text-right">{formatCell(getBiasField(row, "Magenta_Full_Cartridges_Required_365d", bias))}</td>
                    <td className="px-3 py-2 text-right">{formatCell(getBiasField(row, "Yellow_Full_Cartridges_Required_365d", bias))}</td>
                    <td className="px-3 py-2 text-center">{row.Contract_Status}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(getBiasField(row, "Twelve_Month_Transactional_SP", bias))}</td>                    
                    <td className="px-3 py-2 text-right">{formatCurrency(getBiasField(row, "Twelve_Month_Fulfillment_Cost", bias))}</td>
                    <td className="px-3 py-2 text-center">
                      {formatPercent(computeGM(row.Twelve_Month_Transactional_SP, getBiasField(row, "Twelve_Month_Fulfillment_Cost", bias)))}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Total_Revenue)}</td>
                    <td className="px-3 py-2 text-center">
                      {formatPercent(computeContractGM(getBiasField(row, "Twelve_Month_Fulfillment_Cost", bias), row.Contract_Total_Revenue))}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-100 font-semibold">
                  <td className="px-3 py-2" colSpan={4}>
                    {customer} Totals
                  </td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Black_Annual_Volume)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Color_Annual_Volume)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Black)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Cyan)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Magenta)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Yellow)}</td>
                  <td className="px-3 py-2 text-center"></td>
                  <td className="px-3 py-2 text-right">{formatCurrency(totals.SP)}</td>                 
                  <td className="px-3 py-2 text-right">{formatCurrency(totals.Fulfillment)}</td>
                  <td className="px-3 py-2 text-center">{formatPercent(transactionalGM)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(totals.Revenue)}</td>
                  <td className="px-3 py-2 text-center">{formatPercent(contractGM)}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
  );
}
