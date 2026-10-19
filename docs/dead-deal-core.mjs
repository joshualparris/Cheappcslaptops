// Scores "dead / for parts / missing bits" computer listings by how cheap the
// fix is and how much margin is left after a local Dubbo resale. Shared by the
// automated hunter (scripts/hunt_dead_deals.mjs) and the browser page
// (docs/dead-deals.html) so both rank listings identically.
import { calculateRefurbProfit } from "./refurb-profit-core.mjs";

// Defaults follow docs/DUBBO-REFURB-REPAIR-BUSINESS-CONCEPT.md. They are
// planning estimates, not quoted parts prices or achieved sale prices.
export const DEFAULT_ASSUMPTIONS = {
  labourRate: 30,
  baseLabourMinutes: 60, // clean, test checklist, Windows install/updates
  consumables: 5,
  negotiationPercent: 5,
  sellingFeePercent: 0,
  returnReservePercent: 5,
  annualLicenceCost: 692,
  plannedUnits: 20,
  minGrossRoom: 80,
};

const BUSINESS_LAPTOP = /\b(latitude|elitebook|probook|thinkpad|zbook|toughbook|dynabook|tecra|portege)\b/i;
const BUSINESS_DESKTOP = /\b(optiplex|elitedesk|prodesk|thinkcentre|precision tower|z2 mini)\b/i;
const DESKTOP_HINT = /\b(desktop|tower|sff|small form factor|mini pc|micro pc|tiny|usff|optiplex|elitedesk|prodesk|thinkcentre)\b/i;

