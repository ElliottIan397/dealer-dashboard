"use client";

import React, { useState, useEffect } from "react";

type McarpRow = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Black_Annual_Volume: number;
  Color_Annual_Volume: number;
  "Black_Full_Cartridges_Required_(365d)": number;
  "Cyan_Full_Cartridges_Required_(365d)": number;
  "Magenta_Full_Cartridges_Required_(365d)": number;
  "Yellow_Full_Cartridges_Required_(365d)": number;
  Contract_Status: string;
  "12_Mth_Fulfillment_Cost": number;
  "12_Mth_Transactional_SP": number;
  Contract_Total_Revenue: number;
};

export default function DealerDashboard() {
  const [data, setData] = useState<McarpRow[]>([]);
  const [filtered, setFiltered] = useState<McarpRow[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedContractType, setSelectedContractType] = useState("All");
  const [customers, setCustomers] = useState<string[]>(["All"]);

  useEffect(() => {
    fetch("/mcarp.json")
      .then((res) => res.json())
      .then((json: McarpRow[]) => {
        setData(json);
        const customerNames = Array.from(new Set(json.map((row) => row.Monitor))).sort();
        setCustomers(["All", ...customerNames]);
      });
  }, []);

  useEffect(() => {
    let result = data;
    if (selectedCustomer !== "All") {
      result = result.filter((row) => row.Monitor === selectedCustomer);
    }
    if (selectedContractType !== "All") {
      result = result.filter((row) =>
        selectedContractType === "C" ? row.Contract_Status === "C" : row.Contract_Status === "Transactional"
      );
    }
    setFiltered(result);
  }, [selectedCustomer, selectedContractType, data]);

  const formatCurrency = (val: number | string) =>
    typeof val === "number"
      ? val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
      : val;

  const formatPercent = (num: number | string) =>
    typeof num === "number" ? `${Math.round(num * 100)}%` : num;

  const computeGM = (sp: number, cost: number) => (sp > 0 ? (sp - cost) / sp : 0);
  const computeContractGM = (sp: number, cost: number, rev: number) => (rev > 0 ? (sp - cost) / rev : 0);

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
                  Fulfillment: sum.Fulfillment + row["12_Mth_Fulfillment_Cost"],
                  SP: sum.SP + row["12_Mth_Transactional_SP"],
                  Revenue: sum.Revenue + row.Contract_Total_Revenue
                }),
                { Black_Annual_Volume: 0, Color_Annual_Volume: 0, Fulfillment: 0, SP: 0, Revenue: 0 }
              );

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
                      <td className="px-3 py-2 text-right">{row["Black_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{row["Cyan_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{row["Magenta_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-right">{row["Yellow_Full_Cartridges_Required_(365d)"]}</td>
                      <td className="px-3 py-2 text-center">{row.Contract_Status}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row["12_Mth_Fulfillment_Cost"])}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row["12_Mth_Transactional_SP"])}</td>
                      <td className="px-3 py-2 text-center">{formatPercent(computeGM(row["12_Mth_Transactional_SP"], row["12_Mth_Fulfillment_Cost"]))}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Total_Revenue)}</td>
                      <td className="px-3 py-2 text-center">{formatPercent(computeContractGM(row["12_Mth_Transactional_SP"], row["12_Mth_Fulfillment_Cost"], row.Contract_Total_Revenue))}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-100 font-semibold">
                    <td className="px-3 py-2" colSpan={4}>{customer} Totals</td>
                    <td className="px-3 py-2 text-right">{totals.Black_Annual_Volume.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{totals.Color_Annual_Volume.toLocaleString()}</td>
                    <td colSpan={5}></td>
                    <td className="px-3 py-2 text-right">{formatCurrency(totals.Fulfillment)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(totals.SP)}</td>
                    <td></td>
                    <td className="px-3 py-2 text-right">{formatCurrency(totals.Revenue)}</td>
                    <td></td>
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