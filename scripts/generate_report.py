from __future__ import annotations

import html
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "docs/data/listings.json"
RESEARCH_PATH = ROOT / "docs/data/research-2026-09-23.json"
OUT = ROOT / "docs/reports/100-dollar-pc-challenge-2026-09-23.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

listing_payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
research_payload = json.loads(RESEARCH_PATH.read_text(encoding="utf-8"))
LISTINGS = {item["id"]: item for item in listing_payload["listings"]}
BUDGET = float(listing_payload["challenge"]["budgetAud"])
SNAPSHOT_DATE = listing_payload["snapshotDate"]
BENCHMARKS = research_payload.get("benchmarks", {})

font_regular = "Helvetica"
font_bold = "Helvetica-Bold"
reg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
if Path(reg).exists() and Path(bold).exists():
    pdfmetrics.registerFont(TTFont("DV", reg))
    pdfmetrics.registerFont(TTFont("DV-Bold", bold))
    font_regular = "DV"
    font_bold = "DV-Bold"

INK = colors.HexColor("#111318")
LIME = colors.HexColor("#B7FF3C")
VIOLET = colors.HexColor("#7656FF")
MUTED = colors.HexColor("#696D75")
LINE = colors.HexColor("#D7D7D2")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleX", fontName=font_bold, fontSize=31, leading=31, textColor=WHITE, spaceAfter=8))
styles.add(ParagraphStyle(name="HeroSub", fontName=font_regular, fontSize=11.5, leading=17, textColor=colors.HexColor("#D0D2D7")))
styles.add(ParagraphStyle(name="Eyebrow", fontName=font_bold, fontSize=8, leading=10, textColor=VIOLET, tracking=1.6, spaceAfter=5))
styles.add(ParagraphStyle(name="H1X", fontName=font_bold, fontSize=22, leading=24, textColor=INK, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name="H2X", fontName=font_bold, fontSize=14, leading=17, textColor=INK, spaceBefore=5, spaceAfter=7))
styles.add(ParagraphStyle(name="BodyX", fontName=font_regular, fontSize=9.2, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallX", fontName=font_regular, fontSize=7.5, leading=10.5, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name="SmallWhite", fontName=font_regular, fontSize=7.5, leading=10.5, textColor=colors.HexColor("#C8CBD1")))
styles.add(ParagraphStyle(name="CardTitle", fontName=font_bold, fontSize=12.2, leading=14, textColor=INK, spaceAfter=4))
styles.add(ParagraphStyle(name="Price", fontName=font_bold, fontSize=21, leading=22, textColor=INK))
styles.add(ParagraphStyle(name="Badge", fontName=font_bold, fontSize=7, leading=8, textColor=INK))
styles.add(ParagraphStyle(name="Link", fontName=font_regular, fontSize=7, leading=9, textColor=VIOLET, spaceAfter=3))
styles.add(ParagraphStyle(name="Quote", fontName=font_bold, fontSize=15, leading=20, textColor=INK, leftIndent=10 * mm, rightIndent=10 * mm, spaceBefore=8, spaceAfter=12))


def e(value: object) -> str:
    return html.escape(str(value if value is not None else "Unknown"))


def money(value: float | int | None) -> str:
    if value is None:
        return "Unknown"
    value = float(value)
    return f"${value:,.0f}" if value.is_integer() else f"${value:,.2f}"


def listing(listing_id: str) -> dict:
    try:
        return LISTINGS[listing_id]
    except KeyError as exc:
        raise RuntimeError(f"Required report listing missing from canonical data: {listing_id}") from exc


def shipping_text(item: dict) -> str:
    shipping = item.get("shippingAud")
    confidence = item.get("shippingConfidence", "unknown")
    if confidence == "pickup":
        return "pickup only"
    if shipping is None:
        return "shipping unknown"
    if float(shipping) == 0:
        return f"free delivery {confidence}"
    return f"{money(shipping)} delivery {confidence}"


def spec_rows(item: dict) -> list[tuple[str, str]]:
    hardware = item.get("hardware", {})
    rows: list[tuple[str, str]] = []
    for label, key in (("CPU", "cpu"), ("GPU", "gpu")):
        if hardware.get(key):
            rows.append((label, str(hardware[key])))
    if hardware.get("ramGb") is not None:
        rows.append(("RAM", f"{hardware['ramGb']}GB"))
    if hardware.get("storage"):
        rows.append(("Storage", str(hardware["storage"])))
    if hardware.get("osInstalled") and hardware.get("osInstalled") != "Not stated":
        rows.append(("OS", str(hardware["osInstalled"])))
    return rows[:4]


def caveat_text(item: dict) -> str:
    risks = item.get("risks") or []
    evidence = item.get("evidenceNote", "")
    parts = []
    if evidence:
        parts.append(str(evidence))
    if risks:
        parts.append("Risks: " + "; ".join(str(r) for r in risks[:3]))
    return " ".join(parts)


class BarChart(Flowable):
    def __init__(self, rows, max_val, width=170 * mm, bar_h=7 * mm):
        super().__init__()
        self.rows = rows
        self.max_val = max_val
        self.width = width
        self.bar_h = bar_h
        self.height = len(rows) * (bar_h + 4 * mm)

    def draw(self):
        c = self.canv
        label_w = 35 * mm
        x0 = label_w
        maxw = self.width - label_w - 12 * mm
        y = self.height - self.bar_h
        for label, value, color in self.rows:
            c.setFont(font_regular, 7.5)
            c.setFillColor(MUTED)
            c.drawString(0, y + 2, label)
            c.setFillColor(colors.HexColor("#E6E5DF"))
            c.roundRect(x0, y, maxw, self.bar_h, 2 * mm, fill=1, stroke=0)
            width = max(7 * mm, maxw * value / self.max_val)
            c.setFillColor(color)
            c.roundRect(x0, y, width, self.bar_h, 2 * mm, fill=1, stroke=0)
            c.setFillColor(INK if color == LIME else WHITE)
            c.setFont(font_bold, 7)
            c.drawRightString(x0 + width - 2 * mm, y + 2, f"{value:,.0f}")
            y -= self.bar_h + 4 * mm


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(font_regular, 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, f"CHEAP//PC - $100 PC Challenge - {SNAPSHOT_DATE}")
    canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def first_page(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(INK)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(LIME)
    canvas.rect(0, height - 15 * mm, width, 15 * mm, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.setFont(font_bold, 10)
    canvas.drawString(18 * mm, height - 10 * mm, "CHEAP//PC  //  MARKET SNAPSHOT")
    canvas.setFillColor(colors.HexColor("#20232A"))
    canvas.setFont(font_bold, 110)
    canvas.drawRightString(width + 5 * mm, 8 * mm, "$100")
    canvas.restoreState()


def P(text, style="BodyX"):
    return Paragraph(text, styles[style])


def link(url, label=None):
    return Paragraph(f'<link href="{e(url)}" color="#7656FF">{e(label or url)}</link>', styles["Link"])


def badge(text, color=LIME):
    table = Table([[P(e(text), "Badge")]], colWidths=[45 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("BOX", (0, 0), (-1, -1), 0, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return table


def listing_card(item: dict, badge_color=LIME):
    rows = [[P(f"<b>{e(key)}</b>", "SmallX"), P(e(value), "SmallX")] for key, value in spec_rows(item)]
    specs = Table(rows, colWidths=[24 * mm, 55 * mm], hAlign="LEFT")
    specs.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    observed = money(item.get("allInAud"))
    if item.get("buyingMode") == "auction":
        observed += " observed*"
    elements = [
        badge(item.get("award") or item.get("buyingMode", "Listing"), badge_color),
        Spacer(1, 4),
        P(e(item["title"]), "CardTitle"),
        P(e(observed), "Price"),
        P(e(shipping_text(item)), "SmallX"),
        Spacer(1, 4),
        specs,
        Spacer(1, 5),
        P(e(item.get("note", "")), "SmallX"),
        P(e(caveat_text(item)), "SmallX"),
        link(item["sourceUrl"], "Open source listing / search"),
    ]
    inner = Table([[elements]], colWidths=[84 * mm])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 6 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
    ]))
    return inner


best_ready = listing("hp-prodesk-600-g1")
best_cpu = listing("dell-optiplex-9020-i7")
cheap_box = listing("hp-t630")
auction_watch = listing("dell-7050-micro-auction")

story = []
story += [
    Spacer(1, 38 * mm),
    P("DEEP RESEARCH  /  DUBBO NSW 2830", "Eyebrow"),
    P("$100 PC<br/>Challenge", "TitleX"),
    Spacer(1, 4 * mm),
    P("How powerful a complete usable computer can we actually buy for AUD $100 all-in?", "HeroSub"),
    Spacer(1, 13 * mm),
]
cover_table = Table([
    [P("TODAY'S PRACTICAL ANSWER", "SmallWhite")],
    [Paragraph(f'<font color="#B7FF3C"><b>{e(money(best_ready["allInAud"]))}</b></font>', ParagraphStyle("Huge", fontName=font_bold, fontSize=50, leading=50, textColor=WHITE))],
    [P(f'<b>{e(best_ready["title"])}</b>', "HeroSub")],
    [P(f'{e(best_ready["hardware"].get("cpu"))} · {e(best_ready["hardware"].get("ramGb"))}GB RAM · {e(best_ready["hardware"].get("storage"))}', "SmallWhite")],
], colWidths=[92 * mm])
cover_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#22252D")),
    ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#3A3E48")),
    ("LEFTPADDING", (0, 0), (-1, -1), 7 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
]))
story += [
    cover_table,
    Spacer(1, 18 * mm),
    P(
        f"Research date: {e(SNAPSHOT_DATE)}<br/>"
        f"Hard rule: item + shipping + mandatory fees + required parts &lt;= AUD {e(money(BUDGET))}<br/>"
        "Prices can change quickly. Auction observations are not final purchase prices.",
        "SmallWhite",
    ),
    PageBreak(),
]

story += [P("EXECUTIVE ANSWER", "Eyebrow"), P("What $100 can genuinely buy in this snapshot", "H1X")]
story += [
    P(
        f'The strongest fixed-price desktop evidence in the canonical dataset includes '
        f'<b>{e(best_ready["title"])}</b> at <b>{e(money(best_ready["allInAud"]))}</b> '
        f'({e(best_ready["hardware"].get("cpu"))}, {e(best_ready["hardware"].get("ramGb"))}GB RAM, '
        f'{e(best_ready["hardware"].get("storage"))}) and '
        f'<b>{e(best_cpu["title"])}</b> at <b>{e(money(best_cpu["allInAud"]))}</b> '
        f'({e(best_cpu["hardware"].get("cpu"))}, {e(best_cpu["hardware"].get("ramGb"))}GB RAM, '
        f'{e(best_cpu["hardware"].get("storage"))}).'
    ),
    P(
        f'The first is the stronger ready-to-use proposition because its SSD matters immediately; '
        f'the second has the stronger CPU but a mechanical HDD. '
        f'{e(auction_watch["title"])} remains a watch item because its {e(money(auction_watch["allInAud"]))} '
        f'total was only an observed running auction total, not a final purchase price.'
    ),
    P(
        "No complete dedicated-GPU gaming PC at or below the hard budget was verified in the underlying "
        "research sweep. The practical lesson remains: at this price, complete ex-office systems are much "
        "easier to verify than multi-part gaming builds."
    ),
]

summary_items = [
    ("Best ready-to-use", best_ready),
    ("Best CPU", best_cpu),
    ("Best auction watch", auction_watch),
    ("Cheapest useful box", cheap_box),
]
summary_data = [[P("CATEGORY", "SmallX"), P("WINNER / FIND", "SmallX"), P("OBSERVED COST", "SmallX")]]
for category, item in summary_items:
    hw = item.get("hardware", {})
    bits = [hw.get("cpu")]
    if hw.get("ramGb") is not None:
        bits.append(f"{hw['ramGb']}GB")
    if hw.get("storage"):
        bits.append(hw["storage"])
    detail = " / ".join(str(bit) for bit in bits if bit)
    cost = money(item.get("allInAud"))
    if item.get("buyingMode") == "auction":
        cost += " observed; not final"
    else:
        cost += f"; {shipping_text(item)}"
    summary_data.append([
        P(e(category), "SmallX"),
        P(f'<b>{e(item["title"])}</b><br/>{e(detail)}', "SmallX"),
        P(f"<b>{e(cost)}</b>", "SmallX"),
    ])

summary_table = Table(summary_data, colWidths=[36 * mm, 83 * mm, 48 * mm], repeatRows=1)
summary_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F8F7F3")]),
]))
story += [
    Spacer(1, 6 * mm),
    summary_table,
    Spacer(1, 7 * mm),
    P(
        "<b>Shipping confidence matters:</b> an advertised delivery price is not the same as a "
        "destination-specific checkout verification to postcode 2830. The canonical data records that distinction.",
        "SmallX",
    ),
    PageBreak(),
]

