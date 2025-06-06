export type McarpRow = {
  // Shared fields (Tables 1, 2, 3)
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;

  // Table 1 fields
  Black_Annual_Volume: number;
  Color_Annual_Volume: number;
  Black_Full_Cartridges_Required_365d: number;
  Cyan_Full_Cartridges_Required_365d: number;
  Magenta_Full_Cartridges_Required_365d: number;
  Yellow_Full_Cartridges_Required_365d: number;
  Contract_Status: string;
  Last_Updated: string;
  Twelve_Month_Fulfillment_Cost: number;
  Twelve_Month_Transactional_SP: number;
  Contract_Total_Revenue: number;

  // Table 2 fields
  Contract_Mono_CPP: number;
  Contract_Color_CPP: number;
  Contract_Base_Charge_Annual: number;
  Included_Mono_Volume: number;
  Included_Color_Volume: number;
  Billable_Mono_Pages: number;
  Billable_Color_Pages: number;
  contract_end: string;
  Recalculated_Age_Years: number;
  Usage_Percent: number;
  Engine_Cycles: number;
  Final_Risk_Level: string;

  // Table 3 fields
  Black_Pages_Left: number;
  Cyan_Pages_Left: number;
  Magenta_Pages_Left: number;
  Yellow_Pages_Left: number;
  Black_Page_Coverage_Percent: number;
  Cyan_Page_Coverage_Percent: number;
  Magenta_Page_Coverage_Percent: number;
  Yellow_Page_Coverage_Percent: number;
  Black_Yield_Estimate: number;
  Cyan_Yield_Estimate: number;
  Magenta_Yield_Estimate: number;
  Yellow_Yield_Estimate: number;
};
