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
        className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-all duration-200 ${
          dragging
            ? "scale-[1.01] border-violet-500 bg-violet-500/10 shadow-[0_0_0_6px_rgba(139,92,246,0.12)]"
            : "glass border-slate-300/70 hover:border-violet-400 dark:border-slate-600/70"
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
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-3xl text-white shadow-lg shadow-violet-500/30 ${
            busy ? "animate-pulse" : "animate-float group-hover:scale-105"
          } transition-transform`}
        >
          {busy ? "⏳" : "↑"}
        </div>
        <p className="text-xl font-semibold">
          {busy ? "Reading your invoice…" : "Drop an invoice here"}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          PDF, scan, or a phone photo. We never store your file.
        </p>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8">
        <p className="mb-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          …or try a sample
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((s, i) => (
            <button
              key={s.id}
              disabled={busy}
              onClick={() => onSample(s.id)}
              className="glass lift group relative overflow-hidden rounded-2xl p-4 text-left hover:border-violet-400 disabled:opacity-50"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="text-lg">{["📄", "⚠️", "📷"][i]}</div>
              <div className="mt-1.5 text-sm font-semibold">{s.label}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
