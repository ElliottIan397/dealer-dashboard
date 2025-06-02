"use client";

import { useState, useEffect } from "react";

export default function DealerDashboard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState("All");
  const [customers, setCustomers] = useState(["All"]);

  useEffect(() => {
    fetch("/mcarp.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        const customerNames = Array.from(new Set(json.map((row) => row.Monitor))).sort();
        setCustomers(["All", ...customerNames]);
      });
  }, []);

  useEffect(() => {
    setFiltered(
      selected === "All" ? data : data.filter((row) => row.Monitor === selected)
    );
  }, [selected, data]);

  const formatCurrency = (val) => {
    return typeof val === "number"
      ? val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
      : val;
  };

  const formatPercent = (num) => {
    return typeof num === "number" ? `${Math.round(num * 100)}%` : num;
  };

  const computeGM = (sp, cost) => {
    if (sp > 0) return (sp - cost) / sp;
    return 0;
  };

  const computeContractGM = (sp, cost, rev) => {
    if (rev > 0) return (sp - cost) / rev;
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dealer Dashboard: Table 1</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer:</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="p-2 border border-gray-300 rounded w-64"
        >
          {customers.map((cust) => (
            <option key={cust} value={cust}>{cust}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
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
            {filtered.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">{row.Monitor}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.Serial_Number}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.Printer_Model}</td>
                <td className="px-3 py-2 text-center">{row.Device_Type}</td>
                <td className="px-3 py-2 text-right">{Number(row.Black_Annual_Volume).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Number(row.Color_Annual_Volume).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{row.Black_Full_Cartridges_Required_(365d)}</td>
                <td className="px-3 py-2 text-right">{row.Cyan_Full_Cartridges_Required_(365d)}</td>
                <td className="px-3 py-2 text-right">{row.Magenta_Full_Cartridges_Required_(365d)}</td>
                <td className="px-3 py-2 text-right">{row.Yellow_Full_Cartridges_Required_(365d)}</td>
                <td className="px-3 py-2 text-center">{row.Contract_Status}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row["12_Mth_Fulfillment_Cost"])}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row["12_Mth_Transactional_SP"])}</td>
                <td className="px-3 py-2 text-center">{formatPercent(computeGM(row["12_Mth_Transactional_SP"], row["12_Mth_Fulfillment_Cost"]))}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(row.Contract_Total_Revenue)}</td>
                <td className="px-3 py-2 text-center">{formatPercent(computeContractGM(row["12_Mth_Transactional_SP"], row["12_Mth_Fulfillment_Cost"], row.Contract_Total_Revenue))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
