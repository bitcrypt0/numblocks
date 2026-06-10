/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { numberBlocksCoreAbi } from "@/lib/web3/abis";
import { MAINNET_ADDRESSES } from "@/lib/web3/addresses";
import { serverPublicClient } from "@/lib/web3/server";

// Edge runtime: viem reads work on edge, and @vercel/og's edge build
// resolves its bundled font correctly on every platform (the nodejs build
// hits an invalid file-URL path on Windows dev machines).
export const runtime = "edge";
export const alt = "NumberBlock";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic OG card per /block/[id]: the on-chain SVG from tokenURI rendered
 * into a 1200x630 PNG (next/og = @vercel/og). Falls back to a text card
 * when the token does not exist or the RPC read fails.
 */
export default async function OpengraphImage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);
  let svgDataUri: string | null = null;
  let stage: string | null = null;
  let sealed = false;

  if (Number.isInteger(id) && id >= 1) {
    try {
      const client = serverPublicClient();
      const uri = await client.readContract({
        address: MAINNET_ADDRESSES.core,
        abi: numberBlocksCoreAbi,
        functionName: "tokenURI",
        args: [BigInt(id)],
      });
      const b64 = uri.replace(/^data:application\/json;base64,/, "");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const json = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof json.image === "string" && json.image.startsWith("data:image/svg+xml;base64,")) {
        svgDataUri = json.image;
      }
      const attrs: { trait_type: string; value: string | number }[] = Array.isArray(json.attributes)
        ? json.attributes
        : [];
      stage = (attrs.find((a) => a.trait_type === "Polish Stage")?.value as string) ?? null;
      sealed = attrs.find((a) => a.trait_type === "Sealed")?.value === "True";
    } catch {
      // fall through to the text card
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          color: "#f1faee",
          fontFamily: "monospace",
        }}
      >
        {svgDataUri ? (
          <img src={svgDataUri} alt="" width={630} height={630} style={{ width: 630, height: 630 }} />
        ) : (
          <div
            style={{
              width: 630,
              height: 630,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 160,
              fontWeight: 700,
              color: "#8ecae6",
            }}
          >
            {`#${Number.isInteger(id) && id >= 1 ? id : "?"}`}
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 56,
            gap: 18,
          }}
        >
          <div style={{ fontSize: 28, color: "#8ecae6", letterSpacing: 2 }}>NUMBERBLOCKS</div>
          <div style={{ fontSize: 64, fontWeight: 700 }}>{`#${Number.isInteger(id) && id >= 1 ? id : "—"}`}</div>
          {stage ? (
            <div style={{ fontSize: 30, color: "#e9c46a" }}>
              {`${stage.toUpperCase()}${sealed ? " · SEALED" : ""}`}
            </div>
          ) : null}
          <div style={{ fontSize: 22, color: "#9aa0a6", lineHeight: 1.4 }}>
            Fully on-chain. Backed by 1,000 uniBlocks. Polished by Ethereum.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
