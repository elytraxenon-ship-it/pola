// Official list of Recognized Cities and Towns across Kurdistan
export const VALID_KURDISH_CITIES = [
  "هەولێر",
  "سلێمانی",
  "دهۆک",
  "کەرکووک",
  "کەرکوک",
  "هەڵەبجە",
  "ڕانیە",
  "کەلار",
  "زاخۆ",
  "سۆران",
  "کۆیە",
  "چەمچەماڵ",
  "ئامێدی",
  "شەقڵاوە",
  "ڕەواندز",
  "عەقرە",
  "ئاکرێ",
  "خانەقین",
  "کفری",
  "پێنجوێن",
  "دەربەندیخان",
  "بەردەڕەش",
  "سێمێل",
  "چۆمان",
  "قەڵادزێ",
  "مەخموور",
  "سەیدسادق",
  "دووکان",
  "شێخان",
  "بەرزان",
  "پیرمام",
  "بازیان",
  "تەکیە",
  "بەحرکە",
  "کەسنەزان",
] as const;

export type KurdishCity = (typeof VALID_KURDISH_CITIES)[number];

// Standard formatted locations: "شار، کوردستان" (deduplicated display list)
export const VALID_LOCATIONS = [
  "هەولێر، کوردستان",
  "سلێمانی، کوردستان",
  "دهۆک، کوردستان",
  "کەرکووک، کوردستان",
  "هەڵەبجە، کوردستان",
  "ڕانیە، کوردستان",
  "کەلار، کوردستان",
  "زاخۆ، کوردستان",
  "سۆران، کوردستان",
  "کۆیە، کوردستان",
  "چەمچەماڵ، کوردستان",
  "ئاکرێ، کوردستان",
  "ئامێدی، کوردستان",
  "شەقڵاوە، کوردستان",
  "ڕەواندز، کوردستان",
  "خانەقین، کوردستان",
  "دەربەندیخان، کوردستان",
  "پێنجوێن، کوردستان",
  "دووکان، کوردستان",
];

// Normalize text for matching (replaces Arabic Kaf with Kurdish Kaf, normalizes spaces, etc.)
function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/ك/g, "ک")
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ھ/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * Validates that a location string strictly adheres to the rule:
 * Must be in the format: "شار، کوردستان" where شار is a valid recognized city in Kurdistan.
 * Rejects any Latin characters, symbols, numbers, or non-matching cities.
 */
export function isValidKurdishLocation(location: string): boolean {
  if (!location || typeof location !== "string") return false;

  // STRICT RULE: Reject any Latin characters (e.g. "utjtjuttj", "Erbil", etc.)
  if (/[a-zA-Z0-9<>{}\[\]\$\^\*\+=_\\\/@#]/.test(location)) return false;

  const normalized = normalizeText(location);

  // Must end with "، کوردستان" or ", کوردستان"
  const pattern = /^(.+?)[،,]\s*کوردستان$/;
  const match = normalized.match(pattern);

  if (!match) return false;

  let cityPart = normalizeText(match[1]);
  // Strip optional prefix "شاری "
  cityPart = cityPart.replace(/^شاری\s+/, "").trim();

  // City part must not be empty or generic "کوردستان"
  if (!cityPart || cityPart === "کوردستان" || cityPart.length < 2) return false;

  // Check if city exactly matches one of the recognized Kurdish cities
  return VALID_KURDISH_CITIES.some((validCity) => {
    return cityPart === normalizeText(validCity);
  });
}

/**
 * Tries to extract and format a valid location string into standard "شار، کوردستان".
 * Returns null if the input contains Latin letters, garbage, or is not a valid Kurdish city.
 */
export function sanitizeKurdishLocation(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  // Reject any Latin characters or numbers immediately
  if (/[a-zA-Z0-9<>{}\[\]\$\^\*\+=_\\\/@#]/.test(input)) return null;

  const normalized = normalizeText(input);

  // Check if it already matches the full format
  if (isValidKurdishLocation(input)) {
    const match = normalized.match(/^(.+?)[،,]\s*کوردستان$/);
    if (match) {
      let cityPart = normalizeText(match[1]).replace(/^شاری\s+/, "").trim();
      const foundCity = VALID_KURDISH_CITIES.find(
        (c) => normalizeText(c) === cityPart
      );
      if (foundCity) {
        // Standardize alternative spellings: "کەرکوک" -> "کەرکووک"
        const standardCity = foundCity === "کەرکوک" ? "کەرکووک" : foundCity;
        return `${standardCity}، کوردستان`;
      }
    }
  }

  // Check if user entered just the city name (e.g. "هەولێر" or "شاری سلێمانی")
  const cityOnly = normalized
    .replace(/[،,]\s*کوردستان$/, "")
    .replace(/\s*کوردستان$/, "")
    .replace(/^شاری\s+/, "")
    .trim();

  if (cityOnly && cityOnly !== "کوردستان") {
    const matchedCity = VALID_KURDISH_CITIES.find(
      (c) => normalizeText(c) === cityOnly
    );

    if (matchedCity) {
      const standardCity = matchedCity === "کەرکوک" ? "کەرکووک" : matchedCity;
      return `${standardCity}، کوردستان`;
    }
  }

  return null;
}
