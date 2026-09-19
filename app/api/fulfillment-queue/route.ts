import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    console.error("MCARP_INVENTORY_KEY is not configured");

    return NextResponse.json(
      { error: "Fulfillment service is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-fulfillment-queue-read",
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

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Fulfillment queue webhook failed:", responseText);

      return NextResponse.json(
        { error: "Unable to load fulfillment queue" },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      queue: Array.isArray(data.queue) ? data.queue : [],
    });
  } catch (error) {
    console.error("Fulfillment queue request failed:", error);

    return NextResponse.json(
      { error: "Unable to load fulfillment queue" },
      { status: 500 }
    );
  }
}
