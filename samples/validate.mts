/**
 * Validate our generated UBL against the official EN 16931 and Peppol BIS 3.0
 * Schematron rules (the same rule sets that public validators run).
 *
 * For each synthetic invoice it generates UBL with lib/ubl.ts, then runs the
 * official CEN EN 16931 XSLT and the OpenPEPPOL XSLT via Saxon-JS (xslt3) and
 * reports failed assertions by severity.
 *
 * Run: npx tsx samples/validate.mts
 *
 * The large XSLT rule files are cached under samples/.validator (git-ignored)
 * and downloaded on first run.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { InvoiceSchema } from "../lib/types";
import { toUBL } from "../lib/ubl";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, ".validator");
const SYN = join(HERE, "synthetic");

const RULES = {
  "EN 16931": {
    url: "https://raw.githubusercontent.com/phax/phive-rules/master/phive-rules-en16931/src/main/resources/external/schematron/1.3.4/ubl/xslt/EN16931-UBL-validation.xslt",
    file: join(CACHE, "EN16931-UBL-validation.xslt"),
  },
  "Peppol BIS": {
    url: "https://raw.githubusercontent.com/phax/phive-rules/master/phive-rules-peppol/src/main/resources/external/schematron/openpeppol/2026.5/xslt/PEPPOL-EN16931-UBL.xslt",
    file: join(CACHE, "PEPPOL-EN16931-UBL.xslt"),
  },
};

async function ensureRules() {
  mkdirSync(CACHE, { recursive: true });
  for (const [name, r] of Object.entries(RULES)) {
    if (existsSync(r.file)) continue;
    process.stdout.write(`downloading ${name} rules… `);
    const res = await fetch(r.url);
    if (!res.ok) throw new Error(`failed to download ${name} rules (${res.status})`);
    writeFileSync(r.file, Buffer.from(await res.arrayBuffer()));
    console.log("ok");
  }
}

function severities(svrl: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const m of svrl.match(/<svrl:failed-assert[\s\S]*?<\/svrl:failed-assert>/g) ?? []) {
    const id = /id="([^"]*)"/.exec(m)?.[1] ?? "?";
    const text = /<svrl:text>([\s\S]*?)<\/svrl:text>/.exec(m)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const line = `${id}: ${text}`.slice(0, 120);
    (m.includes('flag="warning"') ? warnings : errors).push(line);
  }
  return { errors, warnings };
}

function runXslt(xslt: string, xmlPath: string): string {
  return execFileSync("npx", ["xslt3", `-xsl:${xslt}`, `-s:${xmlPath}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function main() {
  await ensureRules();
  const manifest: { id: string }[] = JSON.parse(readFileSync(join(SYN, "index.json"), "utf8"));
  let totalErrors = 0;

  for (const { id } of manifest) {
    const inv = InvoiceSchema.parse(JSON.parse(readFileSync(join(SYN, `${id}.expected.json`), "utf8")));
    const xmlPath = join(CACHE, `${id}.ubl.xml`);
    writeFileSync(xmlPath, toUBL(inv));

    console.log(`\n${id}`);
    for (const [name, r] of Object.entries(RULES)) {
      const { errors, warnings } = severities(runXslt(r.file, xmlPath));
      totalErrors += errors.length;
      const status = errors.length ? "FAIL" : "pass";
      console.log(`  ${name.padEnd(10)} ${status}  (${errors.length} errors, ${warnings.length} warnings)`);
      for (const e of errors) console.log(`      error: ${e}`);
      for (const w of warnings) console.log(`      warn:  ${w}`);
    }
  }

  console.log(`\n${totalErrors === 0 ? "All invoices valid." : `${totalErrors} error(s) across the pack.`}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
