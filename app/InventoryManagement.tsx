"use client";

import React, { useEffect, useMemo, useState } from "react";
import FulfillmentEntry from "./FulfillmentEntry";

type InventoryPosition = {
  monitor: string;
  serial_number: string;
  color: string;
  sku: string;
  days_remaining: number | null;
  cartridge_level: number | null;
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

function isRecentlyInstalled(
  row: InventoryPosition,
  transactions: InventoryTransaction[]
) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return transactions.some((transaction) => {
    const eventTime = new Date(transaction.event_date).getTime();

    return (
      transaction.event_type === "INSTALLATION" &&
      transaction.serial_number === row.serial_number &&
      transaction.color === row.color &&
      eventTime >= sevenDaysAgo
    );
  });
}

type InventoryResponse = {
  inventory: InventoryPosition[];
  transactions: InventoryTransaction[];
};

type FulfillmentQueueItem = {
  requirement_id: number;
  triggered_at: string;
  needed_by_date: string | null;
  serial_number: string;
  model: string | null;
  delivery_label: string;
  color: string;
  detected_sku: string;
  recommended_sku: string;
  substitution_review_required: boolean;
  quantity: number;
  source_request_level: number | null;
  source_request_days_left: number | null;
  status: string;
  location_code: string;
  location_name: string;
  address_1: string;
  address_2: string | null;
  city: string;
  state: string;
  postal_code: string;
};

