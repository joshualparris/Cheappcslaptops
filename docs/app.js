const money = n => new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: Number.isInteger(n) ? 0 : 2
}).format(n);

const labels = { desktop: "Desktop", laptop: "Laptop", part: "Part" };

let deals = [];
const validFilters = new Set(["all","desktop","laptop","part","auction"]);
const validSortModes = new Set(["price","newest","ram"]);
const initialParams = new URLSearchParams(window.location.search);
let activeFilter = validFilters.has(initialParams.get("filter")) ? initialParams.get("filter") : "all";
let query = (initialParams.get("q") || "").trim().toLowerCase();
let selectedDealId = initialParams.get("deal") || "";
let maxPrice = [50,75,100].includes(Number(initialParams.get("max"))) ? Number(initialParams.get("max")) : 100;
let sortMode = validSortModes.has(initialParams.get("sort")) ? initialParams.get("sort") : "price";
const facetState = {
  windows: initialParams.get("windows") === "1",
  chrome: initialParams.get("chrome") === "1",
  otherOs: initialParams.get("other") === "1",
  fourGb: initialParams.get("ram4") === "1",
  solidState: initialParams.get("ssd") === "1",
  freeShipping: initialParams.get("free") === "1",
  direct: initialParams.get("direct") === "1",
  fresh: initialParams.get("fresh") === "1"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);
}

function freshnessFor(value, status) {
  if (status === "sold") return { key: "sold", label: "Sold" };
  if (status === "gone") return { key: "gone", label: "Gone" };
  if (status === "watch") return { key: "watch", label: "Watch only" };
  if (status === "stale") return { key: "stale", label: "Stale" };

  const checked = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(checked.getTime())) return { key: "unknown", label: "Age unknown" };

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ageDays = Math.max(0, Math.floor((todayUtc - checked.getTime()) / 86400000));

  if (ageDays <= 1) return { key: "fresh", label: "Fresh" };
  if (ageDays <= 3) return { key: "aging", label: `${ageDays}d old` };
  return { key: "stale", label: `Stale · ${ageDays}d` };
}

function shippingLabel(value) {
  return {
    verified: "Shipping verified",
    advertised: "Shipping advertised",
    estimated: "Shipping estimated",
    pickup: "Pickup only",
    unknown: "Shipping unknown"
  }[value] || "Shipping unclear";
}

function evidenceLabel(urlKind) {
  return {
    "direct-listing": "Direct listing",
    "search-fallback": "Search fallback",
    "manual-import": "Manual import"
  }[urlKind] || "Source evidence";
}

function specsFor(listing) {
  const h = listing.hardware || {};
  const specs = [];
  if (h.cpu) specs.push(h.cpu.replace(/^Intel /, "").replace(/^AMD /, ""));
  if (h.gpu && listing.kind === "part") specs.push(h.gpu);
  if (Number.isFinite(h.ramGb)) specs.push(`${h.ramGb}GB RAM`);
  if (h.storage) specs.push(h.storage);
  if (h.formFactor) specs.push(h.formFactor);
  if (h.osInstalled && h.osInstalled !== "Not stated") specs.push(h.osInstalled);
  return specs.slice(0, 5);
}

function normalise(listing) {
  return {
    id: listing.id,
    type: listing.kind,
    title: listing.title,
    seller: [listing.seller, listing.source].filter(Boolean).join(" · "),
    item: listing.itemPriceAud,
    shipping: listing.shippingAud,
    total: listing.allInAud,
    specs: specsFor(listing),
    note: listing.note,
    source: listing.sourceUrl,
    checked: formatDate(listing.lastCheckedAt),
    checkedRaw: listing.lastCheckedAt,
    award: listing.award,
    buyingMode: listing.buyingMode,
    shippingConfidence: listing.shippingConfidence,
    availabilityStatus: listing.availabilityStatus,
    availabilityConfidence: listing.availabilityConfidence,
    urlKind: listing.urlKind,
    evidenceNote: listing.evidenceNote,
    risks: listing.risks || [],
    hardware: listing.hardware || {},
    osInstalled: listing.hardware?.osInstalled || "Not stated",
    ramGb: Number.isFinite(listing.hardware?.ramGb) ? listing.hardware.ramGb : null,
    storage: listing.hardware?.storage || ""
  };
}

