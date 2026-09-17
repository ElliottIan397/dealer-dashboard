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
