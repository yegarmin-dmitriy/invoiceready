import { z } from "zod";

/**
 * Invoice data model for InvoiceReady.
 *
 * This mirrors the subset of EN 16931 semantic fields we need to produce a
 * valid UBL 2.1 invoice. It is intentionally flat and forgiving on input
 * (numeric strings are coerced) because it is also the shape the AI extraction
 * step returns, the deterministic validator in `lib/validate.ts` is what
 * decides compliance, not this schema.
 */

const amount = z.coerce.number();

export const PartySchema = z.object({
  name: z.string().default(""),
  /** VAT identifier, e.g. "PL5252445997". May be empty when missing. */
  vatId: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  postalCode: z.string().default(""),
  /** ISO 3166-1 alpha-2 country code, e.g. "PL". */
  country: z.string().default(""),
});

export const LineSchema = z.object({
  description: z.string().default(""),
  quantity: amount.default(0),
  unitPrice: amount.default(0),
  /** VAT percentage as a number, e.g. 23 for 23%. */
  vatRate: amount.default(0),
  /** Net line amount (quantity × unitPrice), excluding VAT. */
  lineTotal: amount.default(0),
});

export const TotalsSchema = z.object({
  /** Sum of net line amounts (BT-106). */
  net: amount.default(0),
  /** Total VAT amount (BT-110). */
  vat: amount.default(0),
  /** Grand total including VAT (BT-112). */
  gross: amount.default(0),
});

export const InvoiceSchema = z.object({
  invoiceNumber: z.string().default(""),
  /** Buyer reference / purchase order (BT-10). Peppol requires one of these. */
  buyerReference: z.string().default(""),
  /** Issue date, ISO "YYYY-MM-DD". */
  issueDate: z.string().default(""),
  /** Payment due date, ISO "YYYY-MM-DD". */
  dueDate: z.string().default(""),
  /** ISO 4217 currency code, e.g. "EUR". */
  currency: z.string().default("EUR"),
  seller: PartySchema,
  buyer: PartySchema,
  lines: z.array(LineSchema).min(1),
  totals: TotalsSchema,
});

export type Party = z.infer<typeof PartySchema>;
export type Line = z.infer<typeof LineSchema>;
export type Totals = z.infer<typeof TotalsSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