function renderStats(payload) {
  const stats = document.querySelector("#stats");
  const systems = deals.filter(d => d.type !== "part");
  const parts = deals.filter(d => d.type === "part");
  const totals = systems.map(d => d.total).filter(Number.isFinite);
  const cheapestSystem = totals.length ? Math.min(...totals) : null;

  stats.innerHTML = [
    [money(payload.challenge.budgetAud), "hard system cap"],
    [systems.length, "fixed-price systems"],
    [cheapestSystem === null ? "—" : money(cheapestSystem), "cheapest system"],
    [parts.length, "parts leads"]
  ].map(([value, label]) =>
    `<div class="stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`
  ).join("");
}

function renderLeaders() {
  const leaderIds = ["hp-prodesk-600-g1", "dell-optiplex-9020-i7", "hp-t630"];
  const leaders = leaderIds
    .map(id => deals.find(item => item.id === id))
    .filter(Boolean);

  document.querySelector("#leaders").innerHTML = leaders.map(d => {
    const freshness = freshnessFor(d.checkedRaw, d.availabilityStatus);
    return `
      <article class="leader">
        <div class="leader-badges">
          <span class="award">${escapeHtml(d.award || "Stand-out")}</span>
          <span class="evidence-tag evidence-${escapeHtml(freshness.key)}">${escapeHtml(freshness.label)}</span>
        </div>
        <h3>${escapeHtml(d.title)}</h3>
        <div class="big-price">${escapeHtml(money(d.total))} <small>all-in shown</small></div>
        <p>${d.specs.slice(0, 3).map(escapeHtml).join(" · ")}</p>
      </article>
    `;
  }).join("");
}

function card(d) {
  const shipping = d.shipping === 0 ? "FREE" : money(d.shipping);
  const freshness = freshnessFor(d.checkedRaw, d.availabilityStatus);
  const riskList = d.risks.length
    ? `<ul>${d.risks.map(risk => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>`
    : "<p>No additional risks recorded.</p>";

  return `<article class="card">
    <div class="card-top">
      <span class="type">${escapeHtml(labels[d.type] || d.type)}</span>
      <div class="total under-cap">${escapeHtml(money(d.total))}</div>
    </div>
    <h3>${escapeHtml(d.title)}</h3>
    <div class="source">${escapeHtml(d.seller)}</div>

    <div class="evidence-row" aria-label="Evidence status">
      <span class="evidence-tag evidence-${escapeHtml(freshness.key)}">${escapeHtml(freshness.label)}</span>
      <span class="evidence-tag">${escapeHtml(shippingLabel(d.shippingConfidence))}</span>
      <span class="evidence-tag">${escapeHtml(evidenceLabel(d.urlKind))}</span>
    </div>

    <div class="breakdown">
      <div><span>Item</span><strong>${escapeHtml(money(d.item))}</strong></div>
      <div><span>Shipping shown</span><strong>${escapeHtml(shipping)}</strong></div>
    </div>
    <div class="specs">${d.specs.map(s => `<span class="spec">${escapeHtml(s)}</span>`).join("")}</div>
    <p class="note">${escapeHtml(d.note)}</p>

    <details class="evidence-details">
      <summary>Evidence & risks</summary>
      <p><strong>Evidence:</strong> ${escapeHtml(d.evidenceNote)}</p>
      ${riskList}
    </details>

    <div class="card-footer">
      <span class="checked">Checked ${escapeHtml(d.checked)}</span>
      <div class="card-actions"><a class="details-link" href="?deal=${encodeURIComponent(d.id)}#deals">Details</a><a href="${escapeHtml(safeUrl(d.source))}" target="_blank" rel="noreferrer">Open source ↗</a></div>
    </div>
  </article>`;
}

function osFamily(d) {
  const os = (d.osInstalled || "").toLowerCase();
  if (os.startsWith("windows")) return "windows";
  if (os.includes("chrome")) return "chrome";
  return "other";
}

function hasSolidState(d) {
  return /ssd|nvme|emmc|flash/i.test(d.storage || "");
}

