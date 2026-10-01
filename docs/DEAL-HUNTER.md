# Repair-Flip Deal Hunter

Automated screening for cheap faulty computers that may have a simple, profitable repair.

## Strategy

The hunter favours business-class ThinkPad / Latitude / EliteBook / ProBook machines, Intel 8th-gen+ hardware, and explicit low-risk faults such as **boots to BIOS**, missing SSD/RAM/charger, worn battery, Wi-Fi card or minor keyboard faults.

It heavily penalises liquid damage, no-power machines, motherboard faults, BIOS/iCloud/MDM locks, cracked/burned PCBs and GPU faults.

## Search source

The scheduled workflow uses the **Brave Search API** to discover publicly indexed listing pages. It does not log in to or scrape eBay, Gumtree or Facebook Marketplace directly.

Add repository secret `BRAVE_SEARCH_API_KEY` to activate external searching. Without it the workflow exits safely.

Strong new leads are opened as GitHub issues. Every lead must still be manually verified for exact model, shipping to Dubbo, lock status, fault description and live availability before purchase.

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

## Lower-risk lead — 1 October 2026

**Dell XPS — AU $40 negotiable, Fletcher NSW**

- seller says it **boots into BIOS**
- explicit missing part: mSATA storage drive
- genuine power supply included
- shipping available; cost must be confirmed
- exact XPS model/service tag is not stated

Listing: https://www.gumtree.com.au/web/listing/laptops/1344681898

This is a better *fault profile* than a vague no-boot/no-power listing because basic board/CPU/display functionality is already demonstrated by reaching BIOS. Do not estimate resale until the exact model/service tag is confirmed.
