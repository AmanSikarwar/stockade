import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { reportKeys } from "./keys";
import { toQueryString } from "./params";

export function useRevenueOverTime(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: reportKeys.revenue(params),
    queryFn: () => apiRequest(`/reports/revenue-over-time${toQueryString(params)}`),
  });
}

export function useTopProducts(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: reportKeys.topProducts(params),
    queryFn: () => apiRequest(`/reports/top-products${toQueryString(params)}`),
  });
}

export function useSalesByCustomer(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: reportKeys.salesByCustomer(params),
    queryFn: () => apiRequest(`/reports/sales-by-customer${toQueryString(params)}`),
  });
}
