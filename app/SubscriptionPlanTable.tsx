"use client";

import React from "react";
import { McarpRow } from "./types";
import { safeCurrency } from "./utils";

interface Props {
  filtered: McarpRow[];
  bias: "O" | "R" | "N";
  selectedCustomer: string;
}

const MONO_CPP = 0.02;
const COLOR_CPP = 0.06;

export default function SubscriptionPlanTable({ filtered, bias, selectedCustomer }: Props) {
  const transactionalDevices = filtered.filter(row => row.Contract_Status === "T");

  const plans = transactionalDevices.map((row) => {
    const blackVol = row.Black_Annual_Volume ?? 0;
    const colorVol = row.Color_Annual_Volume ?? 0;
    const totalAnnualVol = blackVol + colorVol;
    const avgMonthlyVol = totalAnnualVol / 12;

    const lowerVolLimit = avgMonthlyVol * 0.8;
    const upperVolLimit = avgMonthlyVol * 1.2;

    const deviceCount = 1;
    const lowerDeviceLimit = 0.8;
    const upperDeviceLimit = 1.2;

    const monoCost = blackVol * MONO_CPP;
    const colorCost = colorVol * COLOR_CPP;
    const annualSubscription = monoCost + colorCost;
    const monthlySubscriptionPerDevice = annualSubscription / 12 / deviceCount;

    const transactionalCost = row[`Twelve_Month_Fulfillment_Cost`] ?? 0;

    return {
      Monitor: row.Monitor,
      Printer_Model: row.Printer_Model,
      Device_Type: row.Device_Type,
      Manufacturer: row.Manufacturer,
      Black_Annual_Volume: blackVol,
      Color_Annual_Volume: colorVol,
      Annual_Transactional_Cost: transactionalCost,
      Annual_Subscription_Cost: annualSubscription,
      Monthly_Subscription_Per_Device: monthlySubscriptionPerDevice,
      Volume_Limits: `${Math.round(lowerVolLimit)} - ${Math.round(upperVolLimit)}`,
      Device_Limits: `${Math.round(lowerDeviceLimit)} - ${Math.round(upperDeviceLimit)}`,
    };
  });

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Subscription Plan Projection</h2>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Monitor</th>
            <th className="px-4 py-2 border">Model</th>
            <th className="px-4 py-2 border">Manufacturer</th>
            <th className="px-4 py-2 border">Mono Volume</th>
            <th className="px-4 py-2 border">Color Volume</th>
            <th className="px-4 py-2 border">Trans. Cost</th>
            <th className="px-4 py-2 border">Subscr. Cost</th>
            <th className="px-4 py-2 border">$/mo per Device</th>
            <th className="px-4 py-2 border">Vol Guardrail</th>
            <th className="px-4 py-2 border">Device Guardrail</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2 border">{plan.Monitor}</td>
              <td className="px-4 py-2 border">{plan.Printer_Model}</td>
              <td className="px-4 py-2 border">{plan.Manufacturer}</td>
              <td className="px-4 py-2 border">{plan.Black_Annual_Volume}</td>
              <td className="px-4 py-2 border">{plan.Color_Annual_Volume}</td>
              <td className="px-4 py-2 border">{safeCurrency(plan.Annual_Transactional_Cost)}</td>
              <td className="px-4 py-2 border">{safeCurrency(plan.Annual_Subscription_Cost)}</td>
              <td className="px-4 py-2 border">{safeCurrency(plan.Monthly_Subscription_Per_Device)}</td>
              <td className="px-4 py-2 border">{plan.Volume_Limits}</td>
              <td className="px-4 py-2 border">{plan.Device_Limits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
