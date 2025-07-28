import React from 'react';

interface DevicePlan {
  Serial_Number: string;
  totals: {
    Black_Full_Cartridges_Required_365d: number;
    Cyan_Full_Cartridges_Required_365d: number;
    Magenta_Full_Cartridges_Required_365d: number;
    Yellow_Full_Cartridges_Required_365d: number;
  };
}

interface Table4Props {
  data: DevicePlan[];
}

const Table4: React.FC<Table4Props> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-2">Monthly Fulfillment Plan (Table 4)</h2>
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Serial Number</th>
            <th className="border px-2 py-1 text-right">Black</th>
            <th className="border px-2 py-1 text-right">Cyan</th>
            <th className="border px-2 py-1 text-right">Magenta</th>
            <th className="border px-2 py-1 text-right">Yellow</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-t">
              <td className="border px-2 py-1">{row.Serial_Number}</td>
              <td className="border px-2 py-1 text-right">{row.totals.Black_Full_Cartridges_Required_365d}</td>
              <td className="border px-2 py-1 text-right">{row.totals.Cyan_Full_Cartridges_Required_365d}</td>
              <td className="border px-2 py-1 text-right">{row.totals.Magenta_Full_Cartridges_Required_365d}</td>
              <td className="border px-2 py-1 text-right">{row.totals.Yellow_Full_Cartridges_Required_365d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table4;
