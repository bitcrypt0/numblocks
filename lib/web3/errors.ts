import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  decodeErrorResult,
  type Hex,
} from "viem";
import {
  blocksSaleAbi,
  numberBlocksCoreAbi,
  numberBlocksHookAbi,
  numberBlocksV4LpPositionLockerAbi,
  swapHelperAbi,
  uniBlocksAbi,
} from "./abis";

/**
 * Every `NB_SALE:` / `NB_HOOK:` require-string in contracts/ mapped to a
 * sentence a collector can act on. Inventory source: grep of
 * contracts/sale/BlocksSale.sol and contracts/v4/NumberBlocksHook.sol -
 * keep in sync when a contract adds a string.
 */
const REASON_STRINGS: Record<string, string> = {
  // BlocksSale
  "NB_SALE: NOT_EOA": "Mints are wallet-only. Call from a regular wallet address, not a contract.",
  "NB_SALE: HAS_CODE":
    "Your address carries EIP-7702 delegate code, and the sale only accepts plain wallet addresses. Mint from an address with no code installed.",
  "NB_SALE: NOT_OPEN": "The sale has not opened yet. Check back once the owner opens phase 1.",
  "NB_SALE: CLOSED": "The sale is permanently closed - all five phases sold out. New blocks now mint only through official pool buys.",
  "NB_SALE: BAD_COUNT": "Pick at least 1 block to mint.",
  "NB_SALE: NOT_PAID_PHASE": "No phase is currently selling.",
  "NB_SALE: PHASE_SUPPLY": "Not enough blocks left in this phase for that count. Mint fewer, or wait for the next phase.",
  "NB_SALE: WALLET_CAP": "That would exceed this phase's per-wallet cap. Mint fewer blocks.",
  "NB_SALE: INSUFFICIENT_ETH": "The ETH sent does not cover the mint price. Refresh the price and try again.",
  "NB_SALE: REFUND_FAILED": "Your overpayment refund could not be delivered, so the mint was rolled back. Send the exact amount instead.",
  "NB_SALE: ALREADY_OPEN": "The sale is already open - openSale can only run once.",
  "NB_SALE: PHASE_UNPRICED": "Every phase needs a non-zero price before the sale can open. Set all five phase prices first.",
  "NB_SALE: PHASE_NO_CAP": "Every phase needs a wallet cap of at least 1 before the sale can open. Set all five caps first.",
  "NB_SALE: BAD_PHASE": "Phase number must be between 1 and 5.",
  "NB_SALE: PHASE_STARTED": "This phase has already started selling - its price and cap are locked forever.",
  "NB_SALE: ZERO_PRICE": "Phase price must be above zero (a zero price would recreate the removed free phase).",
  "NB_SALE: BAD_CAP": "Wallet cap must be between 1 and 1,000.",
  "NB_SALE: ZERO_TO": "The withdrawal recipient cannot be the zero address.",
  "NB_SALE: INSUFFICIENT_BALANCE": "The sale contract holds less ETH than that. Withdraw a smaller amount.",
  "NB_SALE: WITHDRAW_FAILED": "The recipient rejected the ETH transfer. Use a plain wallet address.",
  "NB_SALE: ZERO_OWNER": "Owner address cannot be zero.",
  "NB_SALE: ZERO_CORE": "Core address cannot be zero.",
  // Hook
  "NB_HOOK: KEY_MISMATCH": "This swap does not target the official NumberBlocks pool.",
  "NB_HOOK: NOT_OFFICIAL_HELPER": "Only the official SwapHelper can route swaps through this pool. Use this site's swap page.",
  "NB_HOOK: RELEASE_CAP_EXCEEDED":
    "This buy is larger than the UB released so far. The schedule releases 10,000 UB per minute - wait for the next tick or buy less.",
  "NB_HOOK: MINT_COUNT_TOO_LARGE": "This buy would mint more NumberBlocks in one swap than the per-swap limit allows. Split it into smaller buys.",
  "NB_HOOK: SEALED_UNDER_BACKED":
    "Selling that much UB would leave your sealed blocks under-backed. Unseal first, or sell less - sealed blocks are never auto-burned.",
  "NB_HOOK: CONFIG_FROZEN": "The hook configuration is frozen - this setting is permanent now.",
  "NB_HOOK: TREASURY_HAS_CODE":
    "The treasury must be a plain wallet address with no code (no smart account, no EIP-7702 delegate), or every buy would brick once frozen.",
  "NB_HOOK: ZERO_OWNER": "Owner address cannot be zero.",
};

