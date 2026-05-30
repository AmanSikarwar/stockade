export const dashboardKeys = {
  all: ["dashboard"],
  metrics: (params = {}) => [...dashboardKeys.all, "metrics", params],
};

export const productKeys = {
  all: ["products"],
  detail: (productId) => [...productKeys.all, "detail", productId],
  lists: () => [...productKeys.all, "list"],
  list: (params = {}) => [...productKeys.lists(), params],
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
