import { QRCodeCanvas } from "qrcode.react";

/**
 * QR code that points to the voting page for a specific match. Viewers scan it
 * with their phone's built-in camera to open `/vote?m=<matchId>`.
 *
 * The encoded URL must be reachable from the phone, so we use VITE_PUBLIC_URL
 * (your deployed/hosting domain) if set, otherwise the address the app is
 * served on. `compact` renders just the code + a tiny label for the widget bar.
 */
export default function VoteQRCode({ matchId, size = 180, compact = false }) {
  // Prefer VITE_PUBLIC_URL (should include any subpath, e.g.
  // https://host/hg_score_poll). Otherwise build it from the current origin +
  // the app's base path so it works under a subpath without extra config.
  const base = (
    import.meta.env.VITE_PUBLIC_URL ||
    window.location.origin + import.meta.env.BASE_URL
  ).replace(/\/$/, "");
  const voteUrl = matchId
    ? `${base}/vote?m=${encodeURIComponent(matchId)}`
    : `${base}/vote`;

  // Center badge size (~30% of the code). Level "H" recovers ~30% of the
  // modules, so a small centered logo over the middle still scans fine.
  const badge = Math.round(size * 0.3);

  const code = (
    <div className="relative bg-white rounded-lg p-1.5 leading-none">
      <QRCodeCanvas
        value={voteUrl}
        size={size}
        level="H"
        bgColor="#ffffff"
        fgColor="#0b1020"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Scan-frame icon with the label inside it */}
        <div
          className="relative flex items-center justify-center bg-white rounded-md shadow-sm"
          style={{ width: badge, height: badge }}
        >
          <svg
            viewBox="0 0 40 40"
            width={badge}
            height={badge}
            fill="none"
            stroke="#0b1020"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="absolute inset-0"
          >
            <path d="M5 13V7a2 2 0 0 1 2-2h6" />
            <path d="M27 5h6a2 2 0 0 1 2 2v6" />
            <path d="M35 27v6a2 2 0 0 1-2 2h-6" />
            <path d="M13 35H7a2 2 0 0 1-2-2v-6" />
          </svg>
          <span
            className="relative font-extrabold text-[#0b1020] tracking-tight leading-none text-center"
            style={{ fontSize: Math.max(6, Math.round(badge * 0.2)) }}
          >
            SCAN
            <br /> ME
          </span>
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1">
        {/* <span className="text-[11px] font-semibold tracking-wide text-muted">
          Scan and Support Your Team!
        </span> */}
        {code}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {code}
      <div className="flex flex-col gap-1">
        <strong className="text-ink">Scan and Support Your Team!</strong>
        <span className="text-sm text-muted">
          Open your phone camera and point it here
        </span>
        <a className="text-xs text-accent break-all" href={voteUrl}>
          {voteUrl}
        </a>
      </div>
    </div>
  );
}
