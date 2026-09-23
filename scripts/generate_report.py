from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/reports/100-dollar-pc-challenge-2026-09-23.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

font_regular = 'Helvetica'
font_bold = 'Helvetica-Bold'
reg='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
if Path(reg).exists() and Path(bold).exists():
    pdfmetrics.registerFont(TTFont('DV', reg))
    pdfmetrics.registerFont(TTFont('DV-Bold', bold))
    font_regular='DV'; font_bold='DV-Bold'

INK = colors.HexColor('#111318')
LIME = colors.HexColor('#B7FF3C')
VIOLET = colors.HexColor('#7656FF')
MUTED = colors.HexColor('#696D75')
LINE = colors.HexColor('#D7D7D2')
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleX', fontName=font_bold, fontSize=31, leading=31, textColor=WHITE, spaceAfter=8))
styles.add(ParagraphStyle(name='HeroSub', fontName=font_regular, fontSize=11.5, leading=17, textColor=colors.HexColor('#D0D2D7')))
styles.add(ParagraphStyle(name='Eyebrow', fontName=font_bold, fontSize=8, leading=10, textColor=VIOLET, tracking=1.6, spaceAfter=5))
styles.add(ParagraphStyle(name='H1X', fontName=font_bold, fontSize=22, leading=24, textColor=INK, spaceBefore=4, spaceAfter=10))
styles.add(ParagraphStyle(name='H2X', fontName=font_bold, fontSize=14, leading=17, textColor=INK, spaceBefore=5, spaceAfter=7))
styles.add(ParagraphStyle(name='BodyX', fontName=font_regular, fontSize=9.2, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='SmallX', fontName=font_regular, fontSize=7.5, leading=10.5, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name='SmallWhite', fontName=font_regular, fontSize=7.5, leading=10.5, textColor=colors.HexColor('#C8CBD1')))
styles.add(ParagraphStyle(name='CardTitle', fontName=font_bold, fontSize=12.2, leading=14, textColor=INK, spaceAfter=4))
styles.add(ParagraphStyle(name='Price', fontName=font_bold, fontSize=21, leading=22, textColor=INK))
styles.add(ParagraphStyle(name='Badge', fontName=font_bold, fontSize=7, leading=8, textColor=INK))
styles.add(ParagraphStyle(name='Link', fontName=font_regular, fontSize=7, leading=9, textColor=VIOLET, spaceAfter=3))
styles.add(ParagraphStyle(name='Quote', fontName=font_bold, fontSize=15, leading=20, textColor=INK, leftIndent=10*mm, rightIndent=10*mm, spaceBefore=8, spaceAfter=12))

class BarChart(Flowable):
    def __init__(self, rows, max_val, width=170*mm, bar_h=7*mm):
        super().__init__(); self.rows=rows; self.max_val=max_val; self.width=width; self.bar_h=bar_h
        self.height=len(rows)*(bar_h+4*mm)
    def draw(self):
        c=self.canv; label_w=35*mm; x0=label_w; maxw=self.width-label_w-12*mm
        y=self.height-self.bar_h
        for label,val,color in self.rows:
            c.setFont(font_regular,7.5); c.setFillColor(MUTED); c.drawString(0,y+2,label)
            c.setFillColor(colors.HexColor('#E6E5DF')); c.roundRect(x0,y,maxw,self.bar_h,2*mm,fill=1,stroke=0)
            w=max(7*mm,maxw*val/self.max_val)
            c.setFillColor(color); c.roundRect(x0,y,w,self.bar_h,2*mm,fill=1,stroke=0)
            c.setFillColor(INK if color==LIME else WHITE); c.setFont(font_bold,7); c.drawRightString(x0+w-2*mm,y+2,val.__format__(',.0f'))
            y -= self.bar_h+4*mm

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(font_regular, 7); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 10*mm, 'CHEAP//PC - $100 PC Challenge - 23 September 2026')
    canvas.drawRightString(A4[0]-18*mm, 10*mm, f'Page {doc.page}')
    canvas.restoreState()

