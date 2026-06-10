"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ActionButton from "@/components/ActionButton";
import NumberBlock from "@/components/NumberBlock";
import RarityBadges from "@/components/RarityBadges";
import Web3Provider from "@/lib/web3/Web3Provider";
import { BADGE_META, STAGE_NAMES } from "@/lib/art";
import { classify, type Rarity } from "@/lib/numberTheory";
import { allMintedIds, useMintedRanges, useTokenPage } from "@/lib/hooks/useExploreTokens";

type SealFilter = "all" | "sealed" | "unsealed";
type RangeFilter = "all" | "Genesis" | "Sale" | "Reborn";

const PAGE_SIZE = 24;

function idRangeLabel(id: number): "Genesis" | "Sale" | "Reborn" {
  return id <= 5000 ? "Genesis" : id <= 10000 ? "Sale" : "Reborn";
}

function ExploreInner() {
  const [search, setSearch] = useState("");
  const [badge, setBadge] = useState<string>("all");
  const [stage, setStage] = useState<string>("all");
  const [seal, setSeal] = useState<SealFilter>("all");
  const [range, setRange] = useState<RangeFilter>("all");
  const [pages, setPages] = useState(1);

  const { ranges, isLoading: rangesLoading, isError } = useMintedRanges();

  const searched = search.trim();
  const searchedId = /^\d+$/.test(searched) ? Number.parseInt(searched, 10) : null;

  // Id-level filters (badge, range, search) narrow the candidate list before
  // any chain read; stage/seal filters apply to the loaded page below.
  const candidateIds = useMemo(() => {
    if (!ranges) return [];
    if (searchedId !== null && searchedId >= 1) return [searchedId];
    let ids = allMintedIds(ranges);
    if (range !== "all") ids = ids.filter((id) => idRangeLabel(id) === range);
    if (badge !== "all") ids = ids.filter((id) => classify(id)[badge as keyof Rarity]);
    return ids;
  }, [ranges, searchedId, range, badge]);

  const visibleIds = candidateIds.slice(0, pages * PAGE_SIZE);
  const { tokens, isLoading: pageLoading } = useTokenPage(visibleIds);

  const results = useMemo(
    () =>
      tokens.filter((t) => {
        if (t.burned) return false;
        if (stage !== "all" && STAGE_NAMES[t.macroStage - 1] !== stage) return false;
        if (seal === "sealed" && !t.sealed) return false;
        if (seal === "unsealed" && t.sealed) return false;
        return true;
      }),
    [tokens, stage, seal],
  );

  const hasMore = candidateIds.length > visibleIds.length;

  return (
    <>
      <section
        aria-label="Filters"
        className="card mt-8 grid animate-rise-in grid-cols-1 gap-4 p-5 [animation-delay:80ms] sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <label htmlFor="explore-search" className="block text-sm font-bold text-ink">
            Token id
          </label>
          <input
            id="explore-search"
            name="tokenId"
            autoComplete="off"
            inputMode="numeric"
            placeholder="e.g. 144"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPages(1);
            }}
            className="mt-1.5 h-11 w-full rounded-block border-2 border-line bg-raised px-3 font-mono tabular text-ink outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="explore-badge" className="block text-sm font-bold text-ink">
            Badge
          </label>
          <select
            id="explore-badge"
            value={badge}
            onChange={(e) => {
              setBadge(e.target.value);
              setPages(1);
            }}
            className="mt-1.5 h-11 w-full rounded-block border-2 border-line bg-raised px-3 text-ink outline-none focus:border-brand"
          >
            <option value="all">All badges</option>
            {BADGE_META.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="explore-stage" className="block text-sm font-bold text-ink">
            Polish stage
          </label>
          <select
            id="explore-stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-block border-2 border-line bg-raised px-3 text-ink outline-none focus:border-brand"
          >
            <option value="all">All stages</option>
            {STAGE_NAMES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="explore-seal" className="block text-sm font-bold text-ink">
            Seal state
          </label>
          <select
            id="explore-seal"
            value={seal}
            onChange={(e) => setSeal(e.target.value as SealFilter)}
            className="mt-1.5 h-11 w-full rounded-block border-2 border-line bg-raised px-3 text-ink outline-none focus:border-brand"
          >
            <option value="all">All</option>
            <option value="sealed">Sealed</option>
            <option value="unsealed">Unsealed</option>
          </select>
        </div>
        <div>
          <label htmlFor="explore-range" className="block text-sm font-bold text-ink">
            Id range
          </label>
          <select
            id="explore-range"
            value={range}
            onChange={(e) => {
              setRange(e.target.value as RangeFilter);
              setPages(1);
            }}
            className="mt-1.5 h-11 w-full rounded-block border-2 border-line bg-raised px-3 text-ink outline-none focus:border-brand"
          >
            <option value="all">All ranges</option>
            <option value="Genesis">Genesis #1–5,000</option>
            <option value="Sale">Sale #5,001–10,000</option>
            <option value="Reborn">Reborn #10,001+</option>
          </select>
        </div>
      </section>

      {isError ? (
        <p role="alert" className="mt-8 rounded-block bg-danger-soft p-6 text-sm font-semibold text-danger">
          Could not load the collection from Ethereum. Check your connection and reload.
        </p>
      ) : rangesLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading collection">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card aspect-square animate-pulse bg-sunken" />
          ))}
        </div>
      ) : (
        <>
          <p className="mt-4 font-mono text-sm tabular text-ink-soft" role="status">
            {candidateIds.length.toLocaleString("en-US")} block{candidateIds.length === 1 ? "" : "s"} minted
            {searchedId !== null ? ` matching id ${searchedId}` : ""}
            {results.length !== visibleIds.length ? ` — showing ${results.length} after filters` : ""}
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((t, i) => (
              <li key={t.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <Link
                  href={`/block/${t.id}`}
                  className="group block rounded-card transition-transform duration-move ease-pop hover:-translate-y-1.5"
                >
                  <NumberBlock
                    block={{
                      id: t.id,
                      seedHash: t.seedHash,
                      macroStage: t.macroStage,
                      transformationProgress: t.transformationProgress,
                      sealed: t.sealed,
                      resonanceSeal: null,
                    }}
                    interactive={false}
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <span className="font-mono text-sm font-bold tabular text-ink">#{t.id}</span>
                    <RarityBadges rarity={classify(t.id)} variant="dots" />
                  </div>
                  <p className="px-1 font-mono text-xs tabular text-ink-faint">
                    {STAGE_NAMES[t.macroStage - 1]}
                    {t.sealed ? " — sealed" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {pageLoading ? (
            <p className="mt-6 text-center font-mono text-sm text-ink-faint" role="status">
              Loading blocks…
            </p>
          ) : null}

          {results.length === 0 && !pageLoading ? (
            <p className="mt-8 rounded-block bg-sunken p-8 text-center text-ink-soft">
              {candidateIds.length === 0
                ? "Nothing minted in this slice of the collection yet."
                : "No blocks match these filters. Clear one and try again."}
            </p>
          ) : null}

          {hasMore ? (
            <div className="mt-8 text-center">
              <ActionButton variant="ghost" onClick={() => setPages((p) => p + 1)} disabled={pageLoading}>
                Load {Math.min(PAGE_SIZE, candidateIds.length - visibleIds.length)} more
              </ActionButton>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

export default function ExploreLive() {
  return (
    <Web3Provider>
      <ExploreInner />
    </Web3Provider>
  );
}
