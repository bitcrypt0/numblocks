import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = Number.parseInt(params.id, 10);
  const valid = Number.isInteger(id) && id >= 1;
  const title = valid ? `NumberBlock #${id}` : "Block not found";
  return {
    title,
    description: valid
      ? `NumberBlock #${id} - a fully on-chain numbered block, backed by 1,000 uniBlocks and polished by Ethereum.`
      : "Token ids run from #1 upward.",
  };
}

export default function BlockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
