"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";

import type { McarpRow } from "./types";

type Props = {
  filtered: McarpRow[];
};

export default function ChartBlock({ filtered }: Props) {
  if (!filtered || filtered.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        No data available. Select a customer or contract type to view charts.
      </div>
    );
  }

  const total = (arr: number[]) => arr.reduce((sum, v) => sum + (v || 0), 0);

  const blackVol = total(filtered.map((r) => r.Black_Annual_Volume));
  const colorVol = total(filtered.map((r) => r.Color_Annual_Volume));

  const transactionalSP = total(filtered.map((r) => r.Twelve_Month_Transactional_SP));
  const transactionalCost = total(filtered.map((r) => r.Twelve_Month_Fulfillment_Cost));
  const transactionalGM = transactionalSP > 0 ? ((transactionalSP - transactionalCost) / transactionalSP) * 100 : 0;

  const contractRevenue = total(filtered.map((r) => r.Contract_Total_Revenue));
  const contractCost = total(filtered.map((r) => r.Twelve_Month_Fulfillment_Cost));
  const contractGM = contractRevenue > 0 ? ((contractRevenue - contractCost) / contractRevenue) * 100 : 0;

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

  const chart3Data = [
    {
      label: "Contract",
      SP: contractRevenue,
      Cost: contractCost,
      GM: parseFloat(contractGM.toFixed(0)),
    },
  ];

  const maxDollar = Math.max(transactionalSP, transactionalCost, contractRevenue, contractCost);

  const formatYAxisTicks = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="flex flex-row flex-wrap gap-4 w-full">
      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Annual Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart1Data}>
            <XAxis dataKey="type" />
            <YAxis tickFormatter={formatYAxisTicks} />
            <Tooltip />
            <Bar dataKey="value">
              <LabelList dataKey="value" position="top" />
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
        <h3 className="text-lg font-semibold mb-2 text-center">Transactional GM%</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart2Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} tickFormatter={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Legend
              formatter={(value) =>
                value === "SP" ? "SP$" :
                value === "Cost" ? "Cost $" :
                value === "GM" ? "GM%" :
                value
              }
            />
            <Bar yAxisId="left" dataKey="SP" fill="#82ca9d" />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Contract GM%</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart3Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} tickFormatter={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Legend
              formatter={(value) =>
                value === "SP" ? "SP$" :
                value === "Cost" ? "Cost $" :
                value === "GM" ? "GM%" :
                value
              }
            />
            <Bar yAxisId="left" dataKey="SP" fill="#82ca9d" />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
