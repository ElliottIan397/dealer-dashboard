"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const customers = ["All", "McNaughton", "Friends University", "Other Customer"];

const data = [
  { customer: "McNaughton", devices: 5, contractRevenue: 1200, transactionalRevenue: 2200 },
  { customer: "Friends University", devices: 3, contractRevenue: 900, transactionalRevenue: 1800 },
  { customer: "Other Customer", devices: 2, contractRevenue: 0, transactionalRevenue: 1000 }
];

export default function DealerDashboard() {
  const [selected, setSelected] = useState("All");
  const filtered = selected === "All" ? data : data.filter(d => d.customer === selected);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dealer Dashboard</h1>

      <div className="mb-4">
        <label htmlFor="customer" className="block mb-2 text-sm font-medium">Select Customer:</label>
        <select
          id="customer"
          className="p-2 border rounded w-64"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {customers.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Devices</p>
          <p className="text-2xl font-bold">{filtered.reduce((a, b) => a + b.devices, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Contract Revenue</p>
          <p className="text-2xl font-bold text-green-600">${filtered.reduce((a, b) => a + b.contractRevenue, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-600">Transactional Revenue</p>
          <p className="text-2xl font-bold text-yellow-600">${filtered.reduce((a, b) => a + b.transactionalRevenue, 0)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Revenue Opportunity (Contract vs Transactional)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filtered}>
            <XAxis dataKey="customer" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="contractRevenue" stackId="a" fill="#10b981" name="Contract" />
            <Bar dataKey="transactionalRevenue" stackId="a" fill="#facc15" name="Transactional" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
