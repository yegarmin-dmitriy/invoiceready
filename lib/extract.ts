/**
 * AI extraction via the LiteLLM OpenAI-compatible endpoint.
 *
 * This is the only place that talks to the model. It sends the uploaded invoice
 * (image or PDF) to Claude vision and asks for structured JSON matching our
 * invoice schema. It does NOT decide compliance, the deterministic validator
 * does. Credentials come from env vars only; nothing is logged or stored.
 */

const EXTRACTION_PROMPT = `You are an invoice data extractor. Read the attached invoice (it may be a PDF, a scan, or a photo) and return ONLY a JSON object with this exact shape:

{
  "invoiceNumber": string,
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "currency": "ISO 4217 code, e.g. EUR",
  "seller": { "name": string, "vatId": string, "address": string, "city": string, "postalCode": string, "country": "ISO 3166-1 alpha-2" },
  "buyer":  { "name": string, "vatId": string, "address": string, "city": string, "postalCode": string, "country": "ISO 3166-1 alpha-2" },
  "lines": [ { "description": string, "quantity": number, "unitPrice": number, "vatRate": number, "lineTotal": number } ],
  "totals": { "net": number, "vat": number, "gross": number }
}

Rules:
- Use numbers (not strings) for all amounts and rates. vatRate is a percentage, e.g. 23.
- lineTotal is the net amount for the line (quantity x unitPrice), excluding VAT.
- If a field is missing on the invoice, use "" for strings and 0 for numbers. Do not invent data.
- Return the JSON object only, with no markdown fences or commentary.`;

function baseUrl(): string {
  return (process.env.LITELLM_BASE_URL ?? "").replace(/\/+$/, "");
}

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const b64 = Buffer.from(bytes).toString("base64");
  const mime = file.type || "application/octet-stream";
  return `data:${mime};base64,${b64}`;
}

/** Strip accidental ```json fences and parse. */
function parseModelJson(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function extractInvoiceFromFile(file: File): Promise<unknown> {
  const model = process.env.LITELLM_MODEL ?? "anthropic/claude-sonnet-4-5";
  const dataUrl = await toDataUrl(file);

  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LITELLM_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LiteLLM request failed (${res.status}). ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("The model returned an empty response.");

  return parseModelJson(content);
}
