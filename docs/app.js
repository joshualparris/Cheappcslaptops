const deals = [
  {
    id:"dell-9020-i7",
    type:"desktop",
    title:"Dell OptiPlex 9020 SFF",
    seller:"rootscope_it · eBay Australia",
    item:99, shipping:0, total:99,
    specs:["Core i7-4770","8GB RAM","500GB HDD","SFF"],
    note:"Strongest CPU found in a complete sub-$100 desktop. Pre-owned; the current eBay result shows free delivery. OS is not stated in the result.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=Dell+optiplex+9020+SFF+Desktop+i7-4770+8GB+500GB",
    checked:"23 Sep 2026",
    award:"Best complete PC",
    rank:1
  },
  {
    id:"hp-prodesk-600-g1",
    type:"desktop",
    title:"HP ProDesk 600 G1 SFF",
    seller:"southside_computer_centre · eBay Australia",
    item:99, shipping:0, total:99,
    specs:["Core i5-4590","8GB RAM","128GB SSD","Windows 11 Pro"],
    note:"A more responsive out-of-box option than an HDD-only office PC because the listing includes a 128GB SSD. Current result shows free delivery.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=HP+ProDesk+600+G1+SFF+i5-4590+8GB+128GB+SSD",
    checked:"23 Sep 2026",
    award:"Best SSD desktop",
    rank:2
  },
  {
    id:"hp-t630",
    type:"desktop",
    title:"HP T630 Thin Client",
    seller:"2nds-it-vic · eBay Australia",
    item:58, shipping:10, total:68,
    specs:["AMD GX-420GI","8GB RAM","32GB SSD","Power adaptor","No OS"],
    note:"The cheapest complete powered system found. eBay describes the used unit as fully operational; best suited to light desktop, server or retro duties.",
    source:"https://www.ebay.com.au/itm/198515201350",
    checked:"23 Sep 2026",
    award:"Cheapest working system",
    rank:3
  },
  {
    id:"samsung-chromebook-4",
    type:"laptop",
    title:"Samsung Chromebook 4 (XE310XBA)",
    seller:"thebargainsupplier · eBay Australia",
    item:99, shipping:0, total:99,
    specs:["Celeron N4020","4GB RAM","64GB storage","11.6-inch"],
    note:"Pre-owned Chromebook at the full budget cap. Current eBay result shows free delivery and free returns.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=Samsung+Chromebook+4+XE310XBA+N4020+4GB+64GB",
    checked:"23 Sep 2026",
    award:"Laptop under $100",
    rank:4
  },
  {
    id:"micron-8gb-ddr3",
    type:"part",
    title:"Micron 8GB DDR3 PC3-12800U",
    seller:"eBay Australia",
    item:7.90, shipping:0, total:7.90,
    specs:["8GB","DDR3","PC3-12800U","Desktop DIMM"],
    note:"Very cheap used DDR3 desktop memory. Check whether the target machine accepts a single 8GB non-ECC UDIMM before buying.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=Micron+8GB+DDR3+PC3-12800U",
    checked:"23 Sep 2026"
  },
  {
    id:"r7-430",
    type:"part",
    title:"AMD Radeon R7 430 2GB low-profile",
    seller:"bneacttrader · eBay Australia",
    item:15, shipping:0, total:15,
    specs:["2GB GDDR5","Low-profile","PCIe","SFF friendly"],
    note:"A tiny, cheap graphics upgrade for compatible low-profile office PCs. Current listing is refurbished and shows free delivery.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=AMD+R7+430+2GB+GDDR5+Low+Profile",
    checked:"23 Sep 2026"
  },
  {
    id:"quadro-k620",
    type:"part",
    title:"NVIDIA Quadro K620 2GB low-profile",
    seller:"quigstar · eBay Australia",
    item:39, shipping:0, total:39,
    specs:["2GB","Low-profile","PCIe","Workstation GPU"],
    note:"Low-power, low-profile card that can suit SFF machines where a larger gaming GPU will not fit. Current result shows free delivery.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=NVIDIA+Quadro+K620+2GB+low+profile",
    checked:"23 Sep 2026"
  },
  {
    id:"samsung-sm883-240",
    type:"part",
    title:"Samsung SM883 240GB SATA SSD",
    seller:"sydney_computer_parts · eBay Australia",
    item:45, shipping:0, total:45,
    specs:["240GB","2.5-inch","SATA","Used"],
    note:"A useful HDD-to-SSD upgrade for older desktops and laptops with standard 2.5-inch SATA support. Current result shows free delivery.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=Samsung+SM883+240GB+SSD",
    checked:"23 Sep 2026"
  },
  {
    id:"gtx-960-2gb",
    type:"part",
    title:"MSI GeForce GTX 960 Gaming 2G",
    seller:"xcomputec · eBay Australia",
    item:78, shipping:0, total:78,
    specs:["GTX 960","2GB GDDR5","Full-height","8-pin power"],
    note:"The strongest gaming-focused GPU in this first verified parts sweep. It needs a compatible case and PSU; do not assume it fits an SFF office PC.",
    source:"https://www.ebay.com.au/sch/i.html?_nkw=MSI+GTX+960+GAMING+2G+GDDR5",
    checked:"23 Sep 2026"
  }
];

