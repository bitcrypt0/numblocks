import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swap",
  description:
    "Buy and sell uniBlocks (UB) through the official Uniswap v4 pool. Every 1,000 UB of swap output mints a NumberBlock plus 1,000 freshly issued backing UB.",
};

export default function SwapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
