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
  colorFilter?: string;
  manufacturerFilter?: string;
};

export default function VendorSummaryTable({ filtered, bias, colorFilter, manufacturerFilter }: Props) {
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const toggleVendor = (vendor: string) => {
    setExpandedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) newSet.delete(vendor);
      else newSet.add(vendor);
      return newSet;
    });
  };

  const getPriorityFields = (color: string) => {
    const base = color.charAt(0).toUpperCase() + color.slice(1);
    const originKey = color === "Black" ? "K" : base.charAt(0);
    return bias === "O"
      ? [
        { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, origin: `O_${originKey}_Origin` },
        { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, origin: `R_${originKey}_Origin` },
        { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, origin: `N_${originKey}_Origin` },
      ]
      : bias === "R"
        ? [
          { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, origin: `R_${originKey}_Origin` },
          { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, origin: `N_${originKey}_Origin` },
          { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, origin: `O_${originKey}_Origin` },
        ]
        : [
          { sku: `N_${base}_SKU`, qty: `N_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "N_Buy_Price" : `N_${base}_Cartridge_Cost`, supplier: `N_Supplier_${base}`, origin: `N_${originKey}_Origin` },
          { sku: `R_${base}_SKU`, qty: `R_${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "R_Buy_Price" : `R_${base}_Cartridge_Cost`, supplier: `R_Supplier_${base}`, origin: `R_${originKey}_Origin` },
          { sku: `${base}_SKU`, qty: `${base}_Full_Cartridges_Required_365d`, price: base === "Black" ? "Buy_Price" : `${base}_Cartridge_Cost`, supplier: `Supplier_${base}`, origin: `O_${originKey}_Origin` },
        ];
  };

  const vendorMap = new Map<string, { totalCartridges: number; projectedSpend: number; items: Map<string, any> }>();

  for (const row of filtered) {
    let added = false;
    const colors = row.Device_Type === "Mono" ? ["Black"] : ["Black", "Cyan", "Magenta", "Yellow"];

    for (const color of colors) {
      if (colorFilter && color !== colorFilter) continue;
      if (manufacturerFilter && row["Manufacturer"] !== manufacturerFilter) continue;

      const options = getPriorityFields(color);

      for (const opt of options) {
        const qty = row[opt.qty];
        const price = row[opt.price];
        const supplier = row[opt.supplier];
        const sku = row[opt.sku];
        const styleUsed = row[opt.origin];

        const qtyValid = typeof qty === "number" && qty > 0;
        const priceValid = typeof price === "number" && price > 0;
        const supplierValid = supplier && supplier !== "Not Reqd";
        const styleValid = styleUsed && styleUsed !== "Not Reqd";

        if (!(qtyValid && priceValid && supplierValid && styleValid)) continue;

        const extBuy = qty * price;
        const equipment = row["Manufacturer"] || "Unknown";

        if (!vendorMap.has(supplier)) {
          vendorMap.set(supplier, { totalCartridges: 0, projectedSpend: 0, items: new Map() });
        }

        const vendorData = vendorMap.get(supplier)!;
        vendorData.totalCartridges += qty;
        vendorData.projectedSpend += extBuy;

        const key = `${sku}_${styleUsed}_${color}`;

        if (!vendorData.items.has(key)) {
          const cartridgeFieldMap = {
            Black: "K_CART",
            Cyan: "C_CART",
            Magenta: "M_CART",
            Yellow: "Y_CART",
          };

          const rawCartridge = row[cartridgeFieldMap[color as keyof typeof cartridgeFieldMap]];
          const cartridge =
            rawCartridge && rawCartridge !== "Not Reqd" && rawCartridge !== 0 ? rawCartridge : "";

          vendorData.items.set(key, {
            equipment,
            sku,
            cartridge,
            style: styleUsed,
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

        added = true;
        break;
      }
    }
  }

  const vendorList = Array.from(vendorMap.entries())
    .map(([supplier, data]) => ({
      supplier,
      totalCartridges: data.totalCartridges,
      projectedSpend: data.projectedSpend,
      items: Array.from(data.items.values()).sort((a, b) => b.extBuy - a.extBuy),
    }))
    .sort((a, b) => b.projectedSpend - a.projectedSpend);

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
                <td className="px-3 py-2 text-right">{vendor.totalCartridges.toLocaleString()}</td>
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
                          <th className="text-left px-2 py-1">Cartridge</th>
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
                            <td className="px-2 py-1">{item.cartridge}</td>
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