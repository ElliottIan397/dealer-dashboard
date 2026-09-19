import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    return NextResponse.json(
      { error: "Fulfillment service is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-send-approved-fulfillments",
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
      console.error("Send approved fulfillments webhook failed:", responseText);

      return NextResponse.json(
        { error: "Unable to send approved fulfillments" },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Send approved fulfillments request failed:", error);

    return NextResponse.json(
      { error: "Unable to send approved fulfillments" },
      { status: 500 }
    );
  }
}