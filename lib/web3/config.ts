// `injected` comes from the wagmi root export (re-exported from
// @wagmi/core), NOT from "wagmi/connectors" - that barrel drags in every
// third-party connector (WalletConnect, Coinbase, porto, ...), which this
// project bans from the bundle.
import { http, fallback, createConfig, createStorage, cookieStorage, injected } from "wagmi";
import { mainnet } from "wagmi/chains";

/**
 * Mainnet-only wagmi config. The project ships straight to Ethereum mainnet
 * (root AGENTS.md section 11) - no testnet chain may ever appear here.
 *
 * Wallets: INJECTED ONLY (project-owner hard requirement). wagmi discovers
 * every installed extension via EIP-6963 (multiInjectedProviderDiscovery is
 * on by default), so multiple wallets surface as separate connectors and the
 * user picks one; the plain `injected()` connector is the window.ethereum
 * fallback for wallets that do not announce themselves. No WalletConnect,
 * no Coinbase SDK, no Web3Modal/ConnectKit, no relay/QR/deep-link path.
 *
 * Transports: the owner's Alchemy/Infura URL first (NEXT_PUBLIC_MAINNET_RPC_URL,
 * optional NEXT_PUBLIC_MAINNET_RPC_URL_2 spare), then public RPCs as fallback,
 * ranked so a dead primary fails over automatically.
 */

const PUBLIC_RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"];

function transports() {
  const primary = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  // Local mainnet-fork rehearsal: never fall back to live public RPCs, or
  // a transport hiccup would silently mix real-mainnet state into the fork.
  const isLocal = primary !== undefined && /^http:\/\/(127\.0\.0\.1|localhost)/.test(primary);
  const urls = [
    primary,
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL_2,
    ...(isLocal ? [] : PUBLIC_RPCS),
  ].filter((u): u is string => Boolean(u));
  return fallback(
    urls.map((url) => http(url, { batch: true })),
    { rank: false },
  );
}

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [injected()],
  transports: { [mainnet.id]: transports() },
  storage:
    typeof window === "undefined"
      ? createStorage({ storage: cookieStorage })
      : createStorage({ storage: window.localStorage }),
  ssr: true,
});

export const CHAIN = mainnet;
export const CONFIRMATIONS = 2;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
