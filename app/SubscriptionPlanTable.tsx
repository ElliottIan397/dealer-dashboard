"use client";

import React, { useState } from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";

interface Props {
  filtered: McarpRow[];
  bias: "O" | "R" | "N";
  selectedCustomer: string;
}

const DCA_COST = 0.25;
const JITR_COST = 0.42;
const CONTRACT_COST = 0.55;
const QR_COST = 0.14;
const ESW_COST = 5.31;

export default function SubscriptionPlanTable({ filtered, bias, selectedCustomer }: Props) {
  const [includeDCA, setIncludeDCA] = useState(true);
  const [includeJITR, setIncludeJITR] = useState(true);
  const [includeContract, setIncludeContract] = useState(true);
  const [includeQR, setIncludeQR] = useState(true);
  const [includeESW, setIncludeESW] = useState(true);

  const [monoCpp, setMonoCpp] = useState(0.02);
  const [colorCpp, setColorCpp] = useState(0.06);

  const transactionalDevices = filtered.filter(row => row.Contract_Status === "T");
  const totalDevices = transactionalDevices.length;
  const totalMono = transactionalDevices.reduce((sum, r) => sum + (r.Black_Annual_Volume ?? 0), 0);
  const totalColor = transactionalDevices.reduce((sum, r) => sum + (r.Color_Annual_Volume ?? 0), 0);
  const totalVolume = totalMono + totalColor;

  const transactionalCost = transactionalDevices.reduce((sum, r) => sum + (r.Twelve_Month_Fulfillment_Cost ?? 0), 0);
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
      <h2 className="text-2xl font-bold mb-4">Subscription Plan Projection</h2>

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

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Monitor</th>
            <th className="px-4 py-2 border">Annual Volume</th>
            <th className="px-4 py-2 border"># Devices</th>
            <th className="px-4 py-2 border">
              DCA<br />
              <input type="checkbox" checked={includeDCA} onChange={() => setIncludeDCA(!includeDCA)} />
            </th>
            <th className="px-4 py-2 border">
              JIT-R<br />
              <input type="checkbox" checked={includeJITR} onChange={() => setIncludeJITR(!includeJITR)} />
            </th>
            <th className="px-4 py-2 border">
              Contract<br />
              <input type="checkbox" checked={includeContract} onChange={() => setIncludeContract(!includeContract)} />
            </th>
            <th className="px-4 py-2 border">
              QR<br />
              <input type="checkbox" checked={includeQR} onChange={() => setIncludeQR(!includeQR)} />
            </th>
            <th className="px-4 py-2 border">
              ESW<br />
              <input type="checkbox" checked={includeESW} onChange={() => setIncludeESW(!includeESW)} />
            </th>
            <th className="px-4 py-2 border">12 Mo Cartridge Cost</th>
            <th className="px-4 py-2 border">Total SaaS + Fulfillment</th>
            <th className="px-4 py-2 border">Subscription/Yr</th>
            <th className="px-4 py-2 border">$/mo per Device</th>
          </tr>
        </thead>
        <tbody>
          <tr className="odd:bg-white even:bg-gray-50">
            <td className="px-4 py-2 border">{selectedCustomer}</td>
            <td className="px-4 py-2 border">{totalVolume}</td>
            <td className="px-4 py-2 border">{totalDevices}</td>
            <td className="px-4 py-2 border">{safeCurrency(dcaTotal)}</td>
            <td className="px-4 py-2 border">{safeCurrency(jitrTotal)}</td>
            <td className="px-4 py-2 border">{safeCurrency(contractTotal)}</td>
            <td className="px-4 py-2 border">{safeCurrency(qrTotal)}</td>
            <td className="px-4 py-2 border">{safeCurrency(eswTotal)}</td>
            <td className="px-4 py-2 border">{safeCurrency(transactionalCost)}</td>
            <td className="px-4 py-2 border">{safeCurrency(totalSaaSCost)}</td>
            <td className="px-4 py-2 border">{safeCurrency(subscriptionCost)}</td>
            <td className="px-4 py-2 border">{safeCurrency(monthlySubscriptionPerDevice)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}