story += [P("CURRENT SHORTLIST", "Eyebrow"), P("Canonical listing cards", "H1X")]
row = Table(
    [[listing_card(best_ready, LIME), listing_card(best_cpu, colors.HexColor("#BBD6FF"))]],
    colWidths=[86 * mm, 86 * mm],
)
row.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
]))
story += [row, Spacer(1, 6 * mm)]

row2 = Table(
    [[listing_card(cheap_box, colors.HexColor("#FFE1A3")), listing_card(auction_watch, colors.HexColor("#D8CFFF"))]],
    colWidths=[86 * mm, 86 * mm],
)
row2.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
]))
story += [row2, PageBreak()]

cpu_marks = BENCHMARKS.get("cpuMark", {})
g3d_marks = BENCHMARKS.get("g3dMark", {})
cpu_rows = [
    ("i7-4770", cpu_marks.get("Intel Core i7-4770", 7066), LIME),
    ("i5-4590", cpu_marks.get("Intel Core i5-4590", 5380), LIME),
    ("i5-7500T", cpu_marks.get("Intel Core i5-7500T", 5242), LIME),
    ("FX-6300", cpu_marks.get("AMD FX-6300", 4231), LIME),
    ("i5-2400S", cpu_marks.get("Intel Core i5-2400S", 3164), LIME),
]
gpu_rows = [
    ("R9 290", g3d_marks.get("Radeon R9 290", 8139), VIOLET),
    ("Intel HD 630", g3d_marks.get("Intel HD 630", 1112), VIOLET),
    ("Intel HD 4600", g3d_marks.get("Intel HD 4600", 632), VIOLET),
]

