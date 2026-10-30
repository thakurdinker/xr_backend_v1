// Capture public API responses from a LOCAL backend (dev db) into a folder.
//   node capture-api.js <outDir> [baseUrl=http://localhost:3333]
// Endpoint list is built from the DEV db (read-only) so before/after runs hit the same URLs.
const path = require("path");
const fs = require("fs");
const BE = path.resolve(__dirname, "../..");
require(path.join(BE, "node_modules/dotenv")).config({ path: path.join(BE, "vars/.env") });
const { MongoClient } = require(path.join(BE, "node_modules/mongodb"));
const seoUrlMap = require(path.join(BE, "utils/seoUrlMap"));

const OUT = process.argv[2];
const BASE = process.argv[3] || "http://localhost:3333";
if (!OUT) throw new Error("usage: capture-api.js <outDir>");
const url = process.env.TEST_DB_URL;
if ((url.split("/").pop() || "").split("?")[0] !== "xrealty_website_dev_backend") throw new Error("REFUSING: not dev db");

// Fields that legitimately differ between runs.
const VOLATILE = new Set(["generatedAt", "timestamp", "requestId"]);
const strip = (v) =>
  Array.isArray(v) ? v.map(strip)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => !VOLATILE.has(k)).map(([k, x]) => [k, strip(x)]))
  : v;

(async () => {
  const cli = new MongoClient(url); await cli.connect();
  const db = cli.db();
  const props = await db.collection("properties").distinct("property_name_slug");
  const comms = await db.collection("communities").distinct("slug");
  const devs = await db.collection("developers").distinct("developer_slug");
  await cli.close();

  const reqs = [
    ["GET", "/"], ["GET", "/area/communities/"], ["GET", "/admin/developers"], ["GET", "/user/search-filters"],
    ["GET", "/dubai-properties/"], ["GET", "/dubai-properties/?page=2"],
  ];
  for (const s of comms) reqs.push(["GET", `/area/${s}?propertiesPage=1&propertiesLimit=200`]);
  for (const s of props) reqs.push(["GET", `/property/${s}`]);
  for (const s of devs) { reqs.push(["GET", `/label/${s}?page=1`]); reqs.push(["GET", `/label/${s}?page=2`]); }
  for (const p of Object.keys(seoUrlMap)) for (const pg of [1, 2, 23]) reqs.push(["GET", `${p}?page=${pg}`]);
  const searches = [{ page: 1, limit: 20 }, { page: 2, limit: 20 }, { community: "dubai-marina" }, { propertyType: "villas" }, { minPrice: 1000000, maxPrice: 3000000 }];
  for (const b of searches) reqs.push(["POST", "/property-search", b]);

  fs.mkdirSync(OUT, { recursive: true });
  const index = {};
  let i = 0;
  const work = reqs.map(([m, p, body]) => async () => {
    const key = `${m} ${p}${body ? " " + JSON.stringify(body) : ""}`;
    const res = await fetch(BASE + p, { method: m, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    let data = await res.text();
    try { data = strip(JSON.parse(data)); } catch {}
    const file = String(++i).padStart(4, "0") + ".json";
    fs.writeFileSync(path.join(OUT, file), JSON.stringify({ status: res.status, data }, null, 1));
    index[key] = file;
  });
  for (let k = 0; k < work.length; k += 6) await Promise.all(work.slice(k, k + 6).map((f) => f()));
  fs.writeFileSync(path.join(OUT, "_index.json"), JSON.stringify(index, null, 1));
  console.log(`captured ${reqs.length} responses -> ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
