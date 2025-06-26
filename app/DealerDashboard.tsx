"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import ChartBlock from "./ChartBlock";
import Table1 from "./Table1";
import Table2 from "./Table2";
import Table3 from "./Table3";
import RiskMarginTable from "./RiskMarginTable";
import VendorSummaryTable from "./VendorSummaryTable";
import SubscriptionPlanTable from "./SubscriptionPlanTable";
import { useMCARPData } from "./useMCARPData";
import { safeCurrency as formatCurrency, safePercent as formatPercent } from "./utils";
import { DASHBOARD_MODE } from "./config";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
};

export default function DealerDashboard() {
  const {
    loading,
    filtered,
    filteredForVendor,
    data,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedContractType,
    setSelectedContractType,
  } = useMCARPData();

  const [viewMode, setViewMode] = useState<"" | "risk" | "vendor" | "subscription">("");
  const [selectedBias, setSelectedBias] = useState<"O" | "R" | "N">("O");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");

  const manufacturerOptions = Array.from(
    new Set(data.map((row) => row.Manufacturer).filter(Boolean))
  )
    .sort()
    .map((mfr) => ({ value: mfr, label: mfr }));

  useEffect(() => {
    if (viewMode === "risk") {
      setSelectedCustomer("All");
      setSelectedContractType("All");
    }
  }, [viewMode]);

  const customerOptions = ["All", ...customers];

  if (loading) return <div className="p-6 text-xl">Loading data...</div>;

  const contractOnly = filtered.filter((row) => row.Contract_Status === "C");

  const table1Data = filtered.map((row) => ({
    Monitor: row.Monitor,
    Serial_Number: row.Serial_Number,
    Printer_Model: row.Printer_Model,
    Device_Type: row.Device_Type,
    Black_Annual_Volume: row.Black_Annual_Volume,
    Color_Annual_Volume: row.Color_Annual_Volume,
    Black_Full_Cartridges_Required_365d: getBiasField(row, "Black_Full_Cartridges_Required_365d", selectedBias),
    Cyan_Full_Cartridges_Required_365d: getBiasField(row, "Cyan_Full_Cartridges_Required_365d", selectedBias),
    Magenta_Full_Cartridges_Required_365d: getBiasField(row, "Magenta_Full_Cartridges_Required_365d", selectedBias),
    Yellow_Full_Cartridges_Required_365d: getBiasField(row, "Yellow_Full_Cartridges_Required_365d", selectedBias),
    Contract_Status: row.Contract_Status,
    Last_Updated: row.Last_Updated,
    Twelve_Month_Fulfillment_Cost: getBiasField(row, "Twelve_Month_Fulfillment_Cost", selectedBias),
    Twelve_Month_Transactional_SP: getBiasField(row, "Twelve_Month_Transactional_SP", selectedBias),
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
    contract_end: typeof row.contract_end === "number"
      ? new Date((row.contract_end - 25569) * 86400 * 1000).toLocaleDateString("en-US")
      : "-",
    Recalculated_Age_Years: row.Recalculated_Age_Years ?? 0,
    Usage_Percent: row.Usage_Percent,
    Engine_Cycles: row.Engine_Cycles,
    Final_Risk_Level: row.Final_Risk_Level,
    Last_Updated: row.Last_Updated,
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
    Last_Updated: row.Last_Updated,
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dealer Dashboard</h1>

      <div className="flex gap-6 flex-wrap items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU Bias:</label>
          <select
            value={selectedBias}
            onChange={(e) => setSelectedBias(e.target.value as "O" | "R" | "N")}
            className="p-2 border border-gray-300 rounded w-64"
          >
            <option value="O">OEM</option>
            <option value="R">Reman</option>
            <option value="N">New Build</option>
          </select>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Options:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "" | "risk" | "vendor" | "subscription")}
            className="p-2 border border-gray-300 rounded w-64"
          >
            <option value="">-- None --</option>
            <option value="risk">Show Margin & Risk Summary</option>
            <option value="vendor">Show Vendor Summary</option>
            <option value="subscription">Show Subscription Plan</option>
          </select>
        </div>

        {viewMode === "vendor" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Color:</label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="p-2 border border-gray-300 rounded w-64"
              >
                <option value="">All Colors</option>
                <option value="Black">Black</option>
                <option value="Cyan">Cyan</option>
                <option value="Magenta">Magenta</option>
                <option value="Yellow">Yellow</option>
              </select>
            </div>

            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Manufacturer:</label>
              <Select
                options={manufacturerOptions}
                onChange={(opt) => setSelectedManufacturer(opt?.value || "")}
                isClearable
                placeholder="e.g. Brother"
              />
            </div>
          </>
        )}
      </div>

      {viewMode === "risk" && (
        <>
          <ChartBlock filtered={filtered} contractOnly={contractOnly} bias={selectedBias} contractType={selectedContractType} />
          <Table1 data={table1Data} bias={selectedBias} />
          <Table2 data={table2Data} />
          <Table3 filtered={filtered} />
        </>
      )}

      {viewMode === "vendor" && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Vendor Projected Spend Summary</h2>
          <VendorSummaryTable
            filtered={filteredForVendor}
            bias={selectedBias}
            colorFilter={selectedColor}
            manufacturerFilter={selectedManufacturer}
          />
        </div>
      )}

      {viewMode === "subscription" && (
  <div className="mt-10">
    <h2 className="text-xl font-semibold mb-4">Subscription Plan Summary</h2>
    <ChartBlock
      filtered={filtered}
      contractOnly={contractOnly}
      bias={selectedBias}
      contractType={selectedContractType}
    />

    {selectedCustomer !== "All" && (
      <Table1 data={table1Data} bias={selectedBias} />
    )}

    <SubscriptionPlanTable
      filtered={filtered}
      bias={selectedBias}
      selectedCustomer={selectedCustomer}
    />
  </div>
)}

      {!viewMode && (
        <>
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Device Hierarchy: Summary Charts</h2>
            <ChartBlock
              filtered={filtered}
              contractOnly={contractOnly}
              bias={selectedBias}
              contractType={selectedContractType}
            />
          </div>

          {selectedCustomer !== "All" && (
            <>
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Supplies Program Summary by Device</h2>
                <Table1 data={table1Data} bias={selectedBias} />
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Contract Terms & Risk Analysis</h2>
                <Table2 data={table2Data} />
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">In-Device Cartridge Yields & Page Coverage</h2>
                <Table3 filtered={filtered} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
