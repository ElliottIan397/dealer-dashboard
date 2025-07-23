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
import { useSearchParams } from "next/navigation";
import { calculateVolumeBasedFulfillmentPlan } from "@/app/utils";


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
  const [monoCpp, setMonoCpp] = useState(0.02);
  const [colorCpp, setColorCpp] = useState(0.06);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [includeDCA, setIncludeDCA] = useState(true);
  const [includeJITR, setIncludeJITR] = useState(true);
  const [includeContract, setIncludeContract] = useState(true);
  const [includeQR, setIncludeQR] = useState(true);
  const [includeESW, setIncludeESW] = useState(false);
  const [markupOverride, setMarkupOverride] = useState<number | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(12); // default to 12 months
  const manufacturerOptions = Array.from(
    new Set(data.map((row) => row.Manufacturer).filter(Boolean))
  )
    .sort()
    .map((mfr) => ({ value: mfr, label: mfr }));

  useEffect(() => {
    if (viewMode === "risk") {
      setSelectedCustomer("All");
      setSelectedContractType("All");
    } else if (viewMode === "subscription") {
      setSelectedContractType("T");
    }
  }, [viewMode]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const encoded = searchParams.get("s");
    if (!encoded) return;

    try {
      const decoded = JSON.parse(atob(encoded));

      if (decoded.Customer_Name) setSelectedCustomer(decoded.Customer_Name);
      if (typeof decoded.includeDCA === "boolean") setIncludeDCA(decoded.includeDCA);
      if (typeof decoded.includeJITR === "boolean") setIncludeJITR(decoded.includeJITR);
      if (typeof decoded.includeQR === "boolean") setIncludeQR(decoded.includeQR);
      if (typeof decoded.includeESW === "boolean") setIncludeESW(decoded.includeESW);

      if (decoded.isO) setSelectedBias("O");
      else if (decoded.isR) setSelectedBias("R");
      else if (decoded.isN) setSelectedBias("N");

      if (decoded.markupOverride != null) setMarkupOverride(decoded.markupOverride);

      setViewMode("subscription"); // show the subscription UI
    } catch (err) {
      console.error("Invalid scenario URL format:", err);
    }
  }, []);

  const customerOptions = ["All", ...customers];


  if (loading) return <div className="p-6 text-xl">Loading data...</div>;

  const contractOnly = filtered.filter((row) => row.Contract_Status === "C");

  const table1Data = filtered.map((row) => {
    const getVal = (field: string) => getBiasField(row, field, selectedBias);

    // Step 1: compute actual cartridge plan
    const plan = calculateVolumeBasedFulfillmentPlan(row, {
      black: row.Black_Yield_Estimate,
      cyan: row.Cyan_Yield_Estimate,
      magenta: row.Magenta_Yield_Estimate,
      yellow: row.Yellow_Yield_Estimate,
    });
    console.log("Yield Inputs:", {
      black: row.Black_Yield_Estimate,
      cyan: row.Cyan_Yield_Estimate,
      magenta: row.Magenta_Yield_Estimate,
      yellow: row.Yellow_Yield_Estimate,
    });

    console.log("Fulfillment Plan:", plan);

    // Step 2: sum cartridges needed in selected months
    const blackCartridges = plan.black.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const cyanCartridges = plan.cyan.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const magentaCartridges = plan.magenta.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const yellowCartridges = plan.yellow.slice(0, selectedMonths).reduce((a, b) => a + b, 0);

    const totalCartridges = blackCartridges + cyanCartridges + magentaCartridges + yellowCartridges;

    const unitSP = getVal("Twelve_Month_Transactional_SP") /
      (getVal("Black_Full_Cartridges_Required_365d") +
        getVal("Cyan_Full_Cartridges_Required_365d") +
        getVal("Magenta_Full_Cartridges_Required_365d") +
        getVal("Yellow_Full_Cartridges_Required_365d") || 1);

    const unitCost = getVal("Twelve_Month_Fulfillment_Cost") /
      (getVal("Black_Full_Cartridges_Required_365d") +
        getVal("Cyan_Full_Cartridges_Required_365d") +
        getVal("Magenta_Full_Cartridges_Required_365d") +
        getVal("Yellow_Full_Cartridges_Required_365d") || 1);

    return {
      Monitor: row.Monitor,
      Serial_Number: row.Serial_Number,
      Printer_Model: row.Printer_Model,
      Device_Type: row.Device_Type,
      Black_Annual_Volume: Math.round(row.Black_Annual_Volume * (selectedMonths / 12)),
      Color_Annual_Volume: Math.round(row.Color_Annual_Volume * (selectedMonths / 12)),
      Black_Full_Cartridges_Required_365d: blackCartridges,
      Cyan_Full_Cartridges_Required_365d: cyanCartridges,
      Magenta_Full_Cartridges_Required_365d: magentaCartridges,
      Yellow_Full_Cartridges_Required_365d: yellowCartridges,
      Twelve_Month_Transactional_SP: +(unitSP * totalCartridges).toFixed(2),
      Twelve_Month_Fulfillment_Cost: +(unitCost * totalCartridges).toFixed(2),
      Contract_Total_Revenue: +(row.Contract_Total_Revenue * (selectedMonths / 12)).toFixed(2),
      Contract_Status: row.Contract_Status,
      Last_Updated: row.Last_Updated,
    };
  });

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
            className="p-2 border border-gray-300 rounded w-40"
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
            className="p-2 border border-gray-300 rounded w-48"
          >
            <option value="All">All</option>
            <option value="C">Contracted (C)</option>
            <option value="T">Transactional (T)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe (months):</label>
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded w-48"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                +{i + 1} Month{i === 0 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Options:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "" | "risk" | "vendor" | "subscription")}
            className="p-2 border border-gray-300 rounded w-78"
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
        <RiskMarginTable
          filtered={
            selectedCustomer === "All"
              ? filtered                       // all rows
              : filtered.filter(r => r.Monitor === selectedCustomer)  // chosen customer only
          }
          bias={selectedBias}
        />
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
          <div className="mb-6">
            <ChartBlock
              filtered={filtered}
              contractOnly={contractOnly}
              bias={selectedBias}
              contractType={selectedContractType}
              viewMode={viewMode} // 👈 new prop
              monoCpp={monoCpp}
              colorCpp={colorCpp}
              includeDCA={includeDCA}
              includeJITR={includeJITR}
              includeContract={includeContract}
              includeQR={includeQR}
              includeESW={includeESW}
              setIncludeDCA={setIncludeDCA}
              setIncludeJITR={setIncludeJITR}
              setIncludeContract={setIncludeContract}
              setIncludeQR={setIncludeQR}
              setIncludeESW={setIncludeESW}
              markupOverride={markupOverride}
            />
          </div>

          <SubscriptionPlanTable
            filtered={
              selectedCustomer === "All"
                ? filtered
                : filtered.filter(row => row.Monitor === selectedCustomer)
            }
            bias={selectedBias}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            monoCpp={monoCpp}
            colorCpp={colorCpp}
            setMonoCpp={setMonoCpp}
            setColorCpp={setColorCpp}
            includeDCA={includeDCA}
            includeJITR={includeJITR}
            includeContract={includeContract}
            includeQR={includeQR}
            includeESW={includeESW}
            setIncludeDCA={setIncludeDCA}
            setIncludeJITR={setIncludeJITR}
            setIncludeContract={setIncludeContract}
            setIncludeQR={setIncludeQR}
            setIncludeESW={setIncludeESW}
            markupOverride={markupOverride}
            setMarkupOverride={setMarkupOverride}
          />
        </div>
      )}

      {!viewMode && (
        <>
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Device Hierarchy: Summary Charts</h2>
            <ChartBlock
              filtered={
                selectedCustomer === "All"
                  ? filtered
                  : filtered.filter(row => row.Monitor === selectedCustomer)
              }
              contractOnly={contractOnly}
              bias={selectedBias}
              contractType={selectedContractType}
              viewMode={viewMode}
              monoCpp={monoCpp}
              colorCpp={colorCpp}
              includeDCA={includeDCA}
              includeJITR={includeJITR}
              includeContract={includeContract}
              includeQR={includeQR}
              includeESW={includeESW}
              setIncludeDCA={setIncludeDCA}
              setIncludeJITR={setIncludeJITR}
              setIncludeContract={setIncludeContract}
              setIncludeQR={setIncludeQR}
              setIncludeESW={setIncludeESW}
              markupOverride={markupOverride}
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