function matchesFacets(d) {
  if (Number.isFinite(d.total) && d.total > maxPrice) return false;

  const selectedOs = [];
  if (facetState.windows) selectedOs.push("windows");
  if (facetState.chrome) selectedOs.push("chrome");
  if (facetState.otherOs) selectedOs.push("other");
  if (selectedOs.length && !selectedOs.includes(osFamily(d))) return false;

  if (facetState.fourGb && !(Number.isFinite(d.ramGb) && d.ramGb >= 4)) return false;
  if (facetState.solidState && !hasSolidState(d)) return false;
  if (facetState.freeShipping && d.shipping !== 0) return false;
  if (facetState.direct && d.urlKind !== "direct-listing") return false;
  if (facetState.fresh && freshnessFor(d.checkedRaw, d.availabilityStatus).key !== "fresh") return false;

  return true;
}

function sortDeals(items) {
  return [...items].sort((a, b) => {
    if (sortMode === "newest") {
      const dateDiff = String(b.checkedRaw || "").localeCompare(String(a.checkedRaw || ""));
      return dateDiff || a.total - b.total;
    }
    if (sortMode === "ram") {
      const aRam = Number.isFinite(a.ramGb) ? a.ramGb : -1;
      const bRam = Number.isFinite(b.ramGb) ? b.ramGb : -1;
      return bRam - aRam || a.total - b.total;
    }
    return a.total - b.total;
  });
}

function activeFacetCount() {
  return Object.values(facetState).filter(Boolean).length + (maxPrice !== 100 ? 1 : 0) + (sortMode !== "price" ? 1 : 0);
}

function matchesFilter(d) {
  if (activeFilter === "auction") return d.buyingMode === "auction";
  if (d.buyingMode === "auction") return false;
  return activeFilter === "all" || d.type === activeFilter;
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  if (activeFilter === "all") params.delete("filter");
  else params.set("filter", activeFilter);
  if (query) params.set("q", query);
  else params.delete("q");
  if (selectedDealId) params.set("deal", selectedDealId);
  else params.delete("deal");

  if (maxPrice !== 100) params.set("max", String(maxPrice));
  else params.delete("max");
  if (sortMode !== "price") params.set("sort", sortMode);
  else params.delete("sort");

  const facetParams = {
    windows: "windows",
    chrome: "chrome",
    otherOs: "other",
    fourGb: "ram4",
    solidState: "ssd",
    freeShipping: "free",
    direct: "direct",
    fresh: "fresh"
  };
  Object.entries(facetParams).forEach(([key, param]) => {
    if (facetState[key]) params.set(param, "1");
    else params.delete(param);
  });

  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", next);
}

