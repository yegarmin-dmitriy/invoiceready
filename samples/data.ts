import { InvoiceSchema, type Invoice } from "../lib/types";

/**
 * Synthetic European invoice datasets for testing the extraction pipeline.
 *
 * Every company, person, VAT id, IBAN and amount here is FICTIONAL. These are
 * used only to render test images/PDFs and to provide ground-truth JSON; no
 * real company or customer data is involved.
 *
 * Each dataset carries presentation extras (contact lines, bank details, notes)
 * that a real invoice shows but our schema does not capture. The `truth` field
 * is the exact Invoice an ideal extractor should return.
 */

export interface Dataset {
  id: string;
  /** Human description for the manifest. */
  description: string;
  docType: "invoice" | "credit_note";
  country: string;
  accent: string;
  seller: {
    name: string;
    vatId: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    contact: string;
    iban: string;
  };
  buyer: {
    name: string;
    vatId: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lines: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
  /** Footer notes (payment terms, reverse-charge statement, etc.). */
  notes: string[];
  truth: Invoice;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build the ground-truth Invoice from lines so amounts always reconcile. */
function truthFrom(
  d: Omit<Dataset, "truth">,
): Invoice {
  const lines = d.lines.map((l) => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    vatRate: l.vatRate,
    lineTotal: round(l.quantity * l.unitPrice),
  }));
  const net = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const vat = round(lines.reduce((s, l) => s + l.lineTotal * (l.vatRate / 100), 0));
  return InvoiceSchema.parse({
    invoiceNumber: d.invoiceNumber,
    issueDate: d.issueDate,
    dueDate: d.dueDate,
    currency: d.currency,
    seller: {
      name: d.seller.name,
      vatId: d.seller.vatId,
      address: d.seller.address,
      city: d.seller.city,
      postalCode: d.seller.postalCode,
      country: d.seller.country,
    },
    buyer: {
      name: d.buyer.name,
      vatId: d.buyer.vatId,
      address: d.buyer.address,
      city: d.buyer.city,
      postalCode: d.buyer.postalCode,
      country: d.buyer.country,
    },
    lines,
    totals: { net, vat, gross: round(net + vat) },
  });
}

function ds(d: Omit<Dataset, "truth">): Dataset {
  return { ...d, truth: truthFrom(d) };
}

