"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import ChartBlock from "./ChartBlock";
import Table1 from "./Table1";
import Table2 from "./Table2";
import Table3 from "./Table3";
import Table4 from './Table4';
import RiskMarginTable from "./RiskMarginTable";
import VendorSummaryTable from "./VendorSummaryTable";
import SubscriptionPlanTable from "./SubscriptionPlanTable";
import { useMCARPData } from "./useMCARPData";
import {
  safeCurrency as formatCurrency,
  safePercent as formatPercent,
  parse,
} from "./utils";

import { DASHBOARD_MODE } from "./config";
import { useSearchParams } from "next/navigation";
//import { calculateMonthlyFulfillmentPlan } from "@/app/utils";
import { calculateMonthlyFulfillmentPlanV2 } from "@/app/utils";
import type { McarpRow } from "./types";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  const biasKey = `${bias}_${field}`;
  if (row?.[biasKey] != null) return row[biasKey];
  if (row?.[field] != null) return row[field];
  return 0;
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
      setSelectedMonths(12);
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

  type DevicePlan = {
    Serial_Number: string;
    totals: {
      Black_Full_Cartridges_Required_365d: number;
      Cyan_Full_Cartridges_Required_365d: number;
      Magenta_Full_Cartridges_Required_365d: number;
      Yellow_Full_Cartridges_Required_365d: number;
    };
  };

  const [table4Data, setTable4Data] = useState<DevicePlan[]>([]);

  useEffect(() => {
    let isCancelled = false;
    // if (loading) return <div className="p-6 text-xl">Loading data...</div>;

    const processData = async () => {
      const chunkSize = 500;
      const results: DevicePlan[] = [];

      for (let i = 0; i < filtered.length; i += chunkSize) {
        const chunk = filtered.slice(i, i + chunkSize);
        const chunkResults = chunk.map(device => {
          try {
            const result = calculateMonthlyFulfillmentPlanV2(device, selectedBias, selectedMonths);
            return {
              Serial_Number: device.Serial_Number,
              totals: result?.totals || {
                Black_Full_Cartridges_Required_365d: 0,
                Cyan_Full_Cartridges_Required_365d: 0,
                Magenta_Full_Cartridges_Required_365d: 0,
                Yellow_Full_Cartridges_Required_365d: 0,
              }
            };
          } catch (err) {
            console.error("Fulfillment calc error:", err);
            return {
              Serial_Number: device.Serial_Number,
              totals: {
                Black_Full_Cartridges_Required_365d: 0,
                Cyan_Full_Cartridges_Required_365d: 0,
                Magenta_Full_Cartridges_Required_365d: 0,
                Yellow_Full_Cartridges_Required_365d: 0,
              }
            };
          }
        });

        if (!isCancelled) {
          results.push(...chunkResults);
          setTable4Data([...results]); // progressive updates
        }

        await new Promise(res => setTimeout(res, 10)); // allow UI to breathe
      }
    };

    processData();

    return () => {
      isCancelled = true;
    };
  }, [filtered, selectedBias, selectedMonths]);
  if (loading) return <div className="p-6 text-xl">Loading data...</div>;

  //const contractOnly = filtered.filter((row) => row.Contract_Status === "C");


  const table1Data = filtered.map((row) => {
    const getVal = (field: string) => getBiasField(row, field, selectedBias);

    //const contractOnly = table1Data.filter((row) => row.Contract_Status === "C") as McarpRow[];

    // console.log("Row Volume Data:", {
    // black: row.Black_Annual_Volume,
    // color: row.Color_Annual_Volume,
    // type: row.Device_Type,
    //});


    // Step 1: compute actual cartridge plan
    const yieldMap = {
      black: parse(getBiasField(row, "K_Yield", selectedBias)),
      cyan: parse(getBiasField(row, "C_Yield", selectedBias)),
      magenta: parse(getBiasField(row, "M_Yield", selectedBias)),
      yellow: parse(getBiasField(row, "Y_Yield", selectedBias)),
    };
    const plan = calculateMonthlyFulfillmentPlanV2(row, selectedBias, selectedMonths);

    // console.log("Yield Inputs:", yieldMap);

    // console.log("Fulfillment Plan:", JSON.stringify(plan));

    // Step 2: sum cartridges needed in selected months
    const blackCartridges = plan.monthly.black.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const cyanCartridges = plan.monthly.cyan.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const magentaCartridges = plan.monthly.magenta.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const yellowCartridges = plan.monthly.yellow.slice(0, selectedMonths).reduce((a, b) => a + b, 0);

    const totalCartridges = blackCartridges + cyanCartridges + magentaCartridges + yellowCartridges;

    const biasPrefix = selectedBias === "O" ? "" : selectedBias + "_";

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const getPrice = (type: "Buy" | "Sell", color?: string): number => {
      if (!color) return parse(getVal(`${biasPrefix}${type}_Price`)) || 0;
      const suffix = type === "Buy" ? "Cost" : "SP";
      const key = `${biasPrefix}${capitalize(color)}_Cartridge_${suffix}`;
      return parse(getVal(key)) || 0;
    };

    const fulfillmentCost =
      blackCartridges * getPrice("Buy") +
      cyanCartridges * getPrice("Buy", "Cyan") +
      magentaCartridges * getPrice("Buy", "Magenta") +
      yellowCartridges * getPrice("Buy", "Yellow");

    const transactionalSP =
      blackCartridges * getPrice("Sell") +
      cyanCartridges * getPrice("Sell", "Cyan") +
      magentaCartridges * getPrice("Sell", "Magenta") +
      yellowCartridges * getPrice("Sell", "Yellow");

    console.log("CARTRIDGE REVENUE DEBUG", {
      Serial: row.Serial_Number,
      selectedBias,
      blackCartridges,
      cyanCartridges,
      magentaCartridges,
      yellowCartridges,
      Buy: {
        Black: getPrice("Buy"),
        Cyan: getPrice("Buy", "Cyan"),
        Magenta: getPrice("Buy", "Magenta"),
        Yellow: getPrice("Buy", "Yellow"),
      },
      Sell: {
        Black: getPrice("Sell"),
        Cyan: getPrice("Sell", "Cyan"),
        Magenta: getPrice("Sell", "Magenta"),
        Yellow: getPrice("Sell", "Yellow"),
      },
      fulfillmentCost,
      transactionalSP,
    });

    return {
      ...row,
      Monitor: row.Monitor,
      Serial_Number: row.Serial_Number,
      Printer_Model: row.Printer_Model,
      Device_Type: row.Device_Type,
      Final_Risk_Level: row.Final_Risk_Level,
      Black_Annual_Volume: Math.round(row.Black_Annual_Volume * (selectedMonths / 12)),
      Color_Annual_Volume: Math.round(row.Color_Annual_Volume * (selectedMonths / 12)),
      Black_Full_Cartridges_Required_365d: blackCartridges,
      Cyan_Full_Cartridges_Required_365d: cyanCartridges,
      Magenta_Full_Cartridges_Required_365d: magentaCartridges,
      Yellow_Full_Cartridges_Required_365d: yellowCartridges,
      Twelve_Month_Transactional_SP: +transactionalSP.toFixed(2),
      Twelve_Month_Fulfillment_Cost: +fulfillmentCost.toFixed(2),
      Contract_Total_Revenue: +(row.Contract_Total_Revenue * (selectedMonths / 12)).toFixed(2),
      Contract_Status: row.Contract_Status,
      Last_Updated: row.Last_Updated,
    };
  });

  // 2. Define contractOnly *after* table1Data is built
  const contractOnly = table1Data.filter(
    (row) => row.Contract_Status === "C"
  ) as McarpRow[];



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