function setActiveFilterButton() {
  document.querySelectorAll(".filter").forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderDealDetail() {
  const panel = document.querySelector("#dealDetail");
  if (!panel) return;

  const deal = selectedDealId ? deals.find(item => item.id === selectedDealId) : null;
  if (!deal) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }

  const freshness = freshnessFor(deal.checkedRaw, deal.availabilityStatus);
  const risks = deal.risks.length
    ? `<ul>${deal.risks.map(risk => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>`
    : "<p>No additional risks recorded.</p>";

  panel.hidden = false;
  panel.innerHTML = `
    <div class="deal-detail-head">
      <div>
        <div class="eyebrow dark">SHAREABLE LISTING DETAIL</div>
        <h3>${escapeHtml(deal.title)}</h3>
        <p>${escapeHtml(deal.seller)}</p>
      </div>
      <button type="button" class="detail-close" id="detailClose">Close</button>
    </div>
    <div class="deal-detail-price">${escapeHtml(money(deal.total))} <span>recorded all-in total</span></div>
    <div class="evidence-row">
      <span class="evidence-tag evidence-${escapeHtml(freshness.key)}">${escapeHtml(freshness.label)}</span>
      <span class="evidence-tag">${escapeHtml(shippingLabel(deal.shippingConfidence))}</span>
      <span class="evidence-tag">${escapeHtml(evidenceLabel(deal.urlKind))}</span>
      <span class="evidence-tag">${escapeHtml(deal.buyingMode === "auction" ? "Auction/watch" : "Fixed price")}</span>
    </div>
    <div class="deal-detail-grid">
      <div><span>Item</span><strong>${escapeHtml(money(deal.item))}</strong></div>
      <div><span>Shipping shown</span><strong>${escapeHtml(deal.shipping === 0 ? "FREE" : money(deal.shipping))}</strong></div>
      <div><span>Last checked</span><strong>${escapeHtml(deal.checked)}</strong></div>
      <div><span>Availability</span><strong>${escapeHtml(deal.availabilityStatus)}</strong></div>
    </div>
    <div class="specs">${deal.specs.map(s => `<span class="spec">${escapeHtml(s)}</span>`).join("")}</div>
    <p class="note"><strong>Evidence:</strong> ${escapeHtml(deal.evidenceNote)}</p>
    <div class="detail-risks"><strong>Risks / caveats</strong>${risks}</div>
    <div class="deal-detail-actions">
      <a class="button notes-button" href="${escapeHtml(safeUrl(deal.source))}" target="_blank" rel="noreferrer">Open source ↗</a>
      <button type="button" class="copy-link-button" id="copyDealLink">Copy share link</button>
    </div>
  `;

  panel.querySelector("#detailClose")?.addEventListener("click", () => {
    selectedDealId = "";
    renderDealDetail();
    syncUrlState();
  });

  panel.querySelector("#copyDealLink")?.addEventListener("click", async event => {
    const url = new URL(window.location.href);
    url.searchParams.set("deal", deal.id);
    url.hash = "deals";
    try {
      await navigator.clipboard.writeText(url.href);
      event.currentTarget.textContent = "Copied";
      window.setTimeout(() => { event.currentTarget.textContent = "Copy share link"; }, 1400);
    } catch {
      window.prompt("Copy this link:", url.href);
    }
  });
}

function render() {
  const filtered = sortDeals(
    deals
      .filter(matchesFilter)
      .filter(matchesFacets)
      .filter(d => !query || [d.title, d.seller, ...d.specs, d.note, d.evidenceNote, ...d.risks]
        .join(" ")
        .toLowerCase()
        .includes(query))
  );

  document.querySelector("#dealGrid").innerHTML = filtered.map(card).join("");
  const noun = activeFilter === "auction" ? "auction watch" : "deal";
  document.querySelector("#resultCount").textContent =
    `${filtered.length} ${noun}${filtered.length === 1 ? "" : "s"} shown`;

  const sortLabels = {
    price: activeFilter === "auction" ? "Observed price low → high" : "Delivered price low → high",
    newest: "Most recently checked",
    ram: "Most RAM first"
  };
  document.querySelector("#sortLabel").textContent = sortLabels[sortMode] || sortLabels.price;

  const count = activeFacetCount();
  const activeCount = document.querySelector("#activeFilterCount");
  if (activeCount) activeCount.textContent = count ? `${count} extra filter${count === 1 ? "" : "s"} active` : "No extra filters";

  document.querySelector("#empty").hidden = filtered.length !== 0;
  renderDealDetail();
  setActiveFilterButton();
  document.querySelectorAll("[data-toggle]").forEach(button => {
    const active = Boolean(facetState[button.dataset.toggle]);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  syncUrlState();
}

function bindControls() {
  const search = document.querySelector("#search");
  const maxPriceSelect = document.querySelector("#maxPrice");
  const sortSelect = document.querySelector("#sortMode");
  const clearButton = document.querySelector("#clearFilters");

  search.value = query;
  if (maxPriceSelect) maxPriceSelect.value = String(maxPrice);
  if (sortSelect) sortSelect.value = sortMode;

  document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
    activeFilter = btn.dataset.filter;
    render();
  }));

  document.querySelectorAll("[data-toggle]").forEach(btn => btn.addEventListener("click", () => {
    const key = btn.dataset.toggle;
    if (Object.prototype.hasOwnProperty.call(facetState, key)) {
      facetState[key] = !facetState[key];
      render();
    }
  }));

  search.addEventListener("input", event => {
    query = event.target.value.trim().toLowerCase();
    render();
  });

  maxPriceSelect?.addEventListener("change", event => {
    maxPrice = Number(event.target.value) || 100;
    render();
  });

  sortSelect?.addEventListener("change", event => {
    sortMode = validSortModes.has(event.target.value) ? event.target.value : "price";
    render();
  });

  clearButton?.addEventListener("click", () => {
    activeFilter = "all";
    query = "";
    selectedDealId = "";
    maxPrice = 100;
    sortMode = "price";
    Object.keys(facetState).forEach(key => { facetState[key] = false; });
    search.value = "";
    if (maxPriceSelect) maxPriceSelect.value = "100";
    if (sortSelect) sortSelect.value = "price";
    render();
  });

  setActiveFilterButton();
}

