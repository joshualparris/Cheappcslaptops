# CHEAP//PC Roadmap

Updated: 23 September 2026

## Product goal

Build a trustworthy Australian ultra-budget PC and laptop finder centred on the **real all-in cost to Dubbo NSW 2830**, plus a practical evidence base for refurbishing and reselling affordable computers locally.

The project should eventually answer, with current evidence:

- What is the strongest complete computer I can actually obtain within a hard budget?
- Is shipping included, estimated, pickup-only, or genuinely verified to postcode 2830?
- Is the listing still available?
- What hardware is really included?
- What is missing?
- Is an upgrade combination physically and electrically compatible?
- Is the machine officially supported by the intended operating system?
- Is it good value compared with current alternatives?
- If buying to refurbish and resell, is there enough gross margin after parts, compliance and risk?

---

## Implementation status — 23 September 2026

| Area | Status |
|---|---|
| Canonical listing dataset | ✅ Implemented in `docs/data/listings.json` |
| Listing validator + CI | ✅ Implemented |
| Freshness/evidence badges | ✅ Implemented |
| Canonical-data website rendering | ✅ Implemented |
| Separate auction-watch view | ✅ Implemented |
| Shareable deal filter/search state | ✅ Implemented |
| GitHub Pages deployment | ✅ Working and validation-gated |
| Fleet resale valuation dataset | ✅ Implemented and CI-validated |
| Static-site smoke tests | ✅ Implemented |
| Refurb profit calculator | ✅ Implemented |
| SEO/social metadata + sitemap | ✅ Implemented |
| Shareable per-listing detail views | ⏳ Not yet implemented |
| Automated source refresh | ⏳ Not yet implemented |
| Compatibility engine / build combiner | ⏳ Not yet implemented |
| Real Dubbo resale experiment | ⏳ Not yet measured |

The roadmap below remains the long-term plan; completed foundation items are retained for architectural context.

---

# Current audit

## What is already good

- The hard-budget philosophy is correct: item + shipping + mandatory parts must fit the cap.
- The repo keeps raw research notes instead of hiding uncertainty.
- Auctions are separated from confirmed fixed-price buys in the deeper research.
- The website is lightweight, mobile-friendly and understandable.
- Source/legal limitations for Gumtree and Facebook Marketplace are already acknowledged.
- The Dubbo refurb research correctly treats local demand as a hypothesis to test, not a guaranteed market.
- The PDF report is generated reproducibly from code.
- GitHub Actions already exist for PDF generation and Pages deployment.

## Main weaknesses

### Data integrity
- The website now renders listing cards from the canonical `docs/data/listings.json` dataset and CI validates totals, enums, dates, budget rules and duplicate IDs.
- The PDF generator has begun sourcing listing facts from canonical data, reducing duplicate truth sources.
- Remaining drift risk is mainly hand-written homepage/research prose that can outlive a refreshed dataset.
- Some listings still use a search-results URL rather than a specific listing URL.
- Shipping described as “free” is not necessarily postcode-2830 checkout-verified.
- First-seen / last-checked fields and automatic freshness labels now exist, but there is not yet an automated source refresh that marks sold/gone listings.
- OS-installed and OS-supported are separate canonical fields, but coverage still needs ongoing review as inventory expands.

### Freshness
- The website calls itself “live”, but the current listings are a dated research snapshot.
- No stale threshold exists.
- Sold/gone/changed listings do not automatically disappear.
- Auction observations can become meaningless within hours.

### Source strategy
- eBay Browse API is technically suitable for AU, but eBay currently restricts production Buy API access and requires approval/partner eligibility.
- Therefore the architecture must not assume eBay production access will definitely be granted.
- Facebook Marketplace and Gumtree cannot be treated as unattended scrape targets.
- Retailer adapters need explicit source-by-source permission/terms review.

### Deployment / CI
- GitHub Pages deployment is now working and is gated by canonical listing validation, fleet-valuation validation and static-site smoke tests.
- Workflow actions are pinned to immutable commit SHAs.
- Rapid micro-commits intentionally cancel intermediate Pages deployments through workflow concurrency; only the newest deployment needs to finish.
- Generated-report automation still needs careful coordination to avoid unnecessary follow-up runs on `main`.
- JavaScript behaviour does not yet have browser-level automated tests.

