"use client";
import { Suspense } from "react";
import DealerDashboard from "./DealerDashboard";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading scenario...</div>}>
      <DealerDashboard />
    </Suspense>
  );
}
