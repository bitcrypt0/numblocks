import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse the NumberBlocks collection: filter by number-theory badge, polish stage, seal state, and id range.",
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
