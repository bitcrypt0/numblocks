"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import ActionButton from "@/components/ActionButton";
import ReleaseCapacityMeter from "@/components/ReleaseCapacityMeter";
import ConnectGate from "@/components/wallet/ConnectGate";
import Web3Provider from "@/lib/web3/Web3Provider";
import { formatETH, formatUB, parseEtherish } from "@/lib/format";
import { useIsDelegatedAccount, useSwap } from "@/lib/hooks/useSwap";
import { BACKING_UNIT, useMyNBs, type BackingHealth } from "@/lib/hooks/useMyNBs";

type Direction = "buy" | "sell";

interface SellPreflight {
  /** Core.beforeUBSell would revert SealedUnderBacked. */
  blocked: boolean;
  /** Unsealed NBs backing cleanup would burn if the sell goes through. */
  burns: number;
}

/**
 * Mirrors the EXACT on-chain sell pre-flight: SwapHelper.sellUB pulls ubIn
 * from the seller BEFORE the hook calls Core.beforeUBSell(seller, ubIn),
 * which subtracts ubIn from the already-reduced balance. Coverage is
 * therefore evaluated at (balance - 2 * ubIn), clamped at zero - both for
 * the sealed-backing revert and for how many unsealed NBs cleanup burns.
 * The UI must warn with the contract's arithmetic, not the naive one.
 */
function sellPreflight(ubIn: bigint, health: BackingHealth): SellPreflight {
  const pulled = health.ubBalance >= ubIn ? health.ubBalance - ubIn : 0n;
  const after = pulled >= ubIn ? pulled - ubIn : 0n;
  const sealedNeed = BigInt(health.sealedCount) * BACKING_UNIT;
  if (after < sealedNeed) return { blocked: true, burns: 0 };
  const covered = Number(after / BACKING_UNIT);
  const unsealed = health.nbCount - health.sealedCount;
  return { blocked: false, burns: Math.max(0, Math.min(unsealed, health.nbCount - covered)) };
}

