import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swap",
  description:
    "Buy and sell uniBlocks (UB) through the official Uniswap v4 pool. Every 1,000 UB of net buy output mints a fresh NumberBlock.",
};

export default function SwapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
