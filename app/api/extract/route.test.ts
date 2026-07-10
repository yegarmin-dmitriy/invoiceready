import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { POST } from "./route";

function formRequest(fields: Record<string, string>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request("http://localhost/api/extract", { method: "POST", body: fd });
}

describe("POST /api/extract — mock mode", () => {
  const prev = process.env.EXTRACT_MOCK;
  beforeEach(() => {
    process.env.EXTRACT_MOCK = "1";
  });
  afterEach(() => {
    process.env.EXTRACT_MOCK = prev;
  });

  test("returns the requested sample invoice", async () => {
    const res = await POST(formRequest({ sample: "broken" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoice.seller.name).toBe("Kowalski Fotografia");
  });

  test("defaults to the clean sample when none is specified", async () => {
    const res = await POST(formRequest({}));
    const body = await res.json();
    expect(body.invoice.invoiceNumber).toBe("NW-2026-0042");
  });
});

describe("POST /api/extract — misconfiguration", () => {
  const prevMock = process.env.EXTRACT_MOCK;
  const prevKey = process.env.LITELLM_API_KEY;
  beforeEach(() => {
    delete process.env.EXTRACT_MOCK;
    delete process.env.LITELLM_API_KEY;
  });
  afterEach(() => {
    process.env.EXTRACT_MOCK = prevMock;
    process.env.LITELLM_API_KEY = prevKey;
  });

  test("returns 503 when neither mock mode nor an API key is configured", async () => {
    const fd = new FormData();
    fd.append("file", new File([new Uint8Array([1, 2, 3])], "x.pdf", { type: "application/pdf" }));
    const res = await POST(new Request("http://localhost/api/extract", { method: "POST", body: fd }));
    expect(res.status).toBe(503);
  });
});
