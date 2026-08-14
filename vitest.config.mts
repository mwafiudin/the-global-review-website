import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    alias: [
      // Samakan dengan paths di tsconfig.json. Pola "@/" (bukan "@") wajib:
      // tanpa garis miring, @phosphor-icons/react ikut tertelan alias ini.
      { find: /^@\//, replacement: `${fromRoot("./src")}/` },
      // server-only bukan dependency kita — Next meng-alias-nya sendiri saat
      // bundling, jadi di luar Next impornya gagal resolve. Tunjuk shim
      // kosong bawaan Next.
      {
        find: /^server-only$/,
        replacement: fromRoot("./node_modules/next/dist/compiled/server-only/empty.js"),
      },
    ],
  },
});
