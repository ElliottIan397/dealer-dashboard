"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";

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

const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
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
}: Props) {
   console.log("DEBUG SubscriptionPlanTable props", {
    filtered,
    monoCpp,
    colorCpp,
    bias,
  });

const transactionalDevices = filtered.filter(row =>
  row.Contract_Status === "T"
);

  if (!transactionalDevices.length) {
  return (
    <div className="text-gray-500 mt-4">
      No transactional devices found for selected customer.
    </div>
  );
}

  const totalDevices = transactionalDevices.length;
  const totalMono = transactionalDevices.reduce((sum, r) => sum + (r.Black_Annual_Volume ?? 0), 0);
  const totalColor = transactionalDevices.reduce((sum, r) => sum + (r.Color_Annual_Volume ?? 0), 0);
  const totalVolume = totalMono + totalColor;

  const transactionalCost = transactionalDevices.reduce(
  (sum, r) => sum + getBiasField(r, "Twelve_Month_Fulfillment_Cost", bias),
  0
);
  const subscriptionBase = totalMono * monoCpp + totalColor * colorCpp;
  const eswTotal = includeESW ? totalDevices * ESW_COST * 12 : 0;
  const subscriptionCost = subscriptionBase + eswTotal;

  const dcaTotal = includeDCA ? totalDevices * DCA_COST * 12 : 0;
  const jitrTotal = includeJITR ? totalDevices * JITR_COST * 12 : 0;
  const contractTotal = includeContract ? totalDevices * CONTRACT_COST * 12 : 0;
  const qrTotal = includeQR ? totalDevices * QR_COST * 12 : 0;

  const totalSaaSCost = transactionalCost + dcaTotal + jitrTotal + contractTotal + qrTotal + eswTotal;
  const monthlySubscriptionPerDevice = subscriptionCost / 12 / totalDevices;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">
        Subscription Plan Projection{selectedCustomer === "All" ? " (All Customers)" : ""}
      </h2>

      <div className="flex gap-4 mb-4">
        <label>
          Mono CPP ($):
          <input
            type="number"
            step="0.001"
            value={monoCpp}
            onChange={(e) => setMonoCpp(parseFloat(e.target.value) || 0)}
            className="ml-2 border rounded px-2 py-1 w-24"
          />
        </label>
        <label>
          Color CPP ($):
          <input
            type="number"
            step="0.001"
            value={colorCpp}
            onChange={(e) => setColorCpp(parseFloat(e.target.value) || 0)}
            className="ml-2 border rounded px-2 py-1 w-24"
          />
        </label>
      </div>

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
              <th className="px-4 py-2 border">12 Mo Cartridge Cost</th>
              <th className="px-4 py-2 border">Total SaaS + Fulfillment</th>
              <th className="px-4 py-2 border">Subscription/Yr</th>
              <th className="px-4 py-2 border">$/mo per Device</th>
            </tr>
          </thead>
          <tbody>
            <tr className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2 border text-center">{selectedCustomer}</td>
              <td className="px-4 py-2 border text-center">{totalVolume.toLocaleString()}</td>
              <td className="px-4 py-2 border text-center">{totalDevices}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(dcaTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(jitrTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(contractTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(qrTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(eswTotal)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(transactionalCost)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(totalSaaSCost)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(subscriptionCost)}</td>
              <td className="px-4 py-2 border text-center">{safeCurrency(monthlySubscriptionPerDevice)}</td>
            </tr>
          </tbody>
        </table>
    </div>
  );
}