### Front-end / UX
- Cards now expose freshness, shipping-confidence and source-evidence labels alongside price.
- Auction watches are separated from the default fixed-price view.
- Search/filter state is reflected in shareable query parameters.
- Dynamic result counts use live status messaging, visible focus styles are present, and reduced-motion behaviour is respected.
- Canonical, Open Graph/Twitter and CollectionPage metadata plus sitemap/robots files now exist.
- Remaining view gaps include negotiation-required, shipping-unverified and sold/gone history views.
- There is still no shareable per-listing detail page.
- A full WCAG 2.2 AA audit and browser/zoom testing remain outstanding.

### Compatibility / hardware intelligence
- Compatibility notes are prose only.
- No deterministic component/chassis rules yet exist for:
  - low-profile vs full-height GPU
  - card length / slot width
  - PCIe power connectors
  - PSU capacity
  - proprietary motherboard/PSU connectors
  - RAM generation/type
  - SATA/NVMe storage
  - Windows 11 official CPU support

### Research quality
- Benchmark numbers are copied into snapshots without provenance metadata such as checked date/source URL per metric.
- Asking prices and sold-price evidence are not clearly separated.
- Local refurb demand research lacks a measured real-world Dubbo test dataset.
- “Possible asking range” needs to become a tracked experiment rather than remain an estimate.

### Commercial / compliance
- Refurb profit analysis needs a calculator that includes:
  - purchase price
  - shipping
  - RAM/SSD/battery/charger/repair parts
  - platform fees
  - expected negotiation
  - expected failure/return reserve
  - second-hand dealer licence allocation
  - labour/time
- NSW second-hand dealer requirements need a dated compliance checklist and periodic re-check.
- Australian Consumer Law obligations need to be included before the site becomes a selling operation.

---

# Implementation progress

This roadmap is being implemented as small, reviewable commits. Status below reflects `main` on 23 September 2026.

## Completed foundation

- ✅ **Canonical listing data** — `docs/data/listings.json` is now the website's listing source of truth.
- ✅ **Deterministic validator** — cost arithmetic, budget boundaries, enums, auction semantics, shipping consistency, dates, URLs and duplicate IDs are checked before publication.
- ✅ **Boundary tests** — `$100.00` is valid, `$100.01` is not; auction/watch, unknown shipping, duplicate IDs and direct/search URL rules are covered.
- ✅ **Validation CI** — tests and current data validation run automatically.
- ✅ **Honest freshness/evidence UI** — cards expose age, shipping confidence and direct-listing vs search-fallback evidence.
- ✅ **Static-snapshot wording** — the site no longer describes manually researched listings as live inventory.
- ✅ **Pages deployment hardening** — validation runs before publish, actions are SHA-pinned, stale deploys are cancelled, and the site is successfully published at:
  - https://joshualparris.github.io/Cheappcslaptops/
- ✅ **Source/provenance policy** — `docs/SOURCE-STRATEGY.md` documents API/feed/manual modes, eBay production-access gating and restricted-marketplace handling.
- ✅ **Website specification corrected** — eBay Browse API is no longer assumed to be automatically available in production.
- ✅ **Reproducible PDF CI** — pinned action SHAs, pinned ReportLab version, validation gate and concurrency control.
- ✅ **Canonical PDF shortlist** — generated report prices, shipping, hardware and listing URLs now come from `docs/data/listings.json`.
- ✅ **README entry point** — live site, roadmap, source policy, market research and fleet valuation are obvious from the repository root.

## Completed/advanced site quality work

- ✅ **Auction-watch view** — auction observations are separated from confirmed fixed-price deals.
- ✅ **Shareable filter state** — deal filters persist in the URL.
- ✅ **Canonical/social metadata** — basic canonical + social metadata added.
- ✅ **robots.txt + sitemap.xml** added.
- ✅ **Static-site smoke checks** — Pages deployment is gated on basic site/data integrity checks.
- ✅ **Fleet valuation validation** — fleet totals/data are checked in CI.
- ✅ **Safer dynamic rendering** — fleet data is escaped before HTML rendering.
- 🟡 **Accessibility** — visible focus, reduced-motion handling, text-labelled evidence states and live filter result counts are implemented; a fuller WCAG 2.2 audit remains.
- 🟡 **Separate evidence views** — auctions are separated; shipping-unverified, refurb-candidate and sold/gone history views remain.

## Still high priority

- ⬜ **Automated authorised discovery/refresh** — no source currently provides a true continuously refreshed inventory feed.
- ⬜ **eBay production-access decision** — confirm/apply for Buy API production eligibility before building the collector.
- ⬜ **Immutable listing history** — price/shipping/status snapshots over time.
- ⬜ **Shareable listing detail pages** with evidence history.
- ⬜ **Deterministic compatibility engine** and build combiner.
- ⬜ **Hardware reference dataset** with provenance for CPU/GPU/chassis/PSU/Windows support.
- ⬜ **Refurb profit calculator** including licence allocation, labour and failure/return reserve.
- ⬜ **Standard refurb QA checklist** and measured Dubbo demand experiment.
- ⬜ **Compliance pack** covering dated NSW/ACL/electrical/tax obligations.
- ⬜ **Source health/observability dashboard**.
- ⬜ **Full report/data consolidation** — benchmark and market-comparison evidence still has some dated snapshot content outside the canonical listing dataset.

## Micro-commit ledger

Key roadmap commits so far:

| Commit | Change |
| --- | --- |
| `bd781197` | Roadmap and full-repo audit |
| `927db998` | Canonical listing snapshot |
| `41e8dc67` | Listing validator |
| `ffd0462e` | Validation CI |
| `a3fd80bb` | Website reads canonical listing data |
| `11c80264` | Evidence/freshness UI |
| `7a526468` | Evidence styling, keyboard focus, reduced motion |
| `097e9f77` | Honest snapshot wording + live result announcements |
| `6aead727` | Hardened Pages deployment |
| `9c95fbe3` | Source/provenance strategy |
| `70a62b90` | eBay production-access gate in website spec |
| `cb6bcf4b` | Reproducible validated PDF workflow |
| `30a0c5b7` | Validator boundary tests |
| `54e56501` | Boundary tests in CI |
| `fce9cae5` | README navigation/live-site links |
| `634398f5` | PDF listing facts sourced from canonical JSON |

Additional small commits on `main` have implemented fleet valuation, auction filtering, URL filter state, fleet validation, SEO metadata, robots/sitemap and site smoke checks.

# Roadmap

## P0 — Trustworthy foundation

### 0.1 One canonical listing dataset
Move website listing data out of `app.js` into one canonical JSON file.

Required fields should include:

- stable ID
- title
- source + source listing ID where available
- exact source URL
- listing type
- buying mode: fixed-price / auction / negotiation / pickup
- item price
- shipping amount
- mandatory fees
- required-parts cost
- calculated all-in total
- shipping confidence: verified / advertised / estimated / pickup / unknown
- availability confidence
- first seen
- last checked
- status: active / watch / stale / sold / gone / unknown
- CPU/GPU/RAM/storage/form factor
- missing parts
- risks
- evidence notes

**Definition of done:** website cards are rendered from the same canonical data that validation checks.

### 0.2 Automated data validator
Add a zero-secret validator that fails CI when:

- totals do not add up
- a qualifying complete system exceeds the budget
- an auction is labelled as a confirmed winner
- a required URL/date/status is missing
- an invalid enum value is used
- shipping confidence contradicts the displayed copy
- duplicate IDs exist
- dates are malformed
- unsupported listing categories silently appear

### 0.3 Honest freshness model
Add explicit age/status logic:

- FRESH: checked within 24 hours
- AGING: 1–3 days
- STALE: over 3 days
- EXPIRED/WATCH: auction observation is no longer current
- SOLD/GONE: source confirmed unavailable

Never describe the board as live unless an automated refresh path actually exists.

### 0.4 Fix deployment workflow
- Stop trying to auto-enable GitHub Pages from the workflow.
- Validate before upload/deploy.
- Keep the expected Pages URL documented.
- Pages still requires the repository owner to select **Settings → Pages → Source → GitHub Actions** once.
- Add an alternative deployment path only if it can be made reproducible from the repository rather than as a one-off manual copy.

---

## P1 — Better site and evidence UX

### 1.1 Listing confidence badges
Every card should visibly show:

- price type
- shipping confidence
- availability status
- last checked
- fixed-price vs auction/watch
- whether URL is a direct listing or search fallback

### 1.2 Separate views
Add views for:

- Confirmed under budget
- Auction watches
- Shipping unverified
- Parts
- Refurb candidates
- Sold/gone history

### 1.3 Shareable listing details
Create a stable detail view with:

- raw seller facts
- parsed facts
- evidence confidence
- price breakdown
- missing parts
- compatibility warnings
- change history
- direct source link

### 1.4 Accessibility and mobile polish
Target WCAG 2.2 AA:

- visible keyboard focus
- no colour-only status communication
- semantic landmarks/headings
- live result-count announcements
- minimum contrast checks
- 400% zoom/reflow sanity
- adequate tap targets
- reduced-motion support

### 1.5 SEO/social metadata
Add:

- canonical metadata
- Open Graph/Twitter summary
- structured metadata appropriate to an editorial bargain/research site
- sitemap/robots where useful

Do **not** pretend CHEAP//PC is the merchant for third-party listings.

---

## P2 — Source discovery and refresh

### 2.1 eBay adapter feasibility gate
Before building heavily around eBay Buy APIs:

1. create/confirm eBay developer account;
2. confirm production eligibility for the intended use;
3. apply for required production access;
4. only then invest in the production Browse API collector.

eBay supports `EBAY_AU` in Browse API, but current Buy API documentation states production access is restricted/approval-based.

If approved, store:
- item ID
- item URL
- current price
- shipping
- item location
- item end date
- availability
- seller data permitted by terms
- snapshots for price/status history

### 2.2 Compliant fallback sources
Investigate, source by source:

- retailer product feeds/APIs
- public clearance pages where automated access is permitted
- Cash Converters/public shop inventory
- auction/surplus feeds
- local refurbishers
- user-submitted URLs

### 2.3 Restricted marketplace workflow
For Facebook Marketplace and Gumtree:

- no unattended prohibited scraper
- manual URL import
- user-assisted save workflow
- optional email/saved-search ingestion only when allowed
- make freshness/manual nature obvious

### 2.4 Source health dashboard
Track:

- last successful run
- listings discovered
- listings refreshed
- errors
- source disabled reason
- terms/access review date

---

## P3 — Compatibility and performance intelligence

### 3.1 Hardware reference dataset
Create versioned reference records for:

- CPUs
- GPUs
- common office-PC chassis
- PSU limits
- low-profile restrictions
- common proprietary connectors
- Windows 11 official support status

### 3.2 Deterministic compatibility engine
Rules first, prose second.

A build is only “verified compatible” when enough facts are known to validate:

- physical fit
- slot/profile
- power draw/connectors
- PSU capability
- RAM generation/type
- storage interface
- proprietary adapter requirements

Otherwise label it **UNVERIFIED**.

### 3.3 Build combiner
Generate valid <=budget combinations from canonical listings.

Reject combinations when:
- postage pushes total over cap
- required parts are missing
- compatibility is unknown but presented as certain
- listing is stale/sold
- auction price is not final

### 3.4 Performance model
Prefer understandable tiers over fake FPS precision:

- basic desktop
- retro
- light esports
- older 1080p gaming

Keep benchmark source + observed date with every reference number.

---

## P4 — Dubbo refurb business experiment

### 4.1 Refurb profit calculator
Inputs:
- acquisition
- inbound freight
- RAM
- SSD
- battery
- charger
- repairs
- cleaning/consumables
- selling/platform fees
- negotiation allowance
- failure/return reserve
- licence allocation per unit
- labour minutes

Outputs:
- true cost
- break-even
- gross profit
- profit after reserves
- effective hourly return

