import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    return NextResponse.json(
      { error: "Inventory adjustment service is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const serialNumber = String(body.serial_number || "").trim();
    const color = String(body.color || "").trim();
    const reason = String(body.reason || "").trim();
    const correctedQuantity = Number(body.corrected_quantity);

    if (!serialNumber || !color || !reason) {
      return NextResponse.json(
        { error: "Serial number, color and adjustment reason are required" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(correctedQuantity) ||
      correctedQuantity < 0 ||
      correctedQuantity > 100
    ) {
      return NextResponse.json(
        { error: "Corrected quantity must be a whole number between 0 and 100" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-inventory-adjustment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MCARP-Key": webhookKey,
        },
        body: JSON.stringify({
          monitor: "uis_protect2",
          serial_number: serialNumber,
          color,
          corrected_quantity: correctedQuantity,
          reason,
          source: "MCARP_DASHBOARD",
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `Inventory adjustment webhook returned ${response.status}: ${responseText}`
      );

      return NextResponse.json(
        { error: "Unable to adjust inventory" },
        { status: 502 }
      );
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Inventory adjustment request failed", error);

    return NextResponse.json(
      { error: "Unable to adjust inventory" },
      { status: 502 }
    );
  }
}
