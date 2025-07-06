// app/generateContract.ts
export async function generateContract(data: Record<string, any>) {
  try {
    const response = await fetch("/Templates/subscription_agreement_template.html");
    let templateHtml = await response.text();

    type Device = {
      Model: string;
      Serial: string;
      Black_Annual_Volume?: number;
      Color_Annual_Volume?: number;
      Volume: number;
    };

    const devices = (data.Devices_Table || [])
      .map((d: any) => ({
        ...d,
        Volume: (d.Black_Annual_Volume ?? 0) + (d.Color_Annual_Volume ?? 0)
      }))
      .sort((a: any, b: any) => b.Volume - a.Volume);
    data.Devices_Table = devices;

    const formatDevicesTable = (rows: typeof devices) => {
      return rows.map((d: Device) => {
        const mono = d.Black_Annual_Volume ?? 0;
        const color = d.Color_Annual_Volume ?? 0;
        const volume = mono + color;
        return `
          <tr>
            <td class="border px-4 py-2">${d.Model}</td>
            <td class="border px-4 py-2">${d.Serial}</td>
            <td class="border px-4 py-2">${volume.toLocaleString()}</td>
          </tr>`;
      }).join("");
    };

    const guardrailsTable: [string, string | number][] = [
      ["Fleet Output Avg. Mth. Lower Limit:", data.volumeLowerLimit],
      ["Fleet Output Avg. Mth. Upper Limit:", data.volumeUpperLimit],
      ["Device Lower Limit:", data.deviceLowerLimit],
      ["Device Upper Limit:", data.deviceUpperLimit],
    ];

    const formatGuardrailsTable = (rows: [string, string | number][]) => {
      return rows.map(([label, value]) => `
        <tr>
          <td class="border px-4 py-2">${label}</td>
          <td class="border px-4 py-2">${value}</td>
        </tr>`).join("");
    };

    templateHtml = templateHtml
      .replace("{{Customer_Name}}", data.Customer_Name)
      .replace("{{Dealer_Name}}", data.Dealer_Name)
      .replace("{{Rep_Name}}", data.Rep_Name)
      .replace("{{Start_Date}}", data.Start_Date)
      .replace("{{Devices_Table}}", formatDevicesTable(devices))
      .replace("{{Guardrails_Table}}", formatGuardrailsTable(guardrailsTable));

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(templateHtml);
      newWindow.document.close();
    } else {
      throw new Error("Failed to open new browser window.");
    }

    // 🔽 Download contract data as JSON
    console.log("✅ Devices (with Volume):", devices);
    data.Devices_Table = devices;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'contract_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    console.error("Contract generation failed:", err);
    alert("Failed to generate contract.");
  }
}