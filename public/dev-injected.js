/**
 * REHEARSAL-ONLY injected wallet (EIP-1193 + EIP-6963).
 *
 * Loaded exclusively when NEXT_PUBLIC_DEV_INJECTED=1 (see app/layout.tsx),
 * which is never set in production. It announces itself via EIP-6963 like a
 * real extension, so the app's injected-only connect stack is exercised
 * end-to-end against a local Hardhat mainnet fork. Transactions are signed
 * by the fork node's unlocked accounts via eth_sendTransaction.
 */
(function () {
  var RPC = "http://127.0.0.1:8546";
  // Hardhat unlocked account #0; override via localStorage for owner-view
  // rehearsal (the fork node signs for impersonated accounts too).
  var ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  try {
    var override = localStorage.getItem("nb-dev-wallet-account");
    if (override && /^0x[0-9a-fA-F]{40}$/.test(override)) ACCOUNT = override;
  } catch (_) {}
  var nextId = 1;
  var listeners = {};
  // Persisted like a real extension's site-permission, so wagmi's
  // isAuthorized()/reconnect-on-reload path is exercised faithfully.
  var KEY = "nb-dev-wallet-authorized";
  var connected = false;
  try { connected = localStorage.getItem(KEY) === "1"; } catch (_) {}
  function setConnected(v) {
    connected = v;
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (_) {}
  }

  function rpc(method, params) {
    return fetch(RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method: method, params: params || [] }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.error) {
          var e = new Error(j.error.message || "RPC error");
          e.code = j.error.code;
          e.data = j.error.data;
          throw e;
        }
        return j.result;
      });
  }

  function emit(event, payload) {
    (listeners[event] || []).forEach(function (fn) {
      try { fn(payload); } catch (_) {}
    });
  }

  var provider = {
    isDevRehearsalWallet: true,
    request: function (args) {
      var method = args.method;
      var params = args.params || [];
      switch (method) {
        case "eth_requestAccounts":
          setConnected(true);
          emit("connect", { chainId: "0x1" });
          emit("accountsChanged", [ACCOUNT]);
          return Promise.resolve([ACCOUNT]);
        case "eth_accounts":
          return Promise.resolve(connected ? [ACCOUNT] : []);
        case "wallet_switchEthereumChain":
        case "wallet_addEthereumChain":
          return Promise.resolve(null);
        case "wallet_requestPermissions":
          setConnected(true);
          return Promise.resolve([{ parentCapability: "eth_accounts" }]);
        case "wallet_revokePermissions":
          setConnected(false);
          emit("accountsChanged", []);
          return Promise.resolve(null);
        case "personal_sign": {
          // hardhat node can sign for its unlocked accounts
          return rpc("personal_sign", params);
        }
        default:
          return rpc(method, params);
      }
    },
    on: function (event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
      return provider;
    },
    removeListener: function (event, fn) {
      listeners[event] = (listeners[event] || []).filter(function (f) { return f !== fn; });
      return provider;
    },
  };

  var info = {
    uuid: "6f4a3c1e-1111-4a5e-9d1b-rehearsal000".replace("rehearsal000", "000000000001"),
    name: "Rehearsal Wallet (fork)",
    icon:
      "data:image/svg+xml;base64," +
      btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a0a0a"/><text x="16" y="21" font-family="monospace" font-size="14" font-weight="700" text-anchor="middle" fill="#8ecae6">RW</text></svg>'),
    rdns: "local.numberblocks.rehearsal",
  };

  function announce() {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info: info, provider: provider }),
      }),
    );
  }
  window.addEventListener("eip6963:requestProvider", announce);
  announce();

  // window.ethereum fallback path for the plain injected() connector.
  if (!window.ethereum) window.ethereum = provider;
})();
