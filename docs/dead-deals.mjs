import { scoreListing } from "./dead-deal-core.mjs";

const list = document.querySelector("#ddList");
const status = document.querySelector("#ddStatus");
const checkResult = document.querySelector("#checkResult");

const escape = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (n) => (n == null ? "?" : `${n < 0 ? "−" : ""}$${Math.abs(n).toFixed(0)}`);
const safeUrl = (url) => (/^https:\/\//i.test(url ?? "") ? url : null);

function card(deal) {
  const s = deal.score;
  const url = safeUrl(deal.url);
  const fix = s.faults.map((f) => escape(f.label)).join(", ") || "No fault stated";
  return `<li class="dd-card">
    <div class="dd-row"><span class="dd-tier ${s.tier}">${s.recommended ? "Recommended · " : ""}${s.tier}</span><span>${escape(deal.source ?? "")}</span>${deal.location ? `<span>${escape(deal.location)}</span>` : ""}</div>
    <h3>${url ? `<a href="${escape(url)}" target="_blank" rel="noreferrer">${escape(deal.title)} ↗</a>` : escape(deal.title)}</h3>
    <div class="dd-row">
      <span class="dd-profit ${s.expectedProfitAud < 0 ? "neg" : ""}">${money(s.expectedProfitAud)}</span>
      <span>expected profit after labour</span>
      <span>Cash profit <strong>${money(s.cashProfitAud)}</strong></span>
      <span>Buy <strong>${money(s.unitPriceAud)}</strong> + ship <strong>${money(s.unitShippingAud)}</strong></span>
      <span>Parts <strong>${money(s.partsAud)}</strong></span>
      <span>Resell ~<strong>${money(s.estimatedResaleAud)}</strong></span>
      <span>~${s.labourMinutes} min work</span>
      <span>Gen <strong>${s.generation ?? "?"}</strong></span>
    </div>
    <div class="dd-row"><span>Fix: <strong>${fix}</strong></span></div>
    ${s.reasons.length ? `<ul class="dd-reasons">${s.reasons.map((r) => `<li>${escape(r)}</li>`).join("")}</ul>` : ""}
  </li>`;
}

document.querySelector("#checkForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const listing = {
    title: form.get("title"),
    priceAud: Number(form.get("priceAud")),
    shippingAud: form.get("shippingAud") === "" ? null : Number(form.get("shippingAud")),
    source: "Pasted listing",
  };
  checkResult.innerHTML = card({ ...listing, score: scoreListing(listing) });
});

try {
  const response = await fetch("./data/dead-deals.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const sources = data.sources.map((s) => `${s.source}: ${s.ok ? `${s.count}` : "not connected"}`).join(" · ");
  const when = data.generatedAt ? new Date(data.generatedAt).toLocaleString("en-AU") : "never";
  status.textContent = `Last search ${when}. ${sources}. ${data.disclaimer}`;
  list.innerHTML = data.deals.length
    ? data.deals.map(card).join("")
    : `<li class="dd-card">No listings yet. Connect eBay API keys or add manual leads, then run the hunter.</li>`;
} catch (error) {
  status.textContent = `Could not load the latest search (${error.message}).`;
}
