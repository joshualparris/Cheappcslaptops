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
- Listing facts are duplicated across:
  - `docs/app.js`
  - `docs/data/research-2026-09-23.json`
  - `docs/research/2026-09-23.md`
  - the PDF generator
  - homepage prose
- The website therefore can drift away from the research evidence.
- There is no automated schema/logic validation.
- Some listings use a search-results URL rather than a specific listing URL.
- Shipping described as “free” is not necessarily postcode-2830 checkout-verified.
- There is no consistent first-seen / last-checked / expires-or-stale model.
- A seller-installed Windows 11 claim can appear on hardware that Microsoft does not officially support; OS-installed and OS-supported need separate fields.

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
- Pages currently fails because `configure-pages` is trying to auto-enable Pages through an integration that cannot change that repository setting.
- There is no validation job before deploy.
- Workflow actions are referenced by moving version tags rather than immutable commit SHAs.
- Generated PDF automation writes directly to `main`, which can create noisy follow-up workflow runs.

### Front-end / UX
- Price is prominent, but evidence quality is not.
- “Shipping shown” needs a clear confidence/status label.
- No visible stale/expired indicator.
- No separate treatment for:
  - confirmed fixed-price buys
  - auction watches
  - negotiation-required listings
  - shipping-unverified listings
- Search/filter state is not reflected in the URL.
- There is no shareable listing detail page.
- Accessibility can improve: status should never rely on colour alone, dynamic result counts should be announced, and focus states/navigation should be audited against WCAG 2.2.
- There is no structured metadata for search engines/social sharing.

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

The first working tranche will be deliberately small commits:

1. **Roadmap** — this file.
2. **Canonical data** — move site listings into a structured JSON file.
3. **Validator** — add deterministic budget/data checks.
4. **CI validation** — run validator on pushes/PRs.
5. **Evidence UX** — show status, shipping confidence and freshness on cards.
6. **Pages workflow repair** — remove unsupported auto-enablement and gate deploy on validation.
7. **Source strategy correction** — document eBay production-access constraint and fallback approach.
8. **PDF deduplication prep** — begin moving report facts toward canonical structured data.

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
