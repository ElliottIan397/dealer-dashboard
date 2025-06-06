"use client";

import React from "react";
import { safeCurrency as formatCurrency, safePercent as formatPercent } from "./utils";
import type { McarpRow } from "./types";

function isStale(lastUpdated: string, latestDate: Date, days: number): boolean {
  const updatedDate = new Date(lastUpdated);
  const diffMs = latestDate.getTime() - updatedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > days;
}

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
  Twelve_Month_Fulfillment_Cost: number;
  Twelve_Month_Transactional_SP: number;
  Contract_Total_Revenue: number;
  Last_Updated: string;
};

type Props = {
  data: Table1Row[];
};

export default function Table1({ data }: Props) {
  const computeGM = (sp: number, cost: number) => (sp > 0 ? (sp - cost) / sp : 0);
  const computeContractGM = (cost: number, rev: number) => (rev > 0 ? (rev - cost) / rev : 0);
  const formatCell = (value: number) => value === 0 ? <span className="text-gray-400">-</span> : value.toLocaleString();

  const latestDate = data.reduce((latest, row) => {
    const current = new Date(row.Last_Updated);
    return current > latest ? current : latest;
  }, new Date(0));

  const grouped = Object.entries(
    data.reduce((acc: Record<string, Table1Row[]>, row) => {
      if (!row) return acc;
      acc[row.Monitor] = acc[row.Monitor] || [];
      acc[row.Monitor].push(row);
      return acc;
    }, {})
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm text-gray-900">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-left">Serial Number</th>
            <th className="px-3 py-2 text-left">Printer Model</th>
            <th className="px-3 py-2 text-center">Device Type</th>
            <th className="px-3 py-2 text-right">Black Vol</th>
            <th className="px-3 py-2 text-right">Color Vol</th>
            <th className="px-3 py-2 text-right">Black</th>
            <th className="px-3 py-2 text-right">Cyan</th>
            <th className="px-3 py-2 text-right">Magenta</th>
            <th className="px-3 py-2 text-right">Yellow</th>
            <th className="px-3 py-2 text-center">Contract Status</th>
            <th className="px-3 py-2 text-right">Fulfillment</th>
            <th className="px-3 py-2 text-right">Trans SP</th>
            <th className="px-3 py-2 text-center">Trans GM%</th>
            <th className="px-3 py-2 text-right">Revenue</th>
            <th className="px-3 py-2 text-center">Contract GM%</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(([customer, rows]) => {
            const totals = rows.reduce(
              (sum, row) => ({
                Black_Annual_Volume: sum.Black_Annual_Volume + row.Black_Annual_Volume,
                Color_Annual_Volume: sum.Color_Annual_Volume + row.Color_Annual_Volume,
                Fulfillment: sum.Fulfillment + (row.Twelve_Month_Fulfillment_Cost ?? 0),
                SP: sum.SP + (row.Twelve_Month_Transactional_SP ?? 0),
                Revenue: sum.Revenue + row.Contract_Total_Revenue,
                Black: sum.Black + row.Black_Full_Cartridges_Required_365d,
                Cyan: sum.Cyan + row.Cyan_Full_Cartridges_Required_365d,
                Magenta: sum.Magenta + row.Magenta_Full_Cartridges_Required_365d,
                Yellow: sum.Yellow + row.Yellow_Full_Cartridges_Required_365d,
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
                      <span className="flex items-center gap-1">
                        {row.Monitor}
                        {isStale(row.Last_Updated, latestDate, 5) && (
                          <span
                            className="w-2 h-2 bg-red-500 rounded-full"
                            title={`Last updated: ${new Date(row.Last_Updated).toLocaleDateString()}`}
                          ></span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.Serial_Number}</td>
                    <td className="px-3 py-2">{row.Printer_Model}</td>
                    <td className="px-3 py-2 text-center">{row.Device_Type}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Black_Annual_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Color_Annual_Volume)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Black_Full_Cartridges_Required_365d)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Cyan_Full_Cartridges_Required_365d)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Magenta_Full_Cartridges_Required_365d)}</td>
                    <td className="px-3 py-2 text-right">{formatCell(row.Yellow_Full_Cartridges_Required_365d)}</td>
                    <td className="px-3 py-2 text-center">{row.Contract_Status}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.Twelve_Month_Fulfillment_Cost)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.Twelve_Month_Transactional_SP)}</td>
                    <td className="px-3 py-2 text-center">{formatPercent(computeGM(row.Twelve_Month_Transactional_SP, row.Twelve_Month_Fulfillment_Cost))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Total_Revenue)}</td>
                    <td className="px-3 py-2 text-center">{formatPercent(computeContractGM(row.Twelve_Month_Fulfillment_Cost, row.Contract_Total_Revenue))}</td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-100 font-semibold">
                  <td className="px-3 py-2" colSpan={4}>{customer} Totals</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Black_Annual_Volume)}</td>
                  <td className="px-3 py-2 text-right">{formatCell(totals.Color_Annual_Volume)}</td>
                  <td colSpan={5}></td>
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
