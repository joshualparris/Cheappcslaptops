# Cheap PCs & Laptops

A live Australian bargain-finder for **ultra-budget PCs, laptops and parts**, starting with a simple challenge:

> **How powerful a complete PC can we get for $100 AUD all-in, delivered to or collected around Dubbo NSW 2830?**

The long-term goal is a website that continuously discovers current listings, normalises the real delivered cost, estimates hardware capability, filters out misleading/incompatible bargains, and ranks the best value options.

## Current bargain board

The first working static site is now in [docs/index.html](docs/index.html), with the researched deal data in [docs/app.js](docs/app.js).

Current 23 September 2026 sweep includes:
- Dell OptiPlex 9020 SFF — i7-4770 / 8 GB / 500 GB — **$99 shown delivered**
- HP ProDesk 600 G1 SFF — i5-4590 / 8 GB / 128 GB SSD — **$99 shown delivered**
- HP T630 thin client — GX-420GI / 8 GB / 32 GB SSD + adaptor — **$68 shown delivered**
- Samsung Chromebook 4 — N4020 / 4 GB / 64 GB — **$99 shown delivered**
- cheap DDR3 RAM, low-profile GPUs, SATA SSDs and a GTX 960, all with shipping included in the displayed total

The site has desktop/laptop/parts filters, search, delivered-price breakdowns, compatibility notes and source links.

> Shipping is the amount shown by the current marketplace result. Re-check delivery to postcode **2830** at checkout before buying.

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

- [Deep Research Prompt](docs/DEEP-RESEARCH-PROMPT.md)
- [Live Website Specification](docs/WEBSITE-SPEC.md)

## Site publishing

A GitHub Pages workflow is included at [.github/workflows/pages.yml](.github/workflows/pages.yml). If Pages has not yet been enabled for this repository, set **Settings → Pages → Build and deployment → Source → GitHub Actions**, then re-run the workflow.

Expected Pages URL once enabled:

https://joshualparris.github.io/Cheappcslaptops/

## Next phases

- eBay AU Browse API for live automatic discovery and refresh
- sold/gone detection and price history
- verified postcode-specific shipping where the source API supports it
- more retailers and local/manual marketplace imports
- deterministic parts compatibility and a real sub-$100 build combiner

## Status

**Working bargain-board v1 created 23 September 2026.** Current listings are manually researched snapshots; automated source refresh is the next phase.
