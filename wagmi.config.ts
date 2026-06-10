import { defineConfig } from "@wagmi/cli";
import { hardhat } from "@wagmi/cli/plugins";

/**
 * Typed-ABI generation from the Hardhat artifacts at the repo root.
 * Run `pnpm generate:abis` after any contract recompile so the frontend
 * ABI surface always matches the deployed bytecode (D-24: must include
 * `effectiveTransformation` and `phasePrice`/`phaseWalletCap`; any
 * pre-D-24 sale or transformation selector in the output means the
 * artifacts are stale - recompile at the repo root first).
 */
export default defineConfig({
  out: "lib/web3/abis/index.ts",
  plugins: [
    hardhat({
      project: "..",
      artifacts: "artifacts",
      include: [
        "NumberBlocksCore.json",
        "UniBlocks.json",
        "BlocksSale.json",
        "NumberBlocksHook.json",
        "SwapHelper.json",
        "NumberBlocksV4LPPositionLocker.json",
        "Metadata.json",
        "Renderer.json",
      ].map((name) => `**/${name}`),
      commands: {
        // Artifacts are produced by the root Hardhat project; never
        // recompile from inside the frontend package.
        build: "",
      },
    }),
  ],
});
