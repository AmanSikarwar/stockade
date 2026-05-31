import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { customerKeys } from "./keys";
import { toQueryString } from "./params";

export function useCustomers(params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => apiRequest(`/customers${toQueryString(params)}`),
  });
}

export function useCustomer(customerId) {
  const { apiRequest } = useAuth();

  return useQuery({
    enabled: Boolean(customerId),
    queryKey: customerKeys.detail(customerId),
    queryFn: () => apiRequest(`/customers/${customerId}`),
  });
}

export function useCreateCustomer() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => apiRequest("/customers", { method: "POST", body: payload }),
    onSuccess: async (customer) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return customer;
    },
  });
}

export function useUpdateCustomer() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, payload }) =>
      apiRequest(`/customers/${customerId}`, { method: "PUT", body: payload }),
    onSuccess: async (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      await queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      return customer;
    },
  });
}

export function useDeleteCustomer() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId) => apiRequest(`/customers/${customerId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