def first_page(canvas, doc):
    canvas.saveState(); w,h=A4
    canvas.setFillColor(INK); canvas.rect(0,0,w,h,fill=1,stroke=0)
    canvas.setFillColor(LIME); canvas.rect(0,h-15*mm,w,15*mm,fill=1,stroke=0)
    canvas.setFillColor(INK); canvas.setFont(font_bold,10); canvas.drawString(18*mm,h-10*mm,'CHEAP//PC  //  MARKET SNAPSHOT')
    canvas.setFillColor(colors.HexColor('#20232A')); canvas.setFont(font_bold,110); canvas.drawRightString(w+5*mm,8*mm,'$100')
    canvas.restoreState()

def P(txt, style='BodyX'): return Paragraph(txt, styles[style])
def link(url, label=None): return Paragraph(f'<link href="{url}" color="#7656FF">{label or url}</link>', styles['Link'])

def badge(text, color=LIME):
    t=Table([[P(text,'Badge')]], colWidths=[45*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),color),('BOX',(0,0),(-1,-1),0,color),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    return t

def listing_card(badge_text,badge_color,title,price,subtitle,spec_rows,take,url,caveat=None):
    specs=[[P(f'<b>{k}</b>','SmallX'),P(v,'SmallX')] for k,v in spec_rows]
    st=Table(specs,colWidths=[24*mm,55*mm],hAlign='LEFT')
    st.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),0.25,LINE),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),2),('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    elems=[badge(badge_text,badge_color),Spacer(1,4),P(title,'CardTitle'),P(price,'Price'),P(subtitle,'SmallX'),Spacer(1,4),st,Spacer(1,5),P(take,'SmallX')]
    if caveat: elems.append(P(caveat,'SmallX'))
    elems.append(link(url,'Open source listing / search'))
    inner=Table([[elems]], colWidths=[84*mm])
    inner.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),WHITE),('BOX',(0,0),(-1,-1),0.6,LINE),('LEFTPADDING',(0,0),(-1,-1),6*mm),('RIGHTPADDING',(0,0),(-1,-1),6*mm),('TOPPADDING',(0,0),(-1,-1),6*mm),('BOTTOMPADDING',(0,0),(-1,-1),5*mm)]))
    return inner

story=[]
story += [Spacer(1,38*mm),P('DEEP RESEARCH  /  DUBBO NSW 2830','Eyebrow'),P('$100 PC<br/>Challenge','TitleX'),Spacer(1,4*mm),P('How powerful a complete usable computer can we actually buy for AUD $100 all-in?', 'HeroSub'),Spacer(1,13*mm)]
cover_table=Table([
    [P('TODAY\'S PRACTICAL ANSWER','SmallWhite')],
    [Paragraph('<font color="#B7FF3C"><b>$99</b></font>', ParagraphStyle('Huge',fontName=font_bold,fontSize=50,leading=50,textColor=WHITE))],
    [P('<b>4th-gen Core i5/i7 office desktop</b>','HeroSub')],
    [P('8GB RAM is realistic. An SSD is possible. A dedicated gaming GPU is not.', 'SmallWhite')]
],colWidths=[80*mm])
cover_table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#22252D')),('BOX',(0,0),(-1,-1),0.7,colors.HexColor('#3A3E48')),('LEFTPADDING',(0,0),(-1,-1),7*mm),('RIGHTPADDING',(0,0),(-1,-1),7*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),4*mm)]))
story += [cover_table,Spacer(1,18*mm),P('Research date: 23 September 2026<br/>Hard rule: item + advertised shipping + mandatory missing parts &lt;= AUD $100<br/>Prices can change quickly. Auctions are not final prices until they close.', 'SmallWhite'),PageBreak()]

