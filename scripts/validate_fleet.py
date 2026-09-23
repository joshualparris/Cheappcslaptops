#!/usr/bin/env python3
"""Validate the current fleet resale valuation dataset.

Standard-library only so the check can run in GitHub Actions without dependencies.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "data" / "fleet-valuations-2026-09-23.json"
CATEGORIES = {"laptop", "desktop"}


def is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def main() -> int:
    errors: list[str] = []

    try:
        payload = json.loads(DATA.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERROR: could not read {DATA}: {exc}")
        return 1

    try:
        date.fromisoformat(payload["asOf"])
    except Exception:
        errors.append("asOf must be a valid ISO YYYY-MM-DD date")

    if payload.get("currency") != "AUD":
        errors.append("currency must be AUD")

    machines = payload.get("machines")
    summary = payload.get("summary")
    if not isinstance(machines, list) or not machines:
        errors.append("machines must be a non-empty array")
        machines = []
    if not isinstance(summary, dict):
        errors.append("summary must be an object")
        summary = {}

    seen: set[str] = set()
    category_counts = {key: 0 for key in CATEGORIES}
    category_sums = {key: 0.0 for key in CATEGORIES}

    for index, machine in enumerate(machines):
        prefix = f"machines[{index}]"
        if not isinstance(machine, dict):
            errors.append(f"{prefix}: expected object")
            continue

        name = machine.get("name")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{prefix}.name: required non-empty string")
        elif name in seen:
            errors.append(f"{prefix}.name: duplicate machine name {name!r}")
        else:
            seen.add(name)

        category = machine.get("category")
        if category not in CATEGORIES:
            errors.append(f"{prefix}.category: expected one of {sorted(CATEGORIES)}")
        else:
            category_counts[category] += 1

        value = machine.get("maxPlausible")
        if not is_number(value) or value <= 0:
            errors.append(f"{prefix}.maxPlausible: must be a positive finite number")
        elif category in CATEGORIES:
            category_sums[category] += float(value)

        range_value = machine.get("indicativeRange")
        if range_value is not None:
            if (
                not isinstance(range_value, list)
                or len(range_value) != 2
                or not all(is_number(x) for x in range_value)
                or range_value[0] > range_value[1]
            ):
                errors.append(f"{prefix}.indicativeRange: expected [low, high] numeric range")
            elif is_number(value) and range_value[1] != value:
                errors.append(
                    f"{prefix}.indicativeRange: upper bound should equal maxPlausible ({value})"
                )

        part_out = machine.get("partOutMaxPlausible")
        if part_out is not None:
            if not is_number(part_out) or part_out <= 0:
                errors.append(f"{prefix}.partOutMaxPlausible: must be positive")
            elif is_number(value) and part_out < value:
                errors.append(f"{prefix}.partOutMaxPlausible: cannot be below complete-sale max")

        for field in ("spec", "recommendedPlatform"):
            field_value = machine.get(field)
            if not isinstance(field_value, str) or not field_value.strip():
                errors.append(f"{prefix}.{field}: required non-empty string")

    expected_pairs = {
        "activeLaptops": category_counts["laptop"],
        "activeDesktops": category_counts["desktop"],
        "activeMachines": len(machines),
        "laptopsMaxPlausible": category_sums["laptop"],
        "desktopsMaxCompleteSale": category_sums["desktop"],
        "fleetMaxCompleteSale": category_sums["laptop"] + category_sums["desktop"],
    }

    for field, expected in expected_pairs.items():
        actual = summary.get(field)
        if not is_number(actual) or float(actual) != float(expected):
            errors.append(f"summary.{field}: expected {expected:g}, got {actual!r}")

    desktop_part_out = category_sums["desktop"] + sum(
        float(m["partOutMaxPlausible"]) - float(m["maxPlausible"])
        for m in machines
        if isinstance(m, dict)
        and m.get("category") == "desktop"
        and is_number(m.get("partOutMaxPlausible"))
        and is_number(m.get("maxPlausible"))
    )
    optimised_total = sum(
        float(m.get("partOutMaxPlausible", m.get("maxPlausible", 0)))
        for m in machines
        if isinstance(m, dict) and is_number(m.get("maxPlausible"))
    )

    for field, expected in (
        ("desktopsMaxWithCrosshairPartOut", desktop_part_out),
        ("fleetMaxOptimisedSale", optimised_total),
    ):
        actual = summary.get(field)
        if not is_number(actual) or float(actual) != float(expected):
            errors.append(f"summary.{field}: expected {expected:g}, got {actual!r}")

    for field in ("headlineUpperEndRange", "fasterSaleRange", "excludedAsIsExtraRange"):
        value = summary.get(field)
        if (
            not isinstance(value, list)
            or len(value) != 2
            or not all(is_number(x) for x in value)
            or value[0] > value[1]
        ):
            errors.append(f"summary.{field}: expected ascending [low, high] numeric range")

    evidence = payload.get("evidenceAnchors", [])
    if not isinstance(evidence, list):
        errors.append("evidenceAnchors must be an array")
    else:
        anchored: set[str] = set()
        for index, anchor in enumerate(evidence):
            prefix = f"evidenceAnchors[{index}]"
            if not isinstance(anchor, dict):
                errors.append(f"{prefix}: expected object")
                continue
            machine = anchor.get("machine")
            if not isinstance(machine, str) or machine not in seen:
                errors.append(f"{prefix}.machine: must match a machine name in the active fleet")
            elif machine in anchored:
                errors.append(f"{prefix}.machine: duplicate evidence anchor for {machine!r}")
            else:
                anchored.add(machine)
            for field in ("observed", "interpretation"):
                value = anchor.get(field)
                if not isinstance(value, str) or not value.strip():
                    errors.append(f"{prefix}.{field}: required non-empty string")
            urls = anchor.get("urls")
            if not isinstance(urls, list) or not urls:
                errors.append(f"{prefix}.urls: expected at least one source URL")
            else:
                for url_index, url in enumerate(urls):
                    if not isinstance(url, str) or not url.startswith("https://"):
                        errors.append(f"{prefix}.urls[{url_index}]: must be an HTTPS URL")

    excluded = payload.get("notCountedInMainFleet", [])
    if not isinstance(excluded, list):
        errors.append("notCountedInMainFleet must be an array")
    else:
        for index, item in enumerate(excluded):
            if not isinstance(item, dict):
                errors.append(f"notCountedInMainFleet[{index}]: expected object")
                continue
            rng = item.get("indicativeRange")
            if (
                not isinstance(rng, list)
                or len(rng) != 2
                or not all(is_number(x) for x in rng)
                or rng[0] > rng[1]
            ):
                errors.append(
                    f"notCountedInMainFleet[{index}].indicativeRange: expected ascending [low, high]"
                )

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"\nFleet valuation validation failed with {len(errors)} error(s).")
        return 1

    print(
        "Fleet valuation data valid: "
        f"{len(machines)} machines, "
        f"A${category_sums['laptop'] + category_sums['desktop']:.0f} complete-sale upper end, "
        f"A${optimised_total:.0f} optimised upper end."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
