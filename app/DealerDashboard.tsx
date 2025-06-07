"use client";

import React, { useState, useEffect } from "react";
import ChartBlock from "./ChartBlock";
import Table1 from "./Table1";
import Table2 from "./Table2";
import Table3 from "./Table3";
import RiskMarginTable from "./RiskMarginTable";
import { useMCARPData } from "./useMCARPData";
import { safeCurrency as formatCurrency, safePercent as formatPercent } from "./utils";

export default function DealerDashboard() {
  const {
    loading,
    filtered,
    data,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedContractType,
    setSelectedContractType,
  } = useMCARPData();

  const [showRiskTable, setShowRiskTable] = useState(false);

  useEffect(() => {
    if (showRiskTable) {
      setSelectedCustomer("All");
      setSelectedContractType("All");
    }
  }, [showRiskTable, setSelectedCustomer, setSelectedContractType]);

  const customerOptions = ["All", ...customers];

  if (loading) return <div className="p-6 text-xl">Loading data...</div>;

  const grouped = Object.entries(
    filtered.reduce<Record<string, typeof filtered>>((acc, row: (typeof filtered)[number]) => {
      const cust = row.Monitor;
      if (!acc[cust]) acc[cust] = [];
      acc[cust].push(row);
      return acc;
    }, {})
  );

  const table1Data = filtered.map((row) => ({
    Monitor: row.Monitor,
    Serial_Number: row.Serial_Number,
    Printer_Model: row.Printer_Model,
    Device_Type: row.Device_Type,
    Black_Annual_Volume: row.Black_Annual_Volume,
    Color_Annual_Volume: row.Color_Annual_Volume,
    Black_Full_Cartridges_Required_365d: row["Black_Full_Cartridges_Required_365d"],
    Cyan_Full_Cartridges_Required_365d: row["Cyan_Full_Cartridges_Required_365d"],
    Magenta_Full_Cartridges_Required_365d: row["Magenta_Full_Cartridges_Required_365d"],
    Yellow_Full_Cartridges_Required_365d: row["Yellow_Full_Cartridges_Required_365d"],
    Contract_Status: row.Contract_Status,
    Last_Updated: row.Last_Updated,
    Twelve_Month_Fulfillment_Cost: row.Twelve_Month_Fulfillment_Cost,
    Twelve_Month_Transactional_SP: row.Twelve_Month_Transactional_SP,
    Contract_Total_Revenue: row.Contract_Total_Revenue,
  }));

  const table2Data = filtered.map((row) => ({
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
    contract_end:
      typeof row.contract_end === "number"
        ? new Date((row.contract_end - 25569) * 86400 * 1000).toLocaleDateString("en-US")
        : "-",
    Recalculated_Age_Years: row["Recalculated_Age_Years"] ?? 0,
    Usage_Percent: row.Usage_Percent,
    Engine_Cycles: row.Engine_Cycles,
    Final_Risk_Level: row.Final_Risk_Level,
  }));

  const table3Data = filtered.map((row) => ({
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
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dealer Dashboard</h1>

      <div className="flex gap-6 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="p-2 border border-gray-300 rounded w-64"
          >
            {customerOptions.map((cust) => (
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="toggleRisk"
            checked={showRiskTable}
            onChange={() => setShowRiskTable(!showRiskTable)}
          />
          <label htmlFor="toggleRisk" className="text-sm font-medium text-gray-700">Show Margin & Risk Summary</label>
        </div>
      </div>

      {showRiskTable ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Margin & Risk Summary</h2>
          <RiskMarginTable filtered={filtered} />
        </div>
      ) : (
        <>
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Summary Charts</h2>
            <ChartBlock filtered={filtered} />
          </div>

          {selectedCustomer !== "All" && (
            <>
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 1</h2>
                <Table1 data={table1Data} />
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 2</h2>
                <Table2 data={table2Data} />
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Dealer Dashboard: Table 3</h2>
                <Table3 filtered={filtered} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
