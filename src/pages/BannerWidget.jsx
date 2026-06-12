/* ---------------------------------------------------------------------------
 * Banner widget — just the banner image, nothing else. The widget IS the image:
 * it's rendered at a fixed height (the width follows the image's own aspect
 * ratio), so there's no white space, box, or cropping around it.
 *   /banner/2k  -> 170px tall  (2k screen)
 *   /banner/4k  -> 340px tall  (4k screen)
 * Background stays transparent so it can overlay a stream/background, like the
 * main widget. Drop the image at public/banner/.
 * ------------------------------------------------------------------------- */
const BANNER = `${import.meta.env.BASE_URL}banner/${encodeURIComponent(
  "COMING FOR HOME BANNER.png",
)}`;

export default function BannerWidget({ big = false }) {
  const height = big ? 340 : 170;
  return (
    <img
      src={BANNER}
      alt="Coming Home"
      style={{ height }}
      className="block w-auto animate-banner-loop"
    />
  );
}
