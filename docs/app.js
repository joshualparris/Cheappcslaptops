const money = n => new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: Number.isInteger(n) ? 0 : 2
}).format(n);

const labels = { desktop: "Desktop", laptop: "Laptop", part: "Part" };

let deals = [];
let activeFilter = "all";
let query = "";

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
    risks: listing.risks || []
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
      <a href="${escapeHtml(safeUrl(d.source))}" target="_blank" rel="noreferrer">Open source ↗</a>
    </div>
  </article>`;
}

function render() {
  const filtered = deals
    .filter(d => activeFilter === "all" || d.type === activeFilter)
    .filter(d => !query || [d.title, d.seller, ...d.specs, d.note, d.evidenceNote, ...d.risks]
      .join(" ")
      .toLowerCase()
      .includes(query))
    .sort((a, b) => a.total - b.total);

  document.querySelector("#dealGrid").innerHTML = filtered.map(card).join("");
  document.querySelector("#resultCount").textContent =
    `${filtered.length} deal${filtered.length === 1 ? "" : "s"} shown`;
  document.querySelector("#empty").hidden = filtered.length !== 0;
}

function bindControls() {
  document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    render();
  }));

  document.querySelector("#search").addEventListener("input", event => {
    query = event.target.value.trim().toLowerCase();
    render();
  });
}

async function init() {
  try {
    const response = await fetch("./data/listings.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();

    deals = payload.listings
      .filter(item => item.buyingMode !== "auction")
      .map(normalise);

    renderStats(payload);
    renderLeaders();
    render();
    bindControls();
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
      <span class="award">${p.platform}</span>
      <h3>${p.bestFor}</h3>
      <p>${p.why}</p>
    </article>`).join("");

    const rows=[...data.machines].sort((a,b)=>{
      if(a.category!==b.category) return a.category.localeCompare(b.category);
      return b.maxPlausible-a.maxPlausible;
    });

    tableEl.innerHTML=rows.map(m=>{
      const extra=m.partOutMaxPlausible
        ? `<div class="partout">Up to ${money(m.partOutMaxPlausible)} parted</div>`
        : "";
      const condition=m.condition ? `<div class="row-note">${m.condition}</div>` : "";
      return `<tr>
        <td><strong>${m.name}</strong>${condition}</td>
        <td>${m.spec}</td>
        <td><span class="type">${m.category}</span></td>
        <td class="fleet-price"><strong>${saleValueLabel(m)}</strong>${extra}</td>
        <td>${m.recommendedPlatform||"—"}</td>
      </tr>`;
    }).join("");

    const ex=data.notCountedInMainFleet;
    excludedEl.innerHTML=`<strong>Not counted in the main total:</strong> ${ex.map(m=>`${m.name} (${money(m.indicativeRange[0])}–${money(m.indicativeRange[1])} as-is; ${m.reason.toLowerCase()})`).join("; ")}.`;
  }catch(error){
    statsEl.innerHTML=`<div class="fleet-load-error">Fleet valuation data could not be loaded. <a href="./FLEET-RESALE-VALUATION.md">Open the written report instead.</a></div>`;
    console.error("Fleet valuation load failed",error);
  }
}
renderFleetValuation();
