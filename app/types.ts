export type McarpRow = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Black_Annual_Volume: number;
  Color_Annual_Volume: number;
  "Black_Full_Cartridges_Required_(365d)": number;
  "Cyan_Full_Cartridges_Required_(365d)": number;
  "Magenta_Full_Cartridges_Required_(365d)": number;
  "Yellow_Full_Cartridges_Required_(365d)": number;
  Contract_Status: string;
  "12_Mth_Fulfillment_Cost": number;
  "12_Mth_Transactional_SP": number;
  Contract_Total_Revenue: number;
};

export type Table2Row = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Contract_Mono_CPP: number;
  Contract_Color_CPP: number;
  Contract_Base_Charge_Annual: number;
  Included_Mono_Volume: number;
  Included_Color_Volume: number;
  Billable_Mono_Pages: number;
  Billable_Color_Pages: number;
  contract_end: string;
  "Recalculated_Age_(Years)": number;
  "Usage_(%)": number;
  Engine_Cycles: number;
  Final_Risk_Level: string;
};

export type Table3Row = {
  Monitor: string;
  Serial_Number: string;
  Printer_Model: string;
  Device_Type: string;
  Black_Pages_Left: number;
  Cyan_Pages_Left: number;
  Magenta_Pages_Left: number;
  Yellow_Pages_Left: number;
  "Black_Page_Coverage_%": number;
  "Cyan_Page_Coverage_%": number;
  "Magenta_Page_Coverage_%": number;
  "Yellow_Page_Coverage_%": number;
  Black_Yield_Estimate: number;
  Cyan_Yield_Estimate: number;
  Magenta_Yield_Estimate: number;
  Yellow_Yield_Estimate: number;
};
