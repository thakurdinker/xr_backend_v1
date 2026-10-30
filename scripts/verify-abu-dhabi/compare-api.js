// Compare two capture-api.js runs by request key. Prints every differing request
// with the first few differing JSON paths.  node compare-api.js <dirA> <dirB> [--ignore=path.regex]
const fs = require("fs");
const path = require("path");
const [A, B] = process.argv.slice(2);
const ign = process.argv.find((a) => a.startsWith("--ignore="));
const IGNORE = ign ? new RegExp(ign.slice(9)) : null;
const load = (d) => JSON.parse(fs.readFileSync(path.join(d, "_index.json")));
const ia = load(A), ib = load(B);

function diff(a, b, p, out) {
  if (out.length > 5) return;
  if (IGNORE && IGNORE.test(p)) return;
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b) || a === null || b === null || typeof a !== "object") {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${p}: ${JSON.stringify(a)?.slice(0, 80)} -> ${JSON.stringify(b)?.slice(0, 80)}`);
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) diff(a[k], b[k], `${p}.${k}`, out);
}

let same = 0, changed = 0;
for (const key of new Set([...Object.keys(ia), ...Object.keys(ib)])) {
  if (!ia[key] || !ib[key]) { console.log("MISSING in", ia[key] ? "B" : "A", key); changed++; continue; }
  const a = JSON.parse(fs.readFileSync(path.join(A, ia[key])));
  const b = JSON.parse(fs.readFileSync(path.join(B, ib[key])));
  const out = [];
  diff(a, b, "", out);
  if (out.length) { changed++; console.log("DIFF", key, "\n   " + out.join("\n   ")); } else same++;
}
console.log(`\nidentical: ${same}  different: ${changed}`);
process.exit(changed ? 2 : 0);
