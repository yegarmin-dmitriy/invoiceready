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
    const okType = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!okType) {
      setError("Please upload a PDF or an image (PNG/JPG). That file type isn't supported.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("That file is over 15 MB. Try a smaller scan or a photo.");
      return;
    }
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
        <div className="glass mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
          </span>
          EN 16931 · UBL 2.1 · Peppol BIS 3.0
        </div>
        <h1 className="brand-gradient-text text-5xl font-extrabold tracking-tight sm:text-6xl">
          InvoiceReady
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-slate-700 sm:text-xl dark:text-slate-200">
          Turn any invoice — even a photo — into a legally compliant EU e-invoice in 30 seconds.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          E-invoicing mandates are going live across the EU — Poland (KSeF), Belgium and France from
          2026. They require structured formats, not PDFs. Millions of small businesses on Word and
          Excel suddenly have invoices that no longer count. InvoiceReady fixes that in one step.
        </p>
        <dl className="mx-auto mt-7 grid max-w-xl grid-cols-3 gap-3 text-center">
          {[
            ["2026+", "EU mandates going live"],
            ["EN 16931", "the required standard"],
            ["0 files stored", "runs privately"],
          ].map(([big, small]) => (
            <div key={big} className="glass lift rounded-2xl px-2 py-4">
              <dt className="brand-gradient-text text-base font-bold sm:text-lg">{big}</dt>
              <dd className="mt-1 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                {small}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-semibold">
        {(["drop", "review", "done"] as Step[]).map((s, i) => {
          const idx = (["drop", "review", "done"] as Step[]).indexOf(step);
          const active = step === s;
          const past = i < idx;
          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 transition-all ${
                  active
                    ? "brand-btn text-white"
                    : past
                      ? "glass text-indigo-600 dark:text-indigo-300"
                      : "glass text-slate-400"
                }`}
              >
                {past ? "✓" : i + 1}. {s === "drop" ? "Upload" : s === "review" ? "Review" : "Done"}
              </span>
              {i < 2 && <span className="text-slate-300 dark:text-slate-600">→</span>}
            </li>
          );
        })}
      </ol>

      <div key={step} className="flex w-full flex-col items-center animate-fade-up">
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
      </div>

      <footer className="mt-16 text-center text-xs text-slate-400">
        Your file never leaves the browser unencrypted and is never stored. Built for AI Build Day.
      </footer>
    </div>
  );
}
