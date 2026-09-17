import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    console.error("MCARP_INVENTORY_KEY is not configured");

    return NextResponse.json(
      { error: "Inventory service is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-inventory-read",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MCARP-Key": webhookKey,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `Inventory webhook returned ${response.status}: ${await response.text()}`
      );

      return NextResponse.json(
        { error: "Unable to retrieve inventory" },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Inventory webhook request failed", error);

    return NextResponse.json(
      { error: "Unable to retrieve inventory" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    return NextResponse.json(
      { error: "Inventory service is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const serialNumber = String(body.serial_number || "").trim();
    const color = String(body.color || "").trim();
    const reference = String(body.reference || "").trim();
    const quantity = Number(body.quantity);

    if (!serialNumber || !color || !reference) {
      return NextResponse.json(
        { error: "Serial number, color and reference are required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return NextResponse.json(
        { error: "Quantity must be a whole number between 1 and 100" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-inventory-fulfillment",
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
          quantity,
          reference,
          source: "MCARP_DASHBOARD",
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `Fulfillment webhook returned ${response.status}: ${responseText}`
      );

      return NextResponse.json(
        { error: "Unable to record fulfillment" },
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
    console.error("Fulfillment request failed", error);

    return NextResponse.json(
      { error: "Unable to record fulfillment" },
      { status: 502 }
    );
  }
}
