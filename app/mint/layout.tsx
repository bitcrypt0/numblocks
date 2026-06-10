import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mint",
  description:
    "Mint NumberBlocks #5,001-10,000 across five paid phases. Every mint pairs 1,000 UB backing with the new block.",
};

export default function MintLayout({ children }: { children: React.ReactNode }) {
  return children;
}
