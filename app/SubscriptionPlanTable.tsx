"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";
import { generateContract } from "./generateContract";
import Table1 from "./Table1";
import groupBy from "lodash/groupBy";
import { calculateMonthlyFulfillmentPlanV2, parse } from "@/app/utils";
import { useMemo } from "react";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  const biasKey = `${bias}_${field}`;
  if (row?.[biasKey] != null) return row[biasKey];
  if (row?.[field] != null) return row[field];
  return 0;
};

interface Props {
  filtered: McarpRow[];
  bias: "O" | "R" | "N";
  selectedCustomer: string;
  monoCpp: number;
  colorCpp: number;
  setMonoCpp: React.Dispatch<React.SetStateAction<number>>;
  setColorCpp: React.Dispatch<React.SetStateAction<number>>;
  includeDCA: boolean;
  includeJITR: boolean;
  includeContract: boolean;
  includeQR: boolean;
  includeESW: boolean;
  setIncludeDCA: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeJITR: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeContract: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeQR: React.Dispatch<React.SetStateAction<boolean>>;
  setIncludeESW: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<string>>;
  markupOverride: number | null;
  setMarkupOverride: React.Dispatch<React.SetStateAction<number | null>>;
  selectedMonths: number;
}

const COSTS = {
  DCA: 0.25,
  JITR: 0.42,
  CONTRACT: 0.55,
  QR: 0.14,
  ESW: 5.31,
};

