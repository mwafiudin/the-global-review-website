import { describe, expect, it } from "vitest";
import { kodeSebab } from "./client";

describe("kodeSebab", () => {
  it("mengambil kode dari err.cause undici", () => {
    const err = new TypeError("fetch failed", {
      cause: Object.assign(new Error("Connect Timeout Error"), {
        code: "UND_ERR_CONNECT_TIMEOUT",
      }),
    });
    expect(kodeSebab(err)).toBe(" [UND_ERR_CONNECT_TIMEOUT]");
  });

  it("jatuh ke pesan cause bila tak ada kode", () => {
    const err = new TypeError("fetch failed", { cause: new Error("other side closed") });
    expect(kodeSebab(err)).toBe(" [other side closed]");
  });

  it("kosong untuk galat tanpa cause atau bukan Error", () => {
    expect(kodeSebab(new Error("x"))).toBe("");
    expect(kodeSebab("x")).toBe("");
  });
});
