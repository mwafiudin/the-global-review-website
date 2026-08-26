import Image from "@/components/ImageWithFallback";

/** Ambil inisial dari nama (maks 2 huruf). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Avatar penulis: foto bila ada, jika tidak tampilkan monogram inisial
 * di atas latar netral. Ukuran diatur lewat className (mis. h-12 w-12).
 */
export function Avatar({
  name,
  src,
  className = "h-12 w-12",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`Foto ${name}`}
        width={96}
        height={96}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-canvas font-display text-sm font-bold tracking-wide text-meta ring-1 ring-inset ring-line`}
    >
      {initials(name)}
    </span>
  );
}
