/**
 * Kontrak mesin terjemah isi artikel. Implementasi saat ini on-device
 * (Chrome Translator API); implementasi server-side (mis. terjemahan
 * tersimpan di post meta WordPress) kelak menggantikannya tanpa menyentuh
 * routing maupun komponen — cukup tukar provider di titik pakai.
 */

export type TranslateAvailability = "unavailable" | "downloadable" | "available";

export interface TranslateSession {
  translate(text: string): Promise<string>;
  destroy(): void;
}

export interface TranslateProvider {
  id: string;
  availability(source: string, target: string): Promise<TranslateAvailability>;
  createSession(opts: {
    source: string;
    target: string;
    signal?: AbortSignal;
    /** Kemajuan unduh model 0..1 — hanya terpicu bila model perlu diunduh. */
    onDownloadProgress?: (loadedFraction: number) => void;
  }): Promise<TranslateSession>;
}
