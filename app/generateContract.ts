// app/generateContract.ts
export async function generateContract(data: Record<string, any>) {
  try {
    const response = await fetch("/Templates/subscription_agreement_template.html");
    let templateHtml = await response.text();

    const devices = (data.Devices_Table || []) as {
      Model: string;
      Serial: string;
      Black_Annual_Volume?: number;
      Color_Annual_Volume?: number;
    }[];

    devices.sort((a, b) => {
      const aVol = (a.Black_Annual_Volume ?? 0) + (a.Color_Annual_Volume ?? 0);
      const bVol = (b.Black_Annual_Volume ?? 0) + (b.Color_Annual_Volume ?? 0);
      return bVol - aVol;
    });

    const formatDevicesTable = (rows: typeof devices) => {
      return rows.map(d => {
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
  } catch (err) {
    console.error("Contract generation failed:", err);
    alert("Failed to generate contract.");
  }
}