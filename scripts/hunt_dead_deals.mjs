#!/usr/bin/env node
// Finds cheap dead/for-parts computers with easy fixes and ranks them by
// expected refurb profit. Writes docs/data/dead-deals.json for the site.
//
// Sources (docs/SOURCE-STRATEGY.md):
//   api    — eBay Browse API, only when EBAY_CLIENT_ID/EBAY_CLIENT_SECRET are set
//   manual — docs/data/dead-deal-leads.json (Marketplace, Gumtree, local)
//
// Usage:
//   node scripts/hunt_dead_deals.mjs                  # live run
//   node scripts/hunt_dead_deals.mjs --fixture f.json # offline Browse API response
//   node scripts/hunt_dead_deals.mjs --stdout         # print instead of writing
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rankListings } from "../docs/dead-deal-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "docs", "data");
const EBAY_API = process.env.EBAY_API_BASE ?? "https://api.ebay.com";

const args = process.argv.slice(2);
const fixturePath = args.includes("--fixture") ? args[args.indexOf("--fixture") + 1] : null;
const toStdout = args.includes("--stdout");

const config = JSON.parse(await readFile(join(DATA, "dead-deal-searches.json"), "utf8"));
const manual = JSON.parse(await readFile(join(DATA, "dead-deal-leads.json"), "utf8"));

const sourceStatus = [];
let ebayItems = [];

if (fixturePath) {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  ebayItems = (fixture.itemSummaries ?? []).map(fromBrowseItem);
  sourceStatus.push({ source: "eBay Australia", mode: "fixture", ok: true, count: ebayItems.length });
} else if (process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET) {
  try {
    ebayItems = await searchEbay(config);
    sourceStatus.push({ source: "eBay Australia", mode: "api", ok: true, count: ebayItems.length });
  } catch (error) {
    sourceStatus.push({ source: "eBay Australia", mode: "api", ok: false, error: String(error.message ?? error) });
  }
} else {
  sourceStatus.push({ source: "eBay Australia", mode: "disabled", ok: false, error: "EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not configured" });
}

const manualItems = (manual.leads ?? []).map((lead, i) => ({
  id: lead.id ?? `manual-${i + 1}`,
  source: lead.source ?? "Manual lead",
  sourceMode: "manual",
  title: lead.title,
  description: lead.description ?? "",
  priceAud: Number(lead.priceAud),
  shippingAud: lead.shippingAud ?? (lead.pickup ? 0 : null),
  condition: lead.condition ?? "",
  url: lead.url ?? null,
  location: lead.location ?? null,
  seenAt: lead.seenAt ?? null,
}));
sourceStatus.push({ source: "Manual leads", mode: "manual", ok: true, count: manualItems.length });

const unique = new Map();
for (const item of [...ebayItems, ...manualItems]) {
  if (item.title && Number.isFinite(item.priceAud)) unique.set(item.id, item);
}
const ranked = rankListings([...unique.values()]);

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  destinationPostcode: config.destinationPostcode,
  sources: sourceStatus,
  disclaimer: "Resale, parts and labour figures are planning estimates from the Dubbo refurb concept, not quotes. Confirm CPU, BIOS lock status, included parts and shipping with the seller before buying.",
  deals: ranked.slice(0, 200),
};

if (toStdout) {
  console.log(JSON.stringify(output, null, 2));
} else {
  await writeFile(join(DATA, "dead-deals.json"), `${JSON.stringify(output, null, 2)}\n`);
}

const top = ranked.filter((d) => d.score.recommended).slice(0, 10);
const summary = renderSummary(top, sourceStatus);
console.error(summary);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
await notify(top.filter((d) => d.score.expectedProfitAud >= (config.notifyMinExpectedProfitAud ?? 40)));

async function searchEbay(cfg) {
  const token = await ebayToken();
  const results = [];
  for (const search of cfg.searches) {
    const filters = [
      `conditionIds:{${search.conditionIds}}`,
      "buyingOptions:{FIXED_PRICE|BEST_OFFER}",
      "itemLocationCountry:AU",
      `price:[..${cfg.maxPriceAud}]`,
      "priceCurrency:AUD",
    ];
    const params = new URLSearchParams({
      q: search.q,
      category_ids: search.categoryIds,
      filter: filters.join(","),
      sort: "price",
      limit: "100",
    });
    const response = await fetch(`${EBAY_API}/buy/browse/v1/item_summary/search?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": cfg.marketplace,
        // Asks eBay to estimate shipping to the destination postcode.
        "X-EBAY-C-ENDUSERCTX": `contextualLocation=${encodeURIComponent(`country=AU,zip=${cfg.destinationPostcode}`)}`,
      },
    });
    if (!response.ok) throw new Error(`eBay search "${search.q}" failed: HTTP ${response.status} ${await response.text()}`);
    const body = await response.json();
    results.push(...(body.itemSummaries ?? []).map(fromBrowseItem));
  }
  return results;
}

async function ebayToken() {
  const basic = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${EBAY_API}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!response.ok) throw new Error(`eBay OAuth failed: HTTP ${response.status} ${await response.text()}`);
  return (await response.json()).access_token;
}

function fromBrowseItem(item) {
  const shipping = item.shippingOptions?.find((o) => o.shippingCost) ?? null;
  return {
    id: `ebay-${item.itemId}`,
    source: "eBay Australia",
    sourceMode: fixturePath ? "fixture" : "api",
    title: item.title,
    description: item.shortDescription ?? "",
    priceAud: Number(item.price?.value),
    shippingAud: shipping ? Number(shipping.shippingCost.value) : null,
    shippingConfidence: shipping ? "estimated" : "unknown",
    condition: item.condition ?? "",
    url: item.itemWebUrl ?? null,
    location: [item.itemLocation?.city, item.itemLocation?.stateOrProvince, item.itemLocation?.postalCode].filter(Boolean).join(" ") || null,
    image: item.image?.imageUrl ?? null,
    seenAt: new Date().toISOString(),
  };
}

function renderSummary(deals, sources) {
  const lines = ["## Dead-deal hunter", ""];
  for (const s of sources) lines.push(`- ${s.source} (${s.mode}): ${s.ok ? `${s.count} listings` : `not run — ${s.error}`}`);
  lines.push("", deals.length ? "| Exp. profit | Price | Fix | Listing |" : "No recommended deals this run.");
  if (deals.length) lines.push("|---:|---:|---|---|");
  for (const d of deals) {
    const fix = d.score.faults.map((f) => f.label).join(", ") || "none stated";
    lines.push(`| $${d.score.expectedProfitAud} | $${d.score.unitPriceAud}${d.score.unitShippingAud ? ` + $${d.score.unitShippingAud}` : ""} | ${fix} | [${d.title.replace(/[|[\]]/g, " ")}](${d.url ?? "#"}) |`);
  }
  return `${lines.join("\n")}\n`;
}

// Optional phone push through ntfy.sh. Set NTFY_TOPIC to a private, hard-to-guess topic.
async function notify(deals) {
  if (!process.env.NTFY_TOPIC || !deals.length) return;
  const body = deals.slice(0, 5).map((d) => `$${d.score.expectedProfitAud} profit — $${d.score.unitPriceAud} ${d.title}\n${d.url ?? ""}`).join("\n\n");
  const response = await fetch(`https://ntfy.sh/${encodeURIComponent(process.env.NTFY_TOPIC)}`, {
    method: "POST",
    headers: { Title: `${deals.length} easy-fix computer deal(s) found` },
    body,
  });
  if (!response.ok) console.error(`ntfy notification failed: HTTP ${response.status}`);
}