story += [P('EXECUTIVE ANSWER','Eyebrow'),P('What $100 can genuinely buy today','H1X')]
story += [P('The realistic upper end of the current public-web market is a <b>4th-generation Intel Core i5/i7 ex-office desktop with 8GB RAM</b>. Two standout eBay results sat exactly on the cap with advertised free delivery: an HP ProDesk 600 G1 with i5-4590, 8GB and a 128GB SSD, and a Dell OptiPlex 9020 with i7-4770, 8GB and a 500GB HDD.')]
story += [P('The HP is the better complete everyday machine because the SSD matters immediately. The Dell has substantially more CPU throughput, but the mechanical HDD holds back normal responsiveness. A 7th-gen OptiPlex 7050 Micro was below budget at its observed auction bid, but its final price is unknown, so it is a watch item rather than a winner.')]
story += [P('No complete dedicated-GPU gaming PC at or below $100 all-in was verified during this sweep. The strongest visible gaming example near the challenge was an FX-6300 + GTX 1050 + 16GB tower at $150 firm on Gumtree - useful evidence that another $50 changes the category completely.')]

summary_data=[
    [P('CATEGORY','SmallX'),P('WINNER / FIND','SmallX'),P('OBSERVED COST','SmallX')],
    [P('Best ready-to-use','SmallX'),P('<b>HP ProDesk 600 G1</b><br/>i5-4590 / 8GB / 128GB SSD','SmallX'),P('<b>$99</b><br/>free delivery advertised','SmallX')],
    [P('Best CPU','SmallX'),P('<b>Dell OptiPlex 9020</b><br/>i7-4770 / 8GB / 500GB HDD','SmallX'),P('<b>$99</b><br/>free delivery advertised','SmallX')],
    [P('Best auction watch','SmallX'),P('<b>Dell OptiPlex 7050 Micro</b><br/>i5-7500T / 4GB / 128GB SSD','SmallX'),P('<b>$73.61 observed</b><br/>not final','SmallX')],
    [P('Cheapest useful box','SmallX'),P('<b>HP T630</b><br/>GX-420GI / 8GB / 32GB SSD','SmallX'),P('<b>$68</b><br/>$58 + $10 delivery','SmallX')],
]
t=Table(summary_data,colWidths=[36*mm,83*mm,48*mm],repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('TEXTCOLOR',(0,0),(-1,0),WHITE),('GRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,colors.HexColor('#F8F7F3')])]))
story += [Spacer(1,6*mm),t,Spacer(1,7*mm),P('<b>Important shipping note:</b> eBay advertised free delivery on the $99 winners, but this research did not complete a transaction to postcode 2830. Re-open the listing and verify checkout immediately before purchase.', 'SmallX'),PageBreak()]

story += [P('CURRENT SHORTLIST','Eyebrow'),P('The best listings found','H1X')]
card1=listing_card('BEST READY-TO-USE',LIME,'HP ProDesk 600 G1 SFF','$99','Free delivery advertised',[('CPU','Core i5-4590, 4C/4T'),('RAM','8GB DDR3'),('Storage','128GB SSD'),('GPU','Intel HD 4600')],'Best no-fuss answer: the SSD makes it a complete usable desktop without spending another dollar.','https://www.ebay.com.au/itm/318863759958','3 available when checked; SFF and weak iGPU limit gaming/upgrades.')
card2=listing_card('BEST CPU',colors.HexColor('#BBD6FF'),'Dell OptiPlex 9020 SFF','$99','Free delivery advertised',[('CPU','Core i7-4770, 4C/8T'),('RAM','8GB DDR3'),('Storage','500GB HDD'),('GPU','Intel HD 4600')],'Strongest raw CPU at the hard cap. Better compute platform, but the HDD is a real quality-of-life compromise.','https://www.ebay.com.au/sch/i.html?_nkw=Dell+Optiplex+9020+SFF+Desktop+i7-4770+8GB+500GB')
row=Table([[card1,card2]],colWidths=[86*mm,86*mm]); row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),3*mm)])); story += [row,Spacer(1,6*mm)]
card3=listing_card('CHEAPEST USEFUL BOX',colors.HexColor('#FFE1A3'),'HP T630 Thin Client','$68','$58 + $10 advertised delivery',[('CPU','AMD GX-420GI'),('RAM','8GB'),('Storage','32GB SSD'),('OS','None')],'Good tiny Linux/basic-compute or service box. It is not a gaming candidate.','https://www.ebay.com.au/itm/198515201350','More than 10 available; 66 sold when checked.')
card4=listing_card('AUCTION WATCH',colors.HexColor('#D8CFFF'),'Dell OptiPlex 7050 Micro','$73.61*','$53.36 bid + $20.25 postage',[('CPU','Core i5-7500T'),('RAM','4GB DDR4'),('Storage','128GB SSD'),('GPU','Intel HD 630')],'Newer platform and better integrated graphics, but the final auction price is unknown.','https://www.ebay.com.au/sch/i.html?_nkw=DELL+OPTIPLEX+7050+MICRO+i5-7500T+4GB+128GB+SSD','*Observed running total only. The item bid must finish <= $79.75 if postage stays $20.25.')
row2=Table([[card3,card4]],colWidths=[86*mm,86*mm]); row2.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),3*mm)])); story += [row2,PageBreak()]

