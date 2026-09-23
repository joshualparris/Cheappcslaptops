#!/usr/bin/env python3
"""Small zero-dependency smoke test for the static GitHub Pages site."""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
INDEX = DOCS / "index.html"


class LocalReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self.duplicate_ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.add(element_id)
            self.ids.add(element_id)

        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.refs.append((attr, value))


def local_target(value: str) -> tuple[Path | None, str | None]:
    if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
        return None, None

    parsed = urlsplit(value)
    fragment = parsed.fragment or None
    path = unquote(parsed.path)

    if not path:
        return INDEX, fragment

    target = (DOCS / path.lstrip("./")).resolve()
    try:
        target.relative_to(DOCS.resolve())
    except ValueError:
        return Path("__outside_docs__"), fragment
    return target, fragment


def main() -> int:
    errors: list[str] = []

    if not INDEX.exists():
        print("ERROR: docs/index.html is missing")
        return 1

    parser = LocalReferenceParser()
    parser.feed(INDEX.read_text(encoding="utf-8"))

    for duplicate in sorted(parser.duplicate_ids):
        errors.append(f"duplicate HTML id: {duplicate}")

    for attr, value in parser.refs:
        target, fragment = local_target(value)
        if target is None:
            continue
        if target.name == "__outside_docs__":
            errors.append(f"{attr} escapes docs directory: {value}")
            continue
        if not target.exists():
            errors.append(f"missing local {attr} target: {value}")
            continue
        if target == INDEX and fragment and fragment not in parser.ids:
            errors.append(f"missing in-page fragment target: #{fragment}")

    for required in (
        DOCS / "data" / "listings.json",
        DOCS / "data" / "fleet-valuations-2026-09-23.json",
    ):
        try:
            json.loads(required.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"invalid JSON {required.relative_to(ROOT)}: {exc}")

    for required in (DOCS / "robots.txt", DOCS / "sitemap.xml", DOCS / ".nojekyll"):
        if not required.exists():
            errors.append(f"required static asset missing: {required.relative_to(ROOT)}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"\nSite smoke test failed with {len(errors)} error(s).")
        return 1

    print(
        "Site smoke test passed: "
        f"{len(parser.refs)} local/external references scanned, "
        f"{len(parser.ids)} unique IDs."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
