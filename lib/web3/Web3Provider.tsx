"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./config";

/**
 * Module-level singletons: wagmi state lives in `wagmiConfig`'s store (and
 * localStorage), not in React, so several Web3Provider instances mounted on
 * one page share one connection. That lets every web3-interactive island be
 * code-split behind next/dynamic without putting wagmi+viem in the shared
 * layout bundle (the 200KB landing-page budget).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 6_000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
