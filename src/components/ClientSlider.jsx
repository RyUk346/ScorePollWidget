import CLIENT_LOGOS from "../data/clients.js";

/**
 * Infinite auto-scrolling marquee of client logos. The list is duplicated so
 * the animation (translateX -50%) loops seamlessly. Each logo sits on a white
 * chip so dark/transparent logos stay visible on the glass widget.
 * Sizes scale with the `.big` ancestor (the /4k route).
 */
export default function ClientSlider() {
  const row = [...CLIENT_LOGOS, ...CLIENT_LOGOS];
  return (
    <div className="w-full flex flex-col justify-center gap-2">
      {/* <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted [.big_&]:text-[20px]">
        Our clients
      </p> */}
      <div className="overflow-hidden w-full">
        <div className="flex w-max items-center gap-4 animate-marquee [.big_&]:gap-8">
          {row.map((src, i) => (
            <div
              key={i}
              className="shrink-0 w-36 h-16 bg-white rounded-xl p-2 flex items-center justify-center [.big_&]:w-64 [.big_&]:h-28 [.big_&]:p-4 [.big_&]:rounded-2xl"
            >
              <img
                src={src}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
