import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const webhookKey = process.env.MCARP_INVENTORY_KEY;

  if (!webhookKey) {
    return NextResponse.json(
      { error: "Fulfillment service is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const requirementId = Number(body.requirement_id);
    const reference = String(body.reference || "").trim();

    if (
      !Number.isInteger(requirementId) ||
      requirementId <= 0 ||
      !reference
    ) {
      return NextResponse.json(
        { error: "A valid requirement_id and reference are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://automation.digitolservices.com/webhook/mcarp-approved-fulfillment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MCARP-Key": webhookKey,
        },
        body: JSON.stringify({
          requirement_id: requirementId,
          reference,
        }),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Approved fulfillment webhook failed:", responseText);

      return NextResponse.json(
        { error: "Unable to record approved fulfillment" },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Approved fulfillment request failed:", error);

    return NextResponse.json(
      { error: "Unable to record approved fulfillment" },
      { status: 500 }
    );
  }
}
