import { describe, expect, test } from "vitest";
import { InvoiceSchema } from "./types";

const validInvoice = {
  invoiceNumber: "INV-2026-001",
  issueDate: "2026-07-10",
  dueDate: "2026-08-09",
  currency: "EUR",
  seller: {
    name: "Nordwind Studio sp. z o.o.",
    vatId: "PL5252445997",
    address: "ul. Prosta 51",
    city: "Warszawa",
    postalCode: "00-838",
    country: "PL",
  },
  buyer: {
    name: "Helios Retail GmbH",
    vatId: "DE811569869",
    address: "Kurfürstendamm 21",
    city: "Berlin",
    postalCode: "10719",
    country: "DE",
  },
  lines: [
    {
      description: "Brand identity design",
      quantity: 1,
      unitPrice: 2400,
      vatRate: 23,
      lineTotal: 2400,
    },
  ],
  totals: { net: 2400, vat: 552, gross: 2952 },
};

describe("InvoiceSchema", () => {
  test("parses a well-formed invoice", () => {
    const parsed = InvoiceSchema.parse(validInvoice);
    expect(parsed.invoiceNumber).toBe("INV-2026-001");
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.totals.gross).toBe(2952);
  });

  test("rejects an invoice with no line items", () => {
    const bad = { ...validInvoice, lines: [] };
    expect(() => InvoiceSchema.parse(bad)).toThrow();
  });

  test("coerces numeric strings in line amounts", () => {
    const parsed = InvoiceSchema.parse({
      ...validInvoice,
      lines: [{ ...validInvoice.lines[0], quantity: "2", unitPrice: "10.5" }],
    });
    expect(parsed.lines[0].quantity).toBe(2);
    expect(parsed.lines[0].unitPrice).toBe(10.5);
  });
});
