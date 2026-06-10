// Images for the vote-page carousel. Files live in public/images/.
// Edit this list to add/remove slides — names must match the files exactly
// (they're URL-encoded automatically below).
const FILES = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png",
  "11.png",
  "12.png",
];

const CAROUSEL_IMAGES = FILES.map(
  (f) => `${import.meta.env.BASE_URL}images/${encodeURIComponent(f)}`,
);

export default CAROUSEL_IMAGES;
