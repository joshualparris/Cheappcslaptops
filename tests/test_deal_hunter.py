import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("deal_hunter", ROOT / "scripts" / "deal_hunter.py")
deal_hunter = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deal_hunter)


class DealHunterAvailabilityTests(unittest.TestCase):
    def test_ended_marker_overrides_buy_it_now_text(self):
        html = """
        <html>
          <body>
            <h1>This listing has ended.</h1>
            <div>Sold AU $102.50</div>
            <div>Buy It Now</div>
          </body>
        </html>
        """
        status, note = deal_hunter.classify_listing_html(
            "https://www.ebay.com.au/itm/327369525623", 200, html
        )
        self.assertEqual(status, "gone")
        self.assertIn("unavailable", note)

    def test_live_ebay_buy_it_now_is_active(self):
        html = "<html><body><button>Buy It Now</button></body></html>"
        status, _ = deal_hunter.classify_listing_html(
            "https://www.ebay.com.au/itm/227545382071", 200, html
        )
        self.assertEqual(status, "active")

    def test_404_is_gone(self):
        status, note = deal_hunter.classify_listing_html(
            "https://www.ebay.com.au/itm/1", 404, "<html></html>"
        )
        self.assertEqual(status, "gone")
        self.assertEqual(note, "HTTP 404")

    def test_non_direct_url_is_unverified(self):
        status, note = deal_hunter.validate_listing(
            "https://www.ebay.com.au/shop/hp-parts?_nkw=hp+parts"
        )
        self.assertEqual(status, "unverified")
        self.assertIn("not a direct listing URL", note)


if __name__ == "__main__":
    unittest.main()
