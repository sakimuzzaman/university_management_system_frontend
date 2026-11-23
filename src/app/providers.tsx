"use client";

import * as React from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import type { ApiErrorShape } from "@/lib/types";

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      // Toast every failed query (except silent ones and expired sessions).
      onError: (error, query) => {
        if (query.meta?.silent) return;
        const err = error as unknown as ApiErrorShape;
        if (err?.status === 401) return;
        toast.error(err?.message ?? "Failed to load data");
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = (error as unknown as ApiErrorShape)?.status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
