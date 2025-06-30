"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";
import { generateContract } from "./generateContract";
import Table1 from "./Table1";

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
  setIncludeQR,
  setIncludeESW,
  markupOverride,
  setMarkupOverride,
}: Props) {
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
  const eswTotal = includeESW ? totalDevices * COSTS.ESW * 12 : 0;
  const subscriptionCost = transactionalRevenue + markupAmount + eswTotal;
  const monthlySubscriptionPerDevice = subscriptionCost / 12 / totalDevices;

  const dcaTotal = includeDCA ? totalDevices * COSTS.DCA * 12 : 0;
  const jitrTotal = includeJITR ? totalDevices * COSTS.JITR * 12 : 0;
  const contractTotal = includeContract ? totalDevices * COSTS.CONTRACT * 12 : 0;
  const qrTotal = includeQR ? totalDevices * COSTS.QR * 12 : 0;

  const calculatedMonoCpp = (subscriptionCost * (totalMono / totalVolume)) / (totalMono || 1);
  const calculatedColorCpp = (subscriptionCost * (totalColor / totalVolume)) / (totalColor || 1);

  const toggles = [
    { key: "DCA", value: includeDCA, setter: setIncludeDCA },
    { key: "JITR", value: includeJITR, setter: setIncludeJITR },
    { key: "CONTRACT", value: includeContract, setter: setIncludeContract },
    { key: "QR", value: includeQR, setter: setIncludeQR },
    { key: "ESW", value: includeESW, setter: setIncludeESW },
  ];

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">
        Subscription Plan Projection{selectedCustomer === "All" ? " (All Customers)" : ""}
      </h2>

      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Default Markup (%)</label>
          <input
            type="number"
            value={(defaultMarkup * 100).toFixed(1)}
            readOnly
            className="border rounded px-2 py-1 w-24 bg-gray-100 text-gray-500"
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
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      </div>

      <div className="flex gap-6 mb-4 text-sm text-gray-700">
        <div><strong>Mono CPP:</strong> ${calculatedMonoCpp.toFixed(3)}</div>
        <div><strong>Color CPP:</strong> ${calculatedColorCpp.toFixed(3)}</div>
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
                onClick={() => {
                  generateContract({
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
                    List_of_Devices: transactionalDevices.map(d => d.Printer_Model).join(", "),
                    Customer_Rep_Name: formData.contactName,
                    includeDCA,
                    includeJITR,
                    includeQR,
                    includeESW,
                    isO: bias === "O",
                    isR: bias === "R",
                    isN: bias === "N",
                  });
                  setShowForm(false);
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
            Show Supplies Program Summary by Device (Table 1)
          </label>

          {showSummaryTable && <Table1 data={filtered} bias={bias} />}
        </div>
      )}

      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Monitor</th>
            <th className="px-4 py-2 border">Annual Volume</th>
            <th className="px-4 py-2 border"># Devices</th>
            {toggles.map(({ key, value, setter }) => (
              <th key={key} className="px-4 py-2 border text-sm">
                {key}
                <br />
                <input type="checkbox" checked={value} onChange={e => setter(e.target.checked)} />
              </th>
            ))}
            <th className="px-4 py-2 border">12 Mo Transaction Revenue</th>
            <th className="px-4 py-2 border">Subscription/Mo</th>
            <th className="px-4 py-2 border">Subscription/Yr</th>
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
            <td className="px-4 py-2 border text-center">{safeCurrency(transactionalRevenue)}</td>
            <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost / 12)}</td>
            <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost)}</td>
            <td className="px-4 py-2 border text-center">{safeCurrency(monthlySubscriptionPerDevice)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
