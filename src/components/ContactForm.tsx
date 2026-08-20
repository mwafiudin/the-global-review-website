"use client";

import { useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { useLang } from "@/lib/i18n";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-meta focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");
  const { lang, t } = useLang();

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mengirim) return;
    setMengirim(true);
    setGalat("");
    const isi = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: isi.get("nama"),
          email: isi.get("email"),
          telepon: isi.get("telepon"),
          subjek: isi.get("subjek"),
          pesan: isi.get("pesan"),
          // Umpan bot: kolom tersembunyi yang tak pernah diisi manusia.
          situs: isi.get("situs"),
          sumber: window.location.pathname,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // Pesan server berbahasa Indonesia; kamus memetakannya saat EN.
        setGalat(data.error ? t(data.error) : t("Pesan gagal terkirim, coba lagi nanti."));
        return;
      }
      setSent(true);
    } catch {
      setGalat(t("Pesan gagal terkirim, coba lagi nanti."));
    } finally {
      setMengirim(false);
    }
  }

  if (sent) {
    return (
      // translate="no" di /en: pagar dari widget terjemah Google (lihat Search).
      <div
        translate={lang === "en" ? "no" : undefined}
        className="rounded-xl border border-line bg-surface p-8 text-center"
      >
        <CheckCircle size={40} weight="light" className="mx-auto text-accent" />
        <p className="mt-4 font-display text-lg font-bold text-ink">
          {t("Pesan Anda telah terkirim")}
        </p>
        <p className="mt-2 text-sm text-meta">
          {t("Terima kasih. Redaksi akan merespons melalui email yang Anda cantumkan.")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={kirim}
      translate={lang === "en" ? "no" : undefined}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="nama"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            {t("Nama")} <span className="text-accent">*</span>
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
            {t("Telepon")}
          </label>
          <input id="telepon" name="telepon" type="tel" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="subjek"
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            {t("Subjek")}
          </label>
          <select
            id="subjek"
            name="subjek"
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              {t("Pilih subjek…")}
            </option>
            {/* value tetap Indonesia (label boleh EN): nilainya diperiksa
                terhadap daftar subjek resmi di API & wp-admin. */}
            <option value="Redaksi & Hak Jawab">{t("Redaksi & Hak Jawab")}</option>
            <option value="Kerja Sama & Kemitraan">{t("Kerja Sama & Kemitraan")}</option>
            <option value="Pertanyaan Umum">{t("Pertanyaan Umum")}</option>
            <option value="Lainnya">{t("Lainnya")}</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="pesan"
          className="block text-xs font-bold uppercase tracking-wider text-ink"
        >
          {t("Pesan")} <span className="text-accent">*</span>
        </label>
        <textarea id="pesan" name="pesan" rows={6} required className={inputClass} />
      </div>
      {/* Umpan bot: disembunyikan dari mata dan dari pembaca layar. */}
      <input
        type="text"
        name="situs"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg border border-ink bg-surface px-7 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-surface active:scale-[0.98] disabled:opacity-60"
      >
        {t("Kirim Pesan")}
      </button>
      {galat && <p className="mt-2 text-sm text-meta">{galat}</p>}
    </form>
  );
}
