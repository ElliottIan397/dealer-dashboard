// ChartBlock.tsx

"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

import type { McarpRow } from "./types";
import { ChartBlockProps } from "./types";
import { calculateSubscriptionCost, calculateSubscriptionRevenue, getBiasField } from "./utils";

export default function ChartBlock({ filtered, contractOnly, bias, contractType, viewMode, 
  monoCpp, colorCpp, 
  includeDCA, includeJITR, includeContract, includeQR, includeESW, markupOverride, }: ChartBlockProps) {
  console.log("ChartBlock: contractType=", contractType, "viewMode=", viewMode);
  if (!filtered || filtered.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        No data available. Select a customer or contract type to view charts.
      </div>
    );
  }

  const total = (arr: number[]) => arr.reduce((sum, v) => sum + (v || 0), 0);
  const isSubscriptionView = viewMode === "subscription";

  const blackVol = total(filtered.map((r: McarpRow) => r.Black_Annual_Volume));
  const colorVol = total(filtered.map((r: McarpRow) => r.Color_Annual_Volume));

  const transactionalDevices = contractType === "C"
  ? [...(contractOnly ?? [])]
  : [...filtered.filter((r: McarpRow) => r.Contract_Status === "T")];

  const contractDevices = filtered.filter((r: McarpRow) => r.Contract_Status === "C");

  const transactionalSP = total(transactionalDevices.map((r) => getBiasField(r, "Twelve_Month_Transactional_SP", bias)));
  const transactionalCost = total(transactionalDevices.map((r) => getBiasField(r, "Twelve_Month_Fulfillment_Cost", bias)));
  const transactionalGM = transactionalSP > 0 ? ((transactionalSP - transactionalCost) / transactionalSP) * 100 : 0;
  const transactionalGMdollar = transactionalSP - transactionalCost;
  const avgTransactionalMonthlyRevenue = transactionalDevices.length > 0
    ? transactionalSP / transactionalDevices.length / 12
    : 0;

  const contractRevenue = total(contractDevices.map((r) => r.Contract_Total_Revenue ?? 0));
  const contractCost = total(contractDevices.map((r) => getBiasField(r, "Twelve_Month_Fulfillment_Cost", bias)));
  const contractGM = contractRevenue > 0 ? ((contractRevenue - contractCost) / contractRevenue) * 100 : 0;
  const contractGMdollar = contractRevenue - contractCost;
  const avgContractMonthlyRevenue = contractDevices.length > 0
    ? contractRevenue / contractDevices.length / 12
    : 0;

  const subscriptionDevices = filtered.filter((r) => r.Contract_Status === "T");
  const { totalCost: subscriptionCost, totalDevices, breakdown } = calculateSubscriptionCost(subscriptionDevices, bias, {
    includeDCA,
    includeJITR,
    includeContract,
    includeQR,
    includeESW,
  });