export const DATASETS: Dataset[] = [
  ds({
    id: "pl-domestic-standard",
    description: "Poland domestic B2B, single 23% VAT rate, EUR",
    docType: "invoice",
    country: "PL",
    accent: "#4f46e5",
    seller: {
      name: "Nordwind Studio sp. z o.o.",
      vatId: "PL5252445997",
      address: "ul. Prosta 51",
      city: "Warszawa",
      postalCode: "00-838",
      country: "PL",
      contact: "hello@nordwind.example · +48 22 100 20 30",
      iban: "PL61 1090 1014 0000 0712 1981 2874",
    },
    buyer: {
      name: "Helios Retail GmbH",
      vatId: "DE811569869",
      address: "Kurfürstendamm 21",
      city: "Berlin",
      postalCode: "10719",
      country: "DE",
    },
    invoiceNumber: "NW-2026-0042",
    issueDate: "2026-07-03",
    dueDate: "2026-08-02",
    currency: "EUR",
    lines: [
      { description: "Brand identity design", quantity: 1, unitPrice: 2400, vatRate: 23 },
      { description: "Logo animation (10s)", quantity: 1, unitPrice: 600, vatRate: 23 },
    ],
    notes: ["Payment within 30 days by bank transfer.", "Thank you for your business."],
  }),

  ds({
    id: "de-mixed-rates",
    description: "Germany domestic, mixed 19% and 7% VAT rates, EUR",
    docType: "invoice",
    country: "DE",
    accent: "#0f766e",
    seller: {
      name: "Blau & Klein Verlag GmbH",
      vatId: "DE129273398",
      address: "Rosenthaler Straße 40",
      city: "Berlin",
      postalCode: "10178",
      country: "DE",
      contact: "kontakt@blauklein.example · +49 30 555 8890",
      iban: "DE89 3704 0044 0532 0130 00",
    },
    buyer: {
      name: "Atelier Lumière SARL",
      vatId: "FR40303265045",
      address: "12 Rue du Faubourg",
      city: "Lyon",
      postalCode: "69002",
      country: "FR",
    },
    invoiceNumber: "BK-2026-1187",
    issueDate: "2026-06-21",
    dueDate: "2026-07-21",
    currency: "EUR",
    lines: [
      { description: "Design consulting (per hour)", quantity: 12, unitPrice: 95, vatRate: 19 },
      { description: "Printed catalogue (book, reduced rate)", quantity: 150, unitPrice: 8.4, vatRate: 7 },
    ],
    notes: ["Mixed VAT rates apply per line.", "Payment within 30 days."],
  }),

  ds({
    id: "fr-intracom-reverse-charge",
    description: "France intra-community supply, reverse charge, 0% VAT, EUR",
    docType: "invoice",
    country: "FR",
    accent: "#b91c1c",
    seller: {
      name: "Atelier Lumière SARL",
      vatId: "FR40303265045",
      address: "12 Rue du Faubourg",
      city: "Lyon",
      postalCode: "69002",
      country: "FR",
      contact: "compta@lumiere.example · +33 4 72 00 11 22",
      iban: "FR76 3000 6000 0112 3456 7890 189",
    },
    buyer: {
      name: "Van der Berg Interiors B.V.",
      vatId: "NL812345678B01",
      address: "Keizersgracht 245",
      city: "Amsterdam",
      postalCode: "1016 EA",
      country: "NL",
    },
    invoiceNumber: "AL-2026-0091",
    issueDate: "2026-06-30",
    dueDate: "2026-07-30",
    currency: "EUR",
    lines: [
      { description: "Interior lighting design package", quantity: 1, unitPrice: 4200, vatRate: 0 },
      { description: "On-site consultancy (per day)", quantity: 3, unitPrice: 750, vatRate: 0 },
    ],
    notes: [
      "Reverse charge. VAT to be accounted for by the recipient (EU Directive 2006/112/EC, art. 196).",
      "Autoliquidation de la TVA.",
    ],
  }),

  ds({
    id: "nl-foreign-currency-usd",
    description: "Netherlands invoice billed in USD, 21% VAT",
    docType: "invoice",
    country: "NL",
    accent: "#7c3aed",
    seller: {
      name: "Van der Berg Interiors B.V.",
      vatId: "NL812345678B01",
      address: "Keizersgracht 245",
      city: "Amsterdam",
      postalCode: "1016 EA",
      country: "NL",
      contact: "billing@vdberg.example · +31 20 700 1234",
      iban: "NL91 ABNA 0417 1643 00",
    },
    buyer: {
      name: "Copperline Studios LLC",
      vatId: "US99-1234567",
      address: "440 Brannan Street",
      city: "San Francisco",
      postalCode: "94107",
      country: "US",
    },
    invoiceNumber: "VDB-2026-3310",
    issueDate: "2026-05-18",
    dueDate: "2026-06-17",
    currency: "USD",
    lines: [
      { description: "Furniture rendering set", quantity: 20, unitPrice: 45, vatRate: 21 },
      { description: "Rush delivery fee", quantity: 1, unitPrice: 120, vatRate: 21 },
    ],
    notes: ["Amounts in US dollars (USD).", "Payment within 30 days."],
  }),

  ds({
    id: "be-credit-note",
    description: "Belgium credit note, negative amounts, 21% VAT, EUR",
    docType: "credit_note",
    country: "BE",
    accent: "#c2410c",
    seller: {
      name: "Aurora Events s.r.o.",
      vatId: "BE0897654321",
      address: "Rue Antoine Dansaert 88",
      city: "Brussels",
      postalCode: "1000",
      country: "BE",
      contact: "finance@aurora.example · +32 2 555 7788",
      iban: "BE68 5390 0754 7034",
    },
    buyer: {
      name: "Helios Retail GmbH",
      vatId: "DE811569869",
      address: "Kurfürstendamm 21",
      city: "Berlin",
      postalCode: "10719",
      country: "DE",
    },
    invoiceNumber: "CN-2026-0006",
    issueDate: "2026-07-08",
    dueDate: "2026-07-08",
    currency: "EUR",
    lines: [
      { description: "Refund: cancelled catering (per person)", quantity: -24, unitPrice: 18.5, vatRate: 21 },
    ],
    notes: ["Credit note against invoice INV-000318.", "Amount to be refunded to the customer."],
  }),
];
