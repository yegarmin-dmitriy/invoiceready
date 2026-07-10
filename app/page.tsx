"use client";

import { useMemo, useState } from "react";
import { DropZone } from "./components/DropZone";
import { ReviewForm } from "./components/ReviewForm";
import { DonePanel } from "./components/DonePanel";
import { InvoiceSchema, type Invoice } from "@/lib/types";
import { getSample, type SampleId } from "@/lib/samples";
import { isCompliant, validateInvoice } from "@/lib/validate";

type Step = "drop" | "review" | "done";

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Recompute line totals and document totals from quantities, prices and rates. */
function recalculate(inv: Invoice): Invoice {
  const lines = inv.lines.map((l) => ({ ...l, lineTotal: round(l.quantity * l.unitPrice) }));
  const net = round(lines.reduce((s, l) => s + l.lineTotal, 0));
  const vat = round(lines.reduce((s, l) => s + l.lineTotal * (l.vatRate / 100), 0));
  return { ...inv, lines, totals: { net, vat, gross: round(net + vat) } };
}

export default function Home() {
  const [step, setStep] = useState<Step>("drop");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issues = useMemo(() => (invoice ? validateInvoice(invoice) : []), [invoice]);
  const compliant = useMemo(() => isCompliant(issues), [issues]);

  const loadSample = (id: SampleId) => {
    setError(null);
    setInvoice(getSample(id).invoice);
    setStep("review");
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Extraction failed.");
      setInvoice(InvoiceSchema.parse(body.invoice));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setInvoice(null);
    setError(null);
    setStep("drop");
  };

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 sm:py-14">
      {/* Header */}
      <header className="mb-10 w-full max-w-3xl text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          EN 16931 · UBL 2.1 · Peppol BIS 3.0
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">InvoiceReady</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Turn any invoice — even a photo — into a legally compliant EU e-invoice in 30 seconds.
          EU e-invoicing mandates are arriving; Word and Excel invoices won&apos;t count.
        </p>
      </header>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-medium text-slate-400">
        {(["drop", "review", "done"] as Step[]).map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 ${
                step === s ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              {i + 1}. {s === "drop" ? "Upload" : s === "review" ? "Review" : "Done"}
            </span>
            {i < 2 && <span>→</span>}
          </li>
        ))}
      </ol>

      {step === "drop" && (
        <DropZone busy={busy} error={error} onFile={uploadFile} onSample={loadSample} />
      )}

      {step === "review" && invoice && (
        <ReviewForm
          invoice={invoice}
          issues={issues}
          compliant={compliant}
          onChange={setInvoice}
          onRecalculate={() => setInvoice(recalculate(invoice))}
          onContinue={() => setStep("done")}
          onBack={restart}
        />
      )}

      {step === "done" && invoice && (
        <DonePanel invoice={invoice} onBack={() => setStep("review")} onRestart={restart} />
      )}

      <footer className="mt-16 text-center text-xs text-slate-400">
        Your file never leaves the browser unencrypted and is never stored. Built for AI Build Day.
      </footer>
    </div>
  );
}
