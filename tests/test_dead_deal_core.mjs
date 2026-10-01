import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { detectFaults, inferCpuGeneration, inferLotSize, rankListings, scoreListing } from "../docs/dead-deal-core.mjs";

const ids = (text) => detectFaults(text).map((f) => f.id);

// CPU generation from CPU strings and from model names alone.
assert.equal(inferCpuGeneration("Latitude i5-8350U"), 8);
assert.equal(inferCpuGeneration("ThinkPad i7-10610U"), 10);
assert.equal(inferCpuGeneration("i5-1135G7"), 11);
assert.equal(inferCpuGeneration("HP EliteBook 840 G5"), 8);
assert.equal(inferCpuGeneration("Lenovo ThinkPad T480"), 8);
assert.equal(inferCpuGeneration("Dell Latitude 5410"), 10);
assert.equal(inferCpuGeneration("Ryzen 5 PRO 3500U"), 8);
assert.equal(inferCpuGeneration("Acer laptop"), null);

assert.equal(inferLotSize("Lot of 5 ThinkPad T480"), 5);
assert.equal(inferLotSize("ThinkPad T480 14 inch"), 1);

// "No power adapter" is a missing charger, not a dead board.
assert.deepEqual(ids("Latitude no power adapter"), ["no-charger"]);
assert.deepEqual(ids("ThinkPad won't turn on"), ["no-power"]);
assert.ok(ids("EliteBook BIOS password locked").includes("bios-lock"));
assert.ok(ids("Latitude 7490 no ssd no ram").includes("no-storage"));
assert.ok(ids("Latitude 7490 no ssd no ram").includes("no-ram"));
assert.deepEqual(ids("waterproof sleeve included"), []);

// Easy-fix 8th-gen business laptop is recommended with healthy margin.
{
  const s = scoreListing({ title: "Dell Latitude 7490 i5-8350U 8GB No SSD No OS", priceAud: 45, shippingAud: 12, condition: "For parts or not working" });
  assert.equal(s.tier, "easy");
  assert.equal(s.recommended, true);
  assert.equal(s.partsAud, 28);
  assert.ok(s.grossRoomAud >= 80, `gross ${s.grossRoomAud}`);
}

// BIOS-locked machines are never recommended, however cheap.
{
  const s = scoreListing({ title: "HP EliteBook 840 G5 BIOS locked", priceAud: 5, shippingAud: 0 });
  assert.equal(s.tier, "reject");
  assert.equal(s.recommended, false);
  assert.equal(s.successProbability, 0);
}

// An unexplained "for parts" listing is treated as a high-risk dead machine.
{
  const s = scoreListing({ title: "Lenovo ThinkPad T480", priceAud: 40, shippingAud: 10, condition: "For parts or not working" });
  assert.equal(s.tier, "high");
  assert.equal(s.recommended, false);
}

// Old consumer laptop fails the Windows 11 / margin rules.
{
  const s = scoreListing({ title: "Toshiba Satellite i3-4005U cracked screen", priceAud: 20, shippingAud: 15 });
  assert.equal(s.recommended, false);
  assert.ok(s.reasons.some((r) => r.includes("Windows 11")));
}

// Ranking puts the easy business flip first.
{
  const ranked = rankListings([
    { id: "a", title: "ThinkPad T480 won't turn on", priceAud: 20, shippingAud: 0 },
    { id: "b", title: "ThinkPad T480 i5-8250U no ssd no charger", priceAud: 60, shippingAud: 0 },
  ]);
  assert.equal(ranked[0].id, "b");
}

// The hunter runs end-to-end on a Browse API fixture without network.
{
  const out = JSON.parse(execFileSync("node", ["scripts/hunt_dead_deals.mjs", "--fixture", "tests/fixtures/ebay-browse-dead-laptops.json", "--stdout"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, NTFY_TOPIC: "", GITHUB_STEP_SUMMARY: "" } }));
  assert.equal(out.deals.length, 4);
  assert.equal(out.deals[0].id, "ebay-v1|100000000001|0");
  assert.equal(out.deals[0].score.recommended, true);
  assert.equal(out.deals.filter((d) => d.score.recommended).length, 1);
}

console.log("dead-deal core tests passed");
