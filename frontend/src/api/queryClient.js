import { QueryCache, QueryClient } from "@tanstack/react-query";

import { notifyGlobal } from "../lib/notifier";

// Throttle global error toasts so a burst of failing queries (e.g. offline)
// surfaces a single notification rather than one per query.
let lastErrorToastAt = 0;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const now = Date.now();
      if (now - lastErrorToastAt < 4_000) return;
      lastErrorToastAt = now;
      notifyGlobal({
        tone: "danger",
        title: "Couldn’t load data",
        message: error?.message || "Check your connection and try again.",
      });
    },
  }),
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});
