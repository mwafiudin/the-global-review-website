import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Poll } from "@/data/polls";
import { isPollClosed, pollTotal } from "./polls";

const poll = (over: Partial<Poll> = {}): Poll => ({
  id: "poll-uji",
  wpId: 1,
  articleSlug: "artikel-uji",
  question: "Setuju?",
  options: [
    { id: "ya", label: "Ya", base: 10, suara: 2 },
    { id: "tidak", label: "Tidak", base: 5 },
  ],
  date: "2026-08-01",
  ...over,
});

describe("isPollClosed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tanpa tanggal tutup: tidak pernah ditutup", () => {
    expect(isPollClosed(poll())).toBe(false);
  });

  it("batas tutup mengikuti tengah malam WIB, bukan zona server", () => {
    // Gerbang suara mu-plugin menutup pukul 23:59:59 WIB = 16:59:59 UTC.
    // Server Vercel berzona UTC — tanpa offset eksplisit, poll tampak
    // masih buka 7 jam sementara WordPress sudah menolak suaranya (409).
    const p = poll({ closesAt: "2026-08-25" });
    vi.setSystemTime(new Date("2026-08-25T16:59:00Z")); // 23:59 WIB
    expect(isPollClosed(p)).toBe(false);
    vi.setSystemTime(new Date("2026-08-25T17:00:01Z")); // 00:00:01 WIB (26/8)
    expect(isPollClosed(p)).toBe(true);
  });
});

describe("pollTotal", () => {
  it("menjumlahkan suara awal redaksi + suara pembaca", () => {
    expect(pollTotal(poll())).toBe(17);
  });
});
