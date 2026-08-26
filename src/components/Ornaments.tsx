import Image from "@/components/ImageWithFallback";

/** Pembatas ornamental: hairline dengan kompas emas di tengah. */
export function CompassDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-5 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <Image
        src="/tgr-gold-compass.svg"
        alt=""
        width={22}
        height={22}
        className="h-5 w-5"
      />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Penutup artikel: kompas kecil + garis, seperti end mark majalah. */
export function EndMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden>
      <Image
        src="/tgr-gold-compass.svg"
        alt=""
        width={20}
        height={20}
        className="h-[18px] w-[18px]"
      />
      <span className="h-px w-16 bg-line" />
    </div>
  );
}

/** Penanda list bergaya mata kompas (belah ketupat emas). */
export function CompassPoint() {
  return (
    <span
      className="mt-[11px] h-1.5 w-1.5 shrink-0 rotate-45 bg-brand"
      aria-hidden
    />
  );
}
