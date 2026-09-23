# Source Strategy and Data Provenance

Updated: 23 September 2026

CHEAP//PC should prefer **reliable, authorised, reproducible data** over broad-but-brittle scraping.

The product goal is not “scrape everything”. It is:

> Find the strongest affordable computer using sources whose price, shipping, availability and provenance can be defended.

## Source modes

Every source must be assigned one explicit mode:

- `api` — official API with suitable production access
- `feed` — official/authorised product or affiliate feed
- `permitted-crawl` — public pages where automated retrieval has been reviewed and is permitted
- `manual` — user-submitted URL or manually researched snapshot
- `disabled` — source is not currently safe/reliable to automate

The mode must be stored with the source configuration and shown in internal source-health tooling.

---

## eBay Australia

### Opportunity

eBay is the strongest structured source found in the first $100 challenge sweep.

The official Browse API supports the Australian marketplace (`EBAY_AU`) for item search/details.

Official references:

- https://developer.ebay.com/api-docs/buy/ref-marketplace-supported.html
- https://developer.ebay.com/api-docs/buy/api-browse.html

Useful Browse API data includes:

- item IDs
- price
- item URL
- item location
- buying option
- item end date
- availability fields
- shipping-related information
- detailed item data

### Critical production constraint

Current eBay Buy API documentation says production access is restricted/approval based and intended for approved partners. Developers should apply for production eligibility before investing heavily in an integration.

Reference:

- https://developer.ebay.com/api-docs/buy/buy-requirements.html

### CHEAP//PC rule

Do **not** treat eBay production API access as guaranteed.

Implementation gate:

1. Confirm eBay developer account.
2. Document intended CHEAP//PC use case.
3. Apply for production access/required partner approval.
4. Record approval/rejection and constraints.
5. Only then build the production collector around the approved API scope.

Sandbox/prototype code is fine before approval, but the core product must retain manual/feed fallbacks.

### Shipping

Shipping displayed in a search result is not equivalent to a postcode-2830 checkout verification.

Store separately:

- `shippingAud`
- `shippingConfidence`
- destination used
- evidence timestamp

Confidence values:

- `verified` — destination-specific quote/checkout/API evidence
- `advertised` — listing/search result says free/$X delivery
- `estimated` — calculated/derived estimate
- `pickup` — local collection
- `unknown` — cannot establish delivery cost

---

## Gumtree Australia

Current project policy remains:

- no unattended server-side scraper by default
- do not bypass bot controls
- user-submitted/manual listing URLs are acceptable research inputs
- saved-search/email ingestion may be considered only when permitted by current terms
- retain timestamp because local classified listings change quickly

Mode today: **manual**

The existing WEBSITE-SPEC records Gumtree's scraping restrictions. Re-check terms before any automation is added.

---

## Facebook Marketplace

There is no general public buyer-search API assumed suitable for arbitrary Marketplace inventory.

Current project policy:

- no unattended logged-in scraping
- manual/user-assisted URL capture
- do not store user Marketplace credentials
- mark Marketplace records as manual/user-saved
- treat inventory coverage as incomplete

Mode today: **manual**

Marketplace is still strategically important because badly titled local systems may beat public-web deals; the safe solution is a compliant human-assisted import path, not pretending the source can be exhaustively scraped.

---

## Cash Converters

Potential value:

- current used inventory
- fixed prices
- condition/location information
- regional stores

Before automating:

1. check for official API/feed;
2. inspect current robots/terms;
3. confirm shipping information can be collected reliably;
4. avoid automation if access conditions are unclear.

Mode today: **research/manual pending access review**

---

## Mainstream retailers

Candidate retailers:

- Umart
- Centre Com
- Scorptec
- Mwave
- MSY / current operating entity
- PC Case Gear
- JB Hi-Fi marketplace
- Kogan
- Amazon AU where an authorised feed/API is available

Prioritise:

1. official API
2. affiliate/product feed
3. public structured product feed/sitemap where permitted
4. permitted low-rate crawl
5. manual only

Near the $100 challenge these sources are more likely to contribute:

- SSD/RAM/PSU parts
- clearance/open-box stock
- low-cost cases/adapters

rather than complete PCs.

---

## Auctions and surplus

Potentially high value:

- ex-government/business fleet disposal
- Grays
- Pickles
- AllBids
- local auction houses

But auction data needs different semantics.

An auction observation must store:

- observed bid
- buyer premium if applicable
- shipping/pickup
- observation time
- end time
- final result only when known

A running bid is always **WATCH**, never a confirmed under-budget winner.

---

## Local Dubbo and Central West sources

Priority geography:

1. Dubbo
2. Narromine
3. Wellington
4. Parkes
5. Orange
6. wider Central West only when travel economics still make sense

Local sources may include:

- computer shops/refurbishers
- community groups
- business clear-outs
- school/organisation disposals
- user-submitted Marketplace/Gumtree links

Travel cost/time must eventually be part of the true acquisition cost for pickup deals.

---

## User-submitted listings

Manual import is a first-class source, not a temporary hack.

A user should eventually be able to submit:

- URL
- screenshot/text evidence
- observed price
- observed shipping
- location
- timestamp

The system then parses it but preserves the original evidence.

AI-extracted fields must remain distinguishable from directly observed facts.

---

## Provenance requirements

Every listing record should be traceable to evidence.

Minimum provenance:

- source
- source mode
- source URL
- direct-listing vs search-fallback
- first seen
- last checked
- availability status/confidence
- item price
- shipping value/confidence
- evidence note

Future automated snapshots should also store the raw source payload or permitted subset needed to explain changes.

---

## Source health

Each automated source should eventually expose:

- enabled/disabled
- mode
- last successful run
- last failure
- listings discovered
- listings refreshed
- error count
- current rate limit status where available
- terms/access review date
- owner/notes

A failing source should degrade independently rather than break the whole site.

---

## Refresh policy

Suggested starting cadence once automation exists:

- high-value API/feed source: hourly to every few hours
- ordinary retailer catalogues: 3–6 hours
- availability verification: daily or faster for high-ranked deals
- auctions: cadence appropriate to remaining time, within source limits
- manual sources: refresh only through user/manual re-check unless an authorised mechanism exists

Do not call a manually researched snapshot “live”.

---

## Data retention

Keep enough history to explain:

- when a listing appeared
- price changes
- shipping changes
- when it became stale/sold/gone

Do not retain:

- marketplace login credentials
- unnecessary buyer/seller personal information
- private street addresses in this public repository

Base destination stays at **Dubbo NSW 2830**, not a private residential address.

---

## Ranking implications

Source confidence must influence presentation.

A $90 search-result lead with unverified shipping should not silently outrank a $99 direct listing with better evidence.

Ranking/views should expose, rather than hide:

- all-in price
- freshness
- shipping confidence
- direct vs fallback evidence
- repair/missing-parts risk
- compatibility confidence
- performance
- upgrade path

CHEAP//PC should optimise for **best defensible bargain**, not merely lowest displayed number.
