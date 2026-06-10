import { formatUB, shortAddress } from "@/lib/format";
import type { ProtocolStatus } from "@/lib/hooks/useProtocolStatus";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";

/** Read-only protocol status: addresses, frozen flags, supplies, phase. */
export default function StatusPanel({
  status,
  currentPhase,
}: {
  status: ProtocolStatus;
  currentPhase: number;
}) {
  const flags = [
    { label: "Hook config", frozen: status.hookConfigFrozen },
    { label: "Renderer", frozen: status.rendererFrozen },
    { label: "Metadata", frozen: status.metadataFrozen },
    { label: "skipNFT list", frozen: status.skipNFTFrozen },
  ];

  return (
    <section aria-labelledby="status-heading" className="card p-6">
      <h2 id="status-heading" className="font-display text-2xl font-bold text-ink">
        Protocol status
      </h2>
      <p className="mt-2 text-sm text-ink-soft">Read live from Ethereum mainnet.</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Active supply</dt>
          <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">
            {status.activeSupply.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Ever minted</dt>
          <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">
            {status.totalEverMinted.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">UB total supply</dt>
          <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">{formatUB(status.ubTotalSupply)}</dd>
        </div>
        <div className="rounded-block bg-sunken p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Current phase</dt>
          <dd className="mt-1 font-mono text-lg font-bold tabular text-ink">
            {currentPhase === 0 ? "not open" : `${currentPhase} of 5`}
          </dd>
        </div>
      </dl>

      <h3 className="mt-6 font-display text-base font-bold text-ink">Freeze flags</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {flags.map((f) => (
          <li
            key={f.label}
            className={`rounded-full px-3 py-1.5 font-display text-sm font-bold ${
              f.frozen ? "bg-sunken text-ink-faint" : "bg-warn-soft text-warn"
            }`}
          >
            {f.label}: {f.frozen ? "frozen" : "hot"}
          </li>
        ))}
        <li
          className={`rounded-full px-3 py-1.5 font-display text-sm font-bold ${
            status.seedMinted ? "bg-positive-soft text-positive" : "bg-warn-soft text-warn"
          }`}
        >
          Seed mint: {status.seedMinted ? "spent" : "available"}
        </li>
      </ul>

      <h3 className="mt-6 font-display text-base font-bold text-ink">Contract addresses</h3>
      <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {Object.entries(MAINNET_ADDRESSES).map(([name, addr]) => (
          <div key={name} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
            <dt className="text-sm font-semibold capitalize text-ink-soft">{name.replace(/([A-Z])/g, " $1")}</dt>
            <dd className="font-mono text-sm text-ink" title={addr}>
              {shortAddress(addr)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
