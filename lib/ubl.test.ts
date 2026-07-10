import { describe, expect, test } from "vitest";
import { InvoiceSchema, type Invoice } from "./types";
import { toUBL } from "./ubl";

function baseInvoice(overrides: Partial<Invoice> = {}): Invoice {
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
    ...overrides,
  });
}

describe("toUBL — document header", () => {
  const xml = toUBL(baseInvoice());

  test("emits an XML declaration and UBL Invoice root with namespaces", () => {
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2");
    expect(xml).toContain("</Invoice>");
  });

  test("declares the Peppol BIS 3.0 customization and profile", () => {
    expect(xml).toContain(
      "<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>",
    );
    expect(xml).toContain("<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>");
  });

  test("carries invoice number, dates, type code 380 and currency", () => {
    expect(xml).toContain("<cbc:ID>INV-2026-001</cbc:ID>");
    expect(xml).toContain("<cbc:IssueDate>2026-07-10</cbc:IssueDate>");
    expect(xml).toContain("<cbc:DueDate>2026-08-09</cbc:DueDate>");
    expect(xml).toContain("<cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
    expect(xml).toContain("<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");
  });
});

describe("toUBL — parties", () => {
  const xml = toUBL(baseInvoice());

  test("includes supplier legal name and VAT company id", () => {
    expect(xml).toContain("<cbc:RegistrationName>Nordwind Studio sp. z o.o.</cbc:RegistrationName>");
    expect(xml).toContain("<cbc:CompanyID>PL5252445997</cbc:CompanyID>");
  });

  test("includes customer legal name and postal country code", () => {
    expect(xml).toContain("<cbc:RegistrationName>Helios Retail GmbH</cbc:RegistrationName>");
    expect(xml).toContain("<cbc:IdentificationCode>DE</cbc:IdentificationCode>");
  });
});

describe("toUBL — lines and monetary totals", () => {
  const xml = toUBL(baseInvoice());

  test("emits one InvoiceLine per line item with 2-decimal amounts", () => {
    const lineCount = (xml.match(/<cac:InvoiceLine>/g) || []).length;
    expect(lineCount).toBe(2);
    expect(xml).toContain("<cbc:Name>Brand identity design</cbc:Name>");
    expect(xml).toContain('<cbc:LineExtensionAmount currencyID="EUR">2400.00</cbc:LineExtensionAmount>');
    expect(xml).toContain('<cbc:PriceAmount currencyID="EUR">1200.00</cbc:PriceAmount>');
    expect(xml).toContain('<cbc:InvoicedQuantity unitCode="C62">2</cbc:InvoicedQuantity>');
  });

  test("emits LegalMonetaryTotal with net, tax-exclusive, tax-inclusive and payable", () => {
    expect(xml).toContain('<cbc:LineExtensionAmount currencyID="EUR">3000.00</cbc:LineExtensionAmount>');
    expect(xml).toContain('<cbc:TaxExclusiveAmount currencyID="EUR">3000.00</cbc:TaxExclusiveAmount>');
    expect(xml).toContain('<cbc:TaxInclusiveAmount currencyID="EUR">3690.00</cbc:TaxInclusiveAmount>');
    expect(xml).toContain('<cbc:PayableAmount currencyID="EUR">3690.00</cbc:PayableAmount>');
  });
});

describe("toUBL — tax breakdown", () => {
  test("groups a single VAT rate into one TaxSubtotal", () => {
    const xml = toUBL(baseInvoice());
    expect((xml.match(/<cac:TaxSubtotal>/g) || []).length).toBe(1);
    expect(xml).toContain('<cbc:TaxAmount currencyID="EUR">690.00</cbc:TaxAmount>');
    expect(xml).toContain("<cbc:Percent>23</cbc:Percent>");
    expect(xml).toContain("<cbc:ID>S</cbc:ID>");
  });

  test("produces a TaxSubtotal per distinct VAT rate", () => {
    const inv = baseInvoice({
      lines: [
        { description: "Consulting", quantity: 1, unitPrice: 1000, vatRate: 23, lineTotal: 1000 },
        { description: "Printed book", quantity: 1, unitPrice: 100, vatRate: 5, lineTotal: 100 },
      ],
      totals: { net: 1100, vat: 235, gross: 1335 },
    });
    const xml = toUBL(inv);
    expect((xml.match(/<cac:TaxSubtotal>/g) || []).length).toBe(2);
    expect(xml).toContain("<cbc:Percent>23</cbc:Percent>");
    expect(xml).toContain("<cbc:Percent>5</cbc:Percent>");
  });

  test("marks a zero VAT rate with category code Z", () => {
    const inv = baseInvoice({
      lines: [{ description: "Export service", quantity: 1, unitPrice: 500, vatRate: 0, lineTotal: 500 }],
      totals: { net: 500, vat: 0, gross: 500 },
    });
    const xml = toUBL(inv);
    expect(xml).toContain("<cbc:ID>Z</cbc:ID>");
  });
});

describe("toUBL — escaping", () => {
  test("escapes XML special characters in text values", () => {
    const inv = baseInvoice();
    inv.seller.name = "Tom & Jerry <Design> Co.";
    const xml = toUBL(inv);
    expect(xml).toContain("Tom &amp; Jerry &lt;Design&gt; Co.");
    expect(xml).not.toContain("Tom & Jerry");
  });
});
