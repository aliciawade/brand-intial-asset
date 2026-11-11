import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "campus");
const appNames = ["witch-ology", "alchemy-institute", "evergreen-path"];
const keep = new Set(["brand.config.ts", "node_modules", ".next"]);

async function emptyExceptBrand(dir) {
  await mkdir(dir, { recursive: true });
  const entries = await readdir(dir);
  for (const name of entries) {
    if (keep.has(name)) continue;
    await rm(path.join(dir, name), { recursive: true, force: true });
  }
}

async function copyFiltered(src, dest) {
  const entries = await readdir(src, { withFileTypes: true });
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    if (keep.has(entry.name)) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyFiltered(from, to);
    else if (entry.isFile()) await cp(from, to);
  }
}

for (const name of appNames) {
  const dest = path.join(root, "apps", name);
  const brandFile = path.join(dest, "brand.config.ts");
  try {
    const info = await stat(brandFile);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    console.error(`Missing ${path.relative(root, brandFile)}. Write that brand config before syncing.`);
    process.exit(1);
  }
  await emptyExceptBrand(dest);
  await copyFiltered(source, dest);
  console.log(`synced ${name}`);
}
