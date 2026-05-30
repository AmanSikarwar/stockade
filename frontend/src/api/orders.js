import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { orderKeys } from "./keys";
import { toQueryString } from "./params";

export function useOrders(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => apiRequest(`/orders${toQueryString(params)}`),
  });
}

export function useOrder(orderId) {
  const { apiRequest } = useAuth();

  return useQuery({
    enabled: Boolean(orderId),
    queryKey: orderKeys.detail(orderId),
    queryFn: () => apiRequest(`/orders/${orderId}`),
  });
}

export function useCreateOrder() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => apiRequest("/orders", { method: "POST", body: payload }),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return order;
    },
  });
}

export function useCancelOrder() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => apiRequest(`/orders/${orderId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
