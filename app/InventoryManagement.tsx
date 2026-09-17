"use client";

import React, { useEffect, useMemo, useState } from "react";
import FulfillmentEntry from "./FulfillmentEntry";

type InventoryPosition = {
  monitor: string;
  serial_number: string;
  color: string;
  sku: string;
  on_hand_qty: number;
  last_processed_replaced: number | string | null;
  reconciliation_required: boolean;
  updated_at: string;
};

type InventoryTransaction = {
  id: number;
  monitor: string;
  serial_number: string;
  color: string;
  sku: string;
  event_type: string;
  quantity: number;
  event_date: string;
  source: string;
  reference: string | null;
};

type InventoryResponse = {
  inventory: InventoryPosition[];
  transactions: InventoryTransaction[];
};

const formatIdentifier = (value: string) =>
  value.replace(/\.0$/, "");

const formatExcelDate = (value: number | string | null) => {
  if (value === null || value === "") return "Not available";

  const serial = Number(value);
  if (!Number.isFinite(serial)) return String(value);

  const date = new Date(
    Date.UTC(1899, 11, 30) + serial * 24 * 60 * 60 * 1000
  );

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

export default function InventoryManagement() {
  const [data, setData] = useState<InventoryResponse>({
    inventory: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const loadInventory = async (showLoading = true) => {
      if (showLoading) setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inventory", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Inventory request failed: ${response.status}`);
      }

      const result: InventoryResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error("Unable to load inventory", err);
      setError("Unable to load inventory data.");
    } finally {
          if (showLoading) setLoading(false);
        }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();

    return data.inventory.filter((row) => {
      const matchesSearch =
        !term ||
        row.serial_number.toLowerCase().includes(term) ||
        row.sku.toLowerCase().includes(term) ||
        row.color.toLowerCase().includes(term);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "positive" && row.on_hand_qty > 0) ||
        (stockFilter === "zero" && row.on_hand_qty === 0) ||
        (stockFilter === "exceptions" && row.reconciliation_required);

      return matchesSearch && matchesStock;
    });
  }, [data.inventory, search, stockFilter]);

  const summary = useMemo(() => {
    const positivePositions = data.inventory.filter(
      (row) => row.on_hand_qty > 0
    );

    return {
      positions: data.inventory.length,
      positivePositions: positivePositions.length,
      totalUnits: data.inventory.reduce(
        (total, row) => total + row.on_hand_qty,
        0
      ),
      stockedDevices: new Set(
        positivePositions.map((row) => row.serial_number)
      ).size,
      exceptions: data.inventory.filter(
        (row) => row.reconciliation_required
      ).length,
    };
  }, [data.inventory]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));

  if (loading) {
    return <div className="mt-10 text-lg">Loading inventory...</div>;
  }

  if (error) {
    return (
      <div className="mt-10 rounded border border-red-300 bg-red-50 p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadInventory}
          className="mt-3 rounded bg-red-700 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Operational Inventory</h2>
        <p className="mt-1 text-sm text-gray-600">
          Serial-number and color-level inventory maintained by MCARP.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="On-Hand Units" value={summary.totalUnits} />
        <SummaryCard
          label="Positions With Stock"
          value={summary.positivePositions}
        />
        <SummaryCard
          label="Devices With Stock"
          value={summary.stockedDevices}
        />
        <SummaryCard label="Total Positions" value={summary.positions} />
        <SummaryCard
          label="Reconciliation Flags"
          value={summary.exceptions}
          alert={summary.exceptions > 0}
        />
      </div>

      <FulfillmentEntry
        positions={data.inventory}
        onRecorded={() => {
          void loadInventory(false);
        }}
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Search Serial or SKU
          </label>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Enter serial number or SKU"
            className="w-72 rounded border border-gray-300 p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Inventory Status
          </label>
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="w-56 rounded border border-gray-300 p-2"
          >
            <option value="all">All Positions</option>
            <option value="positive">On Hand Greater Than Zero</option>
            <option value="zero">Zero On Hand</option>
            <option value="exceptions">Reconciliation Required</option>
          </select>
        </div>

        <button
          onClick={loadInventory}
          className="rounded bg-gray-800 px-4 py-2 text-white"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">Serial Number</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3">EKM Checkpoint</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((row) => (
              <tr
                key={`${row.monitor}-${formatIdentifier(row.serial_number)}-${row.color}`}
                className="border-t border-gray-200"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {formatIdentifier(row.serial_number)}
                </td>
                <td className="px-4 py-3">{row.color}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatIdentifier(row.sku)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {row.on_hand_qty}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {formatExcelDate(row.last_processed_replaced)}
                </td>
                <td className="px-4 py-3">
                  {row.reconciliation_required ? (
                    <span className="rounded bg-red-100 px-2 py-1 font-medium text-red-700">
                      Reconciliation Required
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-1 text-green-700">
                      Current
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredInventory.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No inventory positions match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-semibold">
          Inventory Transaction History
        </h3>

        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Serial Number</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t border-gray-200"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatDate(transaction.event_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatIdentifier(transaction.serial_number)}
                  </td>
                  <td className="px-4 py-3">{transaction.color}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatIdentifier(transaction.sku)}
                  </td>
                  <td className="px-4 py-3">{transaction.event_type}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      transaction.quantity > 0
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {transaction.quantity > 0 ? "+" : ""}
                    {transaction.quantity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {transaction.source}
                  </td>
                  <td className="min-w-80 px-4 py-3">
                    {transaction.reference || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded border p-4 ${
        alert
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="text-sm text-gray-600">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold ${
          alert ? "text-red-700" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
