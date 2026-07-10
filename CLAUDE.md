@AGENTS.md

# InvoiceReady — AI Build Day hackathon project

**Pitch:** Turn any invoice — even a photo — into a legally compliant EU e-invoice (EN 16931 / UBL 2.1) in 30 seconds. Category: Product. Solo participant (Dmytro) + Claude as the builder.

**Deadline:** git freeze Sat Jul 11, 07:00 Warsaw. See `docs/PLAN.md` for the full plan and hour-by-hour milestones.

## Hackathon rules that constrain this repo
- Everything is built during the event — no code imported from elsewhere. Public libraries are fine.
- Commit after every working piece and push immediately — the commit stream is a public live feed.
- Deploy to Vercel continuously; the live URL must stay up through Wed Jul 15.
- No secrets in code — LiteLLM key and base URL live in env vars (`LITELLM_API_KEY`, `LITELLM_BASE_URL`).
- No confidential company or customer data in prompts, samples, or fixtures — synthetic data only.
- All user-facing text, docs, and commit messages in English.

## Architecture (decided — don't relitigate)
- Next.js (App Router, TypeScript, Tailwind) on Vercel. Stateless: no DB, no auth, uploaded files are never stored.
- `app/api/extract/route.ts` — accepts an invoice file (PDF/image), calls Claude vision via the LiteLLM OpenAI-compatible endpoint, returns structured JSON per the invoice schema. Supports a mock mode (env `EXTRACT_MOCK=1`) so the UI can be built before the LiteLLM key arrives.
- `lib/types.ts` — Zod schema: seller/buyer (name, VAT id, address, country), invoiceNumber, dates, currency, lines[] (description, qty, unitPrice, vatRate, lineTotal), totals.
- `lib/validate.ts` — deterministic EN 16931 business-rule subset: required fields (BR-01…), totals arithmetic, VAT consistency, VAT id format. Returns issues {severity, field, rule, message} with human-friendly messages. AI never decides compliance.
- `lib/ubl.ts` — deterministic UBL 2.1 Invoice XML generator (EN 16931, CustomizationID Peppol BIS 3.0) from validated JSON.
- `app/page.tsx` — single page, 3 states: **Drop** (drag&drop + "Try a sample" with 3 built-in samples) → **Review** (editable form, issues highlighted: 🔴 error / 🟡 warning, human wording) → **Done** (compliant badge, download XML, human-readable preview).
- Samples: 3 synthetic invoices — clean PDF, broken one (missing VAT id, wrong totals), photo of a paper invoice.
