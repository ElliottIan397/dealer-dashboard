"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";
import { generateContract } from "./generateContract";

// ✅ Central logic helper
const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
};

// ✅ Define props
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
}

const DCA_COST = 0.25;
const JITR_COST = 0.42;
const CONTRACT_COST = 0.55;
const QR_COST = 0.14;
const ESW_COST = 5.31;

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
}: Props) {
  const [markupOverride, setMarkupOverride] = useState<number | null>(null);

  const transactionalDevices = filtered.filter((row) => row.Contract_Status === "T");

  if (!transactionalDevices.length) {
    return (
      <div className="text-gray-500 mt-4">
        No transactional devices found for selected customer.
      </div>
    );
  }

  // 💰 Use revenue instead of fulfillment cost
  const transactionalRevenue = transactionalDevices.reduce(
    (sum, r) => sum + getBiasField(r, "Twelve_Month_Transactional_SP", bias),
    0
  );

  // 📦 Keep cost too for SaaS totals
  const transactionalCost = transactionalDevices.reduce(
    (sum, r) => sum + getBiasField(r, "Twelve_Month_Fulfillment_Cost", bias),
    0
  );

  const getDefaultMarkup = (total: number): number => {
    if (total < 1000) return 0.25;
    if (total < 2000) return 0.2;
    if (total < 3000) return 0.15;
    if (total < 4000) return 0.1;
    return 0.075;
  };

  const defaultMarkup = getDefaultMarkup(transactionalRevenue);
  const appliedMarkup = defaultMarkup + (markupOverride ?? 0);

  const totalDevices = transactionalDevices.length;
  const totalMono = transactionalDevices.reduce((sum, r) => sum + (r.Black_Annual_Volume ?? 0), 0);
  const totalColor = transactionalDevices.reduce((sum, r) => sum + (r.Color_Annual_Volume ?? 0), 0);
  const totalVolume = totalMono + totalColor;

  const markupAmount = transactionalRevenue * appliedMarkup;
  const eswTotal = includeESW ? totalDevices * ESW_COST * 12 : 0;
  const subscriptionCost = transactionalRevenue + markupAmount + eswTotal;

  const dcaTotal = includeDCA ? totalDevices * DCA_COST * 12 : 0;
  const jitrTotal = includeJITR ? totalDevices * JITR_COST * 12 : 0;
  const contractTotal = includeContract ? totalDevices * CONTRACT_COST * 12 : 0;
  const qrTotal = includeQR ? totalDevices * QR_COST * 12 : 0;

  const totalSaaSCost = subscriptionCost;
  const monthlySubscriptionPerDevice = subscriptionCost / 12 / totalDevices;
  const calculatedMonoCpp = totalMono > 0 ? subscriptionCost * (totalMono / totalVolume) / totalMono : 0;
  const calculatedColorCpp = totalColor > 0 ? subscriptionCost * (totalColor / totalVolume) / totalColor : 0;

  const handleGenerateContract = () => {
    generateContract({
      Customer_Name: selectedCustomer,
      Dealer_Name: "Your Dealer Name",
      Dealer_Address: "123 Dealer St.",
      Dealer_Phone: "(555) 123-4567",
      Dealer_SalesRep_Name: "Sales Rep Name",
      Customer_Address: "123 Customer Ave.",
      Customer_Contact: "Jane Doe",
      Contract_Effective_Date: new Date().toLocaleDateString(),
      Monthly_Subscription_Fee: (monthlySubscriptionPerDevice * totalDevices).toFixed(2),
      Fee_DCA: "included",
      Fee_JIT: includeJITR ? "$XX" : "Not Included",
      Fee_QR: includeQR ? "$XX" : "Not Included",
      Fee_SubMgmt: "included",
      Fee_ESW: includeESW ? "$XX" : "Not Included",
      SKU_Bias_Option: bias,
      List_of_Devices: transactionalDevices.map((d: any) => d.Model).join(", "),
      Customer_Rep_Name: "Customer Rep Name",
      includeDCA,
      includeJITR,
      includeQR,
      includeESW,
      isO: bias === "O",
      isR: bias === "R",
      isN: bias === "N",
    });
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">
        Subscription Plan Projection{selectedCustomer === "All" ? " (All Customers)" : ""}
      </h2>

      <div className="flex gap-4 mb-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">
            Default Markup (%)
          </label>
          <input
            type="number"
            step="1"
            value={defaultMarkup * 100}
            readOnly
            className="border rounded px-2 py-1 w-24 bg-gray-100 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Override Markup (%)
          </label>
          <input
            type="number"
            step="0.01"  // ← CHANGE THIS LINE
            value={(markupOverride ?? 0) * 100}  // show as percentage
            onChange={(e) => setMarkupOverride((parseFloat(e.target.value) || 0) / 100)}
            className="border rounded px-2 py-1 w-24"
          />
        </div>
      </div>

      <div className="flex gap-6 mb-4 text-sm text-gray-700">
        <div>
          <strong>Mono CPP:</strong> ${calculatedMonoCpp.toFixed(3)}
        </div>
        <div>
          <strong>Color CPP:</strong> ${calculatedColorCpp.toFixed(3)}
        </div>
      </div>

      {selectedCustomer !== "All" && (
        <div className="flex justify-end mb-4">
          <button
            className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleGenerateContract}
          >
            Generate Subscription Agreement
          </button>
        </div>
      )}

      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Monitor</th>
            <th className="px-4 py-2 border">Annual Volume</th>
            <th className="px-4 py-2 border"># Devices</th>
            <th className="px-4 py-2 border text-sm">
              DCA<br />
              <input type="checkbox" checked={includeDCA} onChange={(e) => setIncludeDCA(e.target.checked)} />
            </th>
            <th className="px-4 py-2 border text-sm">
              JIT-R<br />
              <input type="checkbox" checked={includeJITR} onChange={(e) => setIncludeJITR(e.target.checked)} />
            </th>
            <th className="px-4 py-2 border text-sm">
              Contract<br />
              <input type="checkbox" checked={includeContract} onChange={(e) => setIncludeContract(e.target.checked)} />
            </th>
            <th className="px-4 py-2 border text-sm">
              QR<br />
              <input type="checkbox" checked={includeQR} onChange={(e) => setIncludeQR(e.target.checked)} />
            </th>
            <th className="px-4 py-2 border text-sm">
              ESW<br />
              <input type="checkbox" checked={includeESW} onChange={(e) => setIncludeESW(e.target.checked)} />
            </th>
            <th className="px-4 py-2 border">12 Mo Transaction Revenue</th>
            <th className="px-4 py-2 border">Total Subscription/Yr</th>
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
            <td className="px-4 py-2 border text-center">{safeCurrency(totalSaaSCost)}</td>
            <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost)}</td>
            <td className="px-4 py-2 border text-center">{safeCurrency(monthlySubscriptionPerDevice)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}