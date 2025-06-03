"use client";

import React from "react";
import Table1 from "./Table1";
import Table2 from "./Table2";
import Table3 from "./Table3";
import { useMCARPData } from "./useMCARPData";
import type { McarpRow } from "./types";

export default function DealerDashboard() {
  const {
    loading,
    filtered,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedContractType,
    setSelectedContractType,
  } = useMCARPData();
  console.log("Filtered sample row:", JSON.stringify(filtered[0], null, 2));
  const table1Data = filtered.map((row: any) => ({
    Monitor: row.Monitor,
    Serial_Number: row.Serial_Number,
    Printer_Model: row.Printer_Model,
    Device_Type: row.Device_Type,
    Black_Annual_Volume: row.Black_Annual_Volume,
    Color_Annual_Volume: row.Color_Annual_Volume,
    Black_Full_Cartridges_Required_365d: row["Black_Full_Cartridges_Required_(365d)"],
    Cyan_Full_Cartridges_Required_365d: row["Cyan_Full_Cartridges_Required_(365d)"],
    Magenta_Full_Cartridges_Required_365d: row["Magenta_Full_Cartridges_Required_(365d)"],
    Yellow_Full_Cartridges_Required_365d: row["Yellow_Full_Cartridges_Required_(365d)"],
    Contract_Status: row.Contract_Status,
    Fulfillment_Cost_12_Mth: row["12_Mth_Fulfillment_Cost"],
    Transactional_SP_12_Mth: row["12_Mth_Transactional_SP"],
    Contract_Total_Revenue: row.Contract_Total_Revenue,
    Transactional_GM_Percent: row["Transactional_GM%"],
    Contract_GM_Percent: row["Contract_GM%"],
  }));
  const table2Data = filtered.map((row: any) => ({
    Monitor: row.Monitor,
    Serial_Number: row.Serial_Number,
    Printer_Model: row.Printer_Model,
    Device_Type: row.Device_Type,
    Contract_Mono_CPP: row.Contract_Mono_CPP,
    Contract_Color_CPP: row.Contract_Color_CPP,
    Contract_Base_Charge_Annual: row.Contract_Base_Charge_Annual,
    Included_Mono_Volume: row.Included_Mono_Volume,
    Included_Color_Volume: row.Included_Color_Volume,
    Billable_Mono_Pages: row.Billable_Mono_Pages,
    Billable_Color_Pages: row.Billable_Color_Pages,
    contract_end: row.contract_end,
    Recalculated_Age_Years: row.Recalculated_Age_Years,
    Usage_Percent: row.Usage_Percent,
    Engine_Cycles: row.Engine_Cycles,
    Final_Risk_Level: row.Final_Risk_Level,
  })) as any[];

  const table3Data = filtered.map((row: any) => ({
    Monitor: row.Monitor,
    Serial_Number: row.Serial_Number,
    Printer_Model: row.Printer_Model,
    Device_Type: row.Device_Type,
    Black_Pages_Left: row.Black_Pages_Left,
    Cyan_Pages_Left: row.Cyan_Pages_Left,
    Magenta_Pages_Left: row.Magenta_Pages_Left,
    Yellow_Pages_Left: row.Yellow_Pages_Left,
    Black_Page_Coverage_Percent: row.Black_Page_Coverage_Percent,
    Cyan_Page_Coverage_Percent: row.Cyan_Page_Coverage_Percent,
    Magenta_Page_Coverage_Percent: row.Magenta_Page_Coverage_Percent,
    Yellow_Page_Coverage_Percent: row.Yellow_Page_Coverage_Percent,
    Black_Yield_Estimate: row.Black_Yield_Estimate,
    Cyan_Yield_Estimate: row.Cyan_Yield_Estimate,
    Magenta_Yield_Estimate: row.Magenta_Yield_Estimate,
    Yellow_Yield_Estimate: row.Yellow_Yield_Estimate,
  })) as any[];

  const formatCurrency = (val: number | string) =>
    typeof val === "number"
      ? val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
      : val;

  const formatPercent = (num: number | string) =>
    typeof num === "number" ? `${Math.round(num * 100)}%` : num;

  const computeGM = (sp: number, cost: number) => (sp > 0 ? (sp - cost) / sp : 0);
  const computeContractGM = (cost: number, rev: number) => (rev > 0 ? (rev - cost) / rev : 0);

  const grandTotals = filtered.reduce(
    (sum, row) => ({
      Black_Annual_Volume: sum.Black_Annual_Volume + row.Black_Annual_Volume,
      Color_Annual_Volume: sum.Color_Annual_Volume + row.Color_Annual_Volume,
      Fulfillment: sum.Fulfillment + ((row as any)["12_Mth_Fulfillment_Cost"] ?? 0),
      SP: sum.SP + ((row as any)["12_Mth_Transactional_SP"] ?? 0),
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

  const grandTransactionalGM = grandTotals.SP > 0 ? (grandTotals.SP - grandTotals.Fulfillment) / grandTotals.SP : 0;
  const grandContractGM = grandTotals.Revenue > 0 ? (grandTotals.Revenue - grandTotals.Fulfillment) / grandTotals.Revenue : 0;

  if (loading) return <div className="p-6 text-xl">Loading data...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dealer Dashboard: Table 1</h1>

      <div className="flex gap-6 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="p-2 border border-gray-300 rounded w-64"
          >
            {customers.map((cust) => (
              <option key={cust} value={cust}>{cust}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type:</label>
          <select
            value={selectedContractType}
            onChange={(e) => setSelectedContractType(e.target.value)}
            className="p-2 border border-gray-300 rounded w-64"
          >
            <option value="All">All</option>
            <option value="C">Contracted (C)</option>
            <option value="T">Transactional (T)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Serial Number</th>
              <th className="px-3 py-2">Printer Model</th>
              <th className="px-3 py-2 text-center">Device Type</th>
              <th className="px-3 py-2 text-right">Black Annual Volume</th>
              <th className="px-3 py-2 text-right">Color Annual Volume</th>
              <th className="px-3 py-2 text-right">Black Cartridges</th>
              <th className="px-3 py-2 text-right">Cyan</th>
              <th className="px-3 py-2 text-right">Magenta</th>
              <th className="px-3 py-2 text-right">Yellow</th>
              <th className="px-3 py-2 text-center">Contract Status</th>
              <th className="px-3 py-2 text-right">Fulfillment Cost</th>
              <th className="px-3 py-2 text-right">Transactional SP</th>
              <th className="px-3 py-2 text-center">Transactional GM%</th>
              <th className="px-3 py-2 text-right">Contract Revenue</th>
              <th className="px-3 py-2 text-center">Contract GM%</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(
              filtered.reduce((acc, row) => {
                acc[row.Monitor] = acc[row.Monitor] || [];
                acc[row.Monitor].push(row);
                return acc;
              }, {} as Record<string, McarpRow[]>)
            ).map(([customer, rows]) => {
              const totals = rows.reduce(
                (sum, row) => ({
                  Black_Annual_Volume: sum.Black_Annual_Volume + row.Black_Annual_Volume,
                  Color_Annual_Volume: sum.Color_Annual_Volume + row.Color_Annual_Volume,
                  Fulfillment: sum.Fulfillment + ((row as any)["12_Mth_Fulfillment_Cost"] ?? 0),
                  SP: sum.SP + ((row as any)["12_Mth_Transactional_SP"] ?? 0),
                  Revenue: sum.Revenue + row.Contract_Total_Revenue,
                }),
                { Black_Annual_Volume: 0, Color_Annual_Volume: 0, Fulfillment: 0, SP: 0, Revenue: 0 }
              );

              const transactionalGM = totals.SP > 0 ? (totals.SP - totals.Fulfillment) / totals.SP : 0;
              const contractGM = totals.Revenue > 0 ? (totals.Revenue - totals.Fulfillment) / totals.Revenue : 0;

              return (
                <React.Fragment key={customer}>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{row.Monitor}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.Serial_Number}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.Printer_Model}</td>
                      <td className="px-3 py-2 text-center">{row.Device_Type}</td>
                      <td className="px-3 py-2 text-right">{Number(row.Black_Annual_Volume).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{Number(row.Color_Annual_Volume).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{(row as any)["Black_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{(row as any)["Cyan_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{(row as any)["Magenta_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{(row as any)["Yellow_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-center">{row.Contract_Status}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency((row as any)["12_Mth_Fulfillment_Cost"])}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency((row as any)["12_Mth_Transactional_SP"])}</td>
                      <td className="px-3 py-2 text-center">
                        {formatPercent(
                          computeGM(
                            (row as any)["12_Mth_Transactional_SP"],
                            (row as any)["12_Mth_Fulfillment_Cost"]
                          )
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Total_Revenue)}</td>
                      <td className="px-3 py-2 text-center">
                        {formatPercent(
                          computeContractGM(
                            (row as any)["12_Mth_Fulfillment_Cost"],
                            row.Contract_Total_Revenue
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-100 font-semibold">
                    <td className="px-3 py-2" colSpan={4}>{customer} Totals</td>
                    <td className="px-3 py-2 text-right">{totals.Black_Annual_Volume.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totals.Color_Annual_Volume.toLocaleString()}</td>
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
            <tr className="border-t bg-yellow-100 font-bold">
              <td className="px-3 py-2" colSpan={4}>Grand Totals</td>
              <td className="px-3 py-2 text-right">{grandTotals.Black_Annual_Volume.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{grandTotals.Color_Annual_Volume.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{grandTotals.Black}</td>
              <td className="px-3 py-2 text-right">{grandTotals.Cyan}</td>
              <td className="px-3 py-2 text-right">{grandTotals.Magenta}</td>
              <td className="px-3 py-2 text-right">{grandTotals.Yellow}</td>
              <td></td>
              <td className="px-3 py-2 text-right">{formatCurrency(grandTotals.Fulfillment)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(grandTotals.SP)}</td>
              <td className="px-3 py-2 text-center">{formatPercent(grandTransactionalGM)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(grandTotals.Revenue)}</td>
              <td className="px-3 py-2 text-center">{formatPercent(grandContractGM)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 1</h2>
        <Table1 filtered={table1Data} />
      </div>
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 2</h2>
        <Table2 filtered={filtered} />
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 3</h2>
        <Table3 filtered={filtered} />
      </div>
    </div>
  );
}
