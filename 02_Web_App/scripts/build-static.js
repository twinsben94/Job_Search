import { mkdir, cp, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..");
const ROOT_DIR = path.resolve(APP_DIR, "..");
const PUBLIC_DIR = path.join(APP_DIR, "public");
const DOCS_DIR = path.join(ROOT_DIR, "03_Github", "02_pages_site");
const STATIC_DATA_DIR = path.join(DOCS_DIR, "data");

async function main() {
  await rm(DOCS_DIR, { recursive: true, force: true });
  await mkdir(DOCS_DIR, { recursive: true });
  await cp(PUBLIC_DIR, DOCS_DIR, { recursive: true });
  await mkdir(STATIC_DATA_DIR, { recursive: true });
  await copyFile(path.join(APP_DIR, "data", "companies.json"), path.join(STATIC_DATA_DIR, "companies.json"));

  console.log(`Built static site at ${DOCS_DIR}`);
}

await main();
