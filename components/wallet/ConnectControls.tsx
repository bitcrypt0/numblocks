"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import ActionButton from "@/components/ActionButton";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CHAIN } from "@/lib/web3/config";
import { shortAddress } from "@/lib/format";

/**
 * Injected-wallet-only connect surface (EIP-6963 + window.ethereum fallback).
 *
 * States handled, per the owner's reliability bar:
 * - no injected provider at all -> "install a browser wallet" panel
 * - several injected wallets    -> EIP-6963 picker (never blind-grab
 *   window.ethereum when more than one wallet announced itself)
 * - connect / disconnect / reload-reconnect via wagmi's connector store;
 *   an explicit disconnect clears the stored connector, so the next load
 *   does NOT silently re-prompt
 * - accountsChanged / chainChanged / locked wallet are handled inside
 *   wagmi's injected connector (listeners are torn down on disconnect,
 *   so they never duplicate across reconnect cycles)
 * - wrong network -> inline banner with a one-click switch through the
 *   injected provider
 */
export default function ConnectControls() {
  const { address, status: accountStatus, chainId: accountChainId, connector } = useAccount();
  const appChainId = useChainId();
  const { connectors, connectAsync, status: connectStatus } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [available, setAvailable] = useState<Record<string, boolean>>({});

  // Probe each connector for a live provider so the picker can tell
  // "installed wallet" apart from the bare fallback connector when no
  // extension exists at all.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result: Record<string, boolean> = {};
      for (const c of connectors) {
        try {
          const provider = await c.getProvider();
          result[c.uid] = Boolean(provider);
        } catch {
          result[c.uid] = false;
        }
      }
      if (!cancelled) setAvailable(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [connectors]);

  const installed = useMemo(
    () => connectors.filter((c) => available[c.uid]),
    [connectors, available],
  );
  const probed = Object.keys(available).length > 0;
  const noWallet = probed && installed.length === 0;
  const wrongNetwork =
    accountStatus === "connected" && accountChainId !== undefined && accountChainId !== appChainId;

  async function handleConnect(uid: string) {
    const target = connectors.find((c) => c.uid === uid);
    if (!target) return;
    setConnectingId(uid);
    try {
      await connectAsync({ connector: target });
      setPickerOpen(false);
      toast("Wallet connected.", "success");
    } catch (error) {
      const message =
        error instanceof Error && /rejected|denied/i.test(error.message)
          ? "Connection request declined in the wallet."
          : "Could not connect. Unlock your wallet and try again.";
      toast(message, "danger");
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectAsync();
      toast("Wallet disconnected.", "info");
    } catch {
      toast("Disconnect failed - try again.", "danger");
    }
  }

  async function handleSwitch() {
    try {
      await switchChainAsync({ chainId: CHAIN.id });
    } catch {
      toast(`Could not switch - select ${CHAIN.name} inside your wallet.`, "danger");
    }
  }

  if (accountStatus === "connected" && address) {
    return (
      <div className="flex items-center gap-2">
        {wrongNetwork ? (
          <ActionButton size="sm" variant="danger" onClick={handleSwitch} disabled={switching}>
            {switching ? "Switching…" : `Switch to ${CHAIN.name}`}
          </ActionButton>
        ) : null}
        <button
          type="button"
          onClick={handleDisconnect}
          title={`${address}${connector ? ` via ${connector.name}` : ""} - click to disconnect`}
          className="group flex min-h-11 items-center gap-2 rounded-block border border-line bg-raised px-3 py-2 font-mono text-sm text-ink-soft hover:border-danger hover:text-danger"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${wrongNetwork ? "bg-danger" : "bg-positive"}`}
          />
          <span className="group-hover:hidden">{shortAddress(address)}</span>
          <span className="hidden group-hover:inline">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <ActionButton
        size="sm"
        onClick={() => {
          if (installed.length === 1) {
            void handleConnect(installed[0]!.uid);
          } else {
            setPickerOpen(true);
          }
        }}
        disabled={accountStatus === "reconnecting" || connectStatus === "pending"}
      >
        {accountStatus === "reconnecting" ? "Reconnecting…" : "Connect wallet"}
      </ActionButton>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Connect a wallet">
        {noWallet ? (
          <div>
            <p className="text-sm">
              No browser wallet detected. NumberBlocks connects to installed browser-extension
              wallets only - install one, then reload this page:
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                ["Rabby", "https://rabby.io"],
                ["MetaMask", "https://metamask.io"],
                ["Frame", "https://frame.sh"],
              ].map(([name, url]) => (
                <li key={name}>
                  <a className="font-bold text-brand underline-offset-4 hover:underline" href={url} target="_blank" rel="noreferrer">
                    {name}
                  </a>{" "}
                  <span className="font-mono text-xs text-ink-faint">{url}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <p className="text-sm text-ink-soft">
              {installed.length > 1
                ? "Several wallet extensions are installed - pick the one to use."
                : "Connect with your installed browser wallet."}
            </p>
            <ul className="mt-3 space-y-2">
              {(installed.length > 0 ? installed : connectors).map((c) => (
                <li key={c.uid}>
                  <button
                    type="button"
                    onClick={() => void handleConnect(c.uid)}
                    disabled={connectingId !== null}
                    className="flex min-h-12 w-full items-center gap-3 rounded-block border-2 border-line bg-raised px-4 py-2 font-display font-bold text-ink hover:border-brand disabled:opacity-50"
                  >
                    {c.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.icon} alt="" className="h-6 w-6 rounded" />
                    ) : (
                      <span aria-hidden="true" className="h-6 w-6 rounded bg-sunken" />
                    )}
                    {c.name}
                    {connectingId === c.uid ? (
                      <span className="ml-auto font-mono text-xs text-ink-faint">connecting…</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </>
  );
}
