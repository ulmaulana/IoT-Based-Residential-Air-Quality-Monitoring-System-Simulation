import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const sourcePath = path.resolve(projectRoot, "../data.h");
const outputDir = path.resolve(projectRoot, "public/data");
const outputPath = path.join(outputDir, "air-quality.json");

const source = await readFile(sourcePath, "utf8");
const rowPattern =
  /\{\s*([-+]?\d+(?:\.\d+)?)f,\s*([-+]?\d+(?:\.\d+)?)f,\s*([-+]?\d+(?:\.\d+)?)f,\s*([-+]?\d+(?:\.\d+)?)f\s*\}/g;

const rows = [];
let match;
let index = 0;

while ((match = rowPattern.exec(source)) !== null) {
  const [, temperature, humidity, gasPPM, lightLux] = match;
  rows.push({
    index,
    temperature: Number(temperature),
    humidity: Number(humidity),
    gasPPM: Number(gasPPM),
    lightLux: Number(lightLux),
  });
  index += 1;
}

if (rows.length === 0) {
  throw new Error(`Tidak ada data yang berhasil dibaca dari ${sourcePath}`);
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(rows)}\n`, "utf8");

console.log(`Generated ${outputPath}`);
console.log(`Rows: ${rows.length}`);
