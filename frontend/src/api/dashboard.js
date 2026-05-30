import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { dashboardKeys } from "./keys";
import { toQueryString } from "./params";

export const emptyDashboardMetrics = {
  low_stock_products: [],
  low_stock_products_count: 0,
  low_stock_threshold: 0,
  total_active_orders: 0,
  total_active_products: 0,
  total_cancelled_orders: 0,
  total_customers: 0,
  total_orders: 0,
  total_products: 0,
};

export function useDashboardMetrics(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.metrics(params),
    queryFn: () => apiRequest(`/dashboard${toQueryString(params)}`),
  });
}
