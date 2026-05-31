import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { categoryKeys } from "./keys";
import { toQueryString } from "./params";

export function useCategories(params = {}, options = {}) {
  const { apiRequest } = useAuth();

  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => apiRequest(`/categories${toQueryString(params)}`),
    ...options,
  });
}

export function useCreateCategory() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => apiRequest("/categories", { method: "POST", body: payload }),
    onSuccess: async (category) => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      return category;
    },
  });
}

export function useUpdateCategory() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, payload }) =>
      apiRequest(`/categories/${categoryId}`, { method: "PUT", body: payload }),
    onSuccess: async (category) => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      return category;
    },
  });
}

export function useDeleteCategory() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId) => apiRequest(`/categories/${categoryId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      // Products carry a category reference, so refresh those lists too.
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
