# Repair-Flip Deal Hunter

Automated screening for cheap faulty computers that may have a simple, profitable repair.

## Strategy

The hunter favours business-class ThinkPad / Latitude / EliteBook / ProBook machines, Intel 8th-gen+ hardware, and explicit low-risk faults such as **boots to BIOS**, missing SSD/RAM/charger, worn battery, Wi-Fi card or minor keyboard faults.

It heavily penalises liquid damage, no-power machines, motherboard faults, BIOS/iCloud/MDM locks, cracked/burned PCBs and GPU faults.

## Search source

The scheduled workflow uses the **Brave Search API** to discover publicly indexed listing pages. It does not log in to or scrape eBay, Gumtree or Facebook Marketplace directly.

Add repository secret `BRAVE_SEARCH_API_KEY` to activate external searching. Without it the workflow exits safely.

Strong new leads are opened as GitHub issues.

## Availability validation — hard gate

A search result is **discovery only**. Before an item can become a `STRONG LEAD`, the hunter must open the direct marketplace listing and classify it:

- `active` — page is reachable and exposes live purchase/bid controls (eBay) or a live listing structure (Gumtree)
- `gone` — page explicitly says unavailable/out of stock/ended, or returns 404/410
- `unverified` — page could not be confidently validated

Only `active` listings may generate strong-lead alerts. `gone` and `unverified` items remain non-actionable.

Availability should still be rechecked immediately before purchase because marketplace inventory can disappear between scheduled runs.

## Current benchmark lead — 1 October 2026

**HP ProBook 430 G5 — AU $79**

- i5-8250U (8th gen), 8 GB RAM, 256 GB SSD
- seller describes a boot issue + worn battery
- laptop only; no charger
- free delivery shown by eBay
- working/refurbished examples currently appear around the high-$100s to mid-$200s

Listing: https://www.ebay.com.au/itm/227545382071

This is a **promising lead, not an automatic buy**. A vague boot issue can still be a motherboard fault. A better target is a machine explicitly stated to boot to BIOS with only storage/RAM/charger missing.

## Files

- `config/deal-hunter.json` — scoring rules and queries
- `scripts/deal_hunter.py` — search + scoring engine
- `.github/workflows/deal-hunter.yml` — six-hour schedule
- `deal-hunter/latest.json` — latest results after a successful run
- `deal-hunter/seen.json` — dedupe state

## Invalidated lead — Dell XPS

The earlier Gumtree Dell XPS lead is **gone**. On 1 October 2026 the actual Gumtree page displayed **“This listing is no longer available.”**

It is retained conceptually as the reason the hunter now has a hard availability-validation gate.

## Current validated examples — 1 October 2026

These direct eBay pages were individually checked and were live with purchase controls at validation time:

### HP ProBook 430 G5 — AU $79 delivered

- i5-8250U / 8 GB / 256 GB SSD
- seller states boot issue + worn battery
- no charger
- free delivery
- direct listing: https://www.ebay.com.au/itm/227545382071

Working/refurbished Australian examples currently appear around roughly AU $195–$245 depending on seller/condition. The unknown boot fault is the main risk.

### HP EliteBook x360 1030 G3 — AU $99 delivered

- i5-8350U / 8 GB / 256 GB SSD
- seller states it does not reliably start
- no charger
- free delivery
- direct listing: https://www.ebay.com.au/itm/227542095684

Current working listings for the same family/configuration are substantially higher, including examples around the mid-$200s to high-$300s. This creates higher upside, but the intermittent boot fault is less predictable than a known missing-storage repair.

### Acer Aspire 3 A314-52-59LS — AU $40 + AU $15 delivery

- i5-8265U / 4 GB / 128 GB SSD
- **boots all the way into Windows 11**
- known faults: cracked LCD, broken hinge and broken LCD covers
- no charger
- direct listing: https://www.ebay.com.au/itm/278334237956

This has much lower electronic-diagnosis risk, but screen/hinge/chassis parts may consume most of the margin. It is a good example of why “known fault” is not automatically “best profit.”
