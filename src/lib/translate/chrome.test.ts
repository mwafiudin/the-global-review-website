import { afterEach, describe, expect, it, vi } from "vitest";
import { chromeTranslatorProvider } from "./chrome";

/** Tiruan minimal global Translator milik Chrome. */
function pasangTranslator(mock: Partial<typeof globalThis.Translator>) {
  globalThis.Translator = mock as typeof globalThis.Translator;
}

afterEach(() => {
  delete (globalThis as { Translator?: unknown }).Translator;
});

describe("chromeTranslatorProvider.availability", () => {
  it("unavailable bila global Translator tidak ada", async () => {
    expect(await chromeTranslatorProvider.availability("id", "en")).toBe(
      "unavailable"
    );
  });

  it("memetakan status Chrome ke tiga nilai kontrak", async () => {
    for (const [chrome, kita] of [
      ["available", "available"],
      ["downloadable", "downloadable"],
      ["downloading", "downloadable"],
      ["unavailable", "unavailable"],
      ["nilai-aneh-masa-depan", "unavailable"],
    ] as const) {
      pasangTranslator({ availability: async () => chrome });
      expect(await chromeTranslatorProvider.availability("id", "en")).toBe(kita);
    }
  });

  it("availability yang melempar dianggap unavailable, bukan crash", async () => {
    pasangTranslator({
      availability: async () => {
        throw new Error("boom");
      },
    });
    expect(await chromeTranslatorProvider.availability("id", "en")).toBe(
      "unavailable"
    );
  });
});

describe("chromeTranslatorProvider.createSession", () => {
  it("meneruskan pasangan bahasa + signal, dan mengalirkan downloadprogress", async () => {
    const create = vi.fn(
      async (opts: {
        sourceLanguage: string;
        targetLanguage: string;
        monitor?: (m: EventTarget) => void;
      }) => {
        const target = new EventTarget();
        opts.monitor?.(target);
        // Simulasikan unduhan model 40%
        const e = new Event("downloadprogress") as Event & { loaded: number };
        e.loaded = 0.4;
        target.dispatchEvent(e);
        return {
          translate: async (t: string) => `EN:${t}`,
          destroy: vi.fn(),
        };
      }
    );
    pasangTranslator({ availability: async () => "available", create });

    const ctrl = new AbortController();
    const progres: number[] = [];
    const session = await chromeTranslatorProvider.createSession({
      source: "id",
      target: "en",
      signal: ctrl.signal,
      onDownloadProgress: (p) => progres.push(p),
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLanguage: "id",
        targetLanguage: "en",
        signal: ctrl.signal,
      })
    );
    expect(progres).toEqual([0.4]);
    expect(await session.translate("halo")).toBe("EN:halo");
  });

  it("destroy mendelegasikan ke translator Chrome", async () => {
    const destroy = vi.fn();
    pasangTranslator({
      create: async () => ({ translate: async (t: string) => t, destroy }),
    });
    const session = await chromeTranslatorProvider.createSession({
      source: "id",
      target: "en",
    });
    session.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("melempar jelas bila API tidak ada (bukan TypeError samar)", async () => {
    await expect(
      chromeTranslatorProvider.createSession({ source: "id", target: "en" })
    ).rejects.toThrow("Translator API tidak tersedia");
  });
});
