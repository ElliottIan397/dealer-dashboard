"use client";

import React from "react";
import { safeCurrency as formatCurrency } from "./utils";

type Bias = "O" | "R" | "N";

type Row = {
  [key: string]: any;
};

type Props = {
  filtered: Row[];
  bias: Bias;
};

export default function VendorSummaryTable({ filtered, bias }: Props) {
  const getBiasField = (row: Row, field: string): number => {
    return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
  };

  type VendorData = {
    supplier: string;
    totalCartridges: number;
    projectedSpend: number;
  };

  const vendorMap = new Map<string, VendorData>();

  for (const row of filtered) {
    const fields = [
      { color: "Black", qty: "Black_Full_Cartridges_Required_365d", cost: "Buy_Price", vendor: "Supplier_Black" },
      { color: "Cyan", qty: "Cyan_Full_Cartridges_Required_365d", cost: "Cyan_Cartridge_Cost", vendor: "Supplier_Cyan" },
      { color: "Magenta", qty: "Magenta_Full_Cartridges_Required_365d", cost: "Magenta_Cartridge_Cost", vendor: "Supplier_Magenta" },
      { color: "Yellow", qty: "Yellow_Full_Cartridges_Required_365d", cost: "Yellow_Cartridge_Cost", vendor: "Supplier_Yellow" },
    ];

    for (const field of fields) {
      const quantity = getBiasField(row, field.qty);
      const price = getBiasField(row, field.cost);
      const supplier = row[field.vendor];

      if (!supplier || supplier === "Not Reqd" || quantity <= 0 || price <= 0) continue;

      const spend = quantity * price;

      if (vendorMap.has(supplier)) {
        const existing = vendorMap.get(supplier)!;
        existing.totalCartridges += quantity;
        existing.projectedSpend += spend;
      } else {
        vendorMap.set(supplier, {
          supplier,
          totalCartridges: quantity,
          projectedSpend: spend,
        });
      }
    }
  }

  const vendorList = Array.from(vendorMap.values()).sort(
    (a, b) => b.projectedSpend - a.projectedSpend
  );

  const grandTotal = vendorList.reduce(
    (acc, v) => ({
      cartridges: acc.cartridges + v.totalCartridges,
      spend: acc.spend + v.projectedSpend,
    }),
    { cartridges: 0, spend: 0 }
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm text-gray-900">
        <thead className="bg-gray-100 text-xs font-semibold">
          <tr>
            <th className="px-3 py-2 text-left">Supplier</th>
            <th className="px-3 py-2 text-right">Total Cartridges</th>
            <th className="px-3 py-2 text-right">Projected Spend</th>
          </tr>
        </thead>
        <tbody>
          {vendorList.map((v) => (
            <tr key={v.supplier} className="border-t">
              <td className="px-3 py-2">{v.supplier}</td>
              <td className="px-3 py-2 text-right">{v.totalCartridges.toFixed(1)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(v.projectedSpend)}</td>
            </tr>
          ))}
          <tr className="border-t bg-gray-100 font-semibold">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right">{grandTotal.cartridges.toFixed(1)}</td>
            <td className="px-3 py-2 text-right">{formatCurrency(grandTotal.spend)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
