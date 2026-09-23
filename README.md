# Cheap PCs & Laptops

An evidence-labelled Australian bargain board for **ultra-budget PCs, laptops and parts**, starting with a simple challenge:

> **How powerful a complete PC can we get for $100 AUD all-in, delivered to or collected around Dubbo NSW 2830?**

The long-term goal is a website that continuously discovers current listings, normalises the real delivered cost, estimates hardware capability, filters out misleading/incompatible bargains, and ranks the best value options.

**Live site:** https://joshualparris.github.io/Cheappcslaptops/  
**Roadmap:** [ROADMAP.md](ROADMAP.md)  
**Source/data policy:** [docs/SOURCE-STRATEGY.md](docs/SOURCE-STRATEGY.md)

## Current bargain board

The working static site is in [docs/index.html](docs/index.html), with canonical researched listing data in [docs/data/listings.json](docs/data/listings.json) and rendering logic in [docs/app.js](docs/app.js).

Current 23 September 2026 sweep includes:
- Dell OptiPlex 9020 SFF — i7-4770 / 8 GB / 500 GB — **$99 shown delivered**
- HP ProDesk 600 G1 SFF — i5-4590 / 8 GB / 128 GB SSD — **$99 shown delivered**
- HP T630 thin client — GX-420GI / 8 GB / 32 GB SSD + adaptor — **$68 shown delivered**
- Dell Thin Client 5070 — J5005 / 4 GB / 16 GB eMMC + PSU — **$68 shown delivered**
- ASUS Chromebook C214M Touch — N4020 / 4 GB — **$77 shown delivered**
- Acer C731 Chromebook — N3160 — **$70 shown delivered**
- ASUS E402S — N3050 / 2 GB / 32 GB eMMC / Windows 10 — **$89 shown delivered**
- Toshiba Satellite L455-S5980 — T3000 / 4 GB / 500 GB / Windows 10 — **$91 shown delivered**
- Samsung Chromebook 4 and ASUS Chromebook C204MA — **$99 shown delivered**
- Lenovo ThinkPad Core i3 13.3-inch and Acer Aspire 5750 — **$100 shown delivered**
- cheap DDR3 RAM, low-profile GPUs, SATA SSDs and a GTX 960, all with shipping included in the displayed total

The site now renders directly from canonical JSON and includes desktop/laptop/parts filters, a separate auction-watch view, shareable search/filter URLs, per-listing detail links, freshness/evidence badges, delivered-price breakdowns, compatibility notes and source links.

> Shipping is the amount shown by the current marketplace result. Re-check delivery to postcode **2830** at checkout before buying.

## Dubbo refurbished laptop resale research

The website now also includes a current viability assessment for **buying cheap laptops, refurbishing/upgrading them, and reselling them locally in Dubbo**.

Key findings:
- There appears to be a genuine local refurbished-computer category.
- The strongest resale lane is likely **$150–$250 business-class laptops**, not very old low-end machines.
- Prefer **Windows 11-supported hardware**, normally Intel 8th gen or newer or comparable supported Ryzen.
- For stock bought specifically to flip, aim for roughly **$80–$100 visible gross margin** after known parts, delivery and repair costs.
- NSW second-hand dealer rules are a significant business consideration: electronic goods are prescribed goods, the 2026–27 new 1-year licence fee is **$692**, and current rules generally include transaction records, police reporting and a 14-day hold before goods are altered or resold.
- The best next step is a controlled local test listing before buying stock in volume.

Full research:
- [Dubbo Refurbished Laptop Market — Viability Research](docs/DUBBO-REFURB-MARKET.md)

## Current fleet resale valuation

The site now also tracks the estimated resale value of Josh's current computer fleet.

Current 23 September 2026 valuation:
- **15 active laptops:** about **$1,860** maximum plausible gross
- **7 active desktops:** about **$1,870** if sold complete
- **Whole active fleet sold complete:** about **$3,730**
- **Optimised upper end with the Crosshair V system parted out:** about **$3,830**
- **Faster-sale expectation:** roughly **$2,700–$3,200**

These are upper-end indicative targets, not guaranteed completed-sale prices. Marketplace fees, postage, repairs, returns and time are not deducted.

The fleet section includes all tracked machines, specs/condition notes, maximum plausible sale prices, recommended selling channels, search/category controls and current pricing-evidence anchors.

Full valuation:
- [Current Fleet Resale Valuation](docs/FLEET-RESALE-VALUATION.md)
- [Structured fleet valuation data](docs/data/fleet-valuations-2026-09-23.json)

## Refurb profit calculator

The website includes a client-side calculator for:
- purchase price and inbound freight
- RAM, SSD, battery, charger and repairs
- platform/payment fees
- negotiation allowance
- failure/return reserve
- second-hand dealer licence allocation per unit
- labour minutes and a chosen hourly value
- expected achieved sale price

It reports cash cost before labour, break-even including labour, projected profit after allowances, and effective return per labour hour. The calculator is a planning tool only; it does not guarantee an achieved price or determine tax/legal obligations.

## Core rules

- Hard budgets are **all-in**: item + postage + mandatory fees + essential missing parts.
- No complete PC or laptop appears on the qualifying board above **$100 AUD**.
- Local pickup is preferred when postage destroys the value.
- Current availability matters. Dead/out-of-stock listings should disappear quickly.
- Don't call something a bargain until compatibility and missing parts are accounted for.
- Prefer official APIs/feeds where available.
- Only automate sites in ways permitted by their terms and technical access rules.
- Never fabricate shipping prices, specifications or availability.
- Store source URL, source platform, last-seen time and evidence for every listing.

## Initial target

- Budget: **$100 AUD maximum**
- Location: **Dubbo NSW 2830, Australia**
- Tower only for the desktop challenge; monitor/keyboard/mouse/network are already available.
- Laptops are also tracked as a separate category.
- Used, refurbished, ex-office, repairable and parts-combination builds are all in scope.

## Documents

- [Roadmap](ROADMAP.md)
- [Source Strategy and Data Provenance](docs/SOURCE-STRATEGY.md)
- [Deep Research Prompt](docs/DEEP-RESEARCH-PROMPT.md)
- [Live Website Specification](docs/WEBSITE-SPEC.md)
- [Dubbo Refurbished Laptop Market](docs/DUBBO-REFURB-MARKET.md)
- [Current Fleet Resale Valuation](docs/FLEET-RESALE-VALUATION.md)

## Site publishing

A GitHub Pages workflow is included at [.github/workflows/pages.yml](.github/workflows/pages.yml). If Pages has not yet been enabled for this repository, set **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the workflow.

Live Pages URL:

https://joshualparris.github.io/Cheappcslaptops/

## Next phases

- confirm/apply for eBay Buy API production eligibility before building the production adapter
- automated sold/gone detection, refresh and price history
- verified postcode-specific shipping where an authorised source supports it
- more retailer/feed sources plus local/manual marketplace imports
- deterministic parts compatibility and a real sub-$100 build combiner
- browser-level tests for interactive site behaviour
- track Dubbo refurb listing views, enquiries, offers and time-to-sale

## Status

**Working research-backed bargain board and fleet valuation site.** Canonical listing data, fleet valuation data, validators, static-site smoke tests and JavaScript syntax checks run in CI before Pages deploys. Current marketplace listings are still manually researched snapshots; automated source refresh is the next major phase.
