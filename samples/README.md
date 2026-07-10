# Invoice test pack

Test material for the extraction and UBL pipeline. Two parts: a **synthetic**
pack we generate ourselves (with ground truth), and **official** reference
files downloaded from public EU sources.

> Privacy: every company, person, VAT id, IBAN and amount in the synthetic pack
> is fictional. The official files use the publishers' own placeholder data.
> No real customer or company data is used anywhere. Do not add real invoices,
> they would end up in the model prompt.

## `synthetic/` (generated)

Run the generator (rendered images and PDFs are git-ignored, regenerate any time):

```bash
npx tsx samples/generate.mts
```

For each dataset in [`data.ts`](data.ts) it produces:

| File | What |
| --- | --- |
| `<id>.clean.png` | crisp digital render |
| `<id>.scan.jpg` | grayscale, tilted, blurred office-scan look |
| `<id>.photo.jpg` | warm, vignetted, compressed phone-photo look |
| `<id>.pdf` | a real PDF (embeds the clean render) |
| `<id>.expected.json` | ground-truth `Invoice` an ideal extractor should return |

`index.json` is the manifest. The ground truth is checked against our own
`validateInvoice` at generation time, so every clean invoice is compliant.

Coverage (EU-specific cases the extractor and validator must handle):

| id | Case |
| --- | --- |
| `pl-domestic-standard` | Poland domestic, single 23% rate, EUR |
| `de-mixed-rates` | Germany, mixed 19% + 7% rates, EUR |
| `fr-intracom-reverse-charge` | France intra-community, reverse charge, 0% VAT |
| `nl-foreign-currency-usd` | Netherlands billed in USD, 21% |
| `be-credit-note` | Belgium credit note, negative amounts, 21% |

Quality variants (clean / scan / photo) exercise the vision step; the ground
truth lets us score extraction accuracy field by field once the LiteLLM key is
wired in.

## `official/` (downloaded references)

Real EU e-invoice references, used to sanity-check our UBL output format and to
stress-test the extractor on a genuine hybrid PDF.

| File | Source | Use |
| --- | --- | --- |
| `peppol-base-example.xml` | OpenPEPPOL BIS Billing 3.0 | reference UBL layout |
| `peppol-Allowance-example.xml` | OpenPEPPOL | allowances/charges |
| `peppol-base-creditnote-correction.xml` | OpenPEPPOL | credit note |
| `peppol-vat-category-E.xml` | OpenPEPPOL | VAT exempt category |
| `peppol-vat-category-O.xml` | OpenPEPPOL | out-of-scope VAT category |
| `peppol-ubl21-en16931-reference.xml` | akretion/factur-x fixtures | UBL 2.1 EN 16931 reference |
| `facturx-invoice_EN16931.pdf` | akretion/factur-x fixtures | real French Factur-X hybrid PDF (EN 16931) |

The Peppol/UBL XML files are the target our [`lib/ubl.ts`](../lib/ubl.ts) output
should resemble. Validate generated XML against an open EN 16931 validator
(for example the ecosio or Peppol online validator) before the freeze.
