"use client";

import { useMemo } from "react";
import type { Invoice, Line, Party } from "@/lib/types";
import type { Issue } from "@/lib/validate";

interface Props {
  invoice: Invoice;
  issues: Issue[];
  compliant: boolean;
  onChange: (next: Invoice) => void;
  onRecalculate: () => void;
  onContinue: () => void;
  onBack: () => void;
}

/** Small labelled input that highlights and explains a validation issue. */
function Field({
  label,
  value,
  onChange,
  issue,
  type = "text",
  className = "",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  issue?: Issue;
  type?: string;
  className?: string;
}) {
  const ring = issue
    ? issue.severity === "error"
      ? "border-red-400 focus:ring-red-400"
      : "border-amber-400 focus:ring-amber-400"
    : "border-slate-300 focus:ring-indigo-400 dark:border-slate-700";
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 dark:bg-slate-900 ${ring}`}
      />
      {issue && (
        <span
          className={`text-xs ${issue.severity === "error" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}
        >
          {issue.severity === "error" ? "🔴" : "🟡"} {issue.message}
        </span>
      )}
    </label>
  );
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ReviewForm({
  invoice,
  issues,
  compliant,
  onChange,
  onRecalculate,
  onContinue,
  onBack,
}: Props) {
  const byField = useMemo(() => {
    const m = new Map<string, Issue>();
    for (const i of issues) if (!m.has(i.field)) m.set(i.field, i);
    return m;
  }, [issues]);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;

  const patch = (p: Partial<Invoice>) => onChange({ ...invoice, ...p });
  const patchParty = (key: "seller" | "buyer", p: Partial<Party>) =>
    onChange({ ...invoice, [key]: { ...invoice[key], ...p } });
  const patchLine = (i: number, p: Partial<Line>) => {
    const lines = invoice.lines.map((l, idx) => (idx === i ? { ...l, ...p } : l));
    onChange({ ...invoice, lines });
  };
  const addLine = () =>
    onChange({
      ...invoice,
      lines: [...invoice.lines, { description: "", quantity: 1, unitPrice: 0, vatRate: 23, lineTotal: 0 }],
    });
  const removeLine = (i: number) =>
    onChange({ ...invoice, lines: invoice.lines.filter((_, idx) => idx !== i) });

  const party = (key: "seller" | "buyer", title: string) => {
    const p = invoice[key];
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold">{title}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={p.name} issue={byField.get(`${key}.name`)} onChange={(v) => patchParty(key, { name: v })} className="sm:col-span-2" />
          <Field label="VAT id" value={p.vatId} issue={byField.get(`${key}.vatId`)} onChange={(v) => patchParty(key, { vatId: v })} />
          <Field label="Country" value={p.country} onChange={(v) => patchParty(key, { country: v })} />
          <Field label="Address" value={p.address} onChange={(v) => patchParty(key, { address: v })} className="sm:col-span-2" />
          <Field label="City" value={p.city} onChange={(v) => patchParty(key, { city: v })} />
          <Field label="Postal code" value={p.postalCode} onChange={(v) => patchParty(key, { postalCode: v })} />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Status banner */}
      <div
        className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
          compliant
            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        }`}
      >
        <span className="font-medium">
          {compliant
            ? "✓ This invoice meets the EN 16931 checks."
            : `${errorCount} issue${errorCount === 1 ? "" : "s"} to fix${warnCount ? ` · ${warnCount} warning${warnCount === 1 ? "" : "s"}` : ""}`}
        </span>
        <button
          onClick={onRecalculate}
          className="rounded-lg border border-current/30 px-3 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          Recalculate totals
        </button>
      </div>

      {/* Header fields */}
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900">
        <Field label="Invoice #" value={invoice.invoiceNumber} issue={byField.get("invoiceNumber")} onChange={(v) => patch({ invoiceNumber: v })} />
        <Field label="Issue date" value={invoice.issueDate} issue={byField.get("issueDate")} onChange={(v) => patch({ issueDate: v })} />
        <Field label="Due date" value={invoice.dueDate} onChange={(v) => patch({ dueDate: v })} />
        <Field label="Currency" value={invoice.currency} issue={byField.get("currency")} onChange={(v) => patch({ currency: v })} />
      </div>

      {/* Parties */}
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        {party("seller", "Seller")}
        {party("buyer", "Buyer")}
      </div>

      {/* Lines */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Line items</h3>
          <button onClick={addLine} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            + Add line
          </button>
        </div>
        <div className="space-y-3">
          {invoice.lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Field label="Description" value={line.description} onChange={(v) => patchLine(i, { description: v })} className="col-span-12 sm:col-span-4" />
              <Field label="Qty" type="number" value={line.quantity} onChange={(v) => patchLine(i, { quantity: num(v) })} className="col-span-3 sm:col-span-2" />
              <Field label="Unit price" type="number" value={line.unitPrice} onChange={(v) => patchLine(i, { unitPrice: num(v) })} className="col-span-4 sm:col-span-2" />
              <Field label="VAT %" type="number" value={line.vatRate} onChange={(v) => patchLine(i, { vatRate: num(v) })} className="col-span-2 sm:col-span-1" />
              <Field label="Line total" type="number" value={line.lineTotal} issue={byField.get(`lines.${i}.lineTotal`)} onChange={(v) => patchLine(i, { lineTotal: num(v) })} className="col-span-3 sm:col-span-2" />
              <button
                onClick={() => removeLine(i)}
                disabled={invoice.lines.length === 1}
                className="col-span-12 self-end pb-2 text-left text-xs text-slate-400 hover:text-red-500 disabled:opacity-30 sm:col-span-1 sm:text-center"
                title="Remove line"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-900">
        <Field label="Net total" type="number" value={invoice.totals.net} issue={byField.get("totals.net")} onChange={(v) => patch({ totals: { ...invoice.totals, net: num(v) } })} />
        <Field label="VAT total" type="number" value={invoice.totals.vat} issue={byField.get("totals.vat")} onChange={(v) => patch({ totals: { ...invoice.totals, vat: num(v) } })} />
        <Field label="Grand total" type="number" value={invoice.totals.gross} issue={byField.get("totals.gross")} onChange={(v) => patch({ totals: { ...invoice.totals, gross: num(v) } })} />
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 hover:underline dark:text-slate-400">
          ← Start over
        </button>
        <button
          onClick={onContinue}
          disabled={!compliant}
          className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {compliant ? "Generate e-invoice →" : "Fix issues to continue"}
        </button>
      </div>
    </div>
  );
}
