"use client";

import Web3Provider from "@/lib/web3/Web3Provider";
import AdminProbe from "./AdminProbe";
import ConnectControls from "./ConnectControls";

export default function ConnectIsland({
  onAdminStatus,
}: {
  onAdminStatus?: (isAdmin: boolean) => void;
}) {
  return (
    <Web3Provider>
      <ConnectControls />
      {onAdminStatus ? <AdminProbe onChange={onAdminStatus} /> : null}
    </Web3Provider>
  );
}
