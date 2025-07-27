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

export function calculateMonthlyFulfillmentPlan(device: any, bias: 'O' | 'R' | 'N') {
  const daysPerMonth = 365 / 12;
  const isColorDevice = device['Device_Type'] === 'Color';
  const colors = isColorDevice ? ['K', 'C', 'M', 'Y'] : ['K'];

  const safeParse = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val === 'NULL' || val === 'NO SKU' || val === 'ADD YIELD') return NaN;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? NaN : parsed;
  };

  const result: Record<string, number[]> = {
    black: Array(12).fill(0),
    cyan: Array(12).fill(0),
    magenta: Array(12).fill(0),
    yellow: Array(12).fill(0)
  };

  const fieldMap: Record<string, { level: string; pagesLeft: string; daysLeft: string; coverage: string; usage: () => number; resultKey: string }> = {
    K: {
      level: 'Black_Level',
      pagesLeft: 'Black_Pages_Left',
      daysLeft: 'Black_Days_Left',
      coverage: 'Black_Page_Coverage_Percent',
      usage: () => safeParse(device['Mono_(A4-equivalent)_Usage']),
      resultKey: 'black'
    },
    C: {
      level: 'Cyan_Level',
      pagesLeft: 'Cyan_Pages_Left',
      daysLeft: 'Cyan_Days_Left',
      coverage: 'Cyan_Page_Coverage_Percent',
      usage: () => safeParse(device['Colour_(A4-equivalent)_Usage']) / 3,
      resultKey: 'cyan'
    },
    M: {
      level: 'Magenta_Level',
      pagesLeft: 'Magenta_Pages_Left',
      daysLeft: 'Magenta_Days_Left',
      coverage: 'Magenta_Page_Coverage_Percent',
      usage: () => safeParse(device['Colour_(A4-equivalent)_Usage']) / 3,
      resultKey: 'magenta'
    },
    Y: {
      level: 'Yellow_Level',
      pagesLeft: 'Yellow_Pages_Left',
      daysLeft: 'Yellow_Days_Left',
      coverage: 'Yellow_Page_Coverage_Percent',
      usage: () => safeParse(device['Colour_(A4-equivalent)_Usage']) / 3,
      resultKey: 'yellow'
    }
  };

  colors.forEach(color => {
    const map = fieldMap[color];
    const level = safeParse(device[map.level]);
    const pagesLeft = safeParse(device[map.pagesLeft]);
    const coverage = safeParse(device[map.coverage]) || 5;
    const usage = map.usage();
    const daysLeft = safeParse(device[map.daysLeft]) || 0;
    const yieldField = `${bias}_${color}_Yield`;
    const replYield = safeParse(device[yieldField]);

    if (isNaN(level) || isNaN(pagesLeft) || isNaN(replYield) || level <= 0 || usage <= 0) {
      console.warn('⚠️ Skipping cartridge due to invalid inputs', {
        color: map.resultKey,
        sku: replYield,
        monoUsage: device['Mono_(A4-equivalent)_Usage'],
        colorUsage: device['Colour_(A4-equivalent)_Usage'],
        level: device[map.level],
        pagesLeft: device[map.pagesLeft],
        daysLeft: device[map.daysLeft],
        coverage: device[map.coverage],
        inDeviceYield: device[`${map.resultKey.charAt(0).toUpperCase() + map.resultKey.slice(1)}_In_Device_Yield`],
        parsedLevel: level,
        parsedPagesLeft: pagesLeft,
        parsedCoverage: coverage,
        parsedUsage: usage,
        parsedYield: replYield
      });
      return;
    }

    const inferredYield = pagesLeft / (level * (coverage / 100));
    const adjustedYield = (y: number) => y * (5 / coverage);
    const dailyDemand = usage / 90;

    let pointer = daysLeft;
    let first = true;

    while (pointer < 365) {
      const thisYield = first ? inferredYield : replYield;
      const depletionDays = adjustedYield(thisYield) / dailyDemand;

      const monthIdx = Math.min(Math.floor(pointer / daysPerMonth), 11);
      result[map.resultKey][monthIdx]++;

      pointer += depletionDays;
      first = false;
    }
  });

  return result;
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
      black: getVal("K_Yield"),
      cyan: getVal("C_Yield"),
      magenta: getVal("M_Yield"),
      yellow: getVal("Y_Yield"),
    };

    const plan = calculateMonthlyFulfillmentPlan(row, bias);

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


export function calculateMonthlyFulfillmentPlanV2(device: any, bias: 'O' | 'R' | 'N', timeframeInMonths: number = 12) {
  const daysPerMonth = 365 / 12;
  const isColorDevice = device['Device_Type'] === 'Color';
  const colors = isColorDevice ? ['K', 'C', 'M', 'Y'] : ['K'];

  const safeParse = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val === 'NULL' || val === 'NO SKU' || val === 'ADD YIELD') return NaN;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? NaN : parsed;
  };

  const result: Record<string, number[]> = {
    black: Array(12).fill(0),
    cyan: Array(12).fill(0),
    magenta: Array(12).fill(0),
    yellow: Array(12).fill(0)
  };

  const fieldMap: Record<string, { pagesLeft: string; daysLeft: string; resultKey: string }> = {
    K: {
      pagesLeft: 'Black_Pages_Left',
      daysLeft: 'Black_Days_Left',
      resultKey: 'black'
    },
    C: {
      pagesLeft: 'Cyan_Pages_Left',
      daysLeft: 'Cyan_Days_Left',
      resultKey: 'cyan'
    },
    M: {
      pagesLeft: 'Magenta_Pages_Left',
      daysLeft: 'Magenta_Days_Left',
      resultKey: 'magenta'
    },
    Y: {
      pagesLeft: 'Yellow_Pages_Left',
      daysLeft: 'Yellow_Days_Left',
      resultKey: 'yellow'
    }
  };

  colors.forEach(color => {
    const map = fieldMap[color];
    const pagesLeftRaw = device[map.pagesLeft];
    const daysLeftRaw = device[map.daysLeft];
    const yieldField = `${bias}_${color}_Yield`;
    const replYieldRaw = device[yieldField];

    const pagesLeft = safeParse(pagesLeftRaw);
    const daysLeft = safeParse(daysLeftRaw);
    const replYield = safeParse(replYieldRaw);

    if (isNaN(pagesLeft) || isNaN(daysLeft) || isNaN(replYield) || pagesLeft <= 0 || daysLeft <= 0) {
      return;
    }

    const dailyDepletion = pagesLeft / daysLeft;
    let pointer = daysLeft;
    let first = true;
    const timeLimit = timeframeInMonths * daysPerMonth;

    while (pointer < timeLimit) {
      const thisYield = first ? pagesLeft : replYield;
      const depletionDays = thisYield / dailyDepletion;
      const monthIdx = Math.min(Math.floor(pointer / daysPerMonth), 11);
      result[map.resultKey][monthIdx]++;

      pointer += depletionDays;
      first = false;
    }
  });

  return {
    totals: {
      Black_Full_Cartridges_Required_365d: result.black.reduce((a, b) => a + b, 0),
      Cyan_Full_Cartridges_Required_365d: result.cyan.reduce((a, b) => a + b, 0),
      Magenta_Full_Cartridges_Required_365d: result.magenta.reduce((a, b) => a + b, 0),
      Yellow_Full_Cartridges_Required_365d: result.yellow.reduce((a, b) => a + b, 0)
    },
    monthly: result
  };
}