const transactionalRevenue = total(
  subscriptionDevices.map((r) => getBiasField(r, "Twelve_Month_Transactional_SP", bias))
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
const markupAmount = transactionalRevenue * appliedMarkup;

const eswRateByRisk: Record<string, number> = {
  Low: 6,
  Moderate: 7,
  High: 8.5,
  Critical: 10,
};

const eswRevenue = includeESW
  ? subscriptionDevices.reduce((sum, r) => {
      const risk = eswRateByRisk[r.Final_Risk_Level] ?? 7.5;
      return sum + risk * 12;
    }, 0)
  : 0;

const totalSubscriptionRevenue = transactionalRevenue + markupAmount + eswRevenue;

  const subscriptionGM =
    totalSubscriptionRevenue > 0
      ? ((totalSubscriptionRevenue - subscriptionCost) / totalSubscriptionRevenue) * 100
      : 0;

  const avgSubscriptionMonthly = totalDevices > 0
    ? totalSubscriptionRevenue / totalDevices / 12
    : 0;

  const chart1Data = [
    { type: "Black Volume", value: blackVol, color: "#8884d8" },
    { type: "Color Volume", value: colorVol, color: "#82ca9d" },
  ];

  const chart2Data = [
    {
      label: "Transactional",
      SP: transactionalSP,
      Cost: transactionalCost,
      GM: parseFloat(transactionalGM.toFixed(0)),
    },
  ];
  console.log("Chart3 Revenue Debug:", {
    isSubscriptionView,
    totalSubscriptionRevenue,
    subscriptionCost,
    subscriptionGM,
  });
  const chart3Data = [
    {
      label: isSubscriptionView ? "Subscription" : "Contract",
      Revenue: isSubscriptionView ? totalSubscriptionRevenue : contractRevenue,
      Cost: isSubscriptionView ? subscriptionCost : contractCost,
      GM: isSubscriptionView ? parseFloat(subscriptionGM.toFixed(0)) : parseFloat(contractGM.toFixed(0)),
    },
  ];

  const maxDollar = Math.max(transactionalSP, transactionalCost, contractRevenue, contractCost, totalSubscriptionRevenue, subscriptionCost);

  const formatYAxisTicks = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const currencyFormatter = (value: number) => `$${value.toFixed(0)}`;
  const percentFormatter = (value: number) => `${value.toFixed(0)}%`;

  return (
    <div className="flex flex-row flex-wrap gap-4 w-full">
      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Fcst Annual Page Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart1Data}>
            <XAxis dataKey="type" />
            <YAxis tickFormatter={formatYAxisTicks} />
            <YAxis tickFormatter={formatYAxisTicks} domain={[0, 'dataMax + 10']} />
            <Bar dataKey="value">
              <LabelList dataKey="value" position="top" formatter={(value: number) => value.toLocaleString()} />
              {chart1Data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-1 text-sm">
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#8884d8] mr-1" />Black Volume
          </span>
          <span>
            <span className="inline-block w-3 h-3 bg-[#82ca9d] mr-1" />Color Volume
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Transactional Potential</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart2Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} tickFormatter={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "GM") return [`${percentFormatter(value)}\n(GM$: ${currencyFormatter(transactionalGMdollar)})`, "GM"];
                const label = name === "SP"
                  ? `SP$\n(Avg/Device: $${avgTransactionalMonthlyRevenue.toFixed(2)}/mo, Devices: ${transactionalDevices.length})`
                  : name === "Cost"
                    ? "Cost$"
                    : name;
                return [currencyFormatter(value), label];
              }}
            />
            <Bar yAxisId="left" dataKey="SP" fill="#82ca9d" />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-1 text-sm">
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#82ca9d] mr-1" />SP$
          </span>
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#8884d8] mr-1" />Cost $
          </span>
          <span>
            <span className="inline-block w-3 h-3 bg-[#ffc658] mr-1" />GM%
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">
          {isSubscriptionView ? "Subscription Plan Projection" : "Current Contracts"}
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart3Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} tickFormatter={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "GM") {
                  const gmDollar = isSubscriptionView ? totalSubscriptionRevenue - subscriptionCost : contractGMdollar;
                  return [`${percentFormatter(value)}\n(GM$: ${currencyFormatter(gmDollar)})`, "GM"];
                }
                const label = name === "Revenue"
                  ? (isSubscriptionView
                    ? `Revenue$\n(Avg/Device: $${avgSubscriptionMonthly.toFixed(2)}/mo, Devices: ${totalDevices})`
                    : `SP$\n(Avg/Device: $${avgContractMonthlyRevenue.toFixed(2)}/mo, Devices: ${contractDevices.length})`)
                  : name === "Cost"
                    ? "Cost$"
                    : name;
                return [currencyFormatter(value), label];
              }}
            />
            <Bar yAxisId="left" dataKey="Revenue" fill="#82ca9d" />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-1 text-sm">
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#82ca9d] mr-1" />SP$
          </span>
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#8884d8] mr-1" />Cost $
          </span>
          <span>
            <span className="inline-block w-3 h-3 bg-[#ffc658] mr-1" />GM%
          </span>
        </div>
      </div>
    </div>
  );
}