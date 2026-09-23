# Live Website Specification

## Vision

Build a live Australian bargain-finder for cheap PCs, laptops and components, centred on **real all-in cost to Dubbo NSW 2830**.

The site should answer questions like:

- What is the strongest complete PC available for <= $100 right now?
- Is a cheap office PC + GPU combination better?
- Which listings are actually still available?
- What will postage do to the deal?
- Will the GPU physically/electrically fit?
- How does a candidate compare with known reference systems?
- Which newly discovered listing is unusually good value?

The site should be useful every time it is opened, not a static research report.

## Important source reality

"Everywhere automatically" needs a source-by-source approach.

### Tier A — official API / structured feed

Use automatically and frequently where supported.

**eBay Australia**
- Preferred structured source if production access is approved: official eBay Browse API.
- Browse API supports keyword/category search, item detail and availability data.
- Australia (`EBAY_AU`) is a supported Browse API marketplace.
- Requires eBay developer credentials/OAuth.
- **Production Buy API access is approval/partner restricted; it must be treated as a feasibility gate, not an assumed dependency.**
- Before investing heavily in the collector, confirm production eligibility and approval for this use case.
- Keep manual/feed fallbacks so the product still works if production API access is unavailable.
- Store source ID, URL, URL evidence type, first/last seen time, price, shipping confidence and availability.
- See [Source Strategy and Data Provenance](SOURCE-STRATEGY.md).

### Tier B — retailer pages / feeds

Examples:
- PC Case Gear
- MSY
- Umart
- Centre Com
- Scorptec
- Mwave
- Amazon AU / marketplace sources when a permitted API/feed exists
- local refurbishers

For each retailer:
1. prefer an official API, affiliate feed, product feed, sitemap or structured data;
2. otherwise check the site's current terms/robots rules before automation;
3. do not bypass anti-bot controls;
4. disable an adapter if the source does not permit automated collection.

These adapters should be isolated so one retailer changing its HTML does not break the whole site.

### Tier C — restricted marketplaces

**Gumtree Australia**
- Do NOT build a server-side scraper as the default strategy.
- Gumtree's current Terms of Use explicitly prohibit copying, scraping/data-mining the platform and using automated tools/scripts to access its data.
- Support Gumtree through compliant mechanisms: user-submitted listing URLs, a manual/import workflow, saved-search/email ingestion if permission/terms allow, or a future authorised API/partnership.

**Facebook Marketplace**
- Do NOT rely on unattended scraping of logged-in Marketplace.
- Meta actively detects/restricts unauthorised scraping, and there is no general public buyer-search API we can safely assume gives arbitrary Marketplace inventory.
- Support Facebook Marketplace initially through user-driven imports/saved links, with source URLs and timestamps.
- If Meta later exposes an authorised API suitable for this use case, add it as a proper adapter.

The UI should make source freshness explicit, e.g.:
- LIVE API
- AUTO-CHECKED
- USER-SAVED
- SHIPPING UNVERIFIED
- STALE
- SOLD / GONE

## Product philosophy

A "$39 PC" with $70 shipping is not a $39 bargain.

Every listing should have:

```
item price
+ shipping/freight
+ mandatory fees
+ essential missing parts
= real all-in cost
```

Budget challenges operate on the final total.

## MVP

### Home / leaderboard

Show:
- Best Complete PC
- Best Gaming PC
- Best Upgrade Platform
- Best Local Pickup
- Best Weird Bargain
- Best Repair Project
- Recently Added
- Price Drops

Each card shows:
- picture
- source
- title
- location
- item price
- shipping
- all-in price
- CPU / GPU / RAM / storage
- estimated performance tier
- compatibility warnings
- last checked
- source link

### $100 Challenge

Hard budget selector, default $100.

The engine finds:
1. complete systems within budget;
2. compatible combinations of multiple listings;
3. local pickup options;
4. negotiable candidates separately.

Never mix "negotiation required" into confirmed <=budget winners.

### Search / filters

