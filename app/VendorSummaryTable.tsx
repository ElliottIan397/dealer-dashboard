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

  const supplierMatrix = [
    { style: "O", color: "Black", qty: "Black_Full_Cartridges_Required_365d", cost: "Buy_Price", sku: "Black_SKU", supplier: "Supplier_Black" },
    { style: "O", color: "Cyan", qty: "Cyan_Full_Cartridges_Required_365d", cost: "Cyan_Cartridge_Cost", sku: "Cyan_SKU", supplier: "Supplier_Cyan" },
    { style: "O", color: "Magenta", qty: "Magenta_Full_Cartridges_Required_365d", cost: "Magenta_Cartridge_Cost", sku: "Magenta_SKU", supplier: "Supplier_Magenta" },
    { style: "O", color: "Yellow", qty: "Yellow_Full_Cartridges_Required_365d", cost: "Yellow_Cartridge_Cost", sku: "Yellow_SKU", supplier: "Supplier_Yellow" },

    { style: "R", color: "Black", qty: "R_Black_Full_Cartridges_Required_365d", cost: "R_Buy_Price", sku: "R_Black_SKU", supplier: "R_Supplier_Black" },
    { style: "R", color: "Cyan", qty: "R-Cyan_Full_Cartridges_Required_365d", cost: "R_Cyan_Cartridge_Cost", sku: "R_Cyan_SKU", supplier: "R_Supplier_Cyan" },
    { style: "R", color: "Magenta", qty: "R_Magenta_Full_Cartridges_Required_365d", cost: "R_Magenta_Cartridge_Cost", sku: "R_Magenta_SKU", supplier: "R_Supplier_Magenta" },
    { style: "R", color: "Yellow", qty: "R_Yellow_Full_Cartridges_Required_365d", cost: "R_Yellow_Cartridge_Cost", sku: "R_Yellow_SKU", supplier: "R_Supplier_Yellow" },

    { style: "N", color: "Black", qty: "N_Black_Full_Cartridges_Required_365d", cost: "N_Buy_Price", sku: "N_Black_SKU", supplier: "N_Supplier_Black" },
    { style: "N", color: "Cyan", qty: "N_Cyan_Full_Cartridges_Required_365d", cost: "N_Cyan_Cartridge_Cost", sku: "N_Cyan_SKU", supplier: "N_Supplier_Cyan" },
    { style: "N", color: "Magenta", qty: "N_Magenta_Full_Cartridges_Required_365d", cost: "N_Magenta_Cartridge_Cost", sku: "N_Magenta_SKU", supplier: "N_Supplier_Magenta" },
    { style: "N", color: "Yellow", qty: "N_Yellow_Full_Cartridges_Required_365d", cost: "N_Yellow_Cartridge_Cost", sku: "N_Yellow_SKU", supplier: "N_Supplier_Yellow" },
  ];

  const vendorMap = new Map<string, { totalCartridges: number; projectedSpend: number; items: any[] }>();

  for (const row of filtered) {
    for (const entry of supplierMatrix) {
      const qty = row[entry.qty];
      const price = row[entry.cost];
      const supplier = row[entry.supplier];
      const sku = row[entry.sku];

      if (!supplier || supplier === "Not Reqd" || !qty || !price || qty <= 0 || price <= 0) continue;

      const extBuy = qty * price;

      if (!vendorMap.has(supplier)) {
        vendorMap.set(supplier, { totalCartridges: 0, projectedSpend: 0, items: [] });
      }

      const vendorData = vendorMap.get(supplier)!;
      vendorData.totalCartridges += qty;
      vendorData.projectedSpend += extBuy;
      vendorData.items.push({
        equipment: "Manufacturer",
        sku,
        style: entry.style,
        color: entry.color,
        qty,
        price,
        extBuy,
      });
    }
  }

  const vendorList = Array.from(vendorMap.entries()).map(([supplier, data]) => ({
    supplier,
    ...data,
    items: data.items.sort((a, b) => b.extBuy - a.extBuy),
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
