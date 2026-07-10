import { InvoiceSchema, type Invoice } from "./types";

/**
 * Three synthetic sample invoices used both by the "Try a sample" buttons and
 * by the mock extractor. All data is fictional — no real company or customer.
 *
 * - clean:  a well-formed, fully compliant invoice
 * - broken: missing seller VAT id and inconsistent totals (demo for issues)
 * - photo:  a small invoice standing in for a photographed paper receipt
 */

export type SampleId = "clean" | "broken" | "photo";

export interface Sample {
  id: SampleId;
  label: string;
  /** One-line description shown on the sample card. */
  hint: string;
  invoice: Invoice;
}

const clean: Invoice = InvoiceSchema.parse({
  invoiceNumber: "NW-2026-0042",
  issueDate: "2026-07-03",
  dueDate: "2026-08-02",
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
    { description: "Brand identity design", quantity: 1, unitPrice: 2400, vatRate: 23, lineTotal: 2400 },
    { description: "Logo animation (10s)", quantity: 1, unitPrice: 600, vatRate: 23, lineTotal: 600 },
  ],
  totals: { net: 3000, vat: 690, gross: 3690 },
});

const broken: Invoice = InvoiceSchema.parse({
  invoiceNumber: "2026/07/17",
  issueDate: "2026-07-05",
  dueDate: "",
  currency: "EUR",
  seller: {
    // VAT id intentionally missing → BR-CO-09 error
    name: "Kowalski Fotografia",
    vatId: "",
    address: "ul. Lipowa 4",
    city: "Kraków",
    postalCode: "31-063",
    country: "PL",
  },
  buyer: {
    name: "Aurora Events s.r.o.",
    vatId: "CZ26185610",
    address: "Náměstí Míru 9",
    city: "Praha",
    postalCode: "120 00",
    country: "CZ",
  },
  lines: [
    // line total inconsistent with qty × unit price (2 × 450 = 900, not 850)
    { description: "Wedding photo session", quantity: 2, unitPrice: 450, vatRate: 23, lineTotal: 850 },
    { description: "Printed album", quantity: 1, unitPrice: 200, vatRate: 8, lineTotal: 200 },
  ],
  // totals do not reconcile with the lines
  totals: { net: 1050, vat: 250, gross: 1250 },
});

const photo: Invoice = InvoiceSchema.parse({
  invoiceNumber: "INV-000318",
  issueDate: "2026-06-28",
  dueDate: "2026-07-12",
  currency: "EUR",
  seller: {
    name: "La Tavola Catering B.V.",
    vatId: "NL812345678B01",
    address: "Herengracht 182",
    city: "Amsterdam",
    postalCode: "1016 BR",
    country: "NL",
  },
  buyer: {
    name: "Byte & Bloom Studio",
    vatId: "BE0897654321",
    address: "Rue Antoine Dansaert 88",
    city: "Brussels",
    postalCode: "1000",
    country: "BE",
  },
  lines: [
    { description: "Lunch catering (per person)", quantity: 24, unitPrice: 18.5, vatRate: 9, lineTotal: 444 },
    { description: "Barista service", quantity: 1, unitPrice: 150, vatRate: 21, lineTotal: 150 },
  ],
  totals: { net: 594, vat: 71.46, gross: 665.46 },
});

export const SAMPLES: Sample[] = [
  { id: "clean", label: "Clean PDF invoice", hint: "A tidy studio invoice — already compliant.", invoice: clean },
  {
    id: "broken",
    label: "Invoice with problems",
    hint: "Missing VAT id and totals that don't add up.",
    invoice: broken,
  },
  { id: "photo", label: "Photo of a paper invoice", hint: "Catering receipt captured on a phone.", invoice: photo },
];

export function getSample(id: SampleId): Sample {
  const s = SAMPLES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown sample: ${id}`);
  return s;
}
