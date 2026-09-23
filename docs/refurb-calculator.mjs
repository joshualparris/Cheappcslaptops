import { calculateRefurbProfit } from "./refurb-profit-core.mjs";

const form = document.querySelector("#profitForm");
const results = document.querySelector("#profitResults");
const verdict = document.querySelector("#profitVerdict");
const errorBox = document.querySelector("#calcError");

const aud = value => new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2
}).format(value);

function formValues() {
  return Object.fromEntries(
    [...new FormData(form).entries()].map(([key, value]) => [key, Number(value)])
  );
}

function resultCard(label, value, note = "") {
  return `<article class="profit-result">
    <span>${label}</span>
    <strong>${value}</strong>
    ${note ? `<small>${note}</small>` : ""}
  </article>`;
}

function render() {
  try {
    const r = calculateRefurbProfit(formValues());
    errorBox.hidden = true;

    results.innerHTML = [
      resultCard("Expected sale after negotiation", aud(r.expectedSalePrice)),
      resultCard("Parts + acquisition", aud(r.partsAndAcquisition)),
      resultCard("Licence allocation / unit", aud(r.licencePerUnit), `at ${r.plannedUnits} units/year`),
      resultCard("Selling fees + risk reserve", aud(r.sellingFees + r.returnReserve)),
      resultCard("Imputed labour cost", aud(r.labourCost), `${r.labourHours.toFixed(1)} hours`),
      resultCard("Gross room before overhead", aud(r.grossBeforeOverhead)),
      resultCard("Cash profit", aud(r.cashProfit), "before valuing your labour"),
      resultCard("Profit after labour", aud(r.profitAfterLabour)),
      resultCard("Break-even asking price", aud(r.breakEvenAskingPrice)),
      resultCard(
        "Effective return on hands-on time",
        r.effectiveHourlyReturn === null ? "—" : `${aud(r.effectiveHourlyReturn)}/hr`,
        "cash profit ÷ labour hours"
      )
    ].join("");

    const strongGross = r.meetsGrossMarginTarget;
    const positiveAfterLabour = r.profitAfterLabour > 0;
    let heading = "Weak business case";
    let text = "The current inputs leave too little room once risk, compliance overhead and your time are counted.";

    if (strongGross && positiveAfterLabour) {
      heading = "Worth investigating";
      text = "This clears the $80 gross-room screen and remains positive after the costs entered. You would still verify condition, demand and compliance before buying.";
    } else if (positiveAfterLabour) {
      heading = "Possible, but margin is thin";
      text = "It remains profitable on these assumptions, but it does not clear the $80 gross-room screen used in the current Dubbo refurb research.";
    }

    verdict.innerHTML = `<strong>${heading}</strong><p>${text}</p>`;
    verdict.dataset.state = strongGross && positiveAfterLabour ? "good" : positiveAfterLabour ? "caution" : "weak";
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    results.innerHTML = "";
    verdict.innerHTML = "";
  }
}

form.addEventListener("input", render);
render();