story += [
    P("PERFORMANCE REALITY", "Eyebrow"),
    P("$100 buys CPU, RAM and storage more reliably than gaming GPU power", "H1X"),
    P("The benchmark snapshot below is contextual evidence, not a direct FPS prediction."),
    P("CPU Mark", "H2X"),
    BarChart(cpu_rows, max(value for _, value, _ in cpu_rows)),
    Spacer(1, 4 * mm),
    P("3D Graphics Mark", "H2X"),
    BarChart(gpu_rows, max(value for _, value, _ in gpu_rows)),
    Spacer(1, 3 * mm),
    P(
        "The existing R9 290 remains in a completely different graphics tier from the integrated GPUs in "
        "the sub-$100 office systems. These bargains are primarily general-purpose, retro and light-game machines."
    ),
    PageBreak(),
]

story += [P("DEEP MARKET CHECK", "Eyebrow"), P("What other source types add", "H1X")]
market_rows = [
    ["eBay Australia", "Strongest structured public leads in this snapshot; production API automation remains approval-gated."],
    ["Gumtree", "Useful classifieds evidence, but treated as manual research rather than an unattended scrape target."],
    ["Facebook Marketplace", "Strategically important local blind spot; use manual/user-assisted imports rather than unauthorised scraping."],
    ["Cash Converters", "Potential fixed-price used inventory; automation requires a source-access review."],
    ["OzBargain", "Useful historical price evidence; bargain posts can expire quickly."],
    ["Mainstream retailers", "More useful for parts/clearance than complete systems at the $100 cap."],
    ["Dubbo local", "Offline stock, disposals and user-submitted local listings may beat web-indexed deals."],
]
market_table = Table(
    [[P("<b>SOURCE</b>", "SmallX"), P("<b>ROLE</b>", "SmallX")]]
    + [[P(e(a), "SmallX"), P(e(b), "SmallX")] for a, b in market_rows],
    colWidths=[40 * mm, 128 * mm],
    repeatRows=1,
)
market_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F8F7F3")]),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [
    market_table,
    Spacer(1, 7 * mm),
    P("Why a parts build usually loses at $100", "H2X"),
    P(
        "A useful used GPU can consume half the budget. Barebones need RAM/storage/power; separate postage "
        "destroys combinations; and SFF machines often impose profile, power and physical-fit constraints. "
        "A complete ex-office system benefits from one acquisition and one evidence trail."
    ),
    P("Source-policy implication", "H2X"),
    P(
        "CHEAP//PC should optimise for the best defensible bargain, not the lowest number scraped from the web. "
        "Direct listing evidence, freshness and shipping confidence belong beside price."
    ),
    link("https://github.com/joshualparris/Cheappcslaptops/blob/main/docs/SOURCE-STRATEGY.md", "CHEAP//PC source strategy"),
    PageBreak(),
]

