"use client";

import React, { useMemo, useState } from "react";

type InventoryPosition = {
  monitor: string;
  serial_number: string;
  color: string;
  sku: string;
  on_hand_qty: number;
};

type FulfillmentResult = {
  transaction_id: string;
  serial_number: string;
  color: string;
  sku: string;
  quantity: number;
  on_hand_qty: number;
  already_processed: boolean;
};

type FulfillmentEntryProps = {
  positions: InventoryPosition[];
  onRecorded: () => void;
};

const formatIdentifier = (value: string) =>
  value.replace(/\.0$/, "");

export default function FulfillmentEntry({
  positions,
  onRecorded,
}: FulfillmentEntryProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [businessReference, setBusinessReference] = useState("");
  const [requestId, setRequestId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedPositions = useMemo(
    () =>
      [...positions].sort(
        (a, b) =>
          a.serial_number.localeCompare(b.serial_number) ||
          a.color.localeCompare(b.color)
      ),
    [positions]
  );

  const selectedPosition = sortedPositions.find(
    (position) =>
      `${position.monitor}|${position.serial_number}|${position.color}` ===
      selectedKey
  );

  const recordFulfillment = async () => {
    setError("");
    setSuccess("");

    if (!selectedPosition) {
      setError("Select a serial number and cartridge color.");
      return;
    }

    if (!businessReference.trim()) {
      setError("Enter the Friends fulfillment reference.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      setError("Quantity must be a whole number between 1 and 100.");
      return;
    }

    const confirmed = window.confirm(
      `Record fulfillment of ${quantity} ${selectedPosition.color} cartridge${
        quantity === 1 ? "" : "s"
      } for serial ${formatIdentifier(selectedPosition.serial_number)}?`
    );

    if (!confirmed) return;

    const currentRequestId =
      requestId || window.crypto.randomUUID();

    if (!requestId) {
      setRequestId(currentRequestId);
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serial_number: selectedPosition.serial_number,
          color: selectedPosition.color,
          quantity,
          reference: `${businessReference.trim()} | ${currentRequestId}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to record fulfillment.");
      }

      const fulfillment = result as FulfillmentResult;

      setSuccess(
        fulfillment.already_processed
          ? `This fulfillment was already recorded. On-hand inventory remains ${fulfillment.on_hand_qty}.`
          : `Fulfillment recorded. New on-hand inventory is ${fulfillment.on_hand_qty}.`
      );

      setSelectedKey("");
      setQuantity(1);
      setBusinessReference("");
      setRequestId("");
      onRecorded();
    } catch (err) {
      console.error("Unable to record fulfillment", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record fulfillment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded border border-blue-200 bg-blue-50 p-5">
      <h3 className="text-lg font-semibold">Record Friends Fulfillment</h3>

      <p className="mt-1 text-sm text-gray-600">
        Record inventory when an approved fulfillment requirement is sent
        to Friends.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Serial Number / Cartridge
          </label>

          <select
            value={selectedKey}
            onChange={(event) => {
              setSelectedKey(event.target.value);
              setError("");
              setSuccess("");
              setRequestId("");
            }}
            className="w-96 rounded border border-gray-300 bg-white p-2"
          >
            <option value="">Select inventory position</option>

            {sortedPositions.map((position) => {
              const key = `${position.monitor}|${position.serial_number}|${position.color}`;

              return (
                <option key={key} value={key}>
                  {formatIdentifier(position.serial_number)} —{" "}
                  {position.color} — {formatIdentifier(position.sku)} — On
                  Hand: {position.on_hand_qty}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Quantity
          </label>

          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setError("");
              setSuccess("");
            }}
            className="w-24 rounded border border-gray-300 bg-white p-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Friends Fulfillment Reference
          </label>

          <input
            type="text"
            maxLength={150}
            value={businessReference}
            onChange={(event) => {
              setBusinessReference(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="Email, file or batch reference"
            className="w-80 rounded border border-gray-300 bg-white p-2"
          />
        </div>

        <button
          type="button"
          onClick={recordFulfillment}
          disabled={submitting}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Recording..." : "Record Fulfillment"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}
