/**
 * Extraction accuracy harness.
 *
 * Runs every synthetic invoice image/PDF through the extractor and scores the
 * result field-by-field against its ground truth. Prints a per-file and
 * aggregate report plus the most-missed fields.
 *
 * Real run (needs the model):
 *   LITELLM_API_KEY=... LITELLM_BASE_URL=... npx tsx samples/score.mts
 *
 * Wiring self-test (no key; uses ground truth as the "extraction" to prove the
 * harness reads files, compares and aggregates correctly):
 *   SCORE_SELFTEST=1 npx tsx samples/score.mts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { InvoiceSchema, type Invoice } from "../lib/types";
import { extractInvoiceFromFile } from "../lib/extract";
import { compareInvoices, type CompareReport } from "./compare";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "synthetic");
const SELFTEST = process.env.SCORE_SELFTEST === "1";
const VARIANTS = ["clean", "scan", "photo", "pdf"] as const;
type Variant = (typeof VARIANTS)[number];

interface ManifestEntry {
  id: string;
  files: Record<Variant | "expected", string>;
}

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", pdf: "application/pdf" };
function mimeOf(name: string): string {
  return MIME[name.split(".").pop() ?? ""] ?? "application/octet-stream";
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`.padStart(4);
}

async function extract(fileName: string, expected: Invoice): Promise<Invoice | null> {
  const bytes = readFileSync(join(DIR, fileName)); // also asserts the asset exists
  if (SELFTEST) return expected; // wiring check: identity extraction
  const file = new File([bytes], fileName, { type: mimeOf(fileName) });
  const raw = await extractInvoiceFromFile(file);
  const parsed = InvoiceSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function main() {
  if (!SELFTEST && (!process.env.LITELLM_API_KEY || !process.env.LITELLM_BASE_URL)) {
    console.error(
      "No LiteLLM credentials. Set LITELLM_API_KEY and LITELLM_BASE_URL for a real run,\n" +
        "or run with SCORE_SELFTEST=1 to check the harness wiring.",
    );
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8"));
  const missCount = new Map<string, number>();
  const byVariant: Record<string, { overall: number[]; critical: number[] }> = {};
  for (const v of VARIANTS) byVariant[v] = { overall: [], critical: [] };

  console.log(SELFTEST ? "Mode: SELF-TEST (identity extraction)\n" : "Mode: LIVE extraction\n");
  console.log("invoice".padEnd(30) + "variant".padEnd(8) + "overall  critical  lines");
  console.log("-".repeat(64));

  for (const entry of manifest) {
    const expected = InvoiceSchema.parse(
      JSON.parse(readFileSync(join(DIR, entry.files.expected), "utf8")),
    );

    for (const v of VARIANTS) {
      const fileName = entry.files[v];
      let report: CompareReport | null = null;
      try {
        const actual = await extract(fileName, expected);
        if (actual) report = compareInvoices(expected, actual);
      } catch (e) {
        console.log(`${entry.id.padEnd(30)}${v.padEnd(8)}ERROR: ${(e as Error).message.slice(0, 30)}`);
        continue;
      }
      if (!report) {
        console.log(`${entry.id.padEnd(30)}${v.padEnd(8)}extraction failed (schema mismatch)`);
        continue;
      }
      byVariant[v].overall.push(report.score);
      byVariant[v].critical.push(report.critical.score);
      for (const f of report.fields) if (!f.match) missCount.set(f.path, (missCount.get(f.path) ?? 0) + 1);
      const lines = report.lineCountMatch ? "ok" : "MISMATCH";
      console.log(`${entry.id.padEnd(30)}${v.padEnd(8)}${pct(report.score)}    ${pct(report.critical.score)}    ${lines}`);
    }
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  console.log("\nBy variant:");
  for (const v of VARIANTS) {
    const b = byVariant[v];
    if (b.overall.length) console.log(`  ${v.padEnd(8)}overall ${pct(avg(b.overall))}   critical ${pct(avg(b.critical))}`);
  }
  const allOverall = VARIANTS.flatMap((v) => byVariant[v].overall);
  const allCritical = VARIANTS.flatMap((v) => byVariant[v].critical);
  console.log(`\nOverall: ${pct(avg(allOverall))}   Critical: ${pct(avg(allCritical))}   (${allOverall.length} files)`);

  const misses = [...missCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (misses.length) {
    console.log("\nMost-missed fields:");
    for (const [path, count] of misses) console.log(`  ${String(count).padStart(3)}×  ${path}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