Filters:
- maximum delivered price
- radius / pickup region
- desktop / laptop / parts
- CPU
- GPU
- minimum RAM
- SSD required
- ATX / mATX / SFF
- full-height GPU support
- PSU connectors
- source
- pickup / shipping
- availability confidence
- listing age

### Listing detail

Include:
- raw seller title/description excerpt
- parsed specification
- evidence/confidence per field
- source URL
- first seen / last seen
- price history
- shipping status
- compatibility analysis
- performance estimate
- scam/risk flags
- missing parts
- "why this is interesting"

### Build combiner

Example:
- OptiPlex $45 local
- GTX 750 Ti $30 delivered
- 240 GB SSD $18
- total $93

The combiner must validate:
- motherboard/form factor
- low-profile requirement
- GPU dimensions
- PSU capacity/connectors
- proprietary power connectors
- RAM generation
- storage interface
- essential missing components

If compatibility cannot be established, label the combination **UNVERIFIED**, not valid.

## Suggested technical architecture

### Front end
- Next.js + TypeScript
- responsive/mobile-first
- deploy to Vercel
- server-rendered/ISR pages for fast public browsing

### Database
PostgreSQL (e.g. Neon/Supabase/Vercel Postgres-compatible service).

Core tables:
- `sources`
- `listings`
- `listing_snapshots`
- `components`
- `parsed_specs`
- `shipping_quotes`
- `availability_checks`
- `performance_reference`
- `build_candidates`
- `source_runs`

### Collector architecture

Each source implements a common interface:

```ts
interface ListingSource {
  id: string;
  mode: "api" | "feed" | "permitted-crawl" | "manual";
  search(query: SearchQuery): Promise<RawListing[]>;
  refresh(listing: StoredListing): Promise<RefreshResult>;
}
```

Collectors produce raw evidence. They should NOT directly invent hardware fields.

Pipeline:

```
source
  -> raw listing snapshot
  -> parser
  -> normalised specs
  -> compatibility engine
  -> shipping/all-in calculator
  -> performance estimator
  -> value ranking
  -> website
```

### Scheduled refresh

Use scheduled jobs/cron to:
- discover new listings
- refresh known listings
- mark stale/dead inventory
- record price changes
- recompute rankings

Suggested cadence:
- high-value/API sources: hourly
- slower retailer catalogues: every 3-6 hours
- stale listing validation: daily
- manual/restricted sources: refresh when user provides/opens an updated listing unless an authorised automated path exists

Do not hammer marketplaces.

## Shipping to Dubbo

Base challenge destination:
- Dubbo NSW 2830

Never store a private street address in this public repository.

Shipping states:
- `verified`
- `free`
- `pickup`
- `estimated`
- `unknown`

A listing with unknown shipping can appear in search but should not be declared the budget winner until the all-in total is verified.

## Normalised listing model

```ts
type Listing = {
  source: string;
  sourceId: string;
  url: string;
  title: string;
  description?: string;

  itemPriceAud: number;
  shippingAud?: number;
  mandatoryFeesAud?: number;
  requiredPartsAud?: number;
  allInAud?: number;

  suburb?: string;
  state?: string;
  postcode?: string;
  pickup: boolean;

  cpu?: string;
  gpu?: string;
  ramGb?: number;
  storage?: string;
  psu?: string;
  formFactor?: string;

  firstSeenAt: string;
  lastSeenAt: string;
  listingUpdatedAt?: string;
  status: "active" | "sold" | "gone" | "unknown";

  evidenceConfidence: "high" | "medium" | "low";
};
```

## Hardware intelligence

Maintain a small local/reference dataset for:
- CPUs
- GPUs
- common office-PC chassis
- PSU limits
- low-profile restrictions
- common proprietary connectors

Do not use an LLM as the sole source of compatibility facts.

AI can help parse messy listing text, but:
- retain the original evidence;
- mark inferred fields;
- never silently turn inference into fact;
- deterministic compatibility rules override prose guesses.

## Performance estimates

Use benchmark/reference datasets where licence permits.

The UI should prefer tiers/ranges over fake precision:
- desktop/basic
- retro
- esports/light
- 1080p low
- older 1080p gaming

