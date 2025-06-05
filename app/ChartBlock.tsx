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
      Cost: transactionalCost,
      SP: transactionalSP,
      GM: parseFloat(transactionalGM.toFixed(0)),
    },
  ];

  const chart3Data = [
    {
      label: "Contract",
      Cost: contractCost,
      Revenue: contractRevenue,
      GM: parseFloat(contractGM.toFixed(0)),
    },
  ];

  const maxDollar = Math.max(transactionalSP, transactionalCost, contractRevenue, contractCost);

  return (
    <div className="flex flex-row flex-wrap gap-4 w-full">
      <div className="flex-1 min-w-[300px] max-w-[33%] h-80">
        <h3 className="text-lg font-semibold mb-2">Annual Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart1Data}>
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value">
              <LabelList dataKey="value" position="top" />
              {chart1Data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-w-[300px] max-w-[33%] h-80">
        <h3 className="text-lg font-semibold mb-2">Transactional GM%</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart2Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="left" dataKey="SP" fill="#82ca9d" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 min-w-[300px] max-w-[33%] h-80">
        <h3 className="text-lg font-semibold mb-2">Contract GM%</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart3Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            <Bar yAxisId="left" dataKey="Revenue" fill="#82ca9d" />
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
