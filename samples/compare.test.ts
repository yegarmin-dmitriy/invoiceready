import { describe, expect, test } from "vitest";
import { InvoiceSchema, type Invoice } from "../lib/types";
import { compareInvoices } from "./compare";

function inv(overrides: Partial<Invoice> = {}): Invoice {
  return InvoiceSchema.parse({
    invoiceNumber: "NW-2026-0042",
    issueDate: "2026-07-03",
    dueDate: "2026-08-02",
    currency: "EUR",
    seller: { name: "Nordwind Studio sp. z o.o.", vatId: "PL5252445997", address: "ul. Prosta 51", city: "Warszawa", postalCode: "00-838", country: "PL" },
    buyer: { name: "Helios Retail GmbH", vatId: "DE811569869", address: "Kurfürstendamm 21", city: "Berlin", postalCode: "10719", country: "DE" },
    lines: [
      { description: "Brand identity design", quantity: 1, unitPrice: 2400, vatRate: 23, lineTotal: 2400 },
      { description: "Logo animation", quantity: 1, unitPrice: 600, vatRate: 23, lineTotal: 600 },
    ],
    totals: { net: 3000, vat: 690, gross: 3690 },
    ...overrides,
  });
}

describe("compareInvoices", () => {
  test("identical invoices score a perfect match", () => {
    const r = compareInvoices(inv(), inv());
    expect(r.matched).toBe(r.total);
    expect(r.score).toBe(1);
    expect(r.fields.every((f) => f.match)).toBe(true);
  });

  test("a wrong net total is the only mismatch", () => {
    const actual = inv({ totals: { net: 2500, vat: 690, gross: 3690 } });
    const r = compareInvoices(inv(), actual);
    const net = r.fields.find((f) => f.path === "totals.net");
    expect(net?.match).toBe(false);
    expect(r.fields.filter((f) => !f.match)).toHaveLength(1);
    expect(r.matched).toBe(r.total - 1);
  });

  test("VAT id differences in spacing and case still match", () => {
    const actual = inv();
    actual.seller.vatId = "pl 5252 445 997";
    const r = compareInvoices(inv(), actual);
    expect(r.fields.find((f) => f.path === "seller.vatId")?.match).toBe(true);
  });

  test("description differences in case and whitespace still match", () => {
    const actual = inv();
    actual.lines[0].description = "  Brand   Identity  Design ";
    const r = compareInvoices(inv(), actual);
    expect(r.fields.find((f) => f.path === "lines.0.description")?.match).toBe(true);
  });

  test("money within half a cent matches, larger drift does not", () => {
    expect(compareInvoices(inv(), inv({ totals: { net: 3000.004, vat: 690, gross: 3690 } })).fields.find((f) => f.path === "totals.net")?.match).toBe(true);
    expect(compareInvoices(inv(), inv({ totals: { net: 3000.02, vat: 690, gross: 3690 } })).fields.find((f) => f.path === "totals.net")?.match).toBe(false);
  });

  test("a missing line is counted as a mismatch, not a crash", () => {
    const actual = inv({ lines: [{ description: "Brand identity design", quantity: 1, unitPrice: 2400, vatRate: 23, lineTotal: 2400 }] });
    const r = compareInvoices(inv(), actual);
    expect(r.lineCountMatch).toBe(false);
    // the second line's fields should all be present and marked as mismatches
    expect(r.fields.some((f) => f.path === "lines.1.lineTotal" && !f.match)).toBe(true);
  });

  test("critical fields are tracked separately", () => {
    const actual = inv({ totals: { net: 2500, vat: 690, gross: 3690 } });
    const r = compareInvoices(inv(), actual);
    expect(r.critical.total).toBeGreaterThan(0);
    expect(r.critical.matched).toBe(r.critical.total - 1);
    // a non-critical field like address should not be in the critical count
    const addr = r.fields.find((f) => f.path === "seller.address");
    expect(addr?.critical).toBe(false);
  });
});
