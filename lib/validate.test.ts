import { describe, expect, test } from "vitest";
import { InvoiceSchema, type Invoice } from "./types";
import { validateInvoice } from "./validate";

/** A fully compliant baseline invoice; individual tests break one thing. */
function baseInvoice(): Invoice {
  return InvoiceSchema.parse({
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
      { description: "Brand identity design", quantity: 2, unitPrice: 1200, vatRate: 23, lineTotal: 2400 },
      { description: "Logo animation", quantity: 1, unitPrice: 600, vatRate: 23, lineTotal: 600 },
    ],
    totals: { net: 3000, vat: 690, gross: 3690 },
  });
}

const rules = (issues: ReturnType<typeof validateInvoice>) => issues.map((i) => i.rule);

describe("validateInvoice — happy path", () => {
  test("a compliant invoice produces no errors", () => {
    const issues = validateInvoice(baseInvoice());
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });
});

describe("validateInvoice — required fields", () => {
  test("flags a missing invoice number (BR-02)", () => {
    const inv = { ...baseInvoice(), invoiceNumber: "" };
    const issues = validateInvoice(inv);
    expect(rules(issues)).toContain("BR-02");
    expect(issues.find((i) => i.rule === "BR-02")?.severity).toBe("error");
  });

  test("flags a missing issue date (BR-03)", () => {
    const issues = validateInvoice({ ...baseInvoice(), issueDate: "" });
    expect(rules(issues)).toContain("BR-03");
  });

  test("flags a missing seller name (BR-06)", () => {
    const inv = baseInvoice();
    inv.seller.name = "";
    expect(rules(validateInvoice(inv))).toContain("BR-06");
  });

  test("flags a missing buyer name (BR-07)", () => {
    const inv = baseInvoice();
    inv.buyer.name = "";
    expect(rules(validateInvoice(inv))).toContain("BR-07");
  });

  test("flags a missing seller VAT identifier (BR-CO-09)", () => {
    const inv = baseInvoice();
    inv.seller.vatId = "";
    const issue = validateInvoice(inv).find((i) => i.rule === "BR-CO-09");
    expect(issue?.severity).toBe("error");
    expect(issue?.field).toBe("seller.vatId");
  });
});

describe("validateInvoice — arithmetic", () => {
  test("flags a line whose total is not quantity × unit price", () => {
    const inv = baseInvoice();
    inv.lines[0].lineTotal = 2000; // should be 2400
    const issue = validateInvoice(inv).find((i) => i.rule === "LINE-CALC");
    expect(issue?.severity).toBe("error");
    expect(issue?.field).toBe("lines.0.lineTotal");
  });

  test("flags a net total that is not the sum of line totals (BR-CO-10)", () => {
    const inv = baseInvoice();
    inv.totals.net = 2500; // lines sum to 3000
    expect(rules(validateInvoice(inv))).toContain("BR-CO-10");
  });

  test("flags a VAT total inconsistent with line VAT (BR-CO-14)", () => {
    const inv = baseInvoice();
    inv.totals.vat = 500; // should be 690
    expect(rules(validateInvoice(inv))).toContain("BR-CO-14");
  });

  test("flags a gross total that is not net + VAT (BR-CO-15)", () => {
    const inv = baseInvoice();
    inv.totals.gross = 4000; // should be 3690
    expect(rules(validateInvoice(inv))).toContain("BR-CO-15");
  });

  test("tolerates sub-cent rounding differences", () => {
    const inv = baseInvoice();
    inv.totals.vat = 690.004;
    inv.totals.gross = 3690.004;
    expect(validateInvoice(inv).filter((i) => i.severity === "error")).toEqual([]);
  });
});

describe("validateInvoice — VAT id format", () => {
  test("warns on a malformed VAT identifier", () => {
    const inv = baseInvoice();
    inv.seller.vatId = "1234"; // no country prefix
    const issue = validateInvoice(inv).find((i) => i.rule === "VAT-FORMAT");
    expect(issue?.severity).toBe("warning");
  });

  test("accepts a well-formed VAT identifier", () => {
    const issues = validateInvoice(baseInvoice());
    expect(issues.find((i) => i.rule === "VAT-FORMAT")).toBeUndefined();
  });
});
