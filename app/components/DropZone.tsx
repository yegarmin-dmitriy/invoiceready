"use client";

import { useCallback, useRef, useState } from "react";
import { SAMPLES, type SampleId } from "@/lib/samples";

interface Props {
  busy: boolean;
  error: string | null;
  onFile: (file: File) => void;
  onSample: (id: SampleId) => void;
}

export function DropZone({ busy, error, onFile, onSample }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        aria-label="Upload an invoice file"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
            : "border-slate-300 bg-white hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />
        <div className="text-4xl">{busy ? "⏳" : "📄"}</div>
        <p className="text-lg font-semibold">
          {busy ? "Reading your invoice…" : "Drop an invoice here"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          PDF, scan, or a phone photo — we never store your file.
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8">
        <p className="mb-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          …or try a sample
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => onSample(s.id)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-400 hover:shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="text-sm font-semibold">{s.label}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
