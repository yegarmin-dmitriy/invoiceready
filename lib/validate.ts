import type { Invoice } from "./types";

/**
 * Deterministic EN 16931 business-rule validation.
 *
 * This is the compliance authority in InvoiceReady: the AI extracts data, but
 * only these rules decide whether an invoice is valid. Every issue carries a
 * machine field path (for highlighting the form) and a human-friendly message.
 */

export type Severity = "error" | "warning";

export interface Issue {
  severity: Severity;
  /** Dotted path into the invoice, e.g. "seller.vatId" or "lines.0.lineTotal". */
  field: string;
  /** EN 16931 rule id (or a local id like LINE-CALC) for traceability. */
  rule: string;
  /** Plain-language explanation shown to a non-accountant user. */
  message: string;
}

/** Round to cents to keep monetary comparisons stable. */
function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Money amounts are considered equal within half a cent. */
function moneyEquals(a: number, b: number): boolean {
  return Math.abs(cents(a) - cents(b)) < 0.01;
}

/**
 * VAT identifier: ISO country prefix followed by 2–13 alphanumeric characters.
 * A light structural check — not a VIES lookup.
 */
const VAT_ID_PATTERN = /^[A-Z]{2}[0-9A-Z]{2,13}$/;

export function validateInvoice(invoice: Invoice): Issue[] {
  const issues: Issue[] = [];
  const add = (severity: Severity, field: string, rule: string, message: string) =>
    issues.push({ severity, field, rule, message });

  // --- Required header fields ---
  if (!invoice.invoiceNumber.trim()) {
    add("error", "invoiceNumber", "BR-02", "The invoice needs an invoice number.");
  }
  if (!invoice.issueDate.trim()) {
    add("error", "issueDate", "BR-03", "The invoice needs an issue date.");
  }
  if (!invoice.currency.trim()) {
    add("error", "currency", "BR-05", "The invoice needs a currency (e.g. EUR).");
  }

  // --- Parties ---
  if (!invoice.seller.name.trim()) {
    add("error", "seller.name", "BR-06", "The seller's name is missing.");
  }
  if (!invoice.buyer.name.trim()) {
    add("error", "buyer.name", "BR-07", "The buyer's name is missing.");
  }
  if (!invoice.seller.vatId.trim()) {
    add(
      "error",
      "seller.vatId",
      "BR-CO-09",
      "The seller's VAT number is required for a compliant e-invoice.",
    );
  }

  // --- VAT id format (structural, non-blocking) ---
  for (const [key, party] of [
    ["seller", invoice.seller],
    ["buyer", invoice.buyer],
  ] as const) {
    const vatId = party.vatId.trim().toUpperCase();
    if (vatId && !VAT_ID_PATTERN.test(vatId)) {
      add(
        "warning",
        `${key}.vatId`,
        "VAT-FORMAT",
        `The ${key}'s VAT number "${party.vatId}" doesn't look like a valid EU VAT id (e.g. PL5252445997).`,
      );
    }
  }

  // --- Line arithmetic ---
  let lineSum = 0;
  let vatSum = 0;
  invoice.lines.forEach((line, i) => {
    const expected = cents(line.quantity * line.unitPrice);
    if (!moneyEquals(expected, line.lineTotal)) {
      add(
        "error",
        `lines.${i}.lineTotal`,
        "LINE-CALC",
        `Line ${i + 1} total ${line.lineTotal} doesn't match quantity × unit price (${expected}).`,
      );
    }
    lineSum += line.lineTotal;
    vatSum += line.lineTotal * (line.vatRate / 100);
  });
  lineSum = cents(lineSum);
  vatSum = cents(vatSum);

  // --- Document totals ---
  if (!moneyEquals(lineSum, invoice.totals.net)) {
    add(
      "error",
      "totals.net",
      "BR-CO-10",
      `Net total ${invoice.totals.net} doesn't match the sum of line amounts (${lineSum}).`,
    );
  }
  if (!moneyEquals(vatSum, invoice.totals.vat)) {
    add(
      "error",
      "totals.vat",
      "BR-CO-14",
      `VAT total ${invoice.totals.vat} doesn't match the VAT calculated from the lines (${vatSum}).`,
    );
  }
  const expectedGross = cents(invoice.totals.net + invoice.totals.vat);
  if (!moneyEquals(expectedGross, invoice.totals.gross)) {
    add(
      "error",
      "totals.gross",
      "BR-CO-15",
      `Grand total ${invoice.totals.gross} doesn't equal net + VAT (${expectedGross}).`,
    );
  }

  return issues;
}

/** True when the invoice has no blocking errors. */
export function isCompliant(issues: Issue[]): boolean {
  return !issues.some((i) => i.severity === "error");
}
