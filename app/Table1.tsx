"use client";

import React from "react";

const getBiasField = (row: any, field: string, bias: 'O' | 'R' | 'N') => {
  return bias === 'O' ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
};

import { safeCurrency as formatCurrency, safePercent as formatPercent } from "./utils";
import type { McarpRow } from "./types";

type Table1Row = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
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

type Props = {
  data: Table1Row[];
};

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

function isStale(lastUpdated: number, currentDate: Date, days: number): boolean {
  const last = excelDateToJSDate(lastUpdated);
  const diff = (currentDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diff > days;
}

export default function Table1({ data, bias }: { data: any[]; bias: 'O' | 'R' | 'N' }) {
  const computeGM = (sp: number, cost: number) => (sp > 0 ? (sp - cost) / sp : 0);
  const computeContractGM = (cost: number, rev: number) => (rev > 0 ? (rev - cost) / rev : 0);

  const formatCell = (value: number) =>
    value === 0 ? <span className="text-gray-400">-</span> : value.toLocaleString();

  const grouped = Object.entries(
    data.reduce((acc: Record<string, Table1Row[]>, row) => {
      if (!row) return acc;
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
                            title={`Last updated: ${excelDateToJSDate(row.Last_Updated).toLocaleDateString()}`}
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
                  <td className="px-3 py-2 text-right">{formatCurrency(totals.Fulfillment)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(totals.SP)}</td>
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
  );
}