export default function SubscriptionPlanTable({
  filtered,
  bias,
  selectedCustomer,
  monoCpp,
  colorCpp,
  setMonoCpp,
  setColorCpp,
  includeDCA,
  includeJITR,
  includeContract,
  includeQR,
  includeESW,
  setIncludeDCA,
  setIncludeJITR,
  setIncludeContract,
  setSelectedCustomer,
  setIncludeQR,
  setIncludeESW,
  markupOverride,
  setMarkupOverride,
  selectedMonths,

}: Props): React.JSX.Element {
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [localSelectedCustomer, setLocalSelectedCustomer] = useState("All");
  //const [bias, setBias] = useState<"O" | "R" | "N">("O");


  const transactionalDevices = filtered.filter(row => row.Contract_Status === "T");
  const [showForm, setShowForm] = useState(false);
  const [showSummaryTable, setShowSummaryTable] = useState(false);
  const [showSubscriptionAnalytics, setShowSubscriptionAnalytics] = useState(false);
  const [scenarioUrl, setScenarioUrl] = useState("");

  const [formData, setFormData] = useState({
    contactName: "",
    contactTitle: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    dealerRepEmail: "",
    customerEmail: "",      // ← Add this
    isFinalVersion: false,  // ← Add this
  });

  if (transactionalDevices.length === 0) {
    return <div className="text-gray-500 mt-4">No transactional devices found for selected customer.</div>;
  }

  //const transactionalRevenue = transactionalDevices.reduce(
  //  (sum, r) => sum + getBiasField(r, "Twelve_Month_Transactional_SP", bias),
  //  0
  //);


  const table1Data = filtered.map((row) => {
    const getVal = (field: string) => getBiasField(row, field, bias);


    console.log("Row Volume Data:", {
      black: row.Black_Annual_Volume,
      color: row.Color_Annual_Volume,
      type: row.Device_Type,
    });


    // Step 1: compute actual cartridge plan
    const yieldMap = {
      black: parse(getBiasField(row, "K_Yield", bias)),
      cyan: parse(getBiasField(row, "C_Yield", bias)),
      magenta: parse(getBiasField(row, "M_Yield", bias)),
      yellow: parse(getBiasField(row, "Y_Yield", bias)),
    };
    const plan = calculateMonthlyFulfillmentPlanV2(row, bias, selectedMonths);

    console.log("Yield Inputs:", yieldMap);

    console.log("Fulfillment Plan:", JSON.stringify(plan));

    // Step 2: sum cartridges needed in selected months
    const blackCartridges = plan.monthly.black.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const cyanCartridges = plan.monthly.cyan.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const magentaCartridges = plan.monthly.magenta.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const yellowCartridges = plan.monthly.yellow.slice(0, selectedMonths).reduce((a, b) => a + b, 0);

    const totalCartridges = blackCartridges + cyanCartridges + magentaCartridges + yellowCartridges;

    const biasPrefix = bias === "O" ? "" : bias + "_"; // O = no prefix

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
      Twelve_Month_Transactional_SP: +transactionalSP.toFixed(2),
      Twelve_Month_Fulfillment_Cost: +fulfillmentCost.toFixed(2),
      Contract_Total_Revenue: +(row.Contract_Total_Revenue * (selectedMonths / 12)).toFixed(2),
      Contract_Status: row.Contract_Status,
      Last_Updated: row.Last_Updated,
      calculatedFulfillmentPlan: plan,
    };
  });

  const transactionalRevenue = table1Data.reduce(
    (sum, row) => sum + row.Twelve_Month_Transactional_SP,
    0
  );

  const totalDevices = transactionalDevices.length;
  const totalMono = transactionalDevices.reduce((sum, r) => sum + (r.Black_Annual_Volume ?? 0), 0);
  const totalColor = transactionalDevices.reduce((sum, r) => sum + (r.Color_Annual_Volume ?? 0), 0);
  const totalVolume = totalMono + totalColor || 1;

  const defaultMarkup =
    transactionalRevenue < 1000
      ? 0.25
      : transactionalRevenue < 2000
        ? 0.2
        : transactionalRevenue < 3000
          ? 0.15
          : transactionalRevenue < 4000
            ? 0.1
            : 0.075;

  const appliedMarkup = defaultMarkup + (markupOverride ?? 0);
  const markupAmount = transactionalRevenue * appliedMarkup;

  const riskWeights: Record<string, number> = {
    Low: 0,
    Moderate: 1,
    High: 2,
    Critical: 3,
  };

  let totalRiskScore = 0;
  let eswTotal = 0;

  const class1Rates = { Low: 8, Moderate: 10, High: 14, Critical: 25 };
  const class2Rates = { Low: 12, Moderate: 16, High: 20, Critical: 35 };

  if (includeESW) {
    for (const device of transactionalDevices) {
      const riskLevel = device.Final_Risk_Level;
      const deviceClass = device.Device_Class;

      if (!riskLevel || !deviceClass) {
        alert("Cannot calculate ESW: all devices must have a risk level and be tagged Class 1 or Class 2.");
        eswTotal = 0;
        break;
      }

      const rate = deviceClass === "Class 2"
        ? class2Rates[riskLevel as keyof typeof class2Rates]
        : class1Rates[riskLevel as keyof typeof class1Rates];

      eswTotal += rate * 12;
      totalRiskScore += riskWeights[riskLevel] ?? 1;
    }
  }

  const avgRiskScore =
    transactionalDevices.length > 0 ? totalRiskScore / transactionalDevices.length : 0;

  let fleetRiskLabel = "Low";
  if (avgRiskScore >= 2.5) fleetRiskLabel = "Critical";
  else if (avgRiskScore >= 1.5) fleetRiskLabel = "High";
  else if (avgRiskScore >= 0.5) fleetRiskLabel = "Moderate";

  const subscriptionCost = transactionalRevenue + markupAmount + eswTotal;
  const monthlySubscriptionPerDevice = subscriptionCost / 12 / totalDevices;

  const dcaTotal = includeDCA ? totalDevices * COSTS.DCA * 12 : 0;
  const jitrTotal = includeJITR ? totalDevices * COSTS.JITR * 12 : 0;
  const contractTotal = includeContract ? totalDevices * COSTS.CONTRACT * 12 : 0;
  const qrTotal = includeQR ? totalDevices * COSTS.QR * 12 : 0;

  const blendedCpp = subscriptionCost / totalVolume;

  const avgMonthlyVolume = totalVolume / 12;
  const roundToNearestThousand = (val: number) => Math.round(val / 1000) * 1000;

  const volumeLowerBound = roundToNearestThousand(avgMonthlyVolume * 0.9);
  const volumeUpperBound = roundToNearestThousand(avgMonthlyVolume * 1.1);

  const deviceLowerBound = Math.max(0, Math.round(totalDevices * 0.9));
  const deviceUpperBound = Math.round(totalDevices * 1.1);

  const allDevicesTagged = transactionalDevices.every(
    (d) => d.Device_Class === "Class 1" || d.Device_Class === "Class 2"
  );

  console.log("Device_Class check:", transactionalDevices.map(d => d.Device_Class));

  const toggles = [
    { key: "DCA", value: true, setter: () => { }, disabled: true, greyed: true },
    { key: "JITR", value: includeJITR, setter: setIncludeJITR, disabled: false, greyed: false },
    { key: "CONTRACT", value: true, setter: () => { }, disabled: true, greyed: true },
    { key: "QR", value: includeQR, setter: setIncludeQR, disabled: false, greyed: false },
    { key: "ESW", value: includeESW, setter: setIncludeESW, disabled: !allDevicesTagged, greyed: !allDevicesTagged },
  ];

  // Accumulator for per-month cartridge counts
  const cartridgesPerMonth = Array.from({ length: 12 }, () => ({
    black: 0,
    cyan: 0,
    magenta: 0,
    yellow: 0,
  }));

  let cumulativeRevenue = 0;
  let cumulativeCost = 0;
  let cumulativeESW = 0;
  const monthlyESW = eswTotal / 12;

  const monthlyPL = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    let totalCostThisMonth = 0;

    table1Data.forEach((row) => {
      const annualCartridges =
        row.Black_Full_Cartridges_Required_365d +
        row.Cyan_Full_Cartridges_Required_365d +
        row.Magenta_Full_Cartridges_Required_365d +
        row.Yellow_Full_Cartridges_Required_365d;

      const unitCost =
        annualCartridges > 0
          ? row.Twelve_Month_Fulfillment_Cost / annualCartridges
          : 0;

      (["black", "cyan", "magenta", "yellow"] as const).forEach((color) => {
        const monthlyPlan = row.calculatedFulfillmentPlan?.monthly?.[color]?.[i] ?? 0;
        cartridgesPerMonth[i][color] += monthlyPlan;
        totalCostThisMonth += unitCost * monthlyPlan;
      });
    });

    // Calculate cumulative cartridges
    const cumulativeCartridges = cartridgesPerMonth
      .slice(0, i + 1)
      .reduce(
        (sum, month) =>
          sum + month.black + month.cyan + month.magenta + month.yellow,
        0
      );

    const revenueThisMonth = monthlySubscriptionPerDevice * table1Data.length;
    cumulativeRevenue += revenueThisMonth;
    cumulativeCost += totalCostThisMonth;
    cumulativeESW += monthlyESW;

    const totalFulfillmentCost = cumulativeCost + cumulativeESW;
    const gm = cumulativeRevenue - totalFulfillmentCost;
    const gmPercent = cumulativeRevenue > 0 ? (gm / cumulativeRevenue) * 100 : 0;

    return {
      month,
      totalCartridges: cumulativeCartridges,
      totalRevenue: cumulativeRevenue.toFixed(2),
      totalCost: cumulativeCost.toFixed(2),
      eswCost: cumulativeESW.toFixed(2),
      totalWithESW: totalFulfillmentCost.toFixed(2),
      gm: gm.toFixed(2),
      gmPercent: gmPercent.toFixed(1),
    };
  });

  return (
    <div className="mt-10">

      <h2 className="text-2xl font-bold mb-4">
        Subscription Plan Projection{selectedCustomer === "All" ? " (All Customers)" : ""}
      </h2>

      <div className="flex gap-6 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Default Markup (%)</label>
          <input
            type="number"
            value={(defaultMarkup * 100).toFixed(1)}
            readOnly
            className="border rounded px-2 py-1 w-28 bg-gray-100 text-gray-500 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Override Markup (%)</label>
          <input
            type="number"
            step="1"
            value={(markupOverride ?? 0) * 100}
            onChange={e => {
              const val = parseFloat(e.target.value);
              setMarkupOverride(isNaN(val) ? null : val / 100);
            }}
            className="border rounded px-2 py-1 w-28 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Blended CPP ($)</label>
          <input
            type="text"
            value={blendedCpp.toFixed(3)}
            readOnly
            className="border rounded px-2 py-1 w-28 bg-gray-100 text-gray-700 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Device Lower Limit</label>
          <input
            type="text"
            value={deviceLowerBound}
            readOnly
            className="border rounded px-2 py-1 w-28 bg-gray-100 text-gray-700 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Device Upper Limit</label>
          <input
            type="text"
            value={deviceUpperBound}
            readOnly
            className="border rounded px-2 py-1 w-28 bg-gray-100 text-gray-700 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Volume Lower Limit</label>
          <input
            type="text"
            value={Math.round(volumeLowerBound).toLocaleString()}
            readOnly
            className="border rounded px-2 py-1 w-32 bg-gray-100 text-gray-700 text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Volume Upper Limit</label>
          <input
            type="text"
            value={Math.round(volumeUpperBound).toLocaleString()}
            readOnly
            className="border rounded px-2 py-1 w-32 bg-gray-100 text-gray-700 text-center"
          />
        </div>
      </div>

      {selectedCustomer !== "All" && (
        <div className="flex flex-col items-end mb-4 space-y-4">
          <button
            className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              const contractData = {
                Customer_Name: selectedCustomer,
                Dealer_Name: "Your Dealer Name",
                Dealer_Address: "123 Dealer St.",
                Dealer_Phone: "(555) 123-4567",
                Dealer_Email: formData.dealerRepEmail,
                Customer_Address_Line1: formData.address1,
                Customer_Address_Line2: formData.address2,
                Customer_City: formData.city,
                Customer_State: formData.state,
                Customer_Zip: formData.zip,
                Customer_Contact: formData.contactName,
                Customer_Contact_Title: formData.contactTitle,
                Customer_Email: formData.customerEmail,
                Contract_Effective_Date: new Date().toLocaleDateString(),
                Monthly_Subscription_Fee: (monthlySubscriptionPerDevice * totalDevices).toFixed(2),
                Markup_Override: markupOverride ?? 0, // ✅ ADD THIS
                Fee_DCA: "included",
                Fee_JIT: includeJITR ? "$XX" : "Not Included",
                Fee_QR: includeQR ? "$XX" : "Not Included",
                Fee_SubMgmt: "included",
                Fee_ESW: includeESW ? "$XX" : "Not Included",
                SKU_Bias_Option: bias,
                Devices_Table: transactionalDevices.map(d => {
                  const determineBias = (color: "Black" | "Cyan" | "Magenta" | "Yellow") => {
                    const colorInitialMap = { Black: "K", Cyan: "C", Magenta: "M", Yellow: "Y" };
                    const colorInitial = colorInitialMap[color];
                    if (d.Device_Type === "Mono" && color !== "Black") return "-";
                    const fieldName = `${bias}_${colorInitial}_Origin`;
                    const origin = (d as any)[fieldName];
                    return origin && origin !== "Not Reqd" && origin !== "0" ? origin : "N/A";
                  };

                  return {
                    Model: d.Printer_Model,
                    Serial: d.Serial_Number,
                    Black_Annual_Volume: d.Black_Annual_Volume,
                    Color_Annual_Volume: d.Color_Annual_Volume,
                    Mono_Cpp: monoCpp,
                    Color_Cpp: colorCpp,
                    Bias_K: determineBias("Black"),
                    Bias_C: determineBias("Cyan"),
                    Bias_M: determineBias("Magenta"),
                    Bias_Y: determineBias("Yellow"),
                  };
                }),
                includeDCA,
                includeJITR,
                includeQR,
                includeESW,
                isO: bias === "O",
                isR: bias === "R",
                isN: bias === "N",
                volumeLowerLimit: volumeLowerBound,
                volumeUpperLimit: volumeUpperBound,
                deviceLowerLimit: deviceLowerBound,
                deviceUpperLimit: deviceUpperBound,
                Is_Final_Version: formData.isFinalVersion,
                customerName: selectedCustomer,
                customerEmail: formData.customerEmail,
              };

              const newScenarioUrl = `${window.location.origin}/?s=${btoa(JSON.stringify(contractData))}`;
              setScenarioUrl(newScenarioUrl);
              setShowForm(true);
            }}
          >
            Generate Subscription Agreement
          </button>

          {showForm && (
            <div className="p-4 border rounded bg-gray-50 space-y-3 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-2">Enter Customer and Dealer Info</h3>

              {/* Loop through all formData fields except customerEmail and isFinalVersion */}
              {Object.entries(formData)
                .filter(([field]) => field !== "customerEmail" && field !== "isFinalVersion")
                .map(([field, value]) => (
                  <input
                    key={field}
                    className="w-full p-2 border rounded"
                    placeholder={field}
                    value={String(value)}
                    onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                  />
                ))}

              {/* Manually added Customer Email input */}
              <input
                className="w-full p-2 border rounded"
                placeholder="Customer Email"
                value={formData.customerEmail}
                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
              />

              {/* Manually added Final Version checkbox */}
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFinalVersion}
                  onChange={e => setFormData({ ...formData, isFinalVersion: e.target.checked })}
                />
                Final Version – Send for Signature via DocuSign
              </label>

              {/* Submit Button (unchanged) */}
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={async () => {
                  // 1. Build the contractData object (with form fields)
                  const contractData = {
                    Customer_Name: selectedCustomer,
                    Dealer_Name: "Your Dealer Name",
                    Dealer_Address: "123 Dealer St.",
                    Dealer_Phone: "(555) 123-4567",
                    Dealer_Email: formData.dealerRepEmail,
                    Customer_Address_Line1: formData.address1,
                    Customer_Address_Line2: formData.address2,
                    Customer_City: formData.city,
                    Customer_State: formData.state,
                    Customer_Zip: formData.zip,
                    Customer_Contact: formData.contactName,
                    Customer_Contact_Title: formData.contactTitle,
                    Customer_Email: formData.customerEmail,
                    Contract_Effective_Date: new Date().toLocaleDateString(),
                    Monthly_Subscription_Fee: (monthlySubscriptionPerDevice * totalDevices).toFixed(2),
                    Fee_DCA: "included",
                    Fee_JIT: includeJITR ? "$XX" : "Not Included",
                    Fee_QR: includeQR ? "$XX" : "Not Included",
                    Fee_SubMgmt: "included",
                    Fee_ESW: includeESW ? "$XX" : "Not Included",
                    SKU_Bias_Option: bias,
                    markupOverride,
                    Scenario_URL: scenarioUrl, // <-- use pre-generated scenarioUrl
                    Devices_Table: transactionalDevices.map(d => {
                      const determineBias = (color: "Black" | "Cyan" | "Magenta" | "Yellow") => {
                        const colorInitialMap = { Black: "K", Cyan: "C", Magenta: "M", Yellow: "Y" };
                        const colorInitial = colorInitialMap[color];
                        if (d.Device_Type === "Mono" && color !== "Black") return "-";
                        const fieldName = `${bias}_${colorInitial}_Origin`;
                        const origin = (d as any)[fieldName];
                        return origin && origin !== "Not Reqd" && origin !== "0" ? origin : "N/A";
                      };
                      const volume = (d.Black_Annual_Volume ?? 0) + (d.Color_Annual_Volume ?? 0);
                      return {
                        Model: d.Printer_Model,
                        Serial: d.Serial_Number,
                        Black_Annual_Volume: d.Black_Annual_Volume,
                        Color_Annual_Volume: d.Color_Annual_Volume,
                        Volume: volume,
                        VolumeFormatted: volume.toLocaleString(),
                        Black_Bias: determineBias("Black"),
                        Cyan_Bias: determineBias("Cyan"),
                        Magenta_Bias: determineBias("Magenta"),
                        Yellow_Bias: determineBias("Yellow"),
                      };
                    }).sort((a, b) => b.Volume - a.Volume),
                    Customer_Rep_Name: formData.contactName,
                    deviceLowerLimit: deviceLowerBound,
                    deviceUpperLimit: deviceUpperBound,
                    volumeLowerLimit: Math.round(volumeLowerBound / 1000) * 1000,
                    volumeUpperLimit: Math.round(volumeUpperBound / 1000) * 1000,
                    includeDCA,
                    includeJITR,
                    includeQR,
                    includeESW,
                    isO: bias === "O",
                    isR: bias === "R",
                    isN: bias === "N",
                    Is_Final_Version: formData.isFinalVersion,
                    customerEmail: formData.customerEmail,
                    customerName: selectedCustomer,
                  };

                  // 2. If "Final Version" is checked, send to DocuSign
                  if (formData.isFinalVersion) {
                    try {
                      const docusignResponse = await fetch("https://pdf-generator-w32p.onrender.com/send-envelope", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(contractData),
                      });

                      if (!docusignResponse.ok) throw new Error("DocuSign envelope failed.");

                      alert("DocuSign envelope sent to customer successfully.");
                      setShowForm(false);
                      return;

                    } catch (err) {
                      console.error("DocuSign send error:", err);
                      alert("Failed to send document for signing via DocuSign.");
                      return;
                    }
                  }

                  // 3. Otherwise, generate and open the PDF
                  try {
                    const response = await fetch('https://pdf-generator-w32p.onrender.com/generate-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contractData),
                    });

                    if (!response.ok) throw new Error('PDF generation failed.');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');

                    setShowForm(false);

                  } catch (err) {
                    console.error('PDF generation error:', err);
                    alert('Failed to generate contract PDF.');
                  }
                }}
              >
                Submit and Generate Contract
              </button>

            </div>
          )}

          <label className="text-sm font-medium block mb-2">
            <input
              type="checkbox"
              className="mr-2"
              checked={showSubscriptionAnalytics}
              onChange={(e) => setShowSubscriptionAnalytics(e.target.checked)}
            />
            Show Subscription P&amp;L
          </label>

          <label className="text-sm font-medium">
            <input
              type="checkbox"
              className="mr-2"
              checked={showSummaryTable}
              onChange={() => setShowSummaryTable(!showSummaryTable)}
            />
            Show Supplies Program Summary by Device
          </label>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm text-gray-900">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Monitor</th>
              <th className="px-4 py-2 border">Annual Volume</th>
              <th className="px-4 py-2 border"># Devices</th>
              {toggles.map(({ key, value, setter, disabled, greyed }) => (
                <th key={key} className="px-4 py-2 border text-sm">
                  {key}
                  <br />
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => setter(e.target.checked)}
                    disabled={disabled}
                    className={greyed ? 'accent-gray-400' : ''}
                    title={key === "ESW" && !allDevicesTagged ? "ESW cannot be enabled. Some devices are missing Class 1/2 tags." : ""}
                  />
                </th>
              ))}
              <th className="px-4 py-2 border">Fleet Risk</th>
              <th className="px-4 py-2 border">12 Mo Revenue</th>
              <th className="px-4 py-2 border">Monthly</th>
              <th className="px-4 py-2 border">Annual</th>
              <th className="px-4 py-2 border">$/mo per Device</th>
            </tr>
          </thead>
          <tbody>
            <tr className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2 border text-center">{selectedCustomer}</td>
              <td className="px-4 py-2 border text-center">{totalVolume.toLocaleString()}</td>
              <td className="px-4 py-2 border text-center">{totalDevices.toLocaleString()}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(dcaTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(jitrTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(contractTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(qrTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(eswTotal)}</td>
              <td className="px-4 py-2 border text-center">
                <span
                  className={`px-2 py-1 rounded-full text-white text-sm font-semibold ${fleetRiskLabel === "Low"
                    ? "bg-green-500"
                    : fleetRiskLabel === "Moderate"
                      ? "bg-yellow-500"
                      : fleetRiskLabel === "High"
                        ? "bg-orange-500"
                        : "bg-red-600"
                    }`}
                >
                  {fleetRiskLabel}
                </span>
              </td>
              <td className="px-4 py-2 border text-center">
                {safeCurrency(transactionalRevenue + markupAmount)}
              </td>
              <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost / 12)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(monthlySubscriptionPerDevice)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {selectedCustomer !== "All" && showSummaryTable && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Supplies Program Summary by Device</h2>
          <Table1
            data={table1Data}
            bias={bias}
            selectedMonths={selectedMonths}
          />
        </div>
      )}

      {selectedCustomer === "All" && (
        <>
          <div className="mt-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showOpportunities}
                onChange={e => setShowOpportunities(e.target.checked)}
                className="mr-2"
              />
              Show Customer Subscription Opportunities
            </label>
          </div>

          {showOpportunities && (
            <div className="mt-10">
              <div className="mb-3">
                <label className="text-sm font-medium">
                  Search Customer:
                  <input
                    type="text"
                    list="customer-list"
                    className="ml-2 px-2 py-1 border rounded text-sm"
                    placeholder="Start typing..."
                    value={searchCustomer}
                    onChange={e => setSearchCustomer(e.target.value)}
                  />
                  <datalist id="customer-list">
                    {Array.from(new Set(filtered.map(row => row.Monitor)))
                      .sort()
                      .map(customer => (
                        <option key={customer} value={customer} />
                      ))}
                  </datalist>
                </label>
              </div>

              <div className="border rounded">
                <div className="max-h-[700px] overflow-y-auto">
                  <table className="min-w-full border text-sm text-gray-900">
                    <thead className="bg-gray-100 sticky top-0 z-10 text-xs font-semibold">
                      <tr>
                        <th className="px-4 py-2 border text-left">Customer</th>
                        <th className="px-4 py-2 border text-center">Devices</th>
                        <th className="px-4 py-2 border text-center">Total Page Volume</th>
                        <th className="px-4 py-2 border text-center">Fleet Risk</th>
                        <th className="px-4 py-2 border text-right">12 Mo Sub Revenue</th>
                        <th className="px-4 py-2 border text-right">Monthly Sub</th>
                        <th className="px-4 py-2 border text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupBy(filtered, d => d.Monitor))
                        .filter(([customer]) =>
                          searchCustomer === "" ||
                          customer.toLowerCase().includes(searchCustomer.toLowerCase())
                        )
                        .map(([customer, devices]: [string, McarpRow[]]) => {
                          const totalVolume = devices.reduce(
                            (sum, r) => sum + (r.Black_Annual_Volume ?? 0) + (r.Color_Annual_Volume ?? 0),
                            0
                          );
                          const transactionalRevenue = devices.reduce(
                            (sum, r) => sum + getBiasField(r, "Twelve_Month_Transactional_SP", bias),
                            0
                          );
                          const defaultMarkup = transactionalRevenue < 1000 ? 0.25 :
                            transactionalRevenue < 5000 ? 0.2 : 0.15;
                          const markupAmount = transactionalRevenue * defaultMarkup;

                          const eswRateByRisk = { Low: 6, Moderate: 7, High: 8.5, Critical: 10 };
                          const eswTotal = devices.reduce(
                            (sum, r) => sum + (eswRateByRisk[r.Final_Risk_Level as keyof typeof eswRateByRisk] ?? 7.5) * 12,
                            0
                          );
                          const subscriptionRevenue = transactionalRevenue + markupAmount + eswTotal;
                          const avgMonthly = subscriptionRevenue / 12;

                          const riskWeights = { Low: 0, Moderate: 1, High: 2, Critical: 3 };
                          const avgRiskScore = devices.reduce(
                            (sum, r) => sum + (riskWeights[r.Final_Risk_Level as keyof typeof riskWeights] ?? 1),
                            0
                          ) / devices.length;

                          let fleetRiskLabel = "Low";
                          if (avgRiskScore >= 2.5) fleetRiskLabel = "Critical";
                          else if (avgRiskScore >= 1.5) fleetRiskLabel = "High";
                          else if (avgRiskScore >= 0.5) fleetRiskLabel = "Moderate";

                          return {
                            customer,
                            devices,
                            totalVolume,
                            subscriptionRevenue,
                            avgMonthly,
                            fleetRiskLabel,
                          };
                        })
                        .sort((a, b) => b.subscriptionRevenue - a.subscriptionRevenue) // <-- Sort here
                        .map(({ customer, devices, totalVolume, subscriptionRevenue, avgMonthly, fleetRiskLabel }) => (
                          <tr key={customer} className="odd:bg-white even:bg-gray-50">
                            <td className="px-4 py-2 border">{customer}</td>
                            <td className="px-4 py-2 border text-center">{devices.length}</td>
                            <td className="px-4 py-2 border text-center">{totalVolume.toLocaleString()}</td>
                            <td className="px-4 py-2 border text-center">{fleetRiskLabel}</td>
                            <td className="px-4 py-2 border text-right">{safeCurrency(subscriptionRevenue)}</td>
                            <td className="px-4 py-2 border text-right">{safeCurrency(avgMonthly)}</td>
                            <td className="px-4 py-2 border text-center">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowOpportunities(false);
                                }}
                                className="text-blue-600 underline hover:text-blue-800"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {includeESW && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">ESW Device Detail</h2>

          <button
            onClick={() => {
              const headers = [
                "Customer",
                "Serial Number",
                "Printer Model",
                "Black Vol Fcst (Annual)",
                "Color Vol Fcst (Annual)",
                "Device Type",
                "Device Class",
                "Engine Cycles",
                "Device Age (Months)",
                "Device Risk",
                "ESW Fee per Month",
              ];

              const rows = transactionalDevices.map((d) => {
                const risk = d.Final_Risk_Level;
                const deviceClass = d.Device_Class;
                const rate =
                  deviceClass === "Class 2"
                    ? class2Rates[risk as keyof typeof class2Rates]
                    : class1Rates[risk as keyof typeof class1Rates];

                return [
                  d.Monitor,
                  d.Serial_Number,
                  d.Printer_Model,
                  d.Black_Annual_Volume,
                  d.Color_Annual_Volume,
                  d.Device_Type,
                  deviceClass || "—",
                  d.Engine_Cycles,
                  d.Recalculated_Age_Years,
                  risk || "—",
                  rate !== undefined ? `$${rate.toFixed(2)}` : "—",
                ];
              });

              const csvContent =
                [headers, ...rows]
                  .map((row) => row.map((v) => `"${v}"`).join(","))
                  .join("\n");

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", "esw_device_list.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download CSV
          </button>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Customer</th>
                  <th className="p-2 border">Serial Number</th>
                  <th className="p-2 border">Printer Model</th>
                  <th className="p-2 border">Black Vol Fcst (Annual)</th>
                  <th className="p-2 border">Color Vol Fcst (Annual)</th>
                  <th className="p-2 border">Device Type</th>
                  <th className="p-2 border">Device Class</th>
                  <th className="p-2 border">Engine Cycles</th>
                  <th className="p-2 border">Device Age (Yrs.)</th>
                  <th className="p-2 border">Device Risk</th>
                  <th className="p-2 border">ESW Fee per Month</th>
                </tr>
              </thead>
              <tbody>
                {transactionalDevices.map((d, idx) => {
                  const risk = d.Final_Risk_Level;
                  const deviceClass = d.Device_Class;
                  const rate =
                    deviceClass === "Class 2"
                      ? class2Rates[risk as keyof typeof class2Rates]
                      : class1Rates[risk as keyof typeof class1Rates];

                  return (
                    <tr key={idx}>
                      <td className="p-2 border">{d.Monitor}</td>
                      <td className="p-2 border">{d.Serial_Number}</td>
                      <td className="p-2 border">{d.Printer_Model}</td>
                      <td className="p-2 border text-center">{d.Black_Annual_Volume.toLocaleString()}</td>
                      <td className="p-2 border text-center">
                        {d.Device_Type.toLowerCase() === "mono" ? "—" : d.Color_Annual_Volume.toLocaleString()}
                      </td>
                      <td className="p-2 border text-center">{d.Device_Type}</td>
                      <td className="p-2 border text-center">{deviceClass || "—"}</td>
                      <td className="p-2 border text-center">{d.Engine_Cycles.toLocaleString()}</td>
                      <td className="p-2 border text-center">{d.Recalculated_Age_Years.toFixed(1)}</td>
                      <td className="px-4 py-2 border text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-white text-xs font-medium ${d.Final_Risk_Level === "Low"
                            ? "bg-green-500"
                            : d.Final_Risk_Level === "Moderate"
                              ? "bg-yellow-500"
                              : d.Final_Risk_Level === "High"
                                ? "bg-orange-500"
                                : "bg-red-600"
                            }`}
                        >
                          {d.Final_Risk_Level}
                        </span>
                      </td>
                      <td className="p-2 border text-center">
                        {rate !== undefined ? `$${rate.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showSubscriptionAnalytics && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Subscription Plan P&amp;L</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">Cumulative Cartridges</th>
                  <th className="p-2 border">Cumulative Revenue</th>
                  <th className="p-2 border">Cumulative Fulfillment Cost</th>
                  <th className="p-2 border">Cumulative ESW Cost</th>
                  <th className="p-2 border">Cumulative GM$</th>
                  <th className="p-2 border">Cumulative GM%</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPL.map((row) => (
                  <tr key={row.month}>
                    <td className="p-2 border text-center">{row.month}</td>
                    <td className="p-2 border text-center">{row.totalCartridges}</td>
                    <td className="p-2 border text-right">
                      {Number(row.totalRevenue).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 border text-right">
                      {Number(row.totalCost).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 border text-right">
                      {Number(row.eswCost).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`p-2 border text-right ${parseFloat(row.gm) < 0 ? "text-red-600 font-semibold" : ""
                        }`}
                    >
                      {Number(row.gm).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`p-2 border text-center ${parseFloat(row.gmPercent) < 0 ? "text-red-600 font-semibold" : ""
                        }`}
                    >
                      {row.gmPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
