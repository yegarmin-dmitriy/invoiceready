import type { Invoice } from "../lib/types";

/**
 * Field-by-field comparison of an extracted invoice against ground truth.
 *
 * Produces a per-field match report plus aggregate scores, so we can measure
 * extraction accuracy objectively instead of eyeballing. Text is compared
 * leniently (trimmed, whitespace-collapsed, case-insensitive; VAT ids ignore
 * spacing); money is compared within half a cent.
 */

export interface FieldResult {
  path: string;
  expected: string;
  actual: string;
  match: boolean;
  /** Fields that drive compliance (amounts, VAT ids, dates, number, currency). */
  critical: boolean;
}

export interface CompareReport {
  fields: FieldResult[];
  matched: number;
  total: number;
  score: number;
  critical: { matched: number; total: number; score: number };
  lineCountMatch: boolean;
}

const MONEY_TOL = 0.01;
const NUM_TOL = 0.001;

function normStr(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

function normVat(s: string): string {
  return s.trim().replace(/\s+/g, "").toUpperCase();
}

function show(v: string | number | undefined): string {
  return v === undefined ? "—" : String(v);
}

export function compareInvoices(expected: Invoice, actual: Invoice): CompareReport {
  const fields: FieldResult[] = [];

  const add = (
    path: string,
    exp: string | number | undefined,
    act: string | number | undefined,
    match: boolean,
    critical: boolean,
  ) => fields.push({ path, expected: show(exp), actual: show(act), match, critical });

  const str = (path: string, e: string, a: string, critical = false) =>
    add(path, e, a, normStr(e) === normStr(a), critical);
  const vat = (path: string, e: string, a: string) =>
    add(path, e, a, normVat(e) === normVat(a), true);
  const money = (path: string, e: number, a: number) =>
    add(path, e, a, Math.abs(e - a) <= MONEY_TOL, true);
  const num = (path: string, e: number, a: number, critical = false, tol = NUM_TOL) =>
    add(path, e, a, Math.abs(e - a) <= tol, critical);

  // Header
  str("invoiceNumber", expected.invoiceNumber, actual.invoiceNumber, true);
  str("issueDate", expected.issueDate, actual.issueDate, true);
  str("dueDate", expected.dueDate, actual.dueDate, false);
  str("currency", expected.currency, actual.currency, true);

  // Parties
  for (const key of ["seller", "buyer"] as const) {
    const e = expected[key];
    const a = actual[key];
    str(`${key}.name`, e.name, a.name, false);
    vat(`${key}.vatId`, e.vatId, a.vatId);
    str(`${key}.address`, e.address, a.address, false);
    str(`${key}.city`, e.city, a.city, false);
    str(`${key}.postalCode`, e.postalCode, a.postalCode, false);
    str(`${key}.country`, e.country, a.country, false);
  }

  // Lines (compared by index; extra/missing lines are mismatches)
  const n = Math.max(expected.lines.length, actual.lines.length);
  for (let i = 0; i < n; i++) {
    const e = expected.lines[i];
    const a = actual.lines[i];
    if (e && a) {
      str(`lines.${i}.description`, e.description, a.description, false);
      num(`lines.${i}.quantity`, e.quantity, a.quantity, true);
      money(`lines.${i}.unitPrice`, e.unitPrice, a.unitPrice);
      num(`lines.${i}.vatRate`, e.vatRate, a.vatRate, true);
      money(`lines.${i}.lineTotal`, e.lineTotal, a.lineTotal);
    } else {
      // one side is missing this line
      add(`lines.${i}.description`, e?.description, a?.description, false, false);
      add(`lines.${i}.quantity`, e?.quantity, a?.quantity, false, true);
      add(`lines.${i}.unitPrice`, e?.unitPrice, a?.unitPrice, false, true);
      add(`lines.${i}.vatRate`, e?.vatRate, a?.vatRate, false, true);
      add(`lines.${i}.lineTotal`, e?.lineTotal, a?.lineTotal, false, true);
    }
  }

  // Totals
  money("totals.net", expected.totals.net, actual.totals.net);
  money("totals.vat", expected.totals.vat, actual.totals.vat);
  money("totals.gross", expected.totals.gross, actual.totals.gross);

  const matched = fields.filter((f) => f.match).length;
  const total = fields.length;
  const crit = fields.filter((f) => f.critical);
  const critMatched = crit.filter((f) => f.match).length;

  return {
    fields,
    matched,
    total,
    score: total ? matched / total : 1,
    critical: {
      matched: critMatched,
      total: crit.length,
      score: crit.length ? critMatched / crit.length : 1,
    },
    lineCountMatch: expected.lines.length === actual.lines.length,
  };
}
