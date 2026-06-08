import { useState } from "react";

/**
 * Loading state shown while the live fixtures are being fetched, so the static
 * fallback data never flashes on screen. Uses the World Cup 2026 logo with a
 * spinning ring + gentle pulse (falls back to a "2026" mark if the image is
 * missing).
 */
export default function Loader({ label = "Loading fixtures…" }) {
  const [ok, setOk] = useState(true);
  const logoUrl = `${import.meta.env.BASE_URL}fifa_2026.png`;
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center w-28 h-28 [.big_&]:w-44 [.big_&]:h-44">
        <span className="absolute inset-0 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
        {ok ? (
          <img
            src={logoUrl}
            onError={() => setOk(false)}
            alt="FIFA World Cup 2026"
            className="h-16 [.big_&]:h-28 object-contain animate-pulse drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          />
        ) : (
          <span className="text-accent font-black text-2xl animate-pulse">
            2026
          </span>
        )}
      </div>
      <span className="text-[11px] tracking-[0.3em] uppercase text-muted [.big_&]:text-[18px]">
        {label}
      </span>
    </div>
  );
}
