import { BlockList, isIP } from "node:net";

/**
 * Alamat IP pembaca di belakang Cloudflare → Railway.
 *
 * `x-forwarded-for` tidak bisa dipercaya mentah-mentah: Cloudflare
 * MENAMBAHKAN alamat ke rantai yang dikirim klien, bukan menimpanya, jadi
 * entri pertama adalah apa pun yang ditulis pengirim. Yang bisa dipegang:
 * entri paling kanan = peer TCP yang dilihat proxy terakhir (Railway), dan
 * `cf-connecting-ip` hanya berarti bila peer itu memang Cloudflare.
 *
 * Nilainya dipakai sebagai kunci rate limit di sini dan diteruskan ke
 * WordPress (header `X-TGR-Client-IP`) supaya gerbang per-IP di mu-plugin
 * tidak melihat semua pembaca sebagai satu alamat egress Railway.
 */

/** Rentang IP Cloudflare — cloudflare.com/ips (diperiksa September 2026). */
const RENTANG_CLOUDFLARE = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

const cloudflare = new BlockList();
for (const cidr of RENTANG_CLOUDFLARE) {
  const [jaringan, prefiks] = cidr.split("/");
  cloudflare.addSubnet(jaringan, Number(prefiks), isIP(jaringan) === 6 ? "ipv6" : "ipv4");
}

export function dariCloudflare(ip: string): boolean {
  const versi = isIP(ip);
  return versi !== 0 && cloudflare.check(ip, versi === 6 ? "ipv6" : "ipv4");
}

/** IP pembaca, atau null bila tidak ada header proxy yang bisa dipercaya. */
export function alamatKlien(headers: Headers): string | null {
  const rantai = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const peer = rantai[rantai.length - 1] ?? headers.get("x-real-ip")?.trim() ?? "";
  if (!isIP(peer)) return null;

  const cf = headers.get("cf-connecting-ip")?.trim() ?? "";
  if (cf && isIP(cf) && dariCloudflare(peer)) return cf;
  return peer;
}