const vendorTableData = filteredForVendor.map((row) => {
  const fulfillment = calculateMonthlyFulfillmentPlanV2(row, selectedBias, selectedMonths);
  return {
    ...row,
    fulfillment,
  };
});

const enriched = filtered.map(row => {
  const plan = calculateMonthlyFulfillmentPlanV2(row, selectedBias, selectedMonths);

  const black = plan.monthly.black.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
  const cyan = plan.monthly.cyan.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
  const magenta = plan.monthly.magenta.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
  const yellow = plan.monthly.yellow.slice(0, selectedMonths).reduce((a, b) => a + b, 0);

  const sp = (type: "Black" | "Cyan" | "Magenta" | "Yellow") => {
  const key = `${selectedBias === "O" ? "" : selectedBias + "_"}${type}_Cartridge_SP`;
  return (row as any)[key] ?? 0;
};

  const totalSP =
    black * sp("Black") +
    cyan * sp("Cyan") +
    magenta * sp("Magenta") +
    yellow * sp("Yellow");

  return {
    ...row,
    Twelve_Month_Transactional_SP: totalSP,
    Final_Risk_Level: row.Final_Risk_Level, // <- explicitly carry forward
  };
});

console.log("DEBUG ENRICHED:", enriched.map(r => ({
  Monitor: r.Monitor,
  Contract_Status: r.Contract_Status,
  Twelve_Month_Transactional_SP: r.Twelve_Month_Transactional_SP,
})));

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
            disabled={viewMode === "subscription"}
            className="p-2 border border-gray-300 rounded w-48 bg-gray-100 text-gray-500 cursor-not-allowed"
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
      ? table1Data as McarpRow[]
      : (table1Data.filter(r => r.Monitor === selectedCustomer) as McarpRow[])
  }
  bias={selectedBias}
/>
      )}
      {viewMode === "vendor" && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Vendor Projected Spend Summary</h2>
          <VendorSummaryTable
            filtered={vendorTableData}
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
              filtered={table1Data as McarpRow[]}       // ✅ fixed: use enriched data
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
      ? enriched
      : enriched.filter(row => row.Monitor === selectedCustomer)
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
            selectedMonths={selectedMonths}
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
                  ? (table1Data as McarpRow[])
                  : (table1Data.filter(row => row.Monitor === selectedCustomer) as McarpRow[])
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
                <Table1 data={table1Data} bias={selectedBias} selectedMonths={selectedMonths} />
              </div>


              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-4">Monthly Fulfillment Plan</h2>
                <Table4 data={table4Data} />
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
