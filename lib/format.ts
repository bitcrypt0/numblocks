const WAD = 10n ** 18n;

export function formatUnits18(value: bigint, maxDecimals = 2): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / WAD;
  const frac = abs % WAD;
  let out = whole.toLocaleString("en-US");
  if (maxDecimals > 0 && frac > 0n) {
    const fracStr = frac.toString().padStart(18, "0").slice(0, maxDecimals).replace(/0+$/, "");
    if (fracStr.length > 0) out += `.${fracStr}`;
  }
  return negative ? `-${out}` : out;
}

export function formatUB(value: bigint): string {
  return `${formatUnits18(value)} UB`;
}

export function formatETH(wei: bigint, maxDecimals = 4): string {
  return `${formatUnits18(wei, maxDecimals)} ETH`;
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function parseEtherish(s: string): bigint | null {
  const m = s.trim().match(/^(\d+)(?:\.(\d{1,18}))?$/);
  if (!m) return null;
  const whole = BigInt(m[1] ?? "0");
  const fracRaw = m[2] ?? "";
  const frac = BigInt(fracRaw.padEnd(18, "0") || "0");
  return whole * WAD + frac;
}