Game estimates can include:
- Minecraft Java
- Roblox
- Fortnite Performance Mode
- Rocket League
- Valorant
- GTA V
- Skyrim
- Terraria
- Left 4 Dead 2
- Portal 2

## Ranking

Do not produce one opaque magic score only.

Expose factors:
- all-in price
- CPU capability
- GPU capability
- RAM/storage
- repair risk
- upgrade path
- postage risk
- compatibility confidence
- listing freshness

Possible views:
- maximum gaming performance
- best complete system
- best upgrade path
- lowest risk
- local pickup
- best repair project

## Availability and honesty

Every listing needs:
- source
- last checked timestamp
- current status
- shipping confidence

If a source rejects Dubbo at checkout, mark it unavailable for the challenge.

If a retailer says out of stock, remove it from active winners immediately.

This specifically prevents the failure mode where search results show a cheap product but checkout proves it unavailable or undeliverable.

## Alerts

Later phase:
- "new <= $100 gaming PC within 100 km"
- "GTX 1050 Ti under $40"
- "price drop"
- "new local OptiPlex"
- "new listing beats current $100 champion"

Email/push notifications can be added after discovery quality is good.

## Security

- API keys only in server-side environment variables/secrets.
- Never commit eBay or other source credentials.
- Sanitize imported descriptions.
- Treat seller-provided HTML/text as untrusted.
- Rate-limit public endpoints.
- Do not proxy marketplace login credentials through the site.
- Do not automate login-protected/restricted sources in violation of their terms.

## Development phases

### Phase 1 — useful in one sitting
- Next.js site
- database schema
- manual listing import
- all-in price calculator
- $100 leaderboard
- hardware spec parser
- source/freshness labels
- mobile UI

### Phase 2 — first true live source
- eBay AU Browse API
- scheduled refresh
- price history
- sold/gone detection
- shipping handling

### Phase 3 — retailers
- permitted retailer adapters
- stock checking
- product/clearance searches
- adapter monitoring/tests

### Phase 4 — intelligence
- component reference DB
- compatibility engine
- build combiner
- performance tiers
- risk flags

### Phase 5 — restricted-marketplace workflow
- one-click/manual URL import
- optional browser helper for user-initiated saving where compliant
- saved-search/email ingestion only where source rules allow
- never depend on unauthorised scraping

### Phase 6 — alerts and history
- watchlists
- price-drop alerts
- "new champion" alerts
- deal history

## Definition of done for v1

A user can open the site on a phone and immediately see:
- the strongest current <= $100 confirmed option;
- its real all-in price to Dubbo;
- whether it is actually available;
- what hardware it contains;
- what it is likely capable of;
- why it outranks alternatives;
- the evidence/source URL;
- when it was last verified.

At least one source (eBay AU) updates automatically from an official API.

Other sources must clearly expose whether they are automatic, permitted-feed based, or user-assisted.

## Difficulty

### Easy
- UI, filters, database, saved listings, price history, leaderboard.
- Manual link ingestion.

### Medium
- eBay API integration.
- hardware parsing/normalisation.
- all-in cost and ranking.
- retailer adapters that offer structured/public permitted data.

### Hard
- accurate automatic shipping for every seller/site.
- reliable part compatibility from messy listings.
- keeping many retailer adapters working as sites change.
- detecting scams/misidentified hardware.

### Not cleanly automatable without authorised access
- arbitrary Facebook Marketplace inventory.
- Gumtree server-side scraping under its current Terms.

The engineering challenge is therefore **moderate for a genuinely useful site** and **high for a broad multi-source aggregator**. The biggest difficulty is not the website; it is legitimate, reliable data access and freshness.

## Practical recommendation

Build the site now around a pluggable source architecture.

Start with:
1. eBay AU live API;
2. manual URL import for anything;
3. a few permitted retailer adapters;
4. the $100 ranking/compatibility engine.

That produces a useful live product quickly without designing the whole project around brittle or prohibited scraping. Add sources one by one as an authorised/reliable data path is confirmed.
