import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { productKeys } from "./keys";
import { toQueryString } from "./params";

export function useProducts(params = {}, options = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => apiRequest(`/products${toQueryString(params)}`),
    ...options,
  });
}

export function useProduct(productId) {
  const { apiRequest } = useAuth();

  return useQuery({
    enabled: Boolean(productId),
    queryKey: productKeys.detail(productId),
    queryFn: () => apiRequest(`/products/${productId}`),
  });
}

export function useStockMovements(productId, params = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    enabled: Boolean(productId),
    queryKey: productKeys.movements(productId, params),
    queryFn: () => apiRequest(`/products/${productId}/stock-movements${toQueryString(params)}`),
  });
}

export function useAdjustStock() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) =>
      apiRequest(`/products/${productId}/adjust-stock`, { method: "POST", body: payload }),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: productKeys.detail(product.id) });
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return product;
    },
  });
}

export function useCreateProduct() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => apiRequest("/products", { method: "POST", body: payload }),
    onSuccess: async (product) => {
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return product;
    },
  });
}

export function useUpdateProduct() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) =>
      apiRequest(`/products/${productId}`, { method: "PUT", body: payload }),
    onSuccess: async (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      await queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      return product;
    },
  });
}

export function useDeleteProduct() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => apiRequest(`/products/${productId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
