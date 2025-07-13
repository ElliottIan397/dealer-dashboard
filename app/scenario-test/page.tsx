"use client";
import React from "react";

export default function ScenarioTest() {
  const handleTestSend = async () => {
    const dummyScenario = {
      customer: "Test Customer",
      isO: true,
      includeDCA: true,
    };

    const encoded = btoa(JSON.stringify(dummyScenario));
    const scenarioUrl = `${window.location.origin}/?s=${encoded}`;

    const payload = {
      contractData: {
        Customer_Name: "Test Customer",
        Scenario_URL: scenarioUrl,
        Is_Final_Version: true,
      },
    };

    console.log("🚀 Sending payload:", payload);

    const res = await fetch("https://pdf-generator-w32p.onrender.com/send-envelope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("📬 Response:", text);
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleTestSend}>
        🔬 Test Scenario URL Submit
      </button>
    </div>
  );
}
