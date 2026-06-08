// Images for the vote-page carousel. Files live in public/images/.
// Edit this list to add/remove slides — names must match the files exactly
// (they're URL-encoded automatically below).
const FILES = [
  "Screenshot 2026-06-06 152614.png",
  "Screenshot 2026-06-06 152634.png",
  "Screenshot 2026-06-06 152712.png",
  "Screenshot 2026-06-06 152723.png",
  "Screenshot 2026-06-06 152733.png",
  "Screenshot 2026-06-06 152743.png",
  "Screenshot 2026-06-06 152753.png",
  "Screenshot 2026-06-06 152811.png",
  "Screenshot 2026-06-06 152824.png",
  "Screenshot 2026-06-06 152846.png",
  "Screenshot 2026-06-06 152949.png",
  "Screenshot 2026-06-06 153032.png",
  "Screenshot 2026-06-06 153123.png",
  "Screenshot 2026-06-06 153150.png",
  "Screenshot 2026-06-06 153316.png",
  "Screenshot 2026-06-06 153354.png",
  "Screenshot 2026-06-06 153417.png",
  "Screenshot 2026-06-06 153510.png",
  "Screenshot 2026-06-06 153537.png",
  "Screenshot 2026-06-06 153556.png",
  "Screenshot 2026-06-06 153720.png",
  "Screenshot 2026-06-06 154029.png",
  "Screenshot 2026-06-06 154648.png",
  "Screenshot 2026-06-06 154824.png",
  "Screenshot 2026-06-06 154911.png",
];

const CAROUSEL_IMAGES = FILES.map(
  (f) => `${import.meta.env.BASE_URL}images/${encodeURIComponent(f)}`,
);

export default CAROUSEL_IMAGES;
