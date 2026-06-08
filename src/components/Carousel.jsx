import { useEffect, useRef, useState } from "react";

/**
 * Carousel: centre image shown full-size, overlapping the two dimmed neighbours.
 * Auto-advances, and supports touch swipe:
 *   swipe left  -> previous slide
 *   swipe right -> next slide
 * The incoming centre image animates in from the matching side.
 */
export default function Carousel({ images, intervalMs = 3500 }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1); // 1 = next (from right), -1 = previous (from left)
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);

  const go = (delta) => {
    setDir(delta);
    setI((p) => (p + delta + images.length) % images.length);
  };

  // Re-scheduled on every slide change, so a manual swipe resets the timer.
  // Skipped while hovered (paused), which holds the carousel.
  useEffect(() => {
    if (images.length < 2 || paused) return;
    const id = setTimeout(() => {
      setDir(1);
      setI((p) => (p + 1) % images.length);
    }, intervalMs);
    return () => clearTimeout(id);
  }, [i, paused, images.length, intervalMs]);

  if (!images.length) return null;
  const n = images.length;
  const prev = images[(i - 1 + n) % n];
  const cur = images[i];
  const next = images[(i + 1) % n];

  // Click right half -> next, left half -> previous (no visible buttons).
  const onClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    go(x > rect.width / 2 ? 1 : -1);
  };

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 30) return; // ignore taps / tiny moves
    if (dx < 0)
      go(1); // swiped left -> next
    else go(-1); // swiped right -> previous
  };

  return (
    <div
      className="relative my-6 flex items-center justify-center h-72 w-full overflow-hidden select-none cursor-pointer"
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        key={`p${i}`}
        src={prev}
        alt=""
        className="h-40 w-auto max-w-[26%] object-contain rounded-lg opacity-40"
      />
      <img
        key={`c${i}`}
        src={cur}
        alt=""
        className={`relative z-10 h-72 w-auto max-w-[56%] object-contain rounded-xl shadow-2xl -mx-8 ${
          dir >= 0 ? "animate-slide-right" : "animate-slide-left"
        }`}
      />
      <img
        key={`n${i}`}
        src={next}
        alt=""
        className="h-40 w-auto max-w-[26%] object-contain rounded-lg opacity-40"
      />
    </div>
  );
}
