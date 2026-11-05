import { Temporal } from "temporal-polyfill";
import type { TimeZoneOption } from "./types";

// Some runtimes (ICU in Node 22 and older browsers) report a few zones by their
// pre-rename IANA names. Map them to the current names so ids are stable everywhere.
const LEGACY_TO_CURRENT: Record<string, string> = {
  "Africa/Asmera": "Africa/Asmara",
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "America/Catamarca": "America/Argentina/Catamarca",
  "America/Cordoba": "America/Argentina/Cordoba",
  "America/Godthab": "America/Nuuk",
  "America/Indianapolis": "America/Indiana/Indianapolis",
  "America/Jujuy": "America/Argentina/Jujuy",
  "America/Louisville": "America/Kentucky/Louisville",
  "America/Mendoza": "America/Argentina/Mendoza",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Atlantic/Faeroe": "Atlantic/Faroe",
  "Europe/Kiev": "Europe/Kyiv",
  "Pacific/Enderbury": "Pacific/Kanton",
  "Pacific/Ponape": "Pacific/Pohnpei",
  "Pacific/Truk": "Pacific/Chuuk",
};

// Search terms people commonly type that are not part of a zone's name or city.
// The first id listed for a term is the one ranked first.
const ALIASES: Record<string, string[]> = {
  "mountain time": ["America/Denver"],
  "central time": ["America/Chicago"],
  "eastern time": ["America/New_York"],
  "pacific time": ["America/Los_Angeles"],
  "alaska time": ["America/Anchorage"],
  "hawaii time": ["Pacific/Honolulu"],
  utah: ["America/Denver"],
  idaho: ["America/Boise"],
  arizona: ["America/Phoenix"],
  "united states": ["America/Denver", "America/New_York", "America/Chicago", "America/Los_Angeles"],
  usa: ["America/Denver", "America/New_York", "America/Chicago", "America/Los_Angeles"],
  canada: ["America/Toronto", "America/Edmonton", "America/Vancouver"],
  mexico: ["America/Mexico_City"],
  guatemala: ["America/Guatemala"],
  honduras: ["America/Tegucigalpa"],
  "el salvador": ["America/El_Salvador"],
  nicaragua: ["America/Managua"],
  "dominican republic": ["America/Santo_Domingo"],
  jamaica: ["America/Jamaica"],
  colombia: ["America/Bogota"],
  ecuador: ["America/Guayaquil"],
  peru: ["America/Lima"],
  bolivia: ["America/La_Paz"],
  chile: ["America/Santiago"],
  argentina: ["America/Argentina/Buenos_Aires"],
  brazil: ["America/Sao_Paulo"],
  paraguay: ["America/Asuncion"],
  uruguay: ["America/Montevideo"],
  venezuela: ["America/Caracas"],
  "united kingdom": ["Europe/London"],
  uk: ["Europe/London"],
  england: ["Europe/London"],
  ireland: ["Europe/Dublin"],
  france: ["Europe/Paris"],
  germany: ["Europe/Berlin"],
  spain: ["Europe/Madrid"],
  portugal: ["Europe/Lisbon"],
  italy: ["Europe/Rome"],
  ukraine: ["Europe/Kyiv"],
  russia: ["Europe/Moscow"],
  nigeria: ["Africa/Lagos"],
  ghana: ["Africa/Accra"],
  "sierra leone": ["Africa/Freetown"],
  liberia: ["Africa/Monrovia"],
  "ivory coast": ["Africa/Abidjan"],
  "cote d'ivoire": ["Africa/Abidjan"],
  "dr congo": ["Africa/Kinshasa"],
  congo: ["Africa/Kinshasa", "Africa/Lubumbashi"],
  kenya: ["Africa/Nairobi"],
  uganda: ["Africa/Kampala"],
  tanzania: ["Africa/Dar_es_Salaam"],
  zimbabwe: ["Africa/Harare"],
  zambia: ["Africa/Lusaka"],
  mozambique: ["Africa/Maputo"],
  "south africa": ["Africa/Johannesburg"],
  madagascar: ["Indian/Antananarivo"],
  india: ["Asia/Kolkata"],
  nepal: ["Asia/Kathmandu"],
  pakistan: ["Asia/Karachi"],
  philippines: ["Asia/Manila"],
  indonesia: ["Asia/Jakarta"],
  malaysia: ["Asia/Kuala_Lumpur"],
  singapore: ["Asia/Singapore"],
  vietnam: ["Asia/Ho_Chi_Minh"],
  thailand: ["Asia/Bangkok"],
  cambodia: ["Asia/Phnom_Penh"],
  mongolia: ["Asia/Ulaanbaatar"],
  china: ["Asia/Shanghai"],
  taiwan: ["Asia/Taipei"],
  "hong kong": ["Asia/Hong_Kong"],
  japan: ["Asia/Tokyo"],
  korea: ["Asia/Seoul"],
  "south korea": ["Asia/Seoul"],
  australia: ["Australia/Sydney", "Australia/Brisbane", "Australia/Perth"],
  "new zealand": ["Pacific/Auckland"],
  samoa: ["Pacific/Apia"],
  "american samoa": ["Pacific/Pago_Pago"],
  tonga: ["Pacific/Tongatapu"],
  fiji: ["Pacific/Fiji"],
  "papua new guinea": ["Pacific/Port_Moresby"],
  guam: ["Pacific/Guam"],
  "french polynesia": ["Pacific/Tahiti"],
  tahiti: ["Pacific/Tahiti"],
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCurrentId(id: string): string {
  return LEGACY_TO_CURRENT[id] ?? id;
}

let supportedIds: Set<string> | null = null;

function getSupportedIds(): Set<string> {
  if (!supportedIds) {
    supportedIds = new Set(
      Intl.supportedValuesOf("timeZone")
        .filter((id) => id.includes("/") && !id.startsWith("Etc/"))
        .map(toCurrentId),
    );
  }
  return supportedIds;
}

let aliasIndex: Map<string, string[]> | null = null;

function getAliasIndex(): Map<string, string[]> {
  if (!aliasIndex) {
    const supported = getSupportedIds();
    aliasIndex = new Map(
      Object.entries(ALIASES).map(([term, ids]) => [
        normalizeText(term),
        ids.filter((id) => supported.has(id)),
      ]),
    );
  }
  return aliasIndex;
}

/**
 * Returns the current IANA name for a zone id (accepting legacy aliases and any
 * letter case), or `null` if it is not a supported location-based zone.
 * Fixed offsets such as "+05:00" are rejected (Constitution Principle I).
 */
export function normalizeZoneId(id: string): string | null {
  if (!id || !id.includes("/")) return null;
  let resolved: string;
  try {
    resolved = new Intl.DateTimeFormat("en", { timeZone: id }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
  const current = toCurrentId(resolved);
  return getSupportedIds().has(current) ? current : null;
}

export function isSupportedZone(id: string): boolean {
  return normalizeZoneId(id) !== null;
}

function zoneNamePart(
  locale: string,
  timeZone: string,
  style: "longGeneric" | "short",
  epochMilliseconds: number,
): string {
  return (
    new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: style })
      .formatToParts(epochMilliseconds)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone
  );
}

export function cityFromZoneId(id: string): string {
  return id.slice(id.lastIndexOf("/") + 1).replace(/_/g, " ");
}

/** All selectable zones, labeled for `locale` with abbreviations as of noon on `referenceDate`. */
export function listTimeZones(
  referenceDate: Temporal.PlainDate,
  locale: string,
): TimeZoneOption[] {
  const aliasesById = new Map<string, string[]>();
  for (const [term, ids] of getAliasIndex()) {
    for (const id of ids) aliasesById.set(id, [...(aliasesById.get(id) ?? []), term]);
  }

  const options = [...getSupportedIds()].map((id): TimeZoneOption => {
    const noon = referenceDate.toZonedDateTime({
      timeZone: id,
      plainTime: Temporal.PlainTime.from("12:00"),
    }).epochMilliseconds;
    const genericName = zoneNamePart(locale, id, "longGeneric", noon);
    const abbreviation = zoneNamePart(locale, id, "short", noon);
    const city = cityFromZoneId(id);
    const region = id.slice(0, id.indexOf("/"));
    return {
      id,
      genericName,
      city,
      abbreviation,
      searchTerms: [genericName, city, region, id, abbreviation, ...(aliasesById.get(id) ?? [])].map(
        normalizeText,
      ),
    };
  });

  return options.sort(
    (a, b) => a.genericName.localeCompare(b.genericName) || a.city.localeCompare(b.city),
  );
}

/**
 * Case- and accent-insensitive search. Ranking: exact alias, exact city or name,
 * prefix match, then substring match.
 */
export function searchTimeZones(
  options: TimeZoneOption[],
  query: string,
  limit = 50,
): TimeZoneOption[] {
  const q = normalizeText(query);
  if (!q) return [];
  const aliasIds = getAliasIndex().get(q) ?? [];

  const ranked: { option: TimeZoneOption; rank: number; index: number }[] = [];
  options.forEach((option, index) => {
    const aliasPosition = aliasIds.indexOf(option.id);
    let rank: number;
    if (aliasPosition >= 0) rank = aliasPosition / 100;
    else if (
      normalizeText(option.city) === q ||
      normalizeText(option.genericName) === q
    )
      rank = 1;
    else if (option.searchTerms.some((term) => term.startsWith(q))) rank = 2;
    else if (option.searchTerms.some((term) => term.includes(q))) rank = 3;
    else return;
    ranked.push({ option, rank, index });
  });

  return ranked
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.option);
}

export function formatZoneLabel(option: Pick<TimeZoneOption, "genericName" | "city">): string {
  return `${option.genericName} – ${option.city}`;
}
