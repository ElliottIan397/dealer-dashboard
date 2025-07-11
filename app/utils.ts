// utils.ts

export const safeFixed = (val: number | undefined | null, digits: number) =>
  typeof val === "number" ? val.toFixed(digits) : "-";

export const safePercent = (val: number | undefined | null, digits: number = 1) =>
  typeof val === "number" ? `${(val * 100).toFixed(digits)}%` : "-";

export const safeNumber = (val: number | undefined | null) =>
  typeof val === "number" ? val.toLocaleString() : "-";

export const safeCurrency = (val: number | undefined | null) =>
  val !== undefined && val !== null
    ? val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
    : "-";

export const getBiasField = (row: any, field: string, bias: "O" | "R" | "N") => {
  return bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;
};

// SaaS cost constants (annual per device)
const DCA_COST = 0.25;
const JITR_COST = 0.42;
const CONTRACT_COST = 0.55;
const QR_COST = 0.14;
const ESW_COST = 5.31;

interface SaaSCostOptions {
  includeDCA?: boolean;
  includeJITR?: boolean;
  includeContract?: boolean;
  includeQR?: boolean;
  includeESW?: boolean;
}

export function calculateSubscriptionCost(
  devices: any[],
  bias: "O" | "R" | "N",
  options: SaaSCostOptions = {}
) {
  const {
    includeDCA = true,
    includeJITR = true,
    includeContract = true,
    includeQR = true,
    includeESW = true,
  } = options;

  const totalDevices = devices.length;
  const totalMono = devices.reduce((sum, r) => sum + (r.Black_Annual_Volume ?? 0), 0);
  const totalColor = devices.reduce((sum, r) => sum + (r.Color_Annual_Volume ?? 0), 0);

  const fulfillmentCost = devices.reduce(
    (sum, r) => sum + getBiasField(r, "Twelve_Month_Fulfillment_Cost", bias),
    0
  );

  const dcaTotal = includeDCA ? totalDevices * DCA_COST * 12 : 0;
  const jitrTotal = includeJITR ? totalDevices * JITR_COST * 12 : 0;
  const contractTotal = includeContract ? totalDevices * CONTRACT_COST * 12 : 0;
  const qrTotal = includeQR ? totalDevices * QR_COST * 12 : 0;
  const eswRateByRisk: Record<string, number> = {
    Low: 6,
    Moderate: 7,
    High: 8.5,
    Critical: 10,
  };

  const eswTotal = includeESW
    ? devices.reduce((sum, r) => {
      const risk = eswRateByRisk[r.Final_Risk_Level] ?? 7.5;
      return sum + risk * 12;
    }, 0)
    : 0;

  const totalCost = fulfillmentCost + dcaTotal + jitrTotal + contractTotal + qrTotal + eswTotal;

  return {
    totalCost,
    breakdown: {
      fulfillmentCost,
      dcaTotal,
      jitrTotal,
      contractTotal,
      qrTotal,
      eswTotal,
    },
    volume: {
      totalMono,
      totalColor,
    },
    totalDevices,
  };
}

export function calculateSubscriptionRevenue(
  devices: any[],
  monoCpp: number,
  colorCpp: number,
  bias: "O" | "R" | "N"
) {
  let totalRevenue = 0;
  const sample: number[] = [];

  for (const r of devices) {
    const monoPages = getBiasField(r, "Black_Annual_Volume", bias) ?? 0;
    const colorPages = getBiasField(r, "Color_Annual_Volume", bias) ?? 0;
    const revenue = monoPages * monoCpp + colorPages * colorCpp;
    console.log("Device Pages Debug:", {
      monoPages,
      colorPages,
      monoCpp,
      colorCpp,
    });
    totalRevenue += revenue;
    sample.push(revenue);
  }

  return {
    totalRevenue,
    totalDevices: devices.length,
    sample,
  };
}