// Ordered: the first matching rule per `group` wins, so put specific phrases
// before generic ones. tier: easy | medium | high | reject.
export const FAULT_RULES = [
  // Rejects: not economically or legally fixable for resale.
  { id: "bios-lock", group: "lock", tier: "reject", label: "BIOS/management lock", pattern: /\b(bios|supervisor|admin(istrator)?|setup)\s*(password|pw|lock(ed)?)\b|\bpassword\s*lock(ed)?\b|\bbios\s*locked\b|\bcomputrace\b|\babsolute\s*(lock|persistence)\b|\b(mdm|intune|autopilot)\s*(lock(ed)?|enrolled|managed)\b|\bicloud\s*lock(ed)?\b|\bactivation\s*lock(ed)?\b/i },
  { id: "not-a-computer", group: "incomplete", tier: "reject", label: "Shell / missing motherboard", pattern: /\b(no|missing|without)\s*(motherboard|mainboard|logic\s*board|system\s*board)\b|\b(chassis|shell|housing|case|screen|lcd|palm\s*rest|keyboard)\s*only\b|\bempty\s*(chassis|case)\b/i },

  // High risk: board-level or unknown dead faults.
  { id: "liquid", group: "board", tier: "high", label: "Liquid damage", partsAud: 0, minutes: 120, pattern: /\b(liquid|water|coffee|moisture)\s*(damage(d)?|spill(ed)?|exposure)\b|\bspill(ed)?\b/i },
  { id: "motherboard", group: "board", tier: "high", label: "Motherboard fault", partsAud: 0, minutes: 120, pattern: /\b(motherboard|mainboard|logic\s*board|system\s*board)\s*(fault|faulty|issue|problem|dead|fail(ed|ure)?)\b|\bfaulty\s*(motherboard|mainboard)\b/i },
  { id: "no-power", group: "power", tier: "high", label: "No power / won't turn on", partsAud: 0, minutes: 90, pattern: /\b(no\s*power(?!\s*(adapter|supply|cord|brick|pack|cable))|won'?t\s*(turn|power|switch)\s*on|doesn'?t\s*(turn|power|switch)\s*on|does\s*not\s*(turn|power|switch)\s*on|not\s*(turning|powering)\s*on|dead\s*(laptop|unit|board)|completely\s*dead)\b/i },
  { id: "no-post", group: "display", tier: "high", label: "No POST / no display", partsAud: 0, minutes: 90, pattern: /\b(no\s*post|no\s*display|no\s*video|black\s*screen|blank\s*screen|beeps?\s*codes?|blinking\s*(light|led|caps))\b/i },

  // Medium: one hardware repair with commonly available parts.
  { id: "screen", group: "screen", tier: "medium", label: "Cracked/faulty screen", partsAud: 65, minutes: 45, pattern: /\b(crack(ed)?|broken|smashed|faulty|damaged|lines?\s*on|dead\s*pixels?\s*on)\s*(screen|lcd|display|panel)\b|\b(screen|lcd|display)\s*(crack(ed)?|broken|damaged|faulty|lines)\b/i },
  { id: "hinge", group: "hinge", tier: "medium", label: "Broken hinge", partsAud: 25, minutes: 60, pattern: /\b(broken|cracked|loose|damaged|stiff)\s*hinges?\b|\bhinges?\s*(broken|cracked|damaged)\b/i },
  { id: "keyboard", group: "keyboard", tier: "medium", label: "Keyboard fault", partsAud: 30, minutes: 40, pattern: /\b(faulty|broken|damaged|missing)\s*(keys?|keyboard)\b|\bkeyboard\s*(fault|faulty|not\s*working|issue)\b|\bkeys?\s*(missing|not\s*working)\b/i },
  { id: "dc-jack", group: "charging", tier: "medium", label: "Charging port / DC jack", partsAud: 15, minutes: 60, pattern: /\b(dc\s*jack|charging\s*port|power\s*jack)\b|\bnot\s*charging\b|\bwon'?t\s*charge\b/i },
  { id: "untested", group: "unknown", tier: "medium", label: "Untested / unknown condition", partsAud: 0, minutes: 30, pattern: /\b(untested|not\s*tested|unknown\s*(condition|working)|as[\s-]*is|sold\s*as\s*is)\b/i },

  // Easy: the "good faults" from the business concept.
  { id: "no-storage", group: "storage", tier: "easy", label: "No SSD/HDD", partsAud: 28, minutes: 15, pattern: /\b(no|missing|without|w\/o|sans)\s*(ssd|hdd|hard\s*drive|hard\s*disk|drive|storage|m\.?2|nvme|caddy)\b|\b(ssd|hdd|hard\s*drive)\s*(removed|not\s*included|missing)\b|\bno\s*boot(able)?\s*device\b|\bboots?\s*to\s*bios\b/i },
  { id: "no-ram", group: "ram", tier: "easy", label: "No RAM", partsAud: 25, minutes: 5, pattern: /\b(no|missing|without|w\/o)\s*(ram|memory)\b|\b(ram|memory)\s*(removed|not\s*included|missing)\b/i },
  { id: "no-charger", group: "charger", tier: "easy", label: "No charger", partsAud: 22, minutes: 0, pattern: /\b(no|missing|without|w\/o)\s*(charger|power\s*(adapter|supply|brick|cord)|ac\s*adapter|adapter|psu)\b|\b(charger|adapter)\s*not\s*included\b/i },
  { id: "battery", group: "battery", tier: "easy", label: "Battery worn/dead", partsAud: 45, minutes: 20, pattern: /\b(bad|dead|poor|worn|weak|swollen|no|missing|faulty)\s*batter(y|ies)\b|\bbattery\s*(dead|worn|needs\s*replac\w*|not\s*holding|service)\b/i },
  { id: "no-os", group: "os", tier: "easy", label: "No OS / Windows fault", partsAud: 0, minutes: 0, pattern: /\b(no|without|w\/o)\s*(os|operating\s*system|windows)\b|\bos\s*not\s*included\b|\bwindows\s*(corrupt(ed)?|won'?t\s*boot|fault)\b/i },
  { id: "thermal", group: "thermal", tier: "easy", label: "Overheating / fan", partsAud: 10, minutes: 40, pattern: /\b(overheat(s|ing)?|loud\s*fan|fan\s*(noise|error|fault|not\s*working)|thermal\s*shutdown)\b/i },
];

const TIER_RANK = { easy: 0, medium: 1, high: 2, reject: 3 };
const SUCCESS_PROBABILITY = { easy: 0.92, medium: 0.75, high: 0.35 };

// Expected local Dubbo resale after refurb, AUD. Based on the $150–$250
// mainstream band in docs/DUBBO-REFURB-MARKET.md.
const RESALE_BY_GEN = {
  laptop: { business: { 4: 90, 5: 100, 6: 130, 7: 150, 8: 220, 9: 230, 10: 260, 11: 300, 12: 340, 13: 380 }, consumer: { 4: 70, 5: 80, 6: 100, 7: 120, 8: 170, 9: 180, 10: 210, 11: 240, 12: 270, 13: 300 } },
  desktop: { business: { 4: 70, 5: 80, 6: 100, 7: 120, 8: 180, 9: 190, 10: 220, 11: 250, 12: 280, 13: 300 }, consumer: { 4: 60, 5: 70, 6: 85, 7: 100, 8: 150, 9: 160, 10: 180, 11: 200, 12: 230, 13: 250 } },
};
const SALVAGE_VALUE = { business: 40, consumer: 15 };

// Model → Intel generation for listings that omit the CPU.
const MODEL_GENERATION = [
  [/\belitebook\s*\d{3,4}\s*g(\d+)\b/i, (m) => ({ 3: 6, 4: 7, 5: 8, 6: 8, 7: 10, 8: 11, 9: 12, 10: 13 })[m[1]]],
  [/\bprobook\s*\d{3}\s*g(\d+)\b/i, (m) => ({ 4: 7, 5: 8, 6: 8, 7: 10, 8: 11, 9: 12, 10: 13 })[m[1]]],
  [/\b(elitedesk|prodesk)\s*\d{3}\s*g(\d+)\b/i, (m) => ({ 3: 6, 4: 8, 5: 9, 6: 10, 8: 11, 9: 12 })[m[2]]],
  [/\bthinkpad\s*[tlxe]\d{2,3}\s*gen\s*(\d)\b/i, (m) => ({ 1: 10, 2: 11, 3: 12, 4: 13 })[m[1]]],
  [/\bthinkpad\s*[tlx](\d)(\d)0s?\b/i, (m) => ({ 4: { 6: 6, 7: 7, 8: 8, 9: 8 } })[m[1]]?.[m[2]]],
  [/\bthinkpad\s*e(\d)(\d)0\b/i, (m) => ({ 4: { 7: 7, 8: 8, 9: 8 }, 5: { 7: 7, 8: 8, 9: 8 } })[m[1]]?.[m[2]]],
  [/\blatitude\s*[357]4([6-9])0\b/i, (m) => ({ 6: 6, 7: 7, 8: 8, 9: 8 })[m[1]]],
  [/\blatitude\s*[357][345]([0-4])0\b/i, (m) => ({ 0: 8, 1: 10, 2: 11, 3: 12, 4: 13 })[m[1]]],
  [/\boptiplex\s*([357])0([5-9])0\b/i, (m) => ({ 5: 7, 6: 8, 7: 9, 8: 10, 9: 10 })[m[2]]],
];

export function inferCpuGeneration(text) {
  const intel = text.match(/\bi[3579][\s-]*(\d{4,5})([a-z]{0,2}\d?)\b/i);
  if (intel) {
    const [, digits, suffix] = intel;
    // 5 digits (i5-10210U) and Ice/Tiger Lake G-suffix parts (i5-1135G7) lead with a 2-digit generation.
    const twoDigit = digits.length === 5 || (digits.startsWith("1") && /^g\d$/i.test(suffix));
    return Number(twoDigit ? digits.slice(0, 2) : digits[0]);
  }
  const genWord = text.match(/\b(\d{1,2})(?:st|nd|rd|th)\s*gen\b/i);
  if (genWord) return Number(genWord[1]);
  const core = text.match(/\bcore\s*ultra\b/i);
  if (core) return 14;
  const ryzen = text.match(/\bryzen\s*[3579]\s*(?:pro\s*)?(\d)\d{3}/i);
  if (ryzen) {
    // Ryzen 2000+ is on Microsoft's Windows 11 list; map to a comparable Intel tier.
    const series = Number(ryzen[1]);
    return series <= 1 ? 6 : series <= 3 ? 8 : series <= 5 ? 10 : 11;
  }
  for (const [pattern, map] of MODEL_GENERATION) {
    const m = text.match(pattern);
    if (m) {
      const gen = map(m);
      if (gen) return gen;
    }
  }
  return null;
}

export function inferLotSize(text) {
  const m = text.match(/\b(?:lot|bundle|job\s*lot|set)\s*(?:of\s*)?(\d{1,2})\b|\b(\d{1,2})\s*x\s+(?:dell|hp|lenovo|laptops?|units?)\b|\bx\s*(\d{1,2})\s*(?:laptops?|units?)\b/i);
  const n = m ? Number(m[1] || m[2] || m[3]) : 1;
  return n >= 2 && n <= 50 ? n : 1;
}

export function detectFaults(text) {
  const seen = new Set();
  const faults = [];
  for (const rule of FAULT_RULES) {
    if (seen.has(rule.group) || !rule.pattern.test(text)) continue;
    seen.add(rule.group);
    faults.push(rule);
  }
  return faults;
}

/**
 * @param {{title: string, description?: string, priceAud: number, shippingAud?: number|null, condition?: string}} listing
 */
export function scoreListing(listing, assumptions = {}) {
  const a = { ...DEFAULT_ASSUMPTIONS, ...assumptions };
  const text = `${listing.title ?? ""} ${listing.description ?? ""}`.replace(/\s+/g, " ");
  const kind = DESKTOP_HINT.test(text) ? "desktop" : "laptop";
  const segment = (kind === "desktop" ? BUSINESS_DESKTOP : BUSINESS_LAPTOP).test(text) ? "business" : "consumer";
  const generation = inferCpuGeneration(text);
  const lotSize = inferLotSize(text);
  const faults = detectFaults(text);
  const forParts = /for\s*parts|not\s*working|faulty|spares|repair/i.test(`${listing.condition ?? ""} ${text}`);

  // A "for parts" listing that names no fault is an unknown dead machine.
  if (forParts && !faults.length) {
    faults.push({ id: "unstated-fault", group: "unknown", tier: "high", label: "Fault not described", partsAud: 0, minutes: 60 });
  }

  const tier = faults.reduce((worst, f) => (TIER_RANK[f.tier] > TIER_RANK[worst] ? f.tier : worst), "easy");
  const unitPrice = Number(listing.priceAud) / lotSize;
  const unitShipping = listing.shippingAud == null ? null : Number(listing.shippingAud) / lotSize;
  const reasons = [];

  if (tier === "reject") {
    reasons.push(...faults.filter((f) => f.tier === "reject").map((f) => `Rejected: ${f.label}`));
  }
  if (generation == null) reasons.push("CPU generation not stated — check before buying");
  else if (generation < 8) reasons.push(`Gen ${generation} CPU is not Windows 11-supported — low resale`);
  if (unitShipping == null) reasons.push("Shipping to 2830 unknown");
  if (lotSize > 1) reasons.push(`Lot of ${lotSize}: prices shown per unit`);
  if (!faults.length && !forParts) reasons.push("No fault found in listing — may already be working");

  const genKey = generation == null ? 7 : Math.min(13, Math.max(4, generation));
  const resale = RESALE_BY_GEN[kind][segment][genKey];
  const partsAud = faults.reduce((sum, f) => sum + (f.partsAud ?? 0), 0);
  const labourMinutes = a.baseLabourMinutes + faults.reduce((sum, f) => sum + (f.minutes ?? 0), 0);

  const profit = calculateRefurbProfit({
    askingPrice: resale,
    purchasePrice: unitPrice,
    inboundFreight: unitShipping ?? 0,
    repairs: partsAud,
    consumables: a.consumables,
    negotiationPercent: a.negotiationPercent,
    sellingFeePercent: a.sellingFeePercent,
    returnReservePercent: a.returnReservePercent,
    annualLicenceCost: a.annualLicenceCost,
    plannedUnits: a.plannedUnits,
    labourMinutes,
    labourRate: a.labourRate,
  });

  // Expected value: success keeps the profit; failure salvages parts.
  const p = tier === "reject" ? 0 : SUCCESS_PROBABILITY[tier];
  const lossIfFailed = Math.max(0, unitPrice + (unitShipping ?? 0) - SALVAGE_VALUE[segment]);
  const expectedProfit = p * profit.profitAfterLabour - (1 - p) * lossIfFailed;

  return {
    kind,
    segment,
    generation,
    lotSize,
    tier,
    faults: faults.map(({ id, label, tier: t, partsAud: cost = 0 }) => ({ id, label, tier: t, partsAud: cost })),
    unitPriceAud: round(unitPrice),
    unitShippingAud: unitShipping == null ? null : round(unitShipping),
    estimatedResaleAud: resale,
    partsAud,
    labourMinutes,
    grossRoomAud: round(profit.grossBeforeOverhead),
    cashProfitAud: round(profit.cashProfit),
    profitAfterLabourAud: round(profit.profitAfterLabour),
    expectedProfitAud: round(expectedProfit),
    successProbability: p,
    meetsGrossTarget: profit.grossBeforeOverhead >= a.minGrossRoom,
    recommended: tier !== "reject" && tier !== "high" && profit.grossBeforeOverhead >= a.minGrossRoom && generation != null && generation >= 8,
    reasons,
  };
}

export function rankListings(listings, assumptions) {
  return listings
    .map((listing) => ({ ...listing, score: scoreListing(listing, assumptions) }))
    .sort((x, y) =>
      Number(y.score.recommended) - Number(x.score.recommended) ||
      TIER_RANK[x.score.tier] - TIER_RANK[y.score.tier] ||
      y.score.expectedProfitAud - x.score.expectedProfitAud
    );
}

function round(n) {
  return Math.round(n * 100) / 100;
}
