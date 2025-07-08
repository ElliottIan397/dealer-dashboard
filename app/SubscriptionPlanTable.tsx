"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";
import { generateContract } from "./generateContract";
import Table1 from "./Table1";
import groupBy from "lodash/groupBy";

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
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

}: Props): React.JSX.Element {
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [localSelectedCustomer, setLocalSelectedCustomer] = useState("All");
  const [localBias, setBias] = useState<"O" | "R" | "N">("O");

  const transactionalDevices = filtered.filter(row => row.Contract_Status === "T");
  const [showForm, setShowForm] = useState(false);
  const [showSummaryTable, setShowSummaryTable] = useState(false);

  const [formData, setFormData] = useState({
    contactName: "",
    contactTitle: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    dealerRep: "",
  });

  if (transactionalDevices.length === 0) {
    return <div className="text-gray-500 mt-4">No transactional devices found for selected customer.</div>;
  }

  const transactionalRevenue = transactionalDevices.reduce(
    (sum, r) => sum + getBiasField(r, "Twelve_Month_Transactional_SP", bias),
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

  const eswRateByRisk: Record<string, number> = {
    Low: 6,
    Moderate: 7,
    High: 8.5,
    Critical: 10,
  };

  const riskWeights: Record<string, number> = {
    Low: 0,
    Moderate: 1,
    High: 2,
    Critical: 3,
  };

  let totalRiskScore = 0;
  let eswTotal = 0;

  if (includeESW) {
    transactionalDevices.forEach((r) => {
      const riskLevel = r.Final_Risk_Level;
      const rate = eswRateByRisk[riskLevel] ?? 7.5;
      const weight = riskWeights[riskLevel] ?? 1;

      eswTotal += rate * 12;
      totalRiskScore += weight;
    });
  } else {
    totalRiskScore = transactionalDevices.reduce((sum, r) => {
      const weight = riskWeights[r.Final_Risk_Level] ?? 1;
      return sum + weight;
    }, 0);
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

  const toggles = [
    { key: "DCA", value: true, setter: () => { }, disabled: true, greyed: true },
    { key: "JITR", value: includeJITR, setter: setIncludeJITR, disabled: false, greyed: false },
    { key: "CONTRACT", value: true, setter: () => { }, disabled: true, greyed: true },
    { key: "QR", value: includeQR, setter: setIncludeQR, disabled: false, greyed: false },
    { key: "ESW", value: includeESW, setter: setIncludeESW, disabled: false, greyed: false },
  ];

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
            onClick={() => setShowForm(true)}
          >
            Generate Subscription Agreement
          </button>

          {showForm && (
            <div className="p-4 border rounded bg-gray-50 space-y-3 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-2">Enter Customer and Dealer Info</h3>
              {Object.entries(formData).map(([field, value]) => (
                <input
                  key={field}
                  className="w-full p-2 border rounded"
                  placeholder={field}
                  value={value}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                />
              ))}
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={async () => {
                  const contractData = {
                    Customer_Name: selectedCustomer,
                    Dealer_Name: "Your Dealer Name",
                    Dealer_Address: "123 Dealer St.",
                    Dealer_Phone: "(555) 123-4567",
                    Dealer_SalesRep_Name: formData.dealerRep,
                    Customer_Address_Line1: formData.address1,
                    Customer_Address_Line2: formData.address2,
                    Customer_City: formData.city,
                    Customer_State: formData.state,
                    Customer_Zip: formData.zip,
                    Customer_Contact: formData.contactName,
                    Customer_Contact_Title: formData.contactTitle,
                    Contract_Effective_Date: new Date().toLocaleDateString(),
                    Monthly_Subscription_Fee: (monthlySubscriptionPerDevice * totalDevices).toFixed(2),
                    Fee_DCA: "included",
                    Fee_JIT: includeJITR ? "$XX" : "Not Included",
                    Fee_QR: includeQR ? "$XX" : "Not Included",
                    Fee_SubMgmt: "included",
                    Fee_ESW: includeESW ? "$XX" : "Not Included",
                    SKU_Bias_Option: bias,
                    Devices_Table: transactionalDevices
                      .map(d => {
                        const determineBias = (color: "Black" | "Cyan" | "Magenta" | "Yellow") => {
                          const colorInitialMap = {
                            Black: "K",
                            Cyan: "C",
                            Magenta: "M",
                            Yellow: "Y",
                          };

                          const colorInitial = colorInitialMap[color as keyof typeof colorInitialMap];

                          // Mono device: skip C/M/Y cleanly
                          if (d.Device_Type === "Mono" && color !== "Black") {
                            return "-";
                          }

                          const fieldName = `${bias}_${colorInitial}_Origin`; // e.g., R_K_Origin
                          const origin = (d as any)[fieldName];

                          return origin && origin !== "Not Reqd" && origin !== "0" ? origin : "N/A";
                        };

                        const volume = (d.Black_Annual_Volume ?? 0) + (d.Color_Annual_Volume ?? 0);

                        return {
                          Model: d.Printer_Model,
                          Serial: d.Serial_Number,
                          Black_Annual_Volume: d.Black_Annual_Volume,
                          Color_Annual_Volume: d.Color_Annual_Volume,
                          Volume: volume, // still a number for sorting
                          VolumeFormatted: volume.toLocaleString(), // used in the PDF table
                          Black_Bias: determineBias("Black"),
                          Cyan_Bias: determineBias("Cyan"),
                          Magenta_Bias: determineBias("Magenta"),
                          Yellow_Bias: determineBias("Yellow"),
                        };
                      })
                      .sort((a, b) => b.Volume - a.Volume), // ← Ensures descending volume sort

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
                  };

                  try {
                    const response = await fetch('https://pdf-generator-w32p.onrender.com/generate-pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contractData),
                    });

                    if (!response.ok) throw new Error('PDF generation failed.');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'Subscription_Contract.pdf';
                    link.click();
                    window.URL.revokeObjectURL(url);

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
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Supplies Program Summary by Device</h3>
          <div className="overflow-x-auto">
            <Table1
              data={filtered.map(row => ({
                ...row,
                Twelve_Month_Transactional_SP: getBiasField(row, "Twelve_Month_Transactional_SP", bias),
              }))}
              bias={bias}
            />
          </div>
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
    </div>
  );
}
