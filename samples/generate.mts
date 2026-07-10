/**
 * Generate the synthetic European invoice test pack.
 *
 * For each dataset in data.ts this renders an SVG invoice, then produces:
 *   <id>.clean.png   crisp digital render
 *   <id>.scan.png    grayscale, tilted, blurred office-scan look
 *   <id>.photo.jpg   warm, vignetted, compressed phone-photo look
 *   <id>.pdf         real PDF (embeds the clean render)
 *   <id>.expected.json  ground-truth Invoice an ideal extractor should return
 * plus samples/synthetic/index.json manifest.
 *
 * Run: npx tsx samples/generate.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { DATASETS, type Dataset } from "./data";
import { validateInvoice, isCompliant } from "../lib/validate";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "synthetic");
const W = 1000;
const H = 1414;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(n);
}

function vatBreakdown(d: Dataset): { rate: number; net: number; vat: number }[] {
  const groups = new Map<number, { net: number; vat: number }>();
  for (const l of d.truth.lines) {
    const g = groups.get(l.vatRate) ?? { net: 0, vat: 0 };
    g.net += l.lineTotal;
    g.vat += l.lineTotal * (l.vatRate / 100);
    groups.set(l.vatRate, g);
  }
  return [...groups.entries()]
    .map(([rate, g]) => ({ rate, net: Math.round(g.net * 100) / 100, vat: Math.round(g.vat * 100) / 100 }))
    .sort((a, b) => b.rate - a.rate);
}

function renderSVG(d: Dataset): string {
  const c = d.truth.currency;
  const docLabel = d.docType === "credit_note" ? "CREDIT NOTE" : "INVOICE";
  const pad = 60;
  const rightX = W - pad;

  // Line item rows
  const rowY0 = 500;
  const rowH = 40;
  const rows = d.truth.lines
    .map((l, i) => {
      const y = rowY0 + i * rowH;
      return `
    <text x="${pad}" y="${y}" font-size="19" fill="#0f172a">${esc(l.description)}</text>
    <text x="600" y="${y}" font-size="19" fill="#334155" text-anchor="end">${l.quantity}</text>
    <text x="740" y="${y}" font-size="19" fill="#334155" text-anchor="end">${money(l.unitPrice, c)}</text>
    <text x="800" y="${y}" font-size="19" fill="#334155" text-anchor="end">${l.vatRate}%</text>
    <text x="${rightX}" y="${y}" font-size="19" fill="#0f172a" text-anchor="end">${money(l.lineTotal, c)}</text>`;
    })
    .join("");

  const afterRows = rowY0 + d.truth.lines.length * rowH + 20;

  // Totals + VAT breakdown box
  const vb = vatBreakdown(d);
  let ty = afterRows + 30;
  const totalsLines: string[] = [];
  totalsLines.push(
    `<text x="700" y="${ty}" font-size="18" fill="#475569" text-anchor="end">Net total</text><text x="${rightX}" y="${ty}" font-size="18" fill="#0f172a" text-anchor="end">${money(d.truth.totals.net, c)}</text>`,
  );
  for (const g of vb) {
    ty += 30;
    totalsLines.push(
      `<text x="700" y="${ty}" font-size="18" fill="#475569" text-anchor="end">VAT ${g.rate}%</text><text x="${rightX}" y="${ty}" font-size="18" fill="#0f172a" text-anchor="end">${money(g.vat, c)}</text>`,
    );
  }
  ty += 42;
  totalsLines.push(
    `<line x1="640" y1="${ty - 26}" x2="${rightX}" y2="${ty - 26}" stroke="#cbd5e1" stroke-width="1"/>` +
      `<text x="700" y="${ty}" font-size="22" font-weight="bold" fill="${d.accent}" text-anchor="end">Total ${c}</text><text x="${rightX}" y="${ty}" font-size="22" font-weight="bold" fill="${d.accent}" text-anchor="end">${money(d.truth.totals.gross, c)}</text>`,
  );

  // Notes
  const notesY = Math.max(ty + 90, H - 260);
  const notes = d.notes
    .map((n, i) => `<text x="${pad}" y="${notesY + i * 26}" font-size="15" fill="#64748b">${esc(n)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="14" fill="${d.accent}"/>

  <!-- Seller -->
  <text x="${pad}" y="90" font-size="30" font-weight="bold" fill="#0f172a">${esc(d.seller.name)}</text>
  <text x="${pad}" y="120" font-size="16" fill="#475569">${esc(d.seller.address)}</text>
  <text x="${pad}" y="142" font-size="16" fill="#475569">${esc(`${d.seller.postalCode} ${d.seller.city}, ${d.seller.country}`)}</text>
  <text x="${pad}" y="164" font-size="16" fill="#475569">${esc(d.seller.contact)}</text>
  <text x="${pad}" y="186" font-size="16" fill="#475569">VAT ${esc(d.seller.vatId)}</text>

  <!-- Doc meta -->
  <text x="${rightX}" y="86" font-size="30" font-weight="bold" fill="${d.accent}" text-anchor="end">${docLabel}</text>
  <text x="${rightX}" y="120" font-size="17" fill="#0f172a" text-anchor="end">No. ${esc(d.truth.invoiceNumber)}</text>
  <text x="${rightX}" y="144" font-size="16" fill="#475569" text-anchor="end">Issued ${esc(d.truth.issueDate)}</text>
  <text x="${rightX}" y="166" font-size="16" fill="#475569" text-anchor="end">Due ${esc(d.truth.dueDate || "-")}</text>

  <line x1="${pad}" y1="230" x2="${rightX}" y2="230" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Buyer -->
  <text x="${pad}" y="272" font-size="13" fill="#94a3b8" letter-spacing="1">BILL TO</text>
  <text x="${pad}" y="300" font-size="20" font-weight="bold" fill="#0f172a">${esc(d.buyer.name)}</text>
  <text x="${pad}" y="324" font-size="16" fill="#475569">${esc(d.buyer.address)}</text>
  <text x="${pad}" y="346" font-size="16" fill="#475569">${esc(`${d.buyer.postalCode} ${d.buyer.city}, ${d.buyer.country}`)}</text>
  <text x="${pad}" y="368" font-size="16" fill="#475569">VAT ${esc(d.buyer.vatId)}</text>

  <!-- Table header -->
  <line x1="${pad}" y1="452" x2="${rightX}" y2="452" stroke="#0f172a" stroke-width="1.5"/>
  <text x="${pad}" y="478" font-size="14" fill="#64748b" letter-spacing="1">DESCRIPTION</text>
  <text x="600" y="478" font-size="14" fill="#64748b" text-anchor="end">QTY</text>
  <text x="740" y="478" font-size="14" fill="#64748b" text-anchor="end">UNIT</text>
  <text x="800" y="478" font-size="14" fill="#64748b" text-anchor="end">VAT</text>
  <text x="${rightX}" y="478" font-size="14" fill="#64748b" text-anchor="end">NET</text>
  ${rows}

  ${totalsLines.join("\n  ")}

  <line x1="${pad}" y1="${notesY - 34}" x2="${rightX}" y2="${notesY - 34}" stroke="#e2e8f0" stroke-width="1"/>
  ${notes}
  <text x="${pad}" y="${notesY + d.notes.length * 26 + 10}" font-size="15" fill="#64748b">IBAN ${esc(d.seller.iban)}</text>

  <rect y="${H - 12}" width="${W}" height="12" fill="${d.accent}"/>
</svg>`;
}

async function noiseLayer(w: number, h: number, alpha: number): Promise<Buffer> {
  const n = await sharp({
    create: { width: w, height: h, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 22 } },
  })
    .grayscale()
    .png()
    .toBuffer();
  return sharp(n).ensureAlpha(alpha).png().toBuffer();
}

async function vignette(w: number, h: number): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="v" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.35"/>
    </radialGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#v)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const manifest: Record<string, unknown>[] = [];

  for (const d of DATASETS) {
    // Ground-truth sanity check via our own product code.
    const issues = validateInvoice(d.truth);
    const errors = issues.filter((i) => i.severity === "error");
    if (errors.length) {
      throw new Error(`Ground truth for ${d.id} is not compliant: ${errors.map((e) => e.rule).join(", ")}`);
    }

    const svg = renderSVG(d);
    const base = await sharp(Buffer.from(svg)).flatten({ background: "#ffffff" }).png().toBuffer();

    // clean
    writeFileSync(join(OUT, `${d.id}.clean.png`), base);

    // scan: grayscale, contrast, slight blur, small tilt
    const scanBody = await sharp(base).grayscale().linear(1.14, -10).blur(0.4).toBuffer();
    const scanRot = await sharp(scanBody).rotate(1.4, { background: "#ffffff" }).toBuffer({ resolveWithObject: true });
    const scan = await sharp(scanRot.data)
      .composite([{ input: await noiseLayer(scanRot.info.width, scanRot.info.height, 0.05), blend: "over" }])
      .jpeg({ quality: 82 })
      .toBuffer();
    writeFileSync(join(OUT, `${d.id}.scan.jpg`), scan);

    // photo: warm tint, blur, tilt on a desk-colored background, vignette, noise, jpeg
    const photoBody = await sharp(base)
      .modulate({ brightness: 0.95, saturation: 1.05 })
      .tint({ r: 255, g: 249, b: 236 })
      .blur(0.6)
      .toBuffer();
    const photoRot = await sharp(photoBody).rotate(-4, { background: "#e7e2d8" }).toBuffer({ resolveWithObject: true });
    const photo = await sharp(photoRot.data)
      .composite([
        { input: await vignette(photoRot.info.width, photoRot.info.height), blend: "over" },
        { input: await noiseLayer(photoRot.info.width, photoRot.info.height, 0.06), blend: "over" },
      ])
      .jpeg({ quality: 62 })
      .toBuffer();
    writeFileSync(join(OUT, `${d.id}.photo.jpg`), photo);

    // pdf: embed the clean render
    const pdf = await PDFDocument.create();
    const png = await pdf.embedPng(base);
    const page = pdf.addPage([W, H]);
    page.drawImage(png, { x: 0, y: 0, width: W, height: H });
    writeFileSync(join(OUT, `${d.id}.pdf`), await pdf.save());

    // ground truth
    writeFileSync(join(OUT, `${d.id}.expected.json`), JSON.stringify(d.truth, null, 2));

    manifest.push({
      id: d.id,
      description: d.description,
      docType: d.docType,
      country: d.country,
      currency: d.truth.currency,
      compliant: isCompliant(issues),
      warnings: issues.filter((i) => i.severity === "warning").map((w) => w.rule),
      files: {
        clean: `${d.id}.clean.png`,
        scan: `${d.id}.scan.jpg`,
        photo: `${d.id}.photo.jpg`,
        pdf: `${d.id}.pdf`,
        expected: `${d.id}.expected.json`,
      },
    });
    console.log(`✓ ${d.id}  (${d.country}, ${d.truth.currency})`);
  }

  writeFileSync(join(OUT, "index.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nGenerated ${DATASETS.length} invoices → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
