#!/usr/bin/env python3
"""Zero-dependency smoke test for every static GitHub Pages HTML entry point."""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

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


def local_target(source_file: Path, value: str) -> tuple[Path | None, str | None]:
    if value.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
        return None, None

    parsed = urlsplit(value)
    fragment = parsed.fragment or None
    path = unquote(parsed.path)

    if not path:
        return source_file, fragment

    if path.startswith("/"):
        target = (DOCS / path.lstrip("/")).resolve()
    else:
        target = (source_file.parent / path).resolve()

    try:
        target.relative_to(DOCS.resolve())
    except ValueError:
        return Path("__outside_docs__"), fragment
    return target, fragment


def parse_html(path: Path) -> LocalReferenceParser:
    parser = LocalReferenceParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def main() -> int:
    errors: list[str] = []

    if not INDEX.exists():
        print("ERROR: docs/index.html is missing")
        return 1

    html_files = sorted(DOCS.rglob("*.html"))
    if not html_files:
        print("ERROR: no HTML pages found under docs/")
        return 1

    parsed_pages = {path.resolve(): parse_html(path) for path in html_files}
    reference_count = 0
    id_count = 0

    for page, parser in parsed_pages.items():
        page_label = page.relative_to(ROOT)
        id_count += len(parser.ids)

        for duplicate in sorted(parser.duplicate_ids):
            errors.append(f"{page_label}: duplicate HTML id: {duplicate}")

        for attr, value in parser.refs:
            reference_count += 1
            target, fragment = local_target(page, value)
            if target is None:
                continue
            if target.name == "__outside_docs__":
                errors.append(f"{page_label}: {attr} escapes docs directory: {value}")
                continue
            if not target.exists():
                errors.append(f"{page_label}: missing local {attr} target: {value}")
                continue

            if fragment and target.suffix.lower() == ".html":
                target_parser = parsed_pages.get(target.resolve())
                if target_parser is None:
                    target_parser = parse_html(target)
                    parsed_pages[target.resolve()] = target_parser
                if fragment not in target_parser.ids:
                    errors.append(
                        f"{page_label}: missing fragment {fragment!r} in "
                        f"{target.relative_to(ROOT)}"
                    )

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
        f"{len(html_files)} HTML page(s), "
        f"{reference_count} references scanned, "
        f"{id_count} unique IDs."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
