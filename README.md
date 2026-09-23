# Cheap PCs & Laptops

A live Australian bargain-finder for **ultra-budget PCs, laptops and parts**, starting with a simple challenge:

> **How powerful a complete PC can we get for $100 AUD all-in, delivered to or collected around Dubbo NSW 2830?**

The long-term goal is a website that continuously discovers current listings, normalises the real delivered cost, estimates hardware capability, filters out misleading/incompatible bargains, and ranks the best value options.

## Core rules

- Hard budgets are **all-in**: item + postage + mandatory fees + essential missing parts.
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
- Tower only; monitor/keyboard/mouse/network are already available.
- Used, refurbished, ex-office, repairable and parts-combination builds are all in scope.

## Documents

- [Deep Research Prompt](docs/DEEP-RESEARCH-PROMPT.md)
- [Live Website Specification](docs/WEBSITE-SPEC.md)

## Proposed site

The first useful version should show:

- current listings
- delivered/local-pickup total
- CPU/GPU/RAM/storage
- compatibility warnings
- estimated performance tier
- value score
- last checked / availability
- direct source link
- filters for complete PCs, laptops, GPUs, office PCs and parts
- a **$100 Challenge** leaderboard
- a build-combiner that can pair an office PC with a cheap GPU/SSD/RAM while enforcing the total budget

## Status

Planning / research stage. The repository was initialised on 23 September 2026.
