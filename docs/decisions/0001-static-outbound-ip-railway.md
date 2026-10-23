# 0001. Static Outbound IP Railway untuk akses ke WordPress

- Tanggal: 23 Okt 2026
- Status: Accepted

## Konteks

Frontend (Railway, service `web`) mengambil semua isi dari WordPress di
shared host webiihost (`cms.theglobal-review.com`, 172.236.131.177). IP
keluar Railway berasal dari pool bersama dan bisa berganti saat redeploy.
23 Okt 2026 firewall host (CSF/lfd) memblok IP keluar itu, sehingga tulisan
baru tidak tampil (docs/insiden/2026-10-23-egress-railway-diblok.md, COD-43).
Whitelist di host tidak berguna selama IP-nya bisa berubah.

## Opsi

1. **Static Outbound IP Railway + whitelist di host.** Termasuk paket Pro;
   IPv4 tetap, bisa dipakai bersama pelanggan Railway lain.
2. **Minta unblock IP saat ini saja.** Tanpa biaya, tapi IP berganti saat
   redeploy dan blokir bisa terulang tanpa jejak.
3. **Percepat pindah ke VPS sendiri (COD-42).** Menghapus masalah firewall
   shared host, tapi butuh berminggu-minggu.

## Keputusan

Opsi 1 (diputuskan oleh: Farrez).

## Alasan

"Supaya whitelist tidak hilang setiap kali Railway redeploy."

## Konsekuensi

- IP keluar tetap: 208.77.246.240, 208.77.246.241, 208.77.246.242 (mode
  HA, region sin). Aktif setelah redeploy berikutnya.
- Ketiganya diminta masuk whitelist webiihost. IP bisa dipakai bersama
  pelanggan Railway lain, jadi whitelist dibatasi ke port 443 dan lfd-ignore,
  bukan allow semua port, supaya proteksi ModSecurity tetap berlaku.
- Tinjau ulang bila: pindah ke VPS (COD-42) selesai, Railway mengubah
  syarat static IP, atau whitelist ternyata tidak mencegah blokir.