story += [P('PERFORMANCE REALITY','Eyebrow'),P('$100 buys CPU, RAM and storage - not a gaming GPU','H1X'),P('PassMark scores below are current synthetic reference points, not direct game FPS. They are useful for showing the scale of the gap.')]
story += [P('CPU Mark','H2X'),BarChart([('i7-4770',7066,LIME),('i5-4590',5380,LIME),('i5-7500T',5242,LIME),('FX-6300',4231,LIME),('i5-2400S',3164,LIME)],7066),Spacer(1,4*mm)]
story += [P('3D Graphics Mark','H2X'),BarChart([('R9 290',8139,VIOLET),('Intel HD 630',1112,VIOLET),('Intel HD 4600',632,VIOLET)],8139),Spacer(1,3*mm)]
story += [P('<b>Compared with Josh\'s existing machines:</b> the i5-4590 scores about 70% above the i5-2400S in CPU Mark, and the i7-4770 about 123% above it. The existing R9 290, however, scores about 12.9x HD 4600 and 7.3x HD 630 in G3D Mark. That is why none of these $100 office PCs replaces the existing R9 290 gaming tower.'),P('Expected tier','H2X'),P('The $99 HP/Dell machines are best described as <b>strong basic/older general-purpose desktops</b>: web, office, school/work tasks, retro emulation, older PC games, Minecraft/Roblox-class use and light esports at reduced settings/resolution. They should not be bought for current AAA 1080p gaming.'),PageBreak()]

story += [P('DEEP MARKET CHECK','Eyebrow'),P('What the other sources changed - and what they did not','H1X')]
market_rows=[
    ['eBay Australia','Clear winner for this snapshot: $99 fixed-price office PCs plus sub-$100 auction watches.'],
    ['Gumtree','Cheap systems exist, but no public-indexed Dubbo <=$100 winner was verified. A $150 FX-6300/GTX1050 tower marks the visible entry-gaming boundary.'],
    ['Facebook Marketplace','Important blind spot. Public web access does not expose a reliable exhaustive local inventory feed; no result was treated as independently verified.'],
    ['Cash Converters','Low-price examples surfaced, but weak specification, distant pickup or unverified freight kept them from winning.'],
    ['OzBargain','Historical evidence shows ex-office minis can occasionally reach ~$100 delivered, but those deals expire quickly.'],
    ['Mainstream PC retailers','No complete current PC near the hard cap; ~$100 results are typically cases, accessories or services.'],
    ['Dubbo local web','Local computer shops exist, but searchable used inventory under $100 was not surfaced. Offline stock/word-of-mouth may beat the indexed web.'],
]
mt=Table([[P('<b>SOURCE</b>','SmallX'),P('<b>RESULT</b>','SmallX')]]+[[P(a,'SmallX'),P(b,'SmallX')] for a,b in market_rows],colWidths=[40*mm,128*mm],repeatRows=1)
mt.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('TEXTCOLOR',(0,0),(-1,0),WHITE),('GRID',(0,0),(-1,-1),0.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,colors.HexColor('#F8F7F3')]),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
story += [mt,Spacer(1,7*mm),P('Why a parts build loses at $100','H2X'),P('A useful used GPU can consume half the budget. Barebones need RAM/storage/power. Separate postage destroys combinations. SFF systems introduce low-profile and PSU constraints. At this cap, one complete ex-office system is economically stronger than assembling several posted parts.'),P('Visible gaming boundary','H2X'),P('A current Gumtree tower with FX-6300, GTX 1050 2GB, 16GB RAM, 120GB SSD + 400GB HDD was $150 firm, pickup only in Bonnyrigg. That does not qualify, but it shows why the $100 challenge currently lands in integrated-graphics territory.'),link('https://www.gumtree.com.au/web/listing/desktops/1344687608','Gumtree FX-6300 / GTX 1050 listing'),PageBreak()]

