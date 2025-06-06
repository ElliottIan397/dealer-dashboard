// useMCARPData.ts
import { useEffect, useState } from "react";
import type { McarpRow } from "./types";

export function useMCARPData() {
  const [data, setData] = useState<McarpRow[]>([]);
  const [filtered, setFiltered] = useState<McarpRow[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedContractType, setSelectedContractType] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/mcarp.json")
      .then((res) => res.json())
      .then((json: any[]) => {
        setData(json);
        const uniqueCustomers = Array.from(new Set(json.map((r) => r.Monitor))).sort();
        setCustomers(uniqueCustomers);
        setSelectedCustomer("All"); // Default = charts only - all customers
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = data;
    if (selectedCustomer !== "All") {
  result = result.filter((r) => r.Monitor === selectedCustomer);
}
    if (selectedContractType !== "All") {
      result = result.filter((r) =>
        selectedContractType === "C"
          ? r.Contract_Status === "C"
          : r.Contract_Status === "T"
      );
    }
    setFiltered(result);
  }, [data, selectedCustomer, selectedContractType]);

  return {
    loading,
    data,
    filtered,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    selectedContractType,
    setSelectedContractType,
  };
}
