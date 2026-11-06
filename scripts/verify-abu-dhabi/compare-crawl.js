// Compare two crawl.js outputs field by field.  node compare-crawl.js <a.json> <b.json> [--ignore-links=regex]
const fs = require("fs");
const [A, B] = process.argv.slice(2);
const ign = process.argv.find((x) => x.startsWith("--ignore-links="));
const IGNORE_LINK = ign ? new RegExp(ign.slice(15)) : null;
const a = JSON.parse(fs.readFileSync(A)), b = JSON.parse(fs.readFileSync(B));
const byField = {};
let same = 0;
for (const p of Object.keys(a)) {
  const x = a[p], y = b[p] || {};
  const diffs = [];
  for (const f of ["status", "location", "title", "description", "robots", "ogUrl", "canonical", "h1", "jsonld"]) {
    if (JSON.stringify(x[f]) !== JSON.stringify(y[f])) diffs.push(f);
  }
  const keep = (l) => !IGNORE_LINK || !IGNORE_LINK.test(l);
  const lx = (x.links || []).filter(keep), ly = (y.links || []).filter(keep);
  const added = ly.filter((l) => !lx.includes(l)), removed = lx.filter((l) => !ly.includes(l));
  if (added.length || removed.length) diffs.push("links");
  if (!diffs.length) { same++; continue; }
  for (const f of diffs) (byField[f] ||= []).push(p);
  console.log(`DIFF ${p}: ${diffs.join(", ")}`);
  if (added.length || removed.length) console.log(`   links +${JSON.stringify(added.slice(0, 5))} -${JSON.stringify(removed.slice(0, 5))}`);
  for (const f of diffs.filter((f) => f !== "links")) console.log(`   ${f}: ${JSON.stringify(x[f])?.slice(0, 160)}\n   ${" ".repeat(f.length)}→ ${JSON.stringify(y[f])?.slice(0, 160)}`);
}
console.log(`\nidentical pages: ${same} / ${Object.keys(a).length}`);
for (const [f, ps] of Object.entries(byField)) console.log(`  ${f}: ${ps.length} pages`);