story += [P('FINAL VERDICT','Eyebrow'),P('How powerful can $100 genuinely be?','H1X'),P('Realistic upper-end specification','H2X'),P('4th-gen Core i5/i7 + 8GB DDR3 + 128GB SSD or 500GB HDD + Intel HD 4600 + complete ex-office SFF chassis','Quote'),P('That is a <b>surprisingly capable older general-purpose computer</b>, not a gaming rig. The most rational buy right now is the $99 HP ProDesk if you want a complete machine that feels responsive immediately. The $99 i7 OptiPlex is the better CPU if you plan to add an SSD later. If you can wait, disciplined auction watching can sometimes land a newer 6th/7th-gen micro PC below the cap.'),P('The path to a much more exciting $100 gaming result is not retail components. It is a badly listed local complete PC, business clearance, garage cleanout or Marketplace seller who undervalues an old dedicated-GPU tower. That is exactly what the future live version of this project should monitor.'),Spacer(1,4*mm),P('Source links','H2X')]
sources=[
('HP ProDesk 600 G1 listing','https://www.ebay.com.au/itm/318863759958'),
('HP T630 listing','https://www.ebay.com.au/itm/198515201350'),
('Dell i7 OptiPlex live search','https://www.ebay.com.au/sch/i.html?_nkw=Dell+Optiplex+9020+SFF+Desktop+i7-4770+8GB+500GB'),
('Dell 7050 Micro live search','https://www.ebay.com.au/sch/i.html?_nkw=DELL+OPTIPLEX+7050+MICRO+i5-7500T+4GB+128GB+SSD'),
('Gumtree $50 student PC','https://www.gumtree.com.au/web/listing/desktops/1341581439'),
('Gumtree FX-6300 + GTX 1050','https://www.gumtree.com.au/web/listing/desktops/1344687608'),
('Gumtree i5-4670K tower','https://www.gumtree.com.au/web/listing/desktops/1344499898'),
('PassMark i5-4590','https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i5-4590+%40+3.30GHz'),
('PassMark i7-4770','https://www.cpubenchmark.net/cpu.php?cpu=Intel%2BCore%2Bi7-4770%2B%40%2B3.40GHz&id=1907'),
('PassMark HD 4600','https://www.videocardbenchmark.net/gpu.php?gpu=Intel+HD+4600&id=2451'),
('PassMark HD 630','https://www.videocardbenchmark.net/gpu.php?gpu=Intel+HD+630&id=3540'),
('PassMark R9 290','https://www.videocardbenchmark.net/gpu.php?gpu=Radeon+R9+290&id=4259')]
for label,url in sources: story.append(link(url,label))
story += [Spacer(1,4*mm),P('<b>Snapshot warning:</b> used-listing prices, stock, bids and delivery eligibility can change at any time. Re-open listings before buying. Auction bid values in this report are observations, not guaranteed purchase prices.','SmallX')]

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=18*mm,bottomMargin=17*mm,title='$100 PC Challenge - Dubbo NSW',author='CHEAP//PC research snapshot')
doc.build(story,onFirstPage=first_page,onLaterPages=footer)
print(OUT)
