import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = (p) => path.join(root, "public", p);
const app = (p) => path.join(root, "app", p);

const svg = await readFile(pub("favicon.svg"));

const sizes = [
  { file: pub("icon-192.png"), size: 192 },
  { file: pub("icon-512.png"), size: 512 },
  { file: pub("apple-touch-icon.png"), size: 180, pad: true },
];

for (const { file, size, pad } of sizes) {
  let img = sharp(svg, { density: 300 }).resize(pad ? Math.round(size * 0.82) : size);
  if (pad) {
    const inner = await img.png().toBuffer();
    const margin = Math.round((size - Math.round(size * 0.82)) / 2);
    img = sharp({
      create: { width: size, height: size, channels: 4, background: "#f6f3ec" },
    }).composite([{ input: inner, top: margin, left: margin }]);
  }
  await img.png().toFile(file);
  console.log("wrote", file);
}

const icoSources = await Promise.all(
  [16, 32, 48].map((s) => sharp(svg, { density: 300 }).resize(s).png().toBuffer()),
);
await writeFile(app("favicon.ico"), await pngToIco(icoSources));
console.log("wrote", app("favicon.ico"));
