// app/generateContract.ts
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export async function generateContract(data: Record<string, any>) {
  try {
    const response = await fetch("/Templates/subscription_agreement_template.docx");
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // ✅ Format the device table as plain text
    const devices = data.Devices_Table || [];
    const tableAsText = [
      "Model\t\tSerial Number",
      ...devices.map((d: { Model: string; Serial: string }) => `${d.Model}\t\t${d.Serial}`)
    ].join("\n");

    // ✅ Set all merge fields, including the rendered table
    doc.setData({
      ...data,
      List_of_Devices: tableAsText,
    });

    try {
      doc.render();
    } catch (error) {
      console.error("Template rendering error:", error);
      throw error;
    }

    const output = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(output, "Subscription_Agreement.docx");
  } catch (err) {
    console.error("Contract generation failed:", err);
    alert("Failed to generate contract.");
  }
}
