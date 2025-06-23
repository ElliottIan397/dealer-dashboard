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
import { ChartBlockProps } from "./types";

export default function ChartBlock({ filtered, contractOnly, bias, contractType }: ChartBlockProps) {
  if (!filtered || filtered.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        No data available. Select a customer or contract type to view charts.
      </div>
    );
  }

  const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
    return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
  };

  const total = (arr: number[]) => arr.reduce((sum, v) => sum + (v || 0), 0);

  const blackVol = total(filtered.map((r: McarpRow) => r.Black_Annual_Volume));
  const colorVol = total(filtered.map((r: McarpRow) => r.Color_Annual_Volume));

  const transactionalDevices = contractType === "C"
    ? contractOnly ?? []
    : filtered.filter((r: McarpRow) => r.Contract_Status === "T");

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

  const currencyFormatter = (value: number) => `$${value.toFixed(2)}`;
  const percentFormatter = (value: number) => `${value.toFixed(0)}%`;

  return (
    <div className="flex flex-row flex-wrap gap-4 w-full">
      <div className="flex-1 min-w-[300px] max-w-[33%] h-80 flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2 text-center">Fcst Annual Page Volume</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart1Data}>
            <XAxis dataKey="type" />
            <YAxis tickFormatter={formatYAxisTicks} />
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
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
                if (name === "GM") return [`${percentFormatter(value)} (GM$: ${currencyFormatter(transactionalGMdollar)})`, "GM"];
                const label =
                  name === "SP"
                    ? `SP$ (Avg/Device: $${avgTransactionalMonthlyRevenue.toFixed(2)}/mo, Devices: ${transactionalDevices.length})`
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
        <h3 className="text-lg font-semibold mb-2 text-center">Current Contracts</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart3Data}>
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" domain={[0, maxDollar]} tickFormatter={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "GM") return [`${percentFormatter(value)} (GM$: ${currencyFormatter(contractGMdollar)})`, "GM"];
                const label =
                  name === "SP"
                    ? `SP$ (Avg/Device: $${avgContractMonthlyRevenue.toFixed(2)}/mo, Devices: ${contractDevices.length})`
                    : name === "Cost"
                    ? "Cost$"
                    : name;
                return [currencyFormatter(value), label];
              }}
            />
            <Bar yAxisId="left" dataKey="SP" fill="#82ca9d" />
            {contractType !== "T" && (
              <Bar yAxisId="left" dataKey="Cost" fill="#8884d8" />
            )}
            <Bar yAxisId="right" dataKey="GM" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-1 text-sm">
          <span className="inline-block mr-4">
            <span className="inline-block w-3 h-3 bg-[#82ca9d] mr-1" />SP$
          </span>
          {contractType !== "T" && (
            <span className="inline-block mr-4">
              <span className="inline-block w-3 h-3 bg-[#8884d8] mr-1" />Cost $
            </span>
          )}
          <span>
            <span className="inline-block w-3 h-3 bg-[#ffc658] mr-1" />GM%
          </span>
        </div>
      </div>
    </div>
  );
}
