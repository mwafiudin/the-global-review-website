import type { TranslateProvider } from "./provider";

/**
 * Provider Translator API bawaan Chrome (stabil sejak Chrome 138; desktop
 * saja, pasangan id-en didukung). Model berjalan on-device — nol biaya,
 * teks tidak meninggalkan peramban. create() menuntut interaksi pengguna,
 * jadi hanya boleh dipanggil dari handler klik.
 */

interface ChromeTranslator {
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface TranslatorStatic {
  availability(opts: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<string>;
  create(opts: {
    sourceLanguage: string;
    targetLanguage: string;
    signal?: AbortSignal;
    monitor?: (m: EventTarget) => void;
  }): Promise<ChromeTranslator>;
}

declare global {
  var Translator: TranslatorStatic | undefined;
}

export const chromeTranslatorProvider: TranslateProvider = {
  id: "chrome-builtin",

  async availability(source, target) {
    if (typeof globalThis.Translator === "undefined") return "unavailable";
    try {
      const status = await globalThis.Translator.availability({
        sourceLanguage: source,
        targetLanguage: target,
      });
      if (status === "available") return "available";
      if (status === "downloadable" || status === "downloading")
        return "downloadable";
      return "unavailable";
    } catch {
      return "unavailable";
    }
  },

  async createSession({ source, target, signal, onDownloadProgress }) {
    if (typeof globalThis.Translator === "undefined") {
      throw new Error("Translator API tidak tersedia");
    }
    const translator = await globalThis.Translator.create({
      sourceLanguage: source,
      targetLanguage: target,
      signal,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          onDownloadProgress?.((e as ProgressEvent).loaded);
        });
      },
    });
    return {
      translate: (text) => translator.translate(text),
      destroy: () => translator.destroy(),
    };
  },
};
