import { useEffect, useState, useMemo } from "react";
import { DASHBOARD_MODE } from "./config";
import type { McarpRow } from "./types";

export function useMCARPData() {
  const [data, setData] = useState<McarpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedContractType, setSelectedContractType] = useState("All");

  useEffect(() => {
    const dataUrl = DASHBOARD_MODE === "demo"
  ? "/data/demo/mcarp_demo.json"
  : "/data/prod/mcarp.json";
    fetch(dataUrl)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, []);

  const customers = useMemo(() => {
    const unique = Array.from(new Set(data.map((row) => row.Monitor).filter(Boolean)));
    return unique.sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const customerMatch = selectedCustomer === "All" || row.Monitor === selectedCustomer;
      const contractMatch = selectedContractType === "All" || row.Contract_Status === selectedContractType;
      return customerMatch && contractMatch;
    });
  }, [data, selectedCustomer, selectedContractType]);

  const filteredForVendor = useMemo(() => {
    return data.filter((row) => {
      const customerMatch = selectedCustomer === "All" || row.Monitor === selectedCustomer;
      const contractMatch = selectedContractType === "All" || row.Contract_Status === selectedContractType;
      return customerMatch && contractMatch;
    });
  }, [data, selectedCustomer, selectedContractType]);

  const contractDevices = useMemo(() => {
    return data.filter((row) => {
      const customerMatch = selectedCustomer === "All" || row.Monitor === selectedCustomer;
      return row.Contract_Status === "C" && customerMatch;
    });
  }, [data, selectedCustomer]);

  const transactionalDevices = useMemo(() => {
    return data.filter((row) => {
      const customerMatch = selectedCustomer === "All" || row.Monitor === selectedCustomer;
      return row.Contract_Status === "T" && customerMatch;
    });
  }, [data, selectedCustomer]);

  return {
    loading,
    data,
    filtered,
    filteredForVendor, // ✅ added for VendorSummaryTable filtering
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedContractType,
    setSelectedContractType,
    contractDevices,
    transactionalDevices,
  };
}
