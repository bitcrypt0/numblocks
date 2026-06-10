import { LogoMark } from "./Logo";
import { shortAddress } from "@/lib/format";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";

const ETHERSCAN = "https://etherscan.io/address";
const OPENSEA = "https://opensea.io/collection/numberblocks-v4";

/** Footer contract directory - addresses come from lib/web3/addresses.ts
 *  (generated from deployments/mainnet/, never hand-maintained). */
const CONTRACTS = [
  { label: "Core", address: MAINNET_ADDRESSES.core },
  { label: "UniBlocks", address: MAINNET_ADDRESSES.uniBlocks },
  { label: "Hook", address: MAINNET_ADDRESSES.hook },
  { label: "BlocksSale", address: MAINNET_ADDRESSES.blocksSale },
  { label: "LP Locker", address: MAINNET_ADDRESSES.lpLocker },
  { label: "SwapHelper", address: MAINNET_ADDRESSES.swapHelper },
] as const;

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-sunken pb-24 md:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink">
              <LogoMark size={28} />
              NumberBlocks
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              10,000 numbered blocks, fully on-chain, each backed by 1,000 uniBlocks and polished
              by Ethereum through six transformation stages.
            </p>
            <a
              href={OPENSEA}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-display text-sm font-bold text-brand underline-offset-4 hover:underline"
            >
              <svg width="16" height="16" viewBox="0 0 90 90" fill="currentColor" aria-hidden="true">
                <path d="M45 0C20.2 0 0 20.2 0 45s20.2 45 45 45 45-20.1 45-45S69.9 0 45 0ZM22.2 46.5l.2-.3 11.7-18.3c.2-.3.6-.2.7.1 2 4.4 3.7 9.9 2.9 13.3-.3 1.4-1.2 3.3-2.3 5-.1.3-.3.5-.4.8-.1.1-.2.2-.4.2H22.6c-.4 0-.6-.4-.4-.8Zm52.2 6.3c0 .2-.1.3-.3.4-1 .4-4.5 2.1-5.9 4.1-3.7 5.1-6.5 12.5-12.8 12.5H29.1c-9.3 0-16.9-7.6-16.9-17v-.3c0-.2.2-.4.5-.4H27c.3 0 .5.3.5.5-.1 1 .1 2 .5 2.9.9 1.8 2.7 2.9 4.6 2.9h7.2v-5.6h-7.1c-.4 0-.6-.4-.4-.7l.3-.4c.7-1 1.7-2.5 2.7-4.3.7-1.2 1.4-2.5 1.9-3.8.1-.2.2-.5.3-.7.1-.4.3-.8.4-1.1.1-.3.2-.6.2-.9.2-1 .3-2 .3-3.1 0-.4 0-.9-.1-1.3 0-.5-.1-.9-.1-1.4-.1-.4-.1-.8-.2-1.2-.1-.6-.3-1.2-.4-1.8l-.1-.3c-.1-.5-.3-.9-.4-1.4-.5-1.6-1-3.1-1.6-4.6-.2-.6-.4-1.1-.7-1.6-.3-.8-.7-1.5-1-2.2-.2-.3-.3-.6-.4-.9-.2-.3-.3-.7-.5-1-.1-.2-.2-.5-.3-.7l-1.1-2c-.2-.3.1-.6.4-.5l6.9 1.9h.1c.1 0 .1 0 .1.1l.9.2 1 .3.4.1V19.4c0-2 1.6-3.6 3.6-3.6 1 0 1.9.4 2.5 1.1.7.7 1.1 1.6 1.1 2.5v6.1l.7.2c.1 0 .1.1.2.1.2.1.4.3.7.5.2.2.5.4.8.6.6.5 1.3 1.1 2.1 1.8.2.2.4.3.6.5.9.9 2 2 3 3.2.3.3.6.7.9 1 .3.4.6.7.9 1.1.4.5.8 1 1.1 1.5.2.3.4.5.5.8.4.7.8 1.3 1.2 2 .2.3.3.7.5 1 .4 1 .8 2 1 3 .1.2.1.4.1.6v.1c.1.3.1.6.1 1 0 .9-.1 1.8-.4 2.7-.1.4-.2.7-.4 1.1-.1.4-.3.7-.5 1.1-.4.8-.8 1.7-1.3 2.4-.2.3-.4.6-.6.9-.2.3-.5.6-.7.9-.3.4-.6.8-.9 1.1-.3.4-.6.8-.9 1.1-.5.6-.9 1.1-1.4 1.6-.3.3-.6.7-.9 1-.3.3-.6.6-.9.9-.4.4-.8.8-1.1 1.1l-.8.7c-.1.1-.2.2-.4.2h-5.6v5.6h7c1.6 0 3.1-.6 4.3-1.6.4-.4 2.2-1.9 4.4-4.3.1-.1.2-.1.3-.2l11.3-3.3c.3-.1.6.2.6.5v2.4Z" />
              </svg>
              View the collection on OpenSea
            </a>
          </div>

          <nav aria-label="Contracts on Etherscan" className="min-w-[15rem]">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
              Contracts
            </h2>
            <ul className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1">
              {CONTRACTS.map((c) => (
                <li key={c.label}>
                  <a
                    href={`${ETHERSCAN}/${c.address}`}
                    target="_blank"
                    rel="noreferrer"
                    title={c.address}
                    className="group inline-flex min-h-8 items-baseline gap-2 text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                  >
                    <span className="font-semibold">{c.label}</span>
                    {/* Address fits beside the label from sm up; on phones the
                        label alone keeps the grid to three tight rows. */}
                    <span className="hidden whitespace-nowrap font-mono text-xs text-ink-faint group-hover:text-ink-soft sm:inline">
                      {shortAddress(c.address)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