story += [
    P("FINAL VERDICT", "Eyebrow"),
    P("How powerful can $100 genuinely be?", "H1X"),
    P("Current evidence-based answer", "H2X"),
    P(
        f'{e(best_ready["hardware"].get("cpu"))} or {e(best_cpu["hardware"].get("cpu"))} class desktop + '
        f'8GB RAM + SSD/HDD + integrated graphics + complete ex-office chassis',
        "Quote",
    ),
    P(
        "That remains a capable older general-purpose computer rather than a modern gaming rig. "
        "The exact winner can change quickly, which is why this report now obtains listing facts from the same "
        "canonical JSON used by the website and CI validator."
    ),
    P(
        "The next quality leap is automated, authorised refresh plus price/history snapshots—not adding more "
        "hard-coded prices to generated reports."
    ),
    Spacer(1, 4 * mm),
    P("Canonical shortlist source links", "H2X"),
]
for item in (best_ready, best_cpu, cheap_box, auction_watch):
    story.append(link(item["sourceUrl"], item["title"]))
story += [
    Spacer(1, 4 * mm),
    P(
        "<b>Snapshot warning:</b> used-listing prices, stock, bids and delivery eligibility can change at any time. "
        "Re-open listings before buying. Auction bid values are observations, not guaranteed purchase prices.",
        "SmallX",
    )
]

doc = SimpleDocTemplate(
    str(OUT),
    pagesize=A4,
    rightMargin=18 * mm,
    leftMargin=18 * mm,
    topMargin=18 * mm,
    bottomMargin=17 * mm,
    title="$100 PC Challenge - Dubbo NSW",
    author="CHEAP//PC research snapshot",
)
doc.build(story, onFirstPage=first_page, onLaterPages=footer)
print(OUT)
