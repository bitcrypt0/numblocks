import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

/**
 * Server-side viem client for OG-image generation and metadata routes.
 * Prefers the server-only MAINNET_RPC_URL, falls back to the public
 * NEXT_PUBLIC_ vars and public RPCs - mainnet only.
 */
export function serverPublicClient() {
  const urls = [
    process.env.MAINNET_RPC_URL,
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL_2,
    "https://ethereum-rpc.publicnode.com",
    "https://eth.drpc.org",
  ].filter((u): u is string => Boolean(u));
  return createPublicClient({
    chain: mainnet,
    transport: fallback(urls.map((url) => http(url, { timeout: 8_000 }))),
  });
}
