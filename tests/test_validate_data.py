import json
import sys
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_data  # noqa: E402


def base_listing():
    return {
        "id": "test-system",
        "kind": "desktop",
        "listingClass": "complete-system",
        "buyingMode": "fixed-price",
        "title": "Test System",
        "seller": "Test Seller",
        "source": "Test Source",
        "sourceUrl": "https://example.com/item/1",
        "urlKind": "direct-listing",
        "itemPriceAud": 90,
        "shippingAud": 10,
        "mandatoryFeesAud": 0,
        "requiredPartsAud": 0,
        "allInAud": 100,
        "shippingConfidence": "advertised",
        "availabilityStatus": "active",
        "availabilityConfidence": "observed-listing",
        "firstSeenAt": "2026-09-23",
        "lastCheckedAt": "2026-09-23",
        "hardware": {
            "cpu": "Example CPU",
            "osInstalled": "None",
            "osSupport": "not-assessed",
        },
        "evidenceNote": "Test evidence.",
        "note": "Test listing.",
        "risks": [],
    }


def payload_with(*listings):
    return {
        "schemaVersion": 1,
        "snapshotDate": "2026-09-23",
        "challenge": {
            "budgetAud": 100,
            "destination": "Dubbo NSW 2830",
            "currency": "AUD",
        },
        "listings": list(listings),
    }


class ValidatorTests(unittest.TestCase):
    def validate_payload(self, payload):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "listings.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            return validate_data.validate(path)

    def test_exactly_100_is_valid(self):
        errors, _, count = self.validate_payload(payload_with(base_listing()))
        self.assertEqual(count, 1)
        self.assertEqual(errors, [])

    def test_100_01_complete_fixed_price_fails_budget(self):
        listing = base_listing()
        listing["itemPriceAud"] = 90.01
        listing["allInAud"] = 100.01
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("exceeds hard budget" in error for error in errors))

    def test_total_must_equal_components(self):
        listing = base_listing()
        listing["allInAud"] = 99
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("does not equal cost sum" in error for error in errors))

    def test_unresolved_auction_must_be_watch(self):
        listing = base_listing()
        listing["buyingMode"] = "auction"
        listing["availabilityStatus"] = "active"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("auctions must be availabilityStatus='watch'" in error for error in errors))

    def test_auction_watch_can_be_observed_under_budget_without_being_winner(self):
        listing = base_listing()
        listing["buyingMode"] = "auction"
        listing["availabilityStatus"] = "watch"
        listing["award"] = "Auction watch"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertEqual(errors, [])

    def test_duplicate_ids_fail(self):
        first = base_listing()
        second = deepcopy(first)
        errors, _, _ = self.validate_payload(payload_with(first, second))
        self.assertTrue(any("duplicate ID" in error for error in errors))

    def test_unknown_shipping_may_be_null(self):
        listing = base_listing()
        listing["shippingAud"] = None
        listing["allInAud"] = None
        listing["shippingConfidence"] = "unknown"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertEqual(errors, [])

    def test_advertised_shipping_cannot_be_null(self):
        listing = base_listing()
        listing["shippingAud"] = None
        listing["allInAud"] = None
        listing["shippingConfidence"] = "advertised"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("shippingAud may be null" in error for error in errors))

    def test_direct_listing_cannot_be_search_url(self):
        listing = base_listing()
        listing["sourceUrl"] = "https://www.ebay.com.au/sch/i.html?_nkw=test"
        listing["urlKind"] = "direct-listing"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("appears to be a search URL" in error for error in errors))

    def test_search_fallback_cannot_be_active_listing(self):
        listing = base_listing()
        listing["sourceUrl"] = "https://www.ebay.com.au/sch/i.html?_nkw=test"
        listing["urlKind"] = "search-fallback"
        listing["availabilityStatus"] = "active"
        listing["availabilityConfidence"] = "search-result"
        errors, _, _ = self.validate_payload(payload_with(listing))
        self.assertTrue(any("search-fallback records cannot be availabilityStatus='active'" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
