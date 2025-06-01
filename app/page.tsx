"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

      <div className="w-64">
        <Select onValueChange={setSelected} defaultValue="All">
          <SelectTrigger>
            <SelectValue placeholder="Select Customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent><p className="text-sm">Total Devices</p><p className="text-xl font-bold">{filtered.reduce((a, b) => a + b.devices, 0)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm">Contract Revenue</p><p className="text-xl font-bold text-green-600">${filtered.reduce((a, b) => a + b.contractRevenue, 0)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm">Transactional Revenue</p><p className="text-xl font-bold text-yellow-600">${filtered.reduce((a, b) => a + b.transactionalRevenue, 0)}</p></CardContent></Card>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
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
