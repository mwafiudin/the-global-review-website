"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-meta focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <CheckCircle size={40} weight="light" className="mx-auto text-accent" />
        <p className="mt-4 font-display text-lg font-bold text-ink">
          Pesan Anda telah terkirim
        </p>
        <p className="mt-2 text-sm text-meta">
          Terima kasih. Redaksi akan merespons melalui email yang Anda
          cantumkan.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="nama"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            Nama <span className="text-accent">*</span>
          </label>
          <input id="nama" name="nama" type="text" required className={inputClass} />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            Email <span className="text-accent">*</span>
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="telepon"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            Telepon
          </label>
          <input id="telepon" name="telepon" type="tel" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="subjek"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            Subjek
          </label>
          <select
            id="subjek"
            name="subjek"
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Pilih subjek…
            </option>
            <option>Redaksi &amp; Hak Jawab</option>
            <option>Kerja Sama &amp; Kemitraan</option>
            <option>Pertanyaan Umum</option>
            <option>Lainnya</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="pesan"
          className="block text-xs font-bold uppercase tracking-wider text-ink"
        >
          Pesan <span className="text-accent">*</span>
        </label>
        <textarea id="pesan" name="pesan" rows={6} required className={inputClass} />
      </div>
      <button
        type="submit"
        className="rounded-lg border border-ink bg-surface px-7 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface active:scale-[0.98]"
      >
        Kirim Pesan
      </button>
    </form>
  );
}