### 4.2 Standard refurb checklist
For each machine record:

- serial/service tag internally
- ownership/source record
- visual grade
- charger safety/condition
- battery health
- SMART/SSD health
- RAM test
- CPU thermals
- keyboard/touchpad
- screen/dead pixels
- webcam/mic/speakers
- Wi-Fi/Bluetooth
- USB/video ports
- BIOS/UEFI state
- Windows licence/activation status
- official Windows 11 support
- final wipe/install
- final photos

### 4.3 Real Dubbo demand experiment
Run a small measured test before bulk stock:

- one genuinely surplus/refurbished machine
- record list price
- platform
- views
- saves
- enquiries
- offers
- time-to-sale
- achieved price
- buyer use case (only if volunteered)
- actual refurb cost/time

Repeat enough times to replace assumptions with local evidence.

### 4.4 Compliance pack
Maintain dated links/checklists for:

- NSW second-hand dealer licensing
- NSW transaction/holding/reporting requirements
- Australian Consumer Law
- electrical safety for supplied chargers
- tax/business record obligations

No legal/compliance number should be treated as timeless.

---

## P5 — Engineering quality

### 5.1 CI
On every relevant change:

- validate canonical JSON
- smoke-test generated HTML/data references
- check internal links
- generate PDF deterministically
- deploy only after validation passes

### 5.2 Workflow security
- minimum `GITHUB_TOKEN` permissions
- pin reusable actions to immutable commit SHAs where practical
- avoid exposing secrets to untrusted PR workflows
- separate write-capable report generation from read-only validation

### 5.3 Tests
Add tests for:

- money arithmetic
- budget boundary ($100.00 valid; $100.01 invalid)
- auction/watch handling
- stale-date handling
- unknown shipping
- build compatibility
- profit calculator

### 5.4 Generated report architecture
Refactor `generate_report.py` so it reads canonical structured data rather than hard-coding listing facts.

Generated outputs must not become a second source of truth.

---

## P6 — Operations and long-term product quality

### 6.1 History
Keep immutable listing snapshots for:

- first seen
- last seen
- price changes
- shipping changes
- sold/gone timestamp

### 6.2 Observability
Expose:

- data age
- collector health
- last successful refresh
- validation status

### 6.3 Governance
For every source document:

- automation mode
- terms/access basis
- data retained
- refresh cadence
- failure behaviour
- review date

### 6.4 Documentation
Keep README short and operational.
Move deeper material into:
- architecture
- source policy
- data model
- research method
- compliance
- roadmap

---

# Immediate implementation order

The first working tranche is now complete:

1. ✅ **Roadmap** — this file.
2. ✅ **Canonical data** — site listings live in structured JSON.
3. ✅ **Validator** — deterministic budget/data checks.
4. ✅ **CI validation** — validator + boundary tests on pushes/PRs.
5. ✅ **Evidence UX** — status, shipping confidence and freshness on cards.
6. ✅ **Pages workflow repair** — deploy is validation-gated and live.
7. ✅ **Source strategy correction** — eBay production-access constraint and fallbacks documented.
8. ✅ **PDF deduplication** — shortlist listing facts now come from canonical data.

The next tranche should prioritise immutable history, shareable listing details, compatibility rules and the refurb profit/QA tooling before attempting broad source automation.

Each commit should do one job and leave the repository in a reviewable state.

---

# External guidance informing this roadmap

- eBay Browse API supports the Australian marketplace (`EBAY_AU`), but current Buy API production access is approval/restriction based:
  - https://developer.ebay.com/api-docs/buy/ref-marketplace-supported.html
  - https://developer.ebay.com/api-docs/buy/buy-requirements.html
- GitHub Pages custom Actions workflows require Pages to be enabled in repository settings before the workflow can deploy:
  - https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
  - https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub recommends least-privilege workflow permissions and pinning third-party actions to full commit SHAs for stronger workflow security:
  - https://docs.github.com/en/actions/reference/security/secure-use
- WCAG 2.2 requires status/information not to depend on colour alone and supports programmatically exposed status messages:
  - https://www.w3.org/TR/WCAG/