/** Solidity custom errors (errorName from the ABI) across all 8 contracts. */
const CUSTOM_ERRORS: Record<string, string> = {
  // SwapHelper
  InsufficientUBOut: "Price moved - the swap would deliver less UB than your minimum. Refresh the quote and try again.",
  InsufficientEthOut: "Price moved - the swap would deliver less ETH than your minimum. Refresh the quote and try again.",
  EthTransferFailed:
    "Your address rejected the ETH payout - this happens when an EIP-7702 delegate or contract wallet refuses plain transfers. Sell from a regular wallet address.",
  UnexpectedNativeRefund: "The pool returned an unexpected ETH refund. Try again.",
  InvalidPoolKey: "The helper is not wired to the official pool.",
  ZeroInput: "Enter an amount above zero.",
  NotPoolManager: "Unauthorized caller.",
  // Core
  NotAuthorized: "Only the protocol contracts may call this.",
  UBNotSet: "Core is not wired to the UB token yet.",
  UBAlreadySet: "The UB token address is already set and cannot change.",
  BlocksSaleAlreadySet: "The BlocksSale address is already set and cannot change.",
  HookAlreadySet: "The hook address is already set and cannot change.",
  MetadataNotSet: "Core has no metadata contract wired yet.",
  RendererFrozenError: "The renderer pointer is frozen - it can never change again.",
  MetadataFrozenError: "The metadata pointer is frozen - it can never change again.",
  SkipNFTFrozenError: "The skipNFT list is frozen - it can never change again.",
  SkipNFTTargetHoldsNB: "That address currently holds NumberBlocks, so it cannot be added to the skipNFT list.",
  SkipNFTTarget: "That address is on the skipNFT list and can never hold a NumberBlock.",
  ZeroAddress: "The zero address is not allowed here.",
  CountZero: "Amount must be above zero.",
  TokenNotFound: "That block does not exist (or was burned).",
  NotOwner: "You do not own that block.",
  AlreadySealed: "That block is already sealed.",
  NotSealed: "That block is not sealed.",
  ActiveSupplyExceeded: "The 10,000 active-supply cap has been reached.",
  SaleRangeExhausted: "The sale ID range (#5001-#10000) is exhausted.",
  SealedUnderBacked: "That would leave a sealed block under-backed. Unseal first, or keep at least 1,000 UB per sealed block.",
  RoyaltyTooHigh: "Royalty cannot exceed 1,000 basis points (10%).",
  SeedAlreadyMinted: "The one-shot liquidity seed has already been minted - there is no second mint, ever.",
  // UniBlocks
  NotCore: "Only the Core contract may call this.",
  CoreNotSet: "The UB token has no Core wired yet.",
  CoreLinkAlreadyFrozen: "The Core link is frozen and cannot change.",
  // LP locker
  WrongPositionManager: "That NFT is not a v4 position from the official position manager.",
  InvalidLockDuration: "Lock duration is out of range.",
  NotLocked: "No locked position found.",
  AlreadyLocked: "A position is already locked.",
  StillLocked: "The LP position is still locked - wait for the unlock time.",
  // OpenZeppelin
  OwnableUnauthorizedAccount: "This action is owner-only, and the connected wallet is not the owner.",
  ERC20InsufficientBalance: "Your UB balance is too low for that amount.",
  ERC20InsufficientAllowance: "The helper's UB allowance is too low. Approve UB spending first.",
  ERC721InsufficientApproval: "You have not approved this transfer.",
  ERC721InvalidReceiver: "The recipient cannot receive NFTs.",
  EnforcedPause: "The contract is paused.",
};

