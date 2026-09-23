#!/usr/bin/env python3
"""Validate CHEAP//PC canonical listing data.

Uses only the Python standard library so it can run locally and in GitHub Actions
without installing dependencies.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "docs" / "data" / "listings.json"

KINDS = {"desktop", "laptop", "part"}
LISTING_CLASSES = {"complete-system", "component"}
BUYING_MODES = {"fixed-price", "auction", "negotiation", "pickup"}
URL_KINDS = {"direct-listing", "search-fallback", "manual-import"}
SHIPPING_CONFIDENCE = {"verified", "advertised", "estimated", "pickup", "unknown"}
AVAILABILITY_STATUS = {"active", "watch", "stale", "sold", "gone", "unknown"}
AVAILABILITY_CONFIDENCE = {
    "verified",
    "observed-listing",
    "search-result",
    "user-saved",
    "unknown",
}
OS_SUPPORT = {
    "officially-supported",
    "unsupported-unverified",
    "not-assessed",
    "not-applicable",
}


def is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def parse_iso_date(value: object, field: str, errors: list[str]) -> date | None:
    if not isinstance(value, str):
        errors.append(f"{field}: expected YYYY-MM-DD string")
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        errors.append(f"{field}: invalid ISO date {value!r}")
        return None


def require(mapping: dict, key: str, prefix: str, errors: list[str]) -> object:
    if key not in mapping:
        errors.append(f"{prefix}: missing required field {key!r}")
        return None
    return mapping[key]


def validate_url(value: object, prefix: str, errors: list[str]) -> None:
    if not isinstance(value, str) or not value:
        errors.append(f"{prefix}: sourceUrl must be a non-empty URL")
        return
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc:
        errors.append(f"{prefix}: sourceUrl must be an absolute HTTPS URL")


def validate_listing(
    listing: object,
    index: int,
    budget: float,
    ids: set[str],
    errors: list[str],
    warnings: list[str],
) -> None:
    prefix = f"listings[{index}]"
    if not isinstance(listing, dict):
        errors.append(f"{prefix}: expected object")
        return

    listing_id = require(listing, "id", prefix, errors)
    if not isinstance(listing_id, str) or not listing_id.strip():
        errors.append(f"{prefix}.id: must be a non-empty string")
        listing_id = f"#{index}"
    elif listing_id in ids:
        errors.append(f"{prefix}.id: duplicate ID {listing_id!r}")
    else:
        ids.add(listing_id)

    prefix = f"listing {listing_id!r}"

    for field in ("title", "source", "sourceUrl", "evidenceNote", "lastCheckedAt"):
        value = require(listing, field, prefix, errors)
        if field not in {"sourceUrl", "lastCheckedAt"} and (not isinstance(value, str) or not value.strip()):
            errors.append(f"{prefix}.{field}: must be a non-empty string")

    validate_url(listing.get("sourceUrl"), prefix, errors)

    enum_fields = [
        ("kind", KINDS),
        ("listingClass", LISTING_CLASSES),
        ("buyingMode", BUYING_MODES),
        ("urlKind", URL_KINDS),
        ("shippingConfidence", SHIPPING_CONFIDENCE),
        ("availabilityStatus", AVAILABILITY_STATUS),
        ("availabilityConfidence", AVAILABILITY_CONFIDENCE),
    ]
    for field, allowed in enum_fields:
        value = require(listing, field, prefix, errors)
        if value not in allowed:
            errors.append(f"{prefix}.{field}: {value!r} not in {sorted(allowed)}")

    monetary_fields = (
        "itemPriceAud",
        "shippingAud",
        "mandatoryFeesAud",
        "requiredPartsAud",
        "allInAud",
    )
    money: dict[str, float | None] = {}
    for field in monetary_fields:
        value = require(listing, field, prefix, errors)
        if value is None and field in {"shippingAud", "allInAud"}:
            money[field] = None
            continue
        if not is_number(value) or float(value) < 0:
            errors.append(f"{prefix}.{field}: must be a non-negative finite number")
            money[field] = None
        else:
            money[field] = float(value)

    shipping_confidence = listing.get("shippingConfidence")
    if money["shippingAud"] is None and shipping_confidence not in {"unknown", "pickup"}:
        errors.append(
            f"{prefix}: shippingAud may be null only when shippingConfidence is unknown/pickup"
        )
    if shipping_confidence == "unknown" and money["shippingAud"] is not None:
        warnings.append(
            f"{prefix}: shipping is marked unknown but a numeric shippingAud is present"
        )
    if shipping_confidence == "pickup" and money["shippingAud"] not in {0.0, None}:
        errors.append(f"{prefix}: pickup listing cannot have paid shipping")

    components = [
        money["itemPriceAud"],
        money["shippingAud"],
        money["mandatoryFeesAud"],
        money["requiredPartsAud"],
    ]
    if all(v is not None for v in components):
        expected = round(sum(v for v in components if v is not None), 2)
        actual = money["allInAud"]
        if actual is None:
            errors.append(f"{prefix}: allInAud is required when all cost components are known")
        elif abs(expected - actual) > 0.005:
            errors.append(
                f"{prefix}: allInAud {actual:.2f} does not equal cost sum {expected:.2f}"
            )

    buying_mode = listing.get("buyingMode")
    status = listing.get("availabilityStatus")
    listing_class = listing.get("listingClass")

    if buying_mode == "auction" and status != "watch":
        errors.append(f"{prefix}: auctions must be availabilityStatus='watch' until final")
    if buying_mode == "auction":
        award = str(listing.get("award", "")).lower()
        if "best complete" in award or "winner" in award:
            errors.append(f"{prefix}: an unresolved auction cannot be labelled a confirmed winner")

    if listing_class == "complete-system" and buying_mode == "fixed-price":
        total = money["allInAud"]
        if total is not None and total > budget + 0.005:
            errors.append(
                f"{prefix}: fixed-price complete system exceeds hard budget "
                f"({total:.2f} > {budget:.2f})"
            )

    url_kind = listing.get("urlKind")
    source_url = str(listing.get("sourceUrl", ""))
    if url_kind == "direct-listing" and "/sch/" in source_url:
        errors.append(f"{prefix}: direct-listing URL appears to be a search URL")
    if url_kind == "search-fallback":
        if status == "active":
            errors.append(f"{prefix}: search-fallback records cannot be availabilityStatus='active'")
        warnings.append(f"{prefix}: search-fallback evidence is a research lead, not a verified current listing")
    if url_kind == "direct-listing" and status == "active" and listing.get("availabilityConfidence") != "verified":
        errors.append(f"{prefix}: active direct listings must have availabilityConfidence='verified'")

    first_seen = parse_iso_date(listing.get("firstSeenAt"), f"{prefix}.firstSeenAt", errors)
    last_checked = parse_iso_date(listing.get("lastCheckedAt"), f"{prefix}.lastCheckedAt", errors)
    if first_seen and last_checked and last_checked < first_seen:
        errors.append(f"{prefix}: lastCheckedAt is before firstSeenAt")

    hardware = listing.get("hardware")
    if not isinstance(hardware, dict):
        errors.append(f"{prefix}.hardware: expected object")
    else:
        os_support = hardware.get("osSupport")
        if os_support is not None and os_support not in OS_SUPPORT:
            errors.append(
                f"{prefix}.hardware.osSupport: {os_support!r} not in {sorted(OS_SUPPORT)}"
            )

    if listing.get("shippingConfidence") != "verified":
        warnings.append(
            f"{prefix}: delivered cost is not postcode-2830 checkout-verified "
            f"({listing.get('shippingConfidence')})"
        )


def validate(path: Path) -> tuple[list[str], list[str], int]:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return [f"Data file not found: {path}"], warnings, 0
    except json.JSONDecodeError as exc:
        return [f"Invalid JSON: {exc}"], warnings, 0

    if not isinstance(payload, dict):
        return ["Top-level JSON value must be an object"], warnings, 0

    if payload.get("schemaVersion") != 1:
        errors.append("schemaVersion must currently be 1")

    parse_iso_date(payload.get("snapshotDate"), "snapshotDate", errors)

    challenge = payload.get("challenge")
    if not isinstance(challenge, dict):
        errors.append("challenge must be an object")
        budget = 100.0
    else:
        budget_value = challenge.get("budgetAud")
        if not is_number(budget_value) or float(budget_value) <= 0:
            errors.append("challenge.budgetAud must be a positive number")
            budget = 100.0
        else:
            budget = float(budget_value)

        if challenge.get("currency") != "AUD":
            errors.append("challenge.currency must be AUD")
        destination = challenge.get("destination")
        if not isinstance(destination, str) or "2830" not in destination:
            errors.append("challenge.destination must identify Dubbo NSW 2830")

    listings = payload.get("listings")
    if not isinstance(listings, list) or not listings:
        errors.append("listings must be a non-empty array")
        listings = []

    ids: set[str] = set()
    for index, listing in enumerate(listings):
        validate_listing(listing, index, budget, ids, errors, warnings)

    return errors, warnings, len(listings)


def main() -> int:
    path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_DATA
    errors, warnings, count = validate(path)

    print(f"CHEAP//PC data validation: {path}")
    print(f"Listings checked: {count}")

    for warning in warnings:
        print(f"WARNING: {warning}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"PASS: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
