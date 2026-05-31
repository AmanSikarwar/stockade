export const dashboardKeys = {
  all: ["dashboard"],
  metrics: (params = {}) => [...dashboardKeys.all, "metrics", params],
};

export const productKeys = {
  all: ["products"],
  detail: (productId) => [...productKeys.all, "detail", productId],
  lists: () => [...productKeys.all, "list"],
  list: (params = {}) => [...productKeys.lists(), params],
  movements: (productId, params = {}) => [...productKeys.detail(productId), "movements", params],
};

export const customerKeys = {
  all: ["customers"],
  detail: (customerId) => [...customerKeys.all, "detail", customerId],
  lists: () => [...customerKeys.all, "list"],
  list: (params = {}) => [...customerKeys.lists(), params],
};

export const orderKeys = {
  all: ["orders"],
  detail: (orderId) => [...orderKeys.all, "detail", orderId],
  lists: () => [...orderKeys.all, "list"],
  list: (params = {}) => [...orderKeys.lists(), params],
};

export const categoryKeys = {
  all: ["categories"],
  detail: (categoryId) => [...categoryKeys.all, "detail", categoryId],
  lists: () => [...categoryKeys.all, "list"],
  list: (params = {}) => [...categoryKeys.lists(), params],
};

export const reportKeys = {
  all: ["reports"],
  revenue: (params = {}) => [...reportKeys.all, "revenue", params],
  topProducts: (params = {}) => [...reportKeys.all, "top-products", params],
  salesByCustomer: (params = {}) => [...reportKeys.all, "sales-by-customer", params],
};
