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
  const base =
    import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, "") ||
    window.location.origin;
  const voteUrl = matchId
    ? `${base}/vote?m=${encodeURIComponent(matchId)}`
    : `${base}/vote`;

  const code = (
    <div className="bg-white rounded-lg p-1.5 leading-none">
      <QRCodeCanvas
        value={voteUrl}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#0b1020"
      />
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-muted">
          Scan and Support Your Team!
        </span>
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
