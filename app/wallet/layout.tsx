import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Blocks",
  description: "Your NumberBlocks: backing health, seal and unseal, transfers, and UB balance.",
  robots: { index: false },
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