const money = n => new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD",minimumFractionDigits:n%1?2:0}).format(n);
const labels = {desktop:"Desktop",laptop:"Laptop",part:"Part"};

const stats = document.querySelector("#stats");
const systems = deals.filter(d=>d.type!=="part");
const parts = deals.filter(d=>d.type==="part");
const cheapestSystem = Math.min(...systems.map(d=>d.total));
stats.innerHTML = [
  ["$100","hard system cap"],
  [systems.length,"qualifying systems"],
  [money(cheapestSystem),"cheapest system"],
  [parts.length,"useful parts"]
].map(([value,label])=>`<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join("");

const leaderIds = ["dell-9020-i7","hp-prodesk-600-g1","hp-t630"];
document.querySelector("#leaders").innerHTML = leaderIds.map(id=>{
  const d=deals.find(x=>x.id===id);
  return `<article class="leader">
    <span class="award">${d.award}</span>
    <h3>${d.title}</h3>
    <div class="big-price">${money(d.total)} <small>all-in shown</small></div>
    <p>${d.specs.slice(0,3).join(" · ")}</p>
  </article>`;
}).join("");

let activeFilter="all";
let query="";

function card(d){
  return `<article class="card">
    <div class="card-top">
      <span class="type">${labels[d.type]}</span>
      <div class="total under-cap">${money(d.total)}</div>
    </div>
    <h3>${d.title}</h3>
    <div class="source">${d.seller}</div>
    <div class="breakdown">
      <div><span>Item</span><strong>${money(d.item)}</strong></div>
      <div><span>Shipping shown</span><strong>${d.shipping===0?"FREE":money(d.shipping)}</strong></div>
    </div>
    <div class="specs">${d.specs.map(s=>`<span class="spec">${s}</span>`).join("")}</div>
    <p class="note">${d.note}</p>
    <div class="card-footer">
      <span class="checked">Checked ${d.checked}</span>
      <a href="${d.source}" target="_blank" rel="noreferrer">Open listing ↗</a>
    </div>
  </article>`;
}

function render(){
  const filtered=deals
    .filter(d=>activeFilter==="all"||d.type===activeFilter)
    .filter(d=>!query||[d.title,d.seller,...d.specs,d.note].join(" ").toLowerCase().includes(query))
    .sort((a,b)=>a.total-b.total);
  document.querySelector("#dealGrid").innerHTML=filtered.map(card).join("");
  document.querySelector("#resultCount").textContent=`${filtered.length} deal${filtered.length===1?"":"s"} shown`;
  document.querySelector("#empty").hidden=filtered.length!==0;
}
render();

document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter=btn.dataset.filter;
  render();
}));
document.querySelector("#search").addEventListener("input",e=>{
  query=e.target.value.trim().toLowerCase();
  render();
});