type FulfillmentQueueResponse = {
  queue: FulfillmentQueueItem[];
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

const formatTransactionReference = (reference: string | null) => {
  if (!reference) return "—";

  if (
    !reference.startsWith("EKM ") ||
    !reference.includes("_Replaced advanced from")
  ) {
    return reference;
  }

  return reference.replace(
    /\b\d{5}(?:\.\d+)?\b/g,
    (value) => formatExcelDate(value)
  );
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
  const [fulfillmentQueue, setFulfillmentQueue] = useState<
    FulfillmentQueueItem[]
  >([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [reviewingRequirementId, setReviewingRequirementId] = useState<
  number | null
  >(null);
  const [fulfillingRequirementId, setFulfillingRequirementId] = useState<
  number | null
  >(null);

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

  const loadFulfillmentQueue = async () => {
    setQueueLoading(true);
    setQueueError("");

    try {
      const response = await fetch("/api/fulfillment-queue", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Fulfillment queue request failed: ${response.status}`);
      }

      const result: FulfillmentQueueResponse = await response.json();
      setFulfillmentQueue(Array.isArray(result.queue) ? result.queue : []);
    } catch (err) {
      console.error("Unable to load fulfillment queue", err);
      setQueueError("Unable to load the fulfillment approval queue.");
    } finally {
      setQueueLoading(false);
    }
  };

const reviewFulfillmentRequirement = async (
  requirementId: number,
  action: "APPROVE" | "HOLD"
) => {
  const confirmed = window.confirm(
    `${action === "APPROVE" ? "Approve" : "Place on hold"} fulfillment requirement ${requirementId}?`
  );

  if (!confirmed) return;

  setReviewingRequirementId(requirementId);
  setQueueError("");

  try {
    const response = await fetch("/api/fulfillment-review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirement_id: requirementId,
        action,
      }),
    });

    if (!response.ok) {
      throw new Error(`Fulfillment review failed: ${response.status}`);
    }

    await loadFulfillmentQueue();
  } catch (err) {
    console.error("Unable to review fulfillment requirement", err);
    setQueueError("Unable to update the fulfillment requirement.");
  } finally {
    setReviewingRequirementId(null);
  }
};

const recordApprovedFulfillment = async (requirementId: number) => {
  const enteredReference = window.prompt(
    "Enter the Friends fulfillment reference:"
  );

  if (enteredReference === null) return;

  const reference = enteredReference.trim();

  if (!reference) {
    window.alert("A Friends fulfillment reference is required.");
    return;
  }

  const confirmed = window.confirm(
    `Confirm requirement ${requirementId} was sent to Friends using reference "${reference}"?`
  );

  if (!confirmed) return;

  setFulfillingRequirementId(requirementId);
  setQueueError("");

  try {
    const response = await fetch("/api/approved-fulfillment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requirement_id: requirementId,
        reference,
      }),
    });

    if (!response.ok) {
      throw new Error(`Approved fulfillment failed: ${response.status}`);
    }

    window.location.reload();
  } catch (err) {
    console.error("Unable to record approved fulfillment", err);
    setQueueError("Unable to record the approved fulfillment.");
  } finally {
    setFulfillingRequirementId(null);
  }
};
  
  useEffect(() => {
    void loadInventory();
    void loadFulfillmentQueue();
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
          onClick={() => {   void loadInventory(); }}
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

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">
              Fulfillment Approval Queue
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Consumable requests awaiting review before shipment.
            </p>
          </div>

          <button
            onClick={() => {
              void loadFulfillmentQueue();
            }}
            disabled={queueLoading}
            className="rounded bg-gray-800 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {queueLoading ? "Refreshing..." : "Refresh Queue"}
          </button>
        </div>

        {queueError ? (
          <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
            {queueError}
          </div>
        ) : queueLoading ? (
          <div className="rounded border border-gray-200 p-6 text-gray-500">
            Loading fulfillment queue...
          </div>
        ) : fulfillmentQueue.length === 0 ? (
          <div className="rounded border border-green-200 bg-green-50 p-4 text-green-800">
            No fulfillment requests are awaiting review.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Delivery Label</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Recommended SKU</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Ship To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fulfillmentQueue.map((item) => (
                  <tr
                    key={item.requirement_id}
                    className="border-t border-gray-200 align-top"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(item.triggered_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {formatIdentifier(item.serial_number)}
                    </td>
                    <td className="px-4 py-3">{item.delivery_label}</td>
                    <td className="px-4 py-3">{item.color}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatIdentifier(item.recommended_sku)}
                      {item.substitution_review_required && (
                        <div className="mt-1 text-xs font-medium text-amber-700">
                          Substitution review required
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {item.quantity}
                    </td>
                    <td className="min-w-64 px-4 py-3">
                      <div className="font-medium">{item.location_name}</div>
                      <div>{item.address_1}</div>
                      {item.address_2 && <div>{item.address_2}</div>}
                      <div>
                        {item.city}, {item.state} {item.postal_code}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded bg-amber-100 px-2 py-1 font-medium text-amber-800">
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        {item.status === "APPROVED" ? (
                          <>
                            <button
                              onClick={() =>
                                void recordApprovedFulfillment(item.requirement_id)
                              }
                              disabled={
                                fulfillingRequirementId === item.requirement_id ||
                                reviewingRequirementId === item.requirement_id
                              }
                              className="rounded bg-blue-700 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {fulfillingRequirementId === item.requirement_id
                                ? "Recording..."
                                : "Record Sent"}
                            </button>
                    
                            <button
                              onClick={() =>
                                void reviewFulfillmentRequirement(
                                  item.requirement_id,
                                  "HOLD"
                                )
                              }
                              disabled={
                                fulfillingRequirementId === item.requirement_id ||
                                reviewingRequirementId === item.requirement_id
                              }
                              className="rounded bg-amber-600 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Hold
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              void reviewFulfillmentRequirement(
                                item.requirement_id,
                                "APPROVE"
                              )
                            }
                            disabled={reviewingRequirementId === item.requirement_id}
                            className="rounded bg-green-700 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          onClick={() => {   void loadInventory(); }}
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
              <th className="px-4 py-3 text-right">Days Remaining</th>
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
                <td className="px-4 py-3 text-right">
                  {Number(row.days_remaining) === 0 &&
                  Number(row.cartridge_level) === 1 &&
                  isRecentlyInstalled(row, data.transactions)
                    ? "Calculating"
                    : row.days_remaining == null
                      ? "—"
                      : Math.round(Number(row.days_remaining))}
                </td>
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
                  colSpan={7}
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
                    {formatTransactionReference(transaction.reference)}
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

