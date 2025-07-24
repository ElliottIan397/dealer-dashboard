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

export const parse = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

export const getYieldMap = (row: any, bias: "O" | "R" | "N") => ({
  black: parse(getBiasField(row, "K_Yield", bias)),
  cyan: parse(getBiasField(row, "C_Yield", bias)),
  magenta: parse(getBiasField(row, "M_Yield", bias)),
  yellow: parse(getBiasField(row, "Y_Yield", bias)),
});

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
/**
 * Calculates monthly cartridge fulfillment needs per device row
 * using exact MCARP field names and logic.
 * @param device - A single row from MCARP
 * @param yieldMap - Map of SKU → Rated_Yield
 * @returns Object with monthly fulfillment arrays per color
 */

interface DeviceRow {
  [key: string]: any;
}

interface FulfillmentPlan {
  black: number[];
  cyan: number[];
  magenta: number[];
  yellow: number[];
}

function getYieldMapForBias(row: any, bias: "O" | "R" | "N") {
  const prefix = `${bias}_`;

  const parse = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  return {
    black: parse(row[`${prefix}K_Yield`]),
    cyan: parse(row[`${prefix}C_Yield`]),
    magenta: parse(row[`${prefix}M_Yield`]),
    yellow: parse(row[`${prefix}Y_Yield`]),
  };
}

