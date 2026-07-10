"use client";

import { useMemo, useState } from "react";
import type { Invoice } from "@/lib/types";
import { toUBL } from "@/lib/ubl";

interface Props {
  invoice: Invoice;
  onBack: () => void;
  onRestart: () => void;
}

function money(n: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: currency || "EUR" }).format(n);
}

export function DonePanel({ invoice, onBack, onRestart }: Props) {
  const [tab, setTab] = useState<"preview" | "xml">("preview");
  const xml = useMemo(() => toUBL(invoice), [invoice]);

  const download = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber || "invoice"}.ubl.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-5 flex flex-col items-center gap-2 overflow-hidden rounded-3xl border border-emerald-300/50 bg-gradient-to-b from-emerald-50 to-emerald-100/40 px-6 py-8 text-center shadow-[0_20px_50px_-20px_rgba(16,185,129,0.45)] dark:border-emerald-800/50 dark:from-emerald-950/50 dark:to-emerald-900/20">
        <div className="flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-3xl text-white shadow-lg shadow-emerald-500/30">
          ✓
        </div>
        <h2 className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-300">
          Compliant EU e-invoice ready
        </h2>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-300/70">
          EN 16931 · UBL 2.1 · Peppol BIS Billing 3.0
        </p>
        <button
          onClick={download}
          className="mt-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:shadow-emerald-500/40"
        >
          ↓ Download UBL XML
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("preview")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === "preview" ? "brand-btn text-white" : "glass text-slate-500"}`}
        >
          Preview
        </button>
        <button
          onClick={() => setTab("xml")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === "xml" ? "brand-btn text-white" : "glass text-slate-500"}`}
        >
          UBL XML
        </button>
      </div>

      {tab === "preview" ? (
        <div className="glass rounded-2xl p-6">
          <div className="flex justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Invoice</div>
              <div className="text-lg font-semibold">{invoice.invoiceNumber}</div>
            </div>
            <div className="text-right text-sm text-slate-500 dark:text-slate-400">
              <div>Issued {invoice.issueDate}</div>
              {invoice.dueDate && <div>Due {invoice.dueDate}</div>}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(["seller", "buyer"] as const).map((k) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wide text-slate-400">{k}</div>
                <div className="font-medium">{invoice[k].name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {invoice[k].vatId && <div>VAT {invoice[k].vatId}</div>}
                  <div>{invoice[k].address}</div>
                  <div>
                    {invoice[k].postalCode} {invoice[k].city} {invoice[k].country}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-700">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">VAT</th>
                <th className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2">{l.description}</td>
                  <td className="py-2 text-right">{l.quantity}</td>
                  <td className="py-2 text-right">{money(l.unitPrice, invoice.currency)}</td>
                  <td className="py-2 text-right">{l.vatRate}%</td>
                  <td className="py-2 text-right">{money(l.lineTotal, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Net</span>
              <span>{money(invoice.totals.net, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>VAT</span>
              <span>{money(invoice.totals.vat, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold dark:border-slate-700">
              <span>Total</span>
              <span>{money(invoice.totals.gross, invoice.currency)}</span>
            </div>
          </div>
        </div>
      ) : (
        <pre className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 dark:border-slate-700">
          {xml}
        </pre>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 hover:underline dark:text-slate-400">
          ← Back to edit
        </button>
        <button onClick={onRestart} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Convert another →
        </button>
      </div>
    </div>
  );
}
