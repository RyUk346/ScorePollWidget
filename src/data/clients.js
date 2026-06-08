// Client logos shown in the rotating "Our clients" marquee slide.
// Files live in public/clients/. Edit this list to add/remove logos — names
// must match the files exactly (they're URL-encoded automatically below).
const FILES = [
  "Armaan Foods logo.png",
  "GAfbros logo.jpg",
  "Halal edition logo.jpg",
  "Healand logo-1.png",
  "HQ logo.jpg",
  "LIA logo.png",
  "Liberty logo2.png",
  "MAL logo.png",
  "moins chemist logo.png",
  "NON-CUTOUT No bg Dark Logo with Tagline.png",
  "PAK FOODS logo.png",
  "Radio FM logo.jpg",
  "Stoneycroft Pharmacy logo.png",
  "The Pantry logo.png",
  "UMRAH SUPERMARKET logo.png",
  "US-2605-3P-12S-EID MUBARAK-HR WD-V1.png",
  "WhatsApp Image 2026-06-06 at 2.15.21 PM.jpeg",
  "YM GLOBAL LOGO TRANSPARENT.png",
  "Bru_Full Orange.png",
  "BS.png",
  "logo-no-bg (1).png",
  "logo Istanbul_black.png",
  "logo london_black.png",
  "Peckish-logo-1.png",
  "Plt Logo.png",
  "Logo.png",
];

const CLIENT_LOGOS = FILES.map(
  (f) => `${import.meta.env.BASE_URL}clients/${encodeURIComponent(f)}`,
);

export default CLIENT_LOGOS;
