import type { Invoice, Line } from "./types";

/**
 * Deterministic UBL 2.1 Invoice generator (EN 16931, Peppol BIS Billing 3.0).
 *
 * Input is assumed already validated by `lib/validate.ts`. This module only
 * serialises, it does not decide compliance. Amounts are emitted with two
 * decimals and the document currency, as required by the standard.
 */

const CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
const PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/** EN 16931 VAT category code: standard rate → S, zero rate → Z. */
function taxCategory(rate: number): string {
  return rate > 0 ? "S" : "Z";
}

/**
 * Peppol Electronic Address Scheme (EAS) code per country VAT scheme, used for
 * the party EndpointID (BT-34 / BT-49). Best-effort mapping for the countries
 * we handle; unknown countries fall back to the German VAT scheme code so the
 * schemeID stays inside the EAS code list.
 */
const EAS_BY_COUNTRY: Record<string, string> = {
  DE: "9930",
  FR: "9957",
  NL: "9944",
  BE: "9925",
  PL: "9945",
};

function endpoint(party: Invoice["seller"]): { scheme: string; value: string } {
  const scheme = EAS_BY_COUNTRY[party.country.trim().toUpperCase()] ?? "9930";
  return { scheme, value: party.vatId };
}

function partyBlock(party: Invoice["seller"], currency: string): string {
  void currency;
  const ep = endpoint(party);
  return `    <cac:Party>
      <cbc:EndpointID schemeID="${esc(ep.scheme)}">${esc(ep.value)}</cbc:EndpointID>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(party.address)}</cbc:StreetName>
        <cbc:CityName>${esc(party.city)}</cbc:CityName>
        <cbc:PostalZone>${esc(party.postalCode)}</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>${esc(party.country)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(party.vatId)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(party.name)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>`;
}

/** One TaxSubtotal per distinct VAT rate, in first-seen order. */
function taxSubtotals(lines: Line[], currency: string): string {
  const groups = new Map<number, { taxable: number; tax: number }>();
  for (const line of lines) {
    const g = groups.get(line.vatRate) ?? { taxable: 0, tax: 0 };
    g.taxable += line.lineTotal;
    g.tax += line.lineTotal * (line.vatRate / 100);
    groups.set(line.vatRate, g);
  }
  return [...groups.entries()]
    .map(
      ([rate, g]) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${money(g.taxable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${money(g.tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${taxCategory(rate)}</cbc:ID>
        <cbc:Percent>${rate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`,
    )
    .join("\n");
}

/**
 * Payment means (BG-16). Emitted only when an IBAN is known. Uses code 30
 * (credit transfer). Some national Peppol rules (e.g. NL-R-007) require this.
 */
function paymentMeans(iban: string): string {
  if (!iban.trim()) return "";
  return `  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(iban.trim())}</cbc:ID>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>
`;
}

function lineBlock(line: Line, index: number, currency: string): string {
  return `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${money(line.lineTotal)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(line.description)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${taxCategory(line.vatRate)}</cbc:ID>
        <cbc:Percent>${line.vatRate}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${money(line.unitPrice)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
}

export function toUBL(invoice: Invoice): string {
  const c = invoice.currency;
  const lines = invoice.lines.map((l, i) => lineBlock(l, i, c)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>
  <cbc:ID>${esc(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${esc(invoice.issueDate)}</cbc:IssueDate>
  <cbc:DueDate>${esc(invoice.dueDate)}</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${esc(c)}</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${esc(invoice.buyerReference || invoice.invoiceNumber)}</cbc:BuyerReference>
  <cac:AccountingSupplierParty>
${partyBlock(invoice.seller, c)}
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
${partyBlock(invoice.buyer, c)}
  </cac:AccountingCustomerParty>
${paymentMeans(invoice.paymentIban)}  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${c}">${money(invoice.totals.vat)}</cbc:TaxAmount>
${taxSubtotals(invoice.lines, c)}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${c}">${money(invoice.totals.net)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${c}">${money(invoice.totals.net)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${c}">${money(invoice.totals.gross)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${c}">${money(invoice.totals.gross)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
}