export function calculateMonthlyFulfillmentPlan(
  device: DeviceRow,
  yieldMap: Record<string, number>
): FulfillmentPlan {
  const months = 12;
  const daysPerMonth = 365 / months;

  function getAdjustedYield(color: string, coveragePercent: number): number {
    const ratedYield = yieldMap[color] || 0;
    const safeCoverage = coveragePercent > 0 ? coveragePercent : 5;
    return ratedYield * (5 / safeCoverage);
  }

  function buildPlan(
    color: string,
    level: number,
    pagesLeft: number,
    daysLeft: number,
    coverage: number,
    volume90: number
  ): number[] {
    console.log("DEBUG buildPlan inputs", {
      color, level, pagesLeft, daysLeft, coverage, volume90,
    });
    const monthly = Array(months).fill(0);
    const annualVolume = (volume90 / 90) * 365;
    const adjustedYield = getAdjustedYield(color, coverage);
    console.log("💥 Yield Debug", {
      color,
      coverage,
      yieldValue: yieldMap[color],
      adjustedYield,
      pagesLeft,
      daysLeft,
      volume90,
    });
    const dailyDemand = annualVolume / 365;

    console.log("DEBUG → dailyDemand:", dailyDemand, "adjustedYield:", adjustedYield);

    if (dailyDemand <= 0 || adjustedYield <= 0) return monthly;

    let pointer = daysLeft;
    const depletionDays = adjustedYield / dailyDemand;
    console.log("DEBUG loop inputs", { pointer, depletionDays }); // ← INSERT HERE

    while (pointer < 365) {
      const monthIdx = Math.min(Math.floor(pointer / daysPerMonth), 11);
      monthly[monthIdx]++;
      pointer += depletionDays;
    }
    return monthly;
  }

  return {
    black: buildPlan(
      "black",
      device["Black_Level"],
      device["Black_Pages_Left"],
      device["Black_Days_Left"],
      device["Black_Page_Coverage_Percent"],
      device["Mono_(A4-equivalent)_Usage"]
    ),
    cyan: buildPlan(
      "cyan",
      device["Cyan_Level"],
      device["Cyan_Pages_Left"],
      device["Cyan_Days_Left"],
      device["Cyan_Page_Coverage_Percent"],
      device["Colour_(A4-equivalent)_Usage"] / 3
    ),
    magenta: buildPlan(
      "magenta",
      device["Magenta_Level"],
      device["Magenta_Pages_Left"],
      device["Magenta_Days_Left"],
      device["Magenta_Page_Coverage_Percent"],
      device["Colour_(A4-equivalent)_Usage"] / 3
    ),
    yellow: buildPlan(
      "yellow",
      device["Yellow_Level"],
      device["Yellow_Pages_Left"],
      device["Yellow_Days_Left"],
      device["Yellow_Page_Coverage_Percent"],
      device["Colour_(A4-equivalent)_Usage"] / 3
    )
  };
}
export function calculateVolumeBasedFulfillmentPlan(row: any, yieldMap: any) {
  const coverage = {
    black: row.Black_Page_Coverage_Percent || 5,
    cyan: row.Cyan_Page_Coverage_Percent || 5,
    magenta: row.Magenta_Page_Coverage_Percent || 5,
    yellow: row.Yellow_Page_Coverage_Percent || 5,
  };

  const isMono = row.Device_Type?.toLowerCase() === "mono";

  const monthlyBlack = (row.Black_Annual_Volume ?? 0) / 12;
  const monthlyColor = isMono ? 0 : (row.Color_Annual_Volume ?? 0) / 12;

  const monthly = {
    black: Array(12).fill(monthlyBlack),
    cyan: Array(12).fill(monthlyColor / 3),
    magenta: Array(12).fill(monthlyColor / 3),
    yellow: Array(12).fill(monthlyColor / 3),
  };

  const safeYield = (val: number | undefined, coverageVal: number): number =>
    val && val > 0 ? val * (5 / coverageVal) : 0;

  const yields = {
    black: safeYield(yieldMap.black, coverage.black),
    cyan: isMono ? 0 : safeYield(yieldMap.cyan, coverage.cyan),
    magenta: isMono ? 0 : safeYield(yieldMap.magenta, coverage.magenta),
    yellow: isMono ? 0 : safeYield(yieldMap.yellow, coverage.yellow),
  };

  function calc(ctgPerMonth: number[], yieldVal: number): number[] {
    let remaining = 0;
    const result: number[] = [];

    for (let i = 0; i < ctgPerMonth.length; i++) {
      let pages = ctgPerMonth[i];
      let count = 0;

      if (yieldVal <= 0) {
        result.push(0);
        continue;
      }

      while (pages > 0) {
        if (remaining <= 0) remaining = yieldVal;
        const used = Math.min(pages, remaining);
        remaining -= used;
        pages -= used;
        if (remaining === 0) count++;
      }

      result.push(count);
    }

    return result;
  }

  return {
    black: calc(monthly.black, yields.black),
    cyan: calc(monthly.cyan, yields.cyan),
    magenta: calc(monthly.magenta, yields.magenta),
    yellow: calc(monthly.yellow, yields.yellow),
  };
}
export function generateTable1Data(
  rows: any[],
  bias: "O" | "R" | "N",
  selectedMonths: number
) {
  return rows.map((row) => {
    const getVal = (field: string) =>
      bias === "O" ? row[field] ?? 0 : row[`${bias}_${field}`] ?? row[field] ?? 0;

    const yieldMap = {
      black: parseFloat(getVal("K_Yield")) || 0,
      cyan: parseFloat(getVal("C_Yield")) || 0,
      magenta: parseFloat(getVal("M_Yield")) || 0,
      yellow: parseFloat(getVal("Y_Yield")) || 0,
    };

    const plan = calculateMonthlyFulfillmentPlan(row, yieldMap);

    const black = plan.black.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const cyan = plan.cyan.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const magenta = plan.magenta.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const yellow = plan.yellow.slice(0, selectedMonths).reduce((a, b) => a + b, 0);
    const total = black + cyan + magenta + yellow || 1;

    const unitSP = getVal("Twelve_Month_Transactional_SP") / total;
    const unitCost = getVal("Twelve_Month_Fulfillment_Cost") / total;

    return {
      Monitor: row.Monitor,
      Serial_Number: row.Serial_Number,
      Printer_Model: row.Printer_Model,
      Device_Type: row.Device_Type,
      Black_Annual_Volume: Math.round(row.Black_Annual_Volume * (selectedMonths / 12)),
      Color_Annual_Volume: Math.round(row.Color_Annual_Volume * (selectedMonths / 12)),
      Black_Full_Cartridges_Required_365d: black,
      Cyan_Full_Cartridges_Required_365d: cyan,
      Magenta_Full_Cartridges_Required_365d: magenta,
      Yellow_Full_Cartridges_Required_365d: yellow,
      Twelve_Month_Transactional_SP: +(unitSP * total).toFixed(2),
      Twelve_Month_Fulfillment_Cost: +(unitCost * total).toFixed(2),
      Contract_Total_Revenue: +(row.Contract_Total_Revenue * (selectedMonths / 12)).toFixed(2),
      Contract_Status: row.Contract_Status,
      Last_Updated: row.Last_Updated,
    };
  });
}
