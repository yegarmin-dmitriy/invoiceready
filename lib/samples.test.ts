import { describe, expect, test } from "vitest";
import { InvoiceSchema } from "./types";
import { isCompliant, validateInvoice } from "./validate";
import { SAMPLES, getSample } from "./samples";

describe("samples", () => {
  test("every sample parses against the invoice schema", () => {
    for (const s of SAMPLES) {
      expect(() => InvoiceSchema.parse(s.invoice)).not.toThrow();
    }
  });

  test("the clean sample is fully compliant", () => {
    const clean = getSample("clean");
    expect(isCompliant(validateInvoice(clean.invoice))).toBe(true);
  });

  test("the broken sample has blocking errors", () => {
    const broken = getSample("broken");
    const issues = validateInvoice(broken.invoice);
    expect(isCompliant(issues)).toBe(false);
    // it should surface both a missing seller VAT id and a totals mismatch
    expect(issues.map((i) => i.rule)).toContain("BR-CO-09");
  });

  test("the photo sample is compliant (clean OCR result)", () => {
    const photo = getSample("photo");
    expect(isCompliant(validateInvoice(photo.invoice))).toBe(true);
  });
});