function SwapInner() {
  const { isConnected } = useAccount();
  const swap = useSwap();
  const { health } = useMyNBs();
  const { isDelegated, checked } = useIsDelegatedAccount();
  const [direction, setDirection] = useState<Direction>("buy");
  const [amount, setAmount] = useState("0.01");

  const parsed = parseEtherish(amount);
  const buy = direction === "buy" && parsed !== null ? swap.quoteBuy(parsed) : null;
  const sell = direction === "sell" && parsed !== null ? swap.quoteSell(parsed) : null;
  const busy = swap.tx.busy;

  // F-MED-2 (c): block sells (never buys) for EIP-7702-delegated wallets.
  const sellBlocked = direction === "sell" && isConnected && (isDelegated || !checked);
  const preflight =
    direction === "sell" && parsed !== null && isConnected ? sellPreflight(parsed, health) : null;
  const needsApproval =
    direction === "sell" && parsed !== null && swap.state !== null && swap.state.allowance < parsed;
  const insufficientUB =
    direction === "sell" && parsed !== null && swap.state !== null && swap.state.ubBalance < parsed;

  if (swap.isLoading) {
    return (
      <div className="card mt-10 animate-pulse p-8" role="status" aria-label="Loading pool state">
        <div className="h-6 w-40 rounded bg-sunken" />
        <div className="mt-4 h-24 rounded bg-sunken" />
      </div>
    );
  }
  if (swap.isError || !swap.state) {
    return (
      <p role="alert" className="mt-10 rounded-block bg-danger-soft p-6 text-sm font-semibold text-danger">
        Could not load the pool state from Ethereum. Check your connection and reload.
      </p>
    );
  }

  const poolDown = swap.poolInitialized === false;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_minmax(280px,420px)]">
      <section aria-labelledby="swap-panel-heading" className="card animate-rise-in p-6 [animation-delay:80ms] sm:p-8">
        <h2 id="swap-panel-heading" className="sr-only">
          Swap panel
        </h2>

        {poolDown ? (
          <p role="alert" className="mb-6 rounded-block bg-warn-soft p-4 text-sm font-semibold text-warn">
            The official pool is not initialized yet. Swaps open once the owner seeds liquidity.
          </p>
        ) : null}

        <div role="group" aria-label="Swap direction" className="inline-flex rounded-block border border-line bg-sunken p-1">
          {(["buy", "sell"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => {
                setDirection(d);
                setAmount(d === "buy" ? "0.01" : "1000");
              }}
              className={`h-11 rounded-[10px] px-6 font-display font-bold capitalize transition-colors duration-tap ${
                direction === d ? "bg-raised text-ink shadow-press-sm" : "text-ink-soft"
              }`}
            >
              {d === "buy" ? "Buy UB" : "Sell UB"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label htmlFor="swap-amount" className="font-display font-bold text-ink">
            {direction === "buy" ? "ETH in" : "UB in"}
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-block border-2 border-line bg-raised px-4 focus-within:border-brand">
            <input
              id="swap-amount"
              name="amount"
              autoComplete="off"
              spellCheck={false}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-14 w-full bg-transparent font-mono text-2xl font-bold tabular text-ink outline-none"
              aria-describedby="swap-amount-help"
            />
            <span className="font-display font-bold text-ink-faint">{direction === "buy" ? "ETH" : "UB"}</span>
          </div>
          <p id="swap-amount-help" className="mt-2 text-sm text-ink-soft">
            {direction === "buy"
              ? "Estimated from the live pool price; the on-chain minimum-out protects you from drift."
              : isConnected
                ? `Your balance: ${formatUB(swap.state.ubBalance)}. Selling below your sealed-block requirement reverts.`
                : "Connect to see your UB balance."}
          </p>
        </div>

        {/* Fee breakdown - D-24: 1.0% total = 0.20% team (buys only) + 0.80% UB burn.
            Rates rendered from chain reads (FEE_TEAM_BPS / FEE_BURN_BPS). */}
        {buy ? (
          <dl className="mt-6 space-y-2 rounded-block bg-sunken p-4 font-mono text-sm tabular">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Team fee ({bpsPct(swap.state.feeTeamBps)} of ETH)</dt>
              <dd className="font-bold text-ink">{formatETH(buy.teamFeeEth, 6)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Gross UB out (est.)</dt>
              <dd className="font-bold text-ink">{formatUB(buy.grossUBOut)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">UB burned ({bpsPct(swap.state.feeBurnBps)})</dt>
              <dd className="font-bold text-danger">-{formatUB(buy.burnUB)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-2">
              <dt className="font-bold text-ink">Net UB to you (est.)</dt>
              <dd className="font-bold text-positive">{formatUB(buy.netUB)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-ink">New NumberBlocks</dt>
              <dd className="font-bold text-brand">{buy.nbMinted}</dd>
            </div>
          </dl>
        ) : null}
        {sell ? (
          <dl className="mt-6 space-y-2 rounded-block bg-sunken p-4 font-mono text-sm tabular">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">UB burned pre-swap ({bpsPct(swap.state.feeBurnBps)})</dt>
              <dd className="font-bold text-danger">-{formatUB(sell.burnUB)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">UB swapped</dt>
              <dd className="font-bold text-ink">{formatUB(sell.swappedUB)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-2">
              <dt className="font-bold text-ink">ETH to you (est.)</dt>
              <dd className="font-bold text-positive">{formatETH(sell.ethOut, 6)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Team fee on sells</dt>
              <dd className="font-bold text-ink">None</dd>
            </div>
          </dl>
        ) : null}
        {parsed === null ? (
          <p role="alert" className="mt-6 rounded-block bg-danger-soft p-4 text-sm font-semibold text-danger">
            Enter a positive number, like 0.5 or 1000.
          </p>
        ) : null}
        {buy?.exceedsRelease ? (
          <p role="alert" className="mt-3 rounded-block bg-warn-soft p-4 text-sm font-semibold text-warn">
            This buy exceeds the currently released capacity and would revert. Wait for the next
            release tick or buy less.
          </p>
        ) : null}
        {buy?.exceedsMintCap ? (
          <p role="alert" className="mt-3 rounded-block bg-warn-soft p-4 text-sm font-semibold text-warn">
            This buy would exceed the {swap.state.maxNBMintsPerSwap}-NB per-swap mint limit and
            revert. Split it into smaller buys.
          </p>
        ) : null}

        {preflight?.blocked ? (
          <p role="alert" className="mt-3 rounded-block bg-danger-soft p-4 text-sm font-semibold text-danger">
            This sell would leave your sealed blocks under-backed and revert on-chain. The
            pre-flight reserves the sale amount twice while the swap is in flight, so keep at
            least 1,000 UB per sealed block plus twice the amount you are selling - or unseal
            first, or sell less.
          </p>
        ) : null}
        {preflight && !preflight.blocked && preflight.burns > 0 ? (
          <p role="alert" className="mt-3 rounded-block bg-warn-soft p-4 text-sm font-semibold text-warn">
            Heads up: this sell triggers backing cleanup and will burn{" "}
            {preflight.burns} unsealed block{preflight.burns === 1 ? "" : "s"} (highest ids
            first). Sealed blocks are never touched. Sell less to keep them.
          </p>
        ) : null}

        {/* F-MED-2 (c): non-dismissable EIP-7702 seller warning. */}
        {direction === "sell" && isConnected && isDelegated ? (
          <div
            role="alert"
            className="mt-6 rounded-block border-2 border-danger bg-danger-soft p-4 text-sm font-semibold text-danger"
          >
            <p className="font-display text-base font-bold">Selling is blocked for this wallet</p>
            <p className="mt-2">
              Your address has EIP-7702 delegate code installed. Sell proceeds are paid out as a
              plain ETH transfer, and your delegate code runs on receipt - if it rejects bare ETH,
              the whole sell reverts. To protect you, the sell button is disabled for delegated
              wallets.
            </p>
            <p className="mt-2">
              Route the sale through an address with no code instead: a cold wallet or a fresh
              standard wallet address. Transfer your UB there, then sell. Buys are unaffected and
              remain available from this wallet.
            </p>
          </div>
        ) : null}

        <ConnectGate title="Connect to swap">
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              Total protocol fee: {bpsPct(swap.state.feeTeamBps + swap.state.feeBurnBps)} -{" "}
              {bpsPct(swap.state.feeTeamBps)} ETH to the team on buys, {bpsPct(swap.state.feeBurnBps)}{" "}
              UB burned on every swap. The pool{"’"}s 0.30% LP fee is separate.
            </p>
            {direction === "sell" && needsApproval && !sellBlocked ? (
              <ActionButton
                size="lg"
                disabled={busy || parsed === null || insufficientUB || poolDown}
                onClick={() => parsed !== null && void swap.approve(parsed)}
              >
                {busy ? "Approving…" : "Step 1 of 2: Approve UB"}
              </ActionButton>
            ) : (
              <ActionButton
                size="lg"
                disabled={
                  busy ||
                  parsed === null ||
                  poolDown ||
                  (direction === "buy" && (buy === null || buy.exceedsRelease || buy.exceedsMintCap)) ||
                  (direction === "sell" &&
                    (sellBlocked || sell === null || insufficientUB || preflight?.blocked === true))
                }
                onClick={() => {
                  if (direction === "buy" && buy) void swap.buy(buy.ethIn, buy.minUBOut);
                  if (direction === "sell" && sell) void swap.sell(sell.ubIn, sell.minEthOut);
                }}
              >
                {busy
                  ? swap.tx.state.status === "awaiting-signature"
                    ? "Confirm in wallet…"
                    : "Swapping…"
                  : direction === "buy"
                    ? "Buy UB"
                    : needsApproval
                      ? "Step 2 of 2: Sell UB"
                      : "Sell UB"}
              </ActionButton>
            )}
          </div>
          {insufficientUB ? (
            <p className="mt-3 rounded-block bg-danger-soft p-3 text-sm font-semibold text-danger">
              That is more UB than this wallet holds.
            </p>
          ) : null}
        </ConnectGate>

        {direction === "sell" && !(isConnected && isDelegated) ? (
          <p className="mt-4 rounded-block bg-sunken p-4 text-sm text-ink-soft">
            Heads up: if your wallet uses an EIP-7702 delegate that rejects plain ETH transfers,
            selling will fail. Use a standard address to receive ETH.
          </p>
        ) : null}
      </section>

      <div className="flex animate-rise-in flex-col gap-6 [animation-delay:140ms]">
        <ReleaseCapacityMeter
          hookStartTime={swap.state.hookStartTime}
          cumulativeConsumedUB={swap.state.cumulativeConsumedUB}
        />
        {isConnected ? (
          <section aria-labelledby="backing-note-heading" className="card p-5">
            <h2 id="backing-note-heading" className="font-display text-lg font-bold text-ink">
              Backing check
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              You hold {health.nbCount} NBs ({health.sealedCount} sealed) against{" "}
              {formatUB(health.ubBalance)}. A sell that drops you below 1,000 UB per sealed block
              reverts; unsealed blocks are burned by cleanup instead.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function bpsPct(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}

export default function SwapLive() {
  return (
    <Web3Provider>
      <SwapInner />
    </Web3Provider>
  );
}
