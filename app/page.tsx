"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ActionButton from "@/components/ActionButton";
import NumberBlock from "@/components/NumberBlock";
import RarityBadges from "@/components/RarityBadges";
import { BADGE_META, badgeSVG, STAGE_NAMES } from "@/lib/art";
import { classify } from "@/lib/numberTheory";
import { sampleBlock } from "@/lib/sampleBlocks";

const HERO_IDS = [144, 1024, 7, 121, 9801, 42];

export default function HomePage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    // Let the page settle visually before the carousel starts (keeps the
    // first impression calm and the Speed Index honest), then rotate gently.
    let interval: number | undefined;
    const first = window.setTimeout(() => {
      setHeroIndex((i) => (i + 1) % HERO_IDS.length);
      interval = window.setInterval(() => setHeroIndex((i) => (i + 1) % HERO_IDS.length), 7000);
    }, 14_000);
    return () => {
      window.clearTimeout(first);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const hero = sampleBlock(HERO_IDS[heroIndex] ?? 144);

  return (
    <div>
      {/* Hero */}
      <section className="grid items-center gap-10 pt-10 sm:pt-16 md:grid-cols-2">
        <div className="animate-rise-in">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-raised px-4 py-1.5 font-mono text-sm text-ink-soft">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-positive" />
            Fully on-chain. No IPFS, no API server.
          </p>
          <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Numbered blocks,{" "}
            <span className="text-brand">polished by Ethereum.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            10,000 NumberBlocks, each backed by 1,000 uniBlocks. Every block transforms through
            six stages — RAW to PRISM — one tick every six Ethereum blocks. Seal one to freeze it
            into a specimen card.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/mint" className="contents">
              <ActionButton size="lg">Mint a block</ActionButton>
            </Link>
            <Link href="/explore" className="contents">
              <ActionButton size="lg" variant="ghost">
                Explore the collection
              </ActionButton>
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              { dt: "Backing", dd: "1,000 UB / NB" },
              { dt: "Swap fee", dd: "1.0% total" },
              { dt: "Stages", dd: "6, on-chain" },
            ].map((s) => (
              <div key={s.dt} className="rounded-block border border-line bg-raised p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{s.dt}</dt>
                <dd className="mt-1 font-mono text-sm font-bold tabular text-ink">{s.dd}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-rise-in [animation-delay:120ms]">
          <Link
            href={`/block/${hero.id}`}
            aria-label={`View NumberBlock ${hero.id}`}
            className="block rounded-plate transition-transform duration-move ease-pop hover:-translate-y-1"
          >
            <NumberBlock block={hero} className="mx-auto w-full max-w-md" />
          </Link>
          <div className="mx-auto mt-4 flex max-w-md items-center justify-between">
            <p className="font-mono text-sm tabular text-ink-soft">
              #{hero.id} — {STAGE_NAMES[hero.macroStage - 1]} {hero.transformationProgress}/100
            </p>
            <div className="flex gap-1.5" role="group" aria-label="Hero block selector">
              {HERO_IDS.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={i === heroIndex}
                  aria-label={`Show block ${id}`}
                  onClick={() => setHeroIndex(i)}
                  className={`h-3.5 w-3.5 rounded-[4px] transition-transform duration-tap ease-pop ${
                    i === heroIndex ? "scale-110 bg-brand" : "bg-line hover:bg-line-strong"
                  }`}
                />
              ))}
            </div>
          </div>
          {reduced ? null : (
            <p className="sr-only" aria-live="polite">
              Now showing NumberBlock {hero.id}
            </p>
          )}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mt-24">
        <h2 id="how-heading" className="font-display text-3xl font-extrabold tracking-tight text-ink">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="card p-6">
            <span className="chip-digit h-10 w-10 bg-brand text-lg text-brand-ink" aria-hidden="true">1</span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">Backed, always</h3>
            <p className="mt-2 text-ink-soft">
              Every NumberBlock needs 1,000 uniBlocks behind it, minted fresh the moment the
              block is. Spend the backing and the protocol{"’"}s cleanup burns the highest
              unsealed block in the wallet. Sealed blocks are protected — actions that would
              under-back them revert.
            </p>
          </article>
          <article className="card p-6">
            <span className="chip-digit h-10 w-10 bg-accent text-lg text-accent-ink" aria-hidden="true">2</span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">Transformed by time</h3>
            <p className="mt-2 text-ink-soft">
              Unsealed blocks earn one transformation point every six Ethereum blocks, moving
              through RAW, SANDED, POLISHED, GLOSSY, MIRROR, and PRISM. Sealing freezes the
              current state into a specimen card; unsealing resumes exactly where it stopped.
            </p>
          </article>
          <article className="card p-6">
            <span className="chip-digit h-10 w-10 bg-ink text-lg text-bg" aria-hidden="true">3</span>
            <h3 className="mt-4 font-display text-xl font-bold text-ink">Mint Paths</h3>
            <p className="mt-2 text-ink-soft">
              Genesis blocks #1–5,000 mint from official pool buys — one per 1,000 UB of swap
              output, each pair-minting its own fresh backing. Sale blocks #5,001–10,000 mint
              through the five-phase BlocksSale. When a block burns via backing cleanup, a Reborn
              id (#10,001+) can mint later from the pool — new seed, new look.
            </p>
          </article>
        </div>
      </section>

      {/* Badge legend */}
      <section aria-labelledby="badges-heading" className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="badges-heading" className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Eight ways a number is special
          </h2>
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center font-semibold text-brand underline-offset-4 hover:underline"
          >
            Read the full guide
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every token id is classified on-chain. Each property stamps a badge on the art and a
          trait in the metadata.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGE_META.map((b) => (
            <li key={b.key} className="card flex items-start gap-3 p-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#0a0a0a] p-1.5 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: badgeSVG(b.key) }}
              />
              <div>
                <h3 className="font-display font-bold text-ink">{b.label}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{b.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Gallery teaser */}
      <section aria-labelledby="gallery-heading" className="mt-24">
        <h2 id="gallery-heading" className="sr-only">
          Sample blocks
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[16, 555, 2048, 10000].map((id) => {
            const b = sampleBlock(id);
            return (
              <Link
                key={id}
                href={`/block/${id}`}
                className="group block rounded-card transition-transform duration-move ease-pop hover:-translate-y-1.5"
              >
                <NumberBlock block={b} interactive={false} />
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="font-mono text-sm font-bold tabular text-ink">#{id}</span>
                  <RarityBadges rarity={classify(id)} variant="dots" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
