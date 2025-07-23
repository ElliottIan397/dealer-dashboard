"use client";

// Table1.tsx — fixed, bias-aware, time-phased, formatting preserved

import React from "react";
import { calculateMonthlyFulfillmentPlan } from "./utils";

const Table1 = ({ filtered, selectedMonths, selectedBias, yieldMap }: any) => {
  const months = selectedMonths;

  const getBiasVal = (row: any, field: string) => {
    if (selectedBias === "O") return row[field];
    if (selectedBias === "R") return row["R_" + field];
    if (selectedBias === "N") return row["N_" + field];
    return row[field];
  };

  const table1Data = filtered.map((row: any) => {
    const plan = calculateMonthlyFulfillmentPlan(row, yieldMap);

    const black = plan.black.slice(0, months).reduce((a, b) => a + b, 0);
    const cyan = plan.cyan.slice(0, months).reduce((a, b) => a + b, 0);
    const magenta = plan.magenta.slice(0, months).reduce((a, b) => a + b, 0);
    const yellow = plan.yellow.slice(0, months).reduce((a, b) => a + b, 0);

    const total = black + cyan + magenta + yellow;

    const cost =
      (black * getBiasVal(row, "Black_Cartridge_Cost")) +
      (cyan * getBiasVal(row, "Cyan_Cartridge_Cost")) +
      (magenta * getBiasVal(row, "Magenta_Cartridge_Cost")) +
      (yellow * getBiasVal(row, "Yellow_Cartridge_Cost"));

    const sp =
      (black * getBiasVal(row, "Black_Cartridge_SP")) +
      (cyan * getBiasVal(row, "Cyan_Cartridge_SP")) +
      (magenta * getBiasVal(row, "Magenta_Cartridge_SP")) +
      (yellow * getBiasVal(row, "Yellow_Cartridge_SP"));

    return {
      Monitor: row.Monitor,
      Serial_Number: row.Serial_Number,
      Printer_Model: row.Printer_Model,
      Device_Type: row.Device_Type,
      Black_Annual_Volume: Math.round(row.Black_Annual_Volume * (months / 12)),
      Color_Annual_Volume: Math.round(row.Color_Annual_Volume * (months / 12)),
      Black_Full_Cartridges_Required_365d: black,
      Cyan_Full_Cartridges_Required_365d: cyan,
      Magenta_Full_Cartridges_Required_365d: magenta,
      Yellow_Full_Cartridges_Required_365d: yellow,
      Twelve_Month_Transactional_SP: +sp.toFixed(2),
      Twelve_Month_Fulfillment_Cost: +cost.toFixed(2),
      Contract_Total_Revenue: +(row.Contract_Total_Revenue * (months / 12)).toFixed(2),
      Contract_Status: row.Contract_Status,
      Last_Updated: row.Last_Updated,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Monitor</th>
            <th className="px-4 py-2 text-left">Serial #</th>
            <th className="px-4 py-2 text-left">Model</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-right">Mono Vol</th>
            <th className="px-4 py-2 text-right">Color Vol</th>
            <th className="px-4 py-2 text-right">K</th>
            <th className="px-4 py-2 text-right">C</th>
            <th className="px-4 py-2 text-right">M</th>
            <th className="px-4 py-2 text-right">Y</th>
            <th className="px-4 py-2 text-right">SP</th>
            <th className="px-4 py-2 text-right">Cost</th>
            <th className="px-4 py-2 text-right">Rev</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table1Data.map((row: any, i: number) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-left">{row.Monitor}</td>
              <td className="px-4 py-2 text-left">{row.Serial_Number}</td>
              <td className="px-4 py-2 text-left">{row.Printer_Model}</td>
              <td className="px-4 py-2 text-left">{row.Device_Type}</td>
              <td className="px-4 py-2 text-right">{row.Black_Annual_Volume}</td>
              <td className="px-4 py-2 text-right">{row.Color_Annual_Volume}</td>
              <td className="px-4 py-2 text-right">{row.Black_Full_Cartridges_Required_365d}</td>
              <td className="px-4 py-2 text-right">{row.Cyan_Full_Cartridges_Required_365d}</td>
              <td className="px-4 py-2 text-right">{row.Magenta_Full_Cartridges_Required_365d}</td>
              <td className="px-4 py-2 text-right">{row.Yellow_Full_Cartridges_Required_365d}</td>
              <td className="px-4 py-2 text-right">{row.Twelve_Month_Transactional_SP}</td>
              <td className="px-4 py-2 text-right">{row.Twelve_Month_Fulfillment_Cost}</td>
              <td className="px-4 py-2 text-right">{row.Contract_Total_Revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table1;
