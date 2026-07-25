import type { Icon } from "@phosphor-icons/react";
import {
  Article,
  Atom,
  Broadcast,
  ChartLineUp,
  GlobeHemisphereWest,
  GlobeStand,
  Handshake,
  Heartbeat,
  Leaf,
  MagnifyingGlass,
  PaintBrush,
  Scales,
  ShieldCheck,
  UserFocus,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

/** Ikon watermark kontekstual per rubrik (dipakai di PageHeader). */
const CATEGORY_ICONS: Record<string, Icon> = {
  analisis: MagnifyingGlass, // riset / telaah
  internasional: GlobeHemisphereWest, // kawasan dunia
  diplomasi: Handshake, // hubungan antarnegara
  "politik-keamanan": ShieldCheck, // pertahanan & keamanan
  geopolitik: GlobeStand, // peta kekuatan global
  "ekonomi-bisnis": ChartLineUp, // pertumbuhan & pasar
  hukum: Scales, // keadilan
  sosial: UsersThree, // masyarakat
  budaya: PaintBrush, // seni & budaya
  "lingkungan-hidup": Leaf, // alam
  "sains-teknologi": Atom, // iptek
  kesehatan: Heartbeat, // kesehatan
  "sorot-tokoh": UserFocus, // profil tokoh
  features: Article, // liputan panjang
  media: Broadcast, // media & siaran
};

/** Ambil ikon rubrik; sub-rubrik mewarisi ikon induknya (mis. internasional/asia-timur). */
export function categoryIcon(slug: string): Icon | undefined {
  return CATEGORY_ICONS[slug] ?? CATEGORY_ICONS[slug.split("/")[0]];
}
