# syntax=docker/dockerfile:1
# Image untuk self-host (server sendiri di belakang Cloudflare Tunnel + Caddy).
# Railway tidak membaca berkas ini: Railpack tetap membangun dari
# package.json dan menjalankan startCommand di railway.json. Cara pakai,
# env, dan alasannya di docs/self-host.md.
#
# Tiga tahap supaya image akhir hanya berisi server.js standalone dan
# node_modules yang dilacak Next, tanpa devDependencies dan kode sumber.
#
# Base image dipaku ke digest: tag 22-bookworm-slim digeser tiap rilis
# Node/Debian, jadi build yang sama bisa menarik isi berbeda. Digest-nya
# indeks multi-arch. Menaikkan versi = ganti ketiga baris FROM sekaligus
# dengan hasil `docker buildx imagetools inspect node:22-bookworm-slim`.

FROM node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Termasuk devDependencies: sharp ada di sana, dan Next menyalinnya ke
# standalone untuk optimasi gambar.
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build mem-prerender /, /redaksi, sitemap, dan feed dari REST
# WordPress, jadi WP_API_URL wajib ada saat build. Keduanya bukan rahasia
# (URL publik dan tanggal), jadi aman sebagai ARG yang tercatat di riwayat
# image. REVALIDATE_SECRET tidak dibutuhkan build dan tidak boleh lewat ARG.
ARG WP_API_URL=https://cms.theglobal-review.com/wp-json
ARG WP_ARCHIVE_AFTER=2022-12-31T23:59:59
ENV NEXT_OUTPUT=standalone     NEXT_TELEMETRY_DISABLED=1
RUN WP_API_URL="$WP_API_URL" WP_ARCHIVE_AFTER="$WP_ARCHIVE_AFTER" npm run build

FROM node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS jalan
WORKDIR /app
# MALLOC_ARENA_MAX=2: alasan sama dengan variabel di Railway
# (docs/hosting-railway.md §3), RSS glibc menggelembung di luar heap V8.
ENV NODE_ENV=production     NEXT_TELEMETRY_DISABLED=1     PORT=3000     HOSTNAME=0.0.0.0     MALLOC_ARENA_MAX=2
# Kode (server.js, node_modules, public) milik root dan hanya bisa dibaca
# user node. Pengecualiannya .next: cache ISR, fetch-cache, dan gambar hasil
# optimasi ditulis ke .next/server/app dan .next/cache saat jalan, jadi
# direktori itu harus milik node. Tanpa ini setiap revalidasi gagal menulis
# ke disk dan cache hanya hidup di memori (50 MB).
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/standalone/.next ./.next
COPY --from=build --chown=node:node /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
# fetch bawaan Node 22, karena image slim tidak membawa curl/wget.
# /api/health tidak menyentuh WordPress, jadi WP yang lambat tidak membuat
# container ditandai mati lalu di-restart dengan cache kosong.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3   CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
# Bentuk exec: node jadi PID 1 dan menerima SIGTERM langsung. Batas heap
# sama dengan startCommand railway.json (docs/hosting-railway.md §2); sengaja
# di CMD, bukan NODE_OPTIONS, supaya tidak ikut terbaca proses lain.
CMD ["node", "--max-old-space-size=512", "server.js"]