async function init() {
  try {
    const response = await fetch("./data/listings.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();

    deals = payload.listings.map(normalise);

    renderStats(payload);
    renderLeaders();
    bindControls();
    render();
  } catch (error) {
    console.error("Failed to load canonical listing data", error);
    document.querySelector("#stats").innerHTML =
      '<div class="stat"><strong>Data error</strong><span>Canonical listing file could not be loaded.</span></div>';
    document.querySelector("#dealGrid").innerHTML = "";
    document.querySelector("#resultCount").textContent = "Listings unavailable";
    document.querySelector("#empty").hidden = false;
    document.querySelector("#empty").textContent =
      "The bargain data could not be loaded. Open the GitHub repository for the current research snapshot.";
  }
}

init();


function saleValueLabel(m){
  if(Array.isArray(m.indicativeRange)){
    return `${money(m.indicativeRange[0])}–${money(m.indicativeRange[1])}`;
  }
  return money(m.maxPlausible);
}

async function renderFleetValuation(){
  const statsEl=document.querySelector("#fleetStats");
  const tableEl=document.querySelector("#fleetTableBody");
  const platformsEl=document.querySelector("#fleetPlatforms");
  const excludedEl=document.querySelector("#fleetExcluded");
  const fleetEvidenceEl=document.querySelector("#fleetEvidence");
  if(!statsEl||!tableEl||!platformsEl||!excludedEl) return;

  try{
    const response=await fetch("./data/fleet-valuations-2026-09-23.json",{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    const s=data.summary;

    statsEl.innerHTML=[
      [money(s.fleetMaxCompleteSale),"upper end if sold complete"],
      [money(s.fleetMaxOptimisedSale),"upper end with Crosshair part-out"],
      [`${money(s.fasterSaleRange[0])}–${money(s.fasterSaleRange[1])}`,"faster-sale estimate"],
      [s.activeMachines,"active machines valued"]
    ].map(([value,label])=>`<div class="fleet-stat"><strong>${value}</strong><span>${label}</span></div>`).join("");

    platformsEl.innerHTML=data.platformStrategy.map(p=>`<article class="market-callout">
      <span class="award">${escapeHtml(p.platform)}</span>
      <h3>${escapeHtml(p.bestFor)}</h3>
      <p>${escapeHtml(p.why)}</p>
    </article>`).join("");

    const evidenceBackedMachines=new Set((data.evidenceAnchors||[]).map(anchor=>anchor.machine));
    const rows=[...data.machines].sort((a,b)=>b.maxPlausible-a.maxPlausible);

    tableEl.innerHTML=rows.map(m=>{
      const extra=m.partOutMaxPlausible
        ? `<div class="partout">Up to ${money(m.partOutMaxPlausible)} parted</div>`
        : "";
      const condition=m.condition ? `<div class="row-note">${escapeHtml(m.condition)}</div>` : "";
      const searchable=`${m.name} ${m.spec} ${m.recommendedPlatform||""} ${m.condition||""}`.toLowerCase();
      return `<tr class="fleet-row" data-category="${escapeHtml(m.category)}" data-search="${escapeHtml(searchable)}">
        <td><strong>${escapeHtml(m.name)}</strong>${condition}</td>
        <td>${escapeHtml(m.spec)}</td>
        <td><span class="type">${escapeHtml(m.category)}</span></td>
        <td class="fleet-price"><strong>${escapeHtml(saleValueLabel(m))}</strong>${extra}</td>
        <td><span class="valuation-evidence ${evidenceBackedMachines.has(m.name)?"anchored":"estimate"}">${evidenceBackedMachines.has(m.name)?"Evidence-backed":"Estimate"}</span></td>
        <td>${escapeHtml(m.recommendedPlatform||"—")}</td>
      </tr>`;
    }).join("");

    const fleetSearch=document.querySelector("#fleetSearch");
    const fleetCategory=document.querySelector("#fleetCategory");
    const fleetResultCount=document.querySelector("#fleetResultCount");
    const applyFleetFilters=()=>{
      const needle=(fleetSearch?.value||"").trim().toLowerCase();
      const category=fleetCategory?.value||"all";
      let visible=0;
      tableEl.querySelectorAll(".fleet-row").forEach(row=>{
        const categoryMatch=category==="all"||row.dataset.category===category;
        const textMatch=!needle||(row.dataset.search||"").includes(needle);
        row.hidden=!(categoryMatch&&textMatch);
        if(!row.hidden) visible++;
      });
      if(fleetResultCount) fleetResultCount.textContent=`${visible} of ${rows.length} machines shown`;
    };
    fleetSearch?.addEventListener("input",applyFleetFilters);
    fleetCategory?.addEventListener("change",applyFleetFilters);
    applyFleetFilters();

    const ex=data.notCountedInMainFleet;
    excludedEl.innerHTML=`<strong>Not counted in the main total:</strong> ${ex.map(m=>`${escapeHtml(m.name)} (${escapeHtml(money(m.indicativeRange[0]))}–${escapeHtml(money(m.indicativeRange[1]))} as-is; ${escapeHtml(m.reason.toLowerCase())})`).join("; ")}.`;

    if(fleetEvidenceEl){
      fleetEvidenceEl.innerHTML=(data.evidenceAnchors||[]).map(anchor=>{
        const links=(anchor.urls||[]).map((url,index)=>`<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noreferrer">Source ${index+1} ↗</a>`).join("");
        return `<article class="fleet-evidence-card">
          <h4>${escapeHtml(anchor.machine)}</h4>
          <p>${escapeHtml(anchor.observed)}</p>
          <p class="evidence-interpretation">${escapeHtml(anchor.interpretation)}</p>
          <div class="source-links">${links}</div>
        </article>`;
      }).join("");
    }
  }catch(error){
    statsEl.innerHTML=`<div class="fleet-load-error">Fleet valuation data could not be loaded. <a href="./FLEET-RESALE-VALUATION.md">Open the written report instead.</a></div>`;
    console.error("Fleet valuation load failed",error);
  }
}
renderFleetValuation();


function initProfitCalculator(){
  const root=document.querySelector("#calculator");
  if(!root) return;

  const cashInputs=[...root.querySelectorAll('[data-cost="cash"]')];
  const sale=root.querySelector("#calcSale");
  const minutes=root.querySelector("#calcMinutes");
  const hourly=root.querySelector("#calcHourly");
  const reset=root.querySelector("#calculatorReset");

  const read=input=>{
    const value=Number.parseFloat(input.value);
    return Number.isFinite(value)&&value>=0?value:0;
  };

  const output=(selector,value)=>{
    const el=root.querySelector(selector);
    if(el) el.textContent=value;
  };

  const calculate=()=>{
    const cashCost=cashInputs.reduce((sum,input)=>sum+read(input),0);
    const salePrice=read(sale);
    const labourHours=read(minutes)/60;
    const labourValue=labourHours*read(hourly);
    const breakEven=cashCost+labourValue;
    const profit=salePrice-breakEven;
    const hourlyReturn=labourHours>0?(salePrice-cashCost)/labourHours:null;

    output("#calcCashCost",money(cashCost));
    output("#calcBreakEven",money(breakEven));
    output("#calcProfit",money(profit));
    output("#calcHourlyReturn",hourlyReturn===null?"—":`${money(hourlyReturn)}/hr`);

    const profitEl=root.querySelector("#calcProfit");
    if(profitEl){
      profitEl.classList.toggle("positive",profit>0);
      profitEl.classList.toggle("negative",profit<0);
    }
  };

  root.querySelectorAll("input").forEach(input=>input.addEventListener("input",calculate));
  reset?.addEventListener("click",()=>{
    root.querySelectorAll("input").forEach(input=>{input.value="";});
    calculate();
    root.querySelector("input")?.focus();
  });

  calculate();
}
initProfitCalculator();
