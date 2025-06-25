"use client";

import React, { useState } from "react";
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
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const toggleVendor = (vendor: string) => {
    setExpandedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) newSet.delete(vendor);
      else newSet.add(vendor);
      return newSet;
    });
  };

  const colors = ["Black", "Cyan", "Magenta", "Yellow"];

  const getPriorityFields = (color: string): { sku: string; qty: string; price: string; supplier: string; style: string }[] => {
    const base = color.charAt(0).toUpperCase() + color.slice(1);
    return bias === "O"
      ? [
          { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, style: "O" },
          { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, style: "R" },
          { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, style: "N" },
        ]
      : bias === "R"
      ? [
          { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, style: "R" },
          { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, style: "N" },
          { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, style: "O" },
        ]
      : [
          { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, style: "N" },
          { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, style: "R" },
          { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, style: "O" },
        ];
  };

  const vendorMap = new Map<string, { totalCartridges: number; projectedSpend: number; items: Map<string, any> }>();

  for (const row of filtered) {
    for (const color of colors) {
      const options = getPriorityFields(color);
      for (const opt of options) {
        const qty = row[opt.qty];
        const price = row[opt.price];
        const supplier = row[opt.supplier];
        const sku = row[opt.sku];

        if (!supplier || supplier === "Not Reqd" || !qty || !price || qty <= 0 || price <= 0) continue;

        const extBuy = qty * price;
        const equipment = row["Manufacturer"] || "Unknown";

        if (!vendorMap.has(supplier)) {
          vendorMap.set(supplier, { totalCartridges: 0, projectedSpend: 0, items: new Map() });
        }

        const vendorData = vendorMap.get(supplier)!;
        vendorData.totalCartridges += qty;
        vendorData.projectedSpend += extBuy;

        const key = `${sku}_${opt.style}_${color}`;
        if (!vendorData.items.has(key)) {
          vendorData.items.set(key, {
            equipment,
            sku,
            style: opt.style,
            color,
            qty,
            price,
            extBuy,
          });
        } else {
          const existing = vendorData.items.get(key);
          existing.qty += qty;
          existing.extBuy += extBuy;
        }

        break; // Stop after the first valid fallback found
      }
    }
  }

  const vendorList = Array.from(vendorMap.entries()).map(([supplier, data]) => ({
    supplier,
    totalCartridges: data.totalCartridges,
    projectedSpend: data.projectedSpend,
    items: Array.from(data.items.values()).sort((a, b) => b.extBuy - a.extBuy),
  })).sort((a, b) => b.projectedSpend - a.projectedSpend);

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
          {vendorList.map((vendor) => (
            <React.Fragment key={vendor.supplier}>
              <tr className="border-t cursor-pointer hover:bg-gray-50" onClick={() => toggleVendor(vendor.supplier)}>
                <td className="px-3 py-2">{expandedVendors.has(vendor.supplier) ? "▼" : "▶"} {vendor.supplier}</td>
                <td className="px-3 py-2 text-right">{vendor.totalCartridges.toFixed(1)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(vendor.projectedSpend)}</td>
              </tr>
              {expandedVendors.has(vendor.supplier) && (
                <tr className="border-t bg-gray-50">
                  <td colSpan={3} className="px-3 py-2">
                    <table className="min-w-full text-xs">
                      <thead className="text-gray-700">
                        <tr>
                          <th className="text-left px-2 py-1">Equipment</th>
                          <th className="text-left px-2 py-1">SKU</th>
                          <th className="text-left px-2 py-1">Style</th>
                          <th className="text-left px-2 py-1">Color</th>
                          <th className="text-right px-2 py-1">Qty</th>
                          <th className="text-right px-2 py-1">Buy Price</th>
                          <th className="text-right px-2 py-1">Ext. Buy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendor.items.map((item, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{item.equipment}</td>
                            <td className="px-2 py-1">{item.sku}</td>
                            <td className="px-2 py-1">{item.style}</td>
                            <td className="px-2 py-1">{item.color}</td>
                            <td className="px-2 py-1 text-right">{item.qty.toFixed(1)}</td>
                            <td className="px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                            <td className="px-2 py-1 text-right">{formatCurrency(item.extBuy)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
