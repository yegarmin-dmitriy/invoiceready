import { InvoiceSchema } from "@/lib/types";
import { getSample, type SampleId } from "@/lib/samples";
import { extractInvoiceFromFile } from "@/lib/extract";

/**
 * POST /api/extract
 *
 * Accepts a multipart form with an invoice `file` (PDF or image) and returns
 * `{ invoice }`, structured JSON per the invoice schema. Compliance is decided
 * client-side by the deterministic validator, not here.
 *
 * Mock mode (`EXTRACT_MOCK=1`) skips the AI call and returns a built-in sample,
 * so the UI can be built and demoed before the LiteLLM key is available.
 */

export const runtime = "nodejs";

const SAMPLE_IDS: SampleId[] = ["clean", "broken", "photo"];

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  // --- Mock mode: return a built-in sample ---
  if (process.env.EXTRACT_MOCK === "1") {
    const requested = String(form.get("sample") ?? "clean");
    const id = (SAMPLE_IDS as string[]).includes(requested) ? (requested as SampleId) : "clean";
    return Response.json({ invoice: getSample(id).invoice, mock: true });
  }

  // --- Real mode: needs a configured LiteLLM endpoint ---
  if (!process.env.LITELLM_API_KEY || !process.env.LITELLM_BASE_URL) {
    return Response.json(
      {
        error:
          "Extraction is not configured. Set LITELLM_API_KEY and LITELLM_BASE_URL, or run with EXTRACT_MOCK=1.",
      },
      { status: 503 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }

  try {
    const raw = await extractInvoiceFromFile(file);
    const parsed = InvoiceSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "The extracted data did not match the invoice schema.", details: parsed.error.issues },
        { status: 422 },
      );
    }
    return Response.json({ invoice: parsed.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