/**
 * Merged error ABI across the protocol contracts plus the v4 PoolManager's
 * WrappedError, which wraps every hook revert. Lets the parser decode raw
 * revert bytes that the call-site ABI alone cannot name (e.g. a Core custom
 * error surfacing through SwapHelper.sellUB).
 */
const WRAPPED_ERROR_ABI = [
  {
    type: "error",
    name: "WrappedError",
    inputs: [
      { name: "target", type: "address" },
      { name: "selector", type: "bytes4" },
      { name: "reason", type: "bytes" },
      { name: "details", type: "bytes" },
    ],
  },
] as const;

const MERGED_ERROR_ABI = [
  ...WRAPPED_ERROR_ABI,
  ...numberBlocksCoreAbi.filter((x) => x.type === "error"),
  ...uniBlocksAbi.filter((x) => x.type === "error"),
  ...blocksSaleAbi.filter((x) => x.type === "error"),
  ...numberBlocksHookAbi.filter((x) => x.type === "error"),
  ...swapHelperAbi.filter((x) => x.type === "error"),
  ...numberBlocksV4LpPositionLockerAbi.filter((x) => x.type === "error"),
];

/** Decode raw revert bytes, unwrapping nested v4 WrappedError layers. */
function decodeRawRevert(data: Hex, depth = 0): { name?: string; reason?: string } {
  if (depth > 3 || !data || data === "0x") return {};
  try {
    const decoded = decodeErrorResult({ abi: MERGED_ERROR_ABI, data }) as {
      errorName: string;
      args?: readonly unknown[];
    };
    if (decoded.errorName === "WrappedError") {
      const inner = decoded.args?.[2] as Hex | undefined;
      const innerDecoded = inner ? decodeRawRevert(inner, depth + 1) : {};
      return innerDecoded.name || innerDecoded.reason ? innerDecoded : { name: "WrappedError" };
    }
    if (decoded.errorName === "Error") {
      return { reason: String(decoded.args?.[0] ?? "") };
    }
    return { name: decoded.errorName };
  } catch {
    return {};
  }
}

export interface ParsedTxError {
  message: string;
  /** True when nothing matched and the generic fallback was used. */
  fellThrough: boolean;
  /** The raw revert reason / error name, when one was recoverable. */
  raw?: string;
}

export function parseTxError(error: unknown): ParsedTxError {
  if (error instanceof BaseError) {
    const rejected = error.walk((e) => e instanceof UserRejectedRequestError);
    if (rejected) {
      return { message: "You declined the request in your wallet.", fellThrough: false, raw: "UserRejected" };
    }
    const funds = error.walk((e) => e instanceof InsufficientFundsError);
    if (funds) {
      return { message: "Not enough ETH in your wallet to cover this transaction plus gas.", fellThrough: false, raw: "InsufficientFunds" };
    }
    const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      let reason = revert.reason;
      let name = revert.data?.errorName;
      if (!reason && !name && revert.raw) {
        // The call-site ABI could not decode the revert (e.g. a Core error
        // wrapped by the PoolManager) - decode against the merged ABI.
        const deep = decodeRawRevert(revert.raw);
        reason = deep.reason ?? reason;
        name = deep.name ?? name;
      }
      const reasonMessage = reason ? REASON_STRINGS[reason] : undefined;
      if (reason && reasonMessage) {
        return { message: reasonMessage, fellThrough: false, raw: reason };
      }
      const nameMessage = name ? CUSTOM_ERRORS[name] : undefined;
      if (name && nameMessage) {
        return { message: nameMessage, fellThrough: false, raw: name };
      }
      const raw = reason ?? name;
      if (raw) {
        // A revert we can name but have no copy for - surface it verbatim so
        // it is debuggable, and tag it for the fell-through report.
        console.warn(`[nb-tx] unmapped revert: ${raw}`);
        return { message: `Transaction reverted: ${raw}`, fellThrough: true, raw };
      }
    }
    return { message: error.shortMessage || "Transaction failed.", fellThrough: true };
  }
  if (error instanceof Error) {
    return { message: error.message || "Transaction failed.", fellThrough: true };
  }
  return { message: "Transaction failed.", fellThrough: true };
}
