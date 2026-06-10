import type { Metadata } from "next";
import Link from "next/link";
import NumberBlock from "@/components/NumberBlock";
import TransformationStageBar from "@/components/TransformationStageBar";
import { BADGE_META } from "@/lib/art";
import { sampleBlock } from "@/lib/sampleBlocks";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const sample = sampleBlock(121);
  return (
    <div className="pt-10">
      <header className="max-w-2xl animate-rise-in">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          What NumberBlocks is
        </h1>
        <p className="mt-4 text-lg text-ink-soft">
          A fully on-chain numbered block, polished by Ethereum and stamped into a colourful
          specimen card. All art renders live from chain state — no IPFS, no API server. Calling
          tokenURI returns a complete data-URI JSON with the SVG embedded.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_minmax(280px,420px)]">
        <div className="space-y-12">
          <section aria-labelledby="about-backing">
            <h2 id="about-backing" className="font-display text-2xl font-bold text-ink">
              The backing rule
            </h2>
            <p className="mt-3 text-ink-soft">
              Two assets share one system. NumberBlocks (NB) is the ERC721 — the visual identity
              and collectible card. uniBlocks (UB) is the ERC20 that backs it.{" "}
              <strong className="text-ink">1 NB needs at least 1,000 UB as backing.</strong> A
              wallet holding 3 NBs needs 3,000 UB; anything above that is loose UB.
            </p>
            <p className="mt-3 text-ink-soft">
              Holding 1,000 UB does not create an NB by itself. New blocks mint only through two
              official paths: the BlocksSale phases and official pool buy swaps. When a protocol
              action leaves a wallet under-backed, cleanup burns the highest-id unsealed block
              until the rest are covered — and reverts rather than touch a sealed block.
            </p>
          </section>

          <section aria-labelledby="about-cycle">
            <h2 id="about-cycle" className="font-display text-2xl font-bold text-ink">
              The transformation cycle
            </h2>
            <p className="mt-3 text-ink-soft">
              Unsealed blocks earn one transformation point every six Ethereum blocks. Six stages,
              100 points each — a full cycle takes roughly twelve hours, then restarts.
            </p>
            <div className="card mt-5 p-5">
              <TransformationStageBar macroStage={4} transformationProgress={62} />
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
              <li><strong className="text-ink">RAW</strong> — solid block, single digit</li>
              <li><strong className="text-ink">SANDED</strong> — inner shadow added</li>
              <li><strong className="text-ink">POLISHED</strong> — top-left highlight</li>
              <li><strong className="text-ink">GLOSSY</strong> — per-block gradient fill</li>
              <li><strong className="text-ink">MIRROR</strong> — vertical reflection below</li>
              <li><strong className="text-ink">PRISM</strong> — chromatic-aberration digit</li>
            </ul>
          </section>

          <section aria-labelledby="about-sealing">
            <h2 id="about-sealing" className="font-display text-2xl font-bold text-ink">
              Sealing
            </h2>
            <p className="mt-3 text-ink-soft">
              Sealing freezes a block{"’"}s exact transformation state into a specimen card, marked by
              a thin gradient border inside the canvas edge. Sealed blocks are protected: any
              action that would leave one under-backed reverts. Unsealing is cheap and resumes the
              cycle exactly where it stopped — time spent sealed is never replayed.
            </p>
          </section>

          <section aria-labelledby="about-ranges">
            <h2 id="about-ranges" className="font-display text-2xl font-bold text-ink">
              Three id ranges
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-line-strong font-display text-ink">
                    <th scope="col" className="py-2 pr-4">Range</th>
                    <th scope="col" className="py-2 pr-4">Name</th>
                    <th scope="col" className="py-2">Minted by</th>
                  </tr>
                </thead>
                <tbody className="text-ink-soft">
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 font-mono tabular">#1 – #5,000</td>
                    <td className="py-2.5 pr-4 font-bold text-ink">Genesis Blocks</td>
                    <td className="py-2.5">Official pool buy swaps</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4 font-mono tabular">#5,001 – #10,000</td>
                    <td className="py-2.5 pr-4 font-bold text-ink">Sale Blocks</td>
                    <td className="py-2.5">BlocksSale, five paid phases</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-mono tabular">#10,001 +</td>
                    <td className="py-2.5 pr-4 font-bold text-ink">Reborn Blocks</td>
                    <td className="py-2.5">Pool buys, after a block burns via backing cleanup</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="about-pool">
            <h2 id="about-pool" className="font-display text-2xl font-bold text-ink">
              The official pool and its fees
            </h2>
            <p className="mt-3 text-ink-soft">
              UB trades against ETH in one official Uniswap v4 pool with the NumberBlocks hook
              installed. The combined protocol fee is{" "}
              <strong className="text-ink">1.0%</strong>: a 0.20% ETH team fee on buys, and a
              0.80% UB burn on every swap — buys and sells alike. The burn is deflationary; the
              team takes nothing on sells.
            </p>
            <p className="mt-3 text-ink-soft">
              Buys also mint: every full 1,000 UB of net output pair-mints a new NumberBlock to
              the buyer. A timed release schedule (20,000 UB at launch plus 10,000 UB per minute)
              paces how fast the pool can mint, so no single buyer drains the genesis band on day
              one.
            </p>
            <p className="mt-3 text-ink-soft">
              The pool{"’"}s first liquidity comes from a one-shot, owner-only seed mint of loose UB,
              paired with ETH and locked away in the LP locker — a lock the owner can extend but
              never shorten, with no emergency unlock.
            </p>
          </section>

          <section aria-labelledby="about-sets">
            <h2 id="about-sets" className="font-display text-2xl font-bold text-ink">
              Badges and resonance sets
            </h2>
            <p className="mt-3 text-ink-soft">
              Every id is classified on-chain against eight number-theory properties; each one
              stamps a badge on the art and a trait in the metadata.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {BADGE_META.map((b) => (
                <li
                  key={b.key}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-raised py-1 pl-1.5 pr-3 text-sm font-semibold text-ink"
                >
                  <span aria-hidden="true" className="block h-4 w-4 rounded-[5px]" style={{ backgroundColor: b.color }} />
                  {b.label}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-ink-soft">
              Hold a complete thematic set — a full decade, all primes under 100, all powers of
              two up to 8,192, all single-digit ids, or all palindromes up to 9,999 — and every
              member gains a cosmetic set seal. The seal appears and disappears with ownership,
              no action needed.
            </p>
          </section>
        </div>

        <aside className="animate-rise-in [animation-delay:120ms]">
          <div className="lg:sticky lg:top-24">
            <NumberBlock block={sample} />
            <p className="mt-3 text-center font-mono text-sm tabular text-ink-soft">
              #121 — palindrome, perfect square
            </p>
            <div className="card mt-6 p-5">
              <h2 className="font-display text-lg font-bold text-ink">Ready to start?</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Mint from the current sale phase, or buy UB in the pool once the sale closes.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/mint"
                  className="pressable inline-flex h-11 items-center rounded-block border border-transparent bg-brand px-5 font-display font-bold text-brand-ink"
                >
                  Mint
                </Link>
                <Link
                  href="/swap"
                  className="pressable inline-flex h-11 items-center rounded-block border border-line bg-raised px-5 font-display font-bold text-ink"
                >
                  Swap
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
