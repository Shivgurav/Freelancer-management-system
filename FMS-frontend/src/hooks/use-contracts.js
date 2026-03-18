import { useState, useEffect } from "react";
import { getMyContracts } from "@/api/contracts";

export function useContracts() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getMyContracts()
      .then((result) => {
        const list = Array.isArray(result) ? result : result?.content ?? result?.contracts ?? [];
        setData(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}
