This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/[lang]/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load Montserrat and Cardo (see `src/app/[lang]/layout.tsx`).

## Pengembangan

Node 22 (lihat `.nvmrc`). Salin `.env.example` ke `.env.local` sebelum
`npm run dev` — `WP_API_URL` wajib terisi.

| Perintah | Isi |
| --- | --- |
| `npm run dev` | Server pengembangan di <http://localhost:3000> |
| `npm run lint` | ESLint, warning dihitung sebagai kegagalan |
| `npm run typecheck` | `next typegen` lalu `tsc --noEmit` |
| `npm test` | Unit test Vitest (`src/**/*.test.ts`, semuanya offline) |
| `npm run build` | Build produksi (menghubungi WordPress) |
| `npm run ikon` | Regenerasi favicon dkk dari `public/tgr-gold-compass.svg` |

Ikon situs (`icon.svg`, `favicon.ico`, `apple-icon.png`, dan ikon manifest)
adalah keluaran `npm run ikon` — jangan disunting satu per satu; ubah SVG
kompasnya lalu jalankan ulang perintah itu.

Sebelum push, jalankan gate yang sama dengan CI:

```bash
npm run lint && npm run typecheck && npm test
```

Rinciannya di [`docs/ci.md`](docs/ci.md). Integrasi WordPress-nya di
[`docs/integrasi-wordpress.md`](docs/integrasi-wordpress.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Produksi berjalan di Railway (Node server `next start`, satu replica) di
belakang Cloudflare; `railway.json` memuat konfigurasi build/deploy-nya.
Runbook lengkap — variabel, deploy `railway up`, log, rollback, domain,
setelan Cloudflare — ada di [`docs/hosting-railway.md`](docs/hosting-railway.md).
