# InvoiceReady

**Turn any invoice, even a photo, into a compliant EU e-invoice (EN 16931 / UBL 2.1 / Peppol) in 30 seconds.**

Live demo: **https://invoiceready-air-slate.vercel.app**

Built for AI Build Day (24h hackathon). Category: Product.

---

## The problem

E-invoicing is becoming mandatory across the EU. Belgium requires structured **Peppol BIS 3.0** invoices for all B2B from January 2026, and Poland's KSeF and others are rolling out through 2026 and 2027. These mandates require structured formats built on **EN 16931**, not PDFs or Word/Excel documents. Businesses still invoicing in Word, Excel or PDF, and without an ERP, need a structured format and an easy way to produce it.

InvoiceReady takes any invoice (a clean PDF, a scan, or a phone photo) and produces a structured, standards-compliant e-invoice, with plain-language validation so a non-accountant can understand and fix any issues.

## How it works

1. **Drop** an invoice (PDF / image) or pick a built-in sample.
2. **Review** the extracted data in an editable form. Deterministic EN 16931 checks flag problems inline (🔴 errors / 🟡 warnings) in human language.
3. **Done**: download a valid UBL 2.1 XML and see a human-readable preview.

The AI only *extracts* data. Whether the invoice is compliant is decided by a **deterministic rule engine**, never by the model, so results are predictable and auditable.

## Architecture

Stateless Next.js (App Router, TypeScript, Tailwind) on Vercel. No database, no auth, and **uploaded files are never stored**. Privacy is a feature.

| Module | Responsibility |
| --- | --- |
| [`lib/types.ts`](lib/types.ts) | Zod invoice model (parties, lines, totals), the EN 16931 field subset |
| [`lib/validate.ts`](lib/validate.ts) | Deterministic EN 16931 rules: required fields, line & document arithmetic, VAT id format. Returns `{severity, field, rule, message}` |
| [`lib/ubl.ts`](lib/ubl.ts) | UBL 2.1 Invoice XML generator (Peppol BIS Billing 3.0) |
| [`lib/extract.ts`](lib/extract.ts) | Claude vision extraction via the LiteLLM OpenAI-compatible endpoint |
| [`lib/samples.ts`](lib/samples.ts) | Three synthetic sample invoices (all data fictional) |
| [`app/api/extract/route.ts`](app/api/extract/route.ts) | `POST` returns `{ invoice }`; mock mode serves samples |
| [`app/page.tsx`](app/page.tsx) | The Drop → Review → Done single-page flow |

## Running locally

```bash
npm install
npm run dev:mock   # runs with EXTRACT_MOCK=1, no AI key needed, uses samples
```

Open http://localhost:3000. Use **Try a sample** or drop a file (in mock mode any dropped file returns the clean sample).

### Tests

Arithmetic and XML generation are covered by unit tests:

```bash
npm test
```

## Configuration

Extraction talks to an OpenAI-compatible LiteLLM endpoint. Credentials live in environment variables only, never in code.

| Variable | Purpose |
| --- | --- |
| `EXTRACT_MOCK` | Set to `1` to skip the AI call and return built-in samples |
| `LITELLM_API_KEY` | LiteLLM API key |
| `LITELLM_BASE_URL` | LiteLLM base URL (OpenAI-compatible) |
| `LITELLM_MODEL` | Optional model override (default `anthropic/claude-sonnet-4-5`) |

## Compliance scope

MVP targets the pan-European **EN 16931** semantic model serialised as **UBL 2.1** with the **Peppol BIS Billing 3.0** customization. National formats (e.g. KSeF FA(3), Factur-X) are out of scope for the hackathon. Generated XML is intended to be checked against an open EN 16931 validator.

## Notes

- All sample and fixture data is **synthetic**, no real company or customer data.
- User-facing text and commits are in English.
