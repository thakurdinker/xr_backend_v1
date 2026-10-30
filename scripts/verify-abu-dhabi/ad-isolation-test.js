// End-to-end Abu Dhabi isolation test against the LOCAL backend + DEV db.
// Inserts zz-test-* docs via the real models (so hooks run), checks every
// endpoint, then deletes them. Refuses to run against anything but the dev db.
process.env.MAIN_FRONTEND_URL = "http://127.0.0.1:9"; // never nudge the live site
const path = require("path");
const BE = path.resolve(__dirname, "../..");
require(path.join(BE, "node_modules/dotenv")).config({ path: path.join(BE, "vars/.env") });
const mongoose = require(path.join(BE, "node_modules/mongoose"));
const Community = require(path.join(BE, "models/community"));
const Property = require(path.join(BE, "models/properties"));
const Sitemap = require(path.join(BE, "models/sitemap"));
const { generateSitemap } = require(path.join(BE, "utils/generateSitemap/generateSitemap"));

const API = "http://localhost:3333";
const url = process.env.TEST_DB_URL;
if ((url.split("/").pop() || "").split("?")[0] !== "xrealty_website_dev_backend") throw new Error("REFUSING: not dev db");

const AREA = "zz-test-saadiyat";
const PROP = "zz-test-ad-project";
const DEV = "emaar-properties";
let pass = 0, fail = 0;
const check = (name, ok, extra = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };
const get = async (p) => (await fetch(API + p)).json();
const post = async (p, b) => (await fetch(API + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) })).json();
const slugsIn = (arr, key = "property_name_slug") => (arr || []).map((x) => x[key] || x.slug);
// Other zz-test-* rows (for example the seed-ad-demo.js demo data) may exist in
// the dev db. The "exactly this" checks ignore them, and only them, so any
// other unexpected Abu Dhabi data still fails.
const isOtherTestRow = (slug) => typeof slug === "string" && slug.startsWith("zz-test-") && slug !== AREA && slug !== PROP;
const own = (slugs) => slugs.filter((s) => !isOtherTestRow(s));

async function cleanup() {
  await Property.deleteMany({ property_name_slug: PROP });
  await Community.deleteMany({ slug: AREA });
}

(async () => {
  await mongoose.connect(url);
  if (mongoose.connection.db.databaseName !== "xrealty_website_dev_backend") throw new Error("REFUSING");
  await cleanup();
  const offplanBefore = await get("/off-plan-projects-for-sale-in-dubai/?page=1");

  await new Community({ name: "ZZ Test Saadiyat", slug: AREA, emirate: "Abu Dhabi" }).save();
  const maxOrder = (await Property.findOne().sort({ order: -1 }).select("order").lean())?.order || 0;
  // emirate deliberately set WRONG here: the hook must override it from the community.
  const prop = new Property({
    property_name: "ZZ Test AD Project", property_name_slug: PROP, community_name: "ZZ Test Saadiyat",
    community_name_slug: AREA, developer: "Emaar", developer_name_slug: DEV, show_property: true,
    featured: true, type: [{ name: "apartments", bedrooms: "1" }], order: maxOrder + 1000, emirate: "Dubai",
  });
  await prop.save();
  check("property inherits Abu Dhabi from its community", prop.emirate === "Abu Dhabi", prop.emirate);
  check("generated schema URL uses /abu-dhabi/property/", prop.schema_org?.properties?.url === `https://www.xrealty.ae/abu-dhabi/property/${PROP}/`, prop.schema_org?.properties?.url);

  // Property page
  check("Dubai /property/ does not serve the AD property", (await get(`/property/${PROP}`)).success === false);
  const adProp = await get(`/property/${PROP}?emirate=abu-dhabi`);
  check("AD property served with ?emirate=abu-dhabi", adProp.success && adProp.property?.emirate === "Abu Dhabi");
  check("invalid emirate rejected", (await (await fetch(`${API}/property/${PROP}?emirate=sharjah`)).status) === 400);
  const dubaiProp = await get("/property/the-yards-plaza-by-beyond");
  check("Dubai property not served under abu-dhabi", (await get("/property/the-yards-plaza-by-beyond?emirate=abu-dhabi")).success === false && dubaiProp.success);

  // Area page + list
  const dubaiArea = await get(`/area/${AREA}`);
  check("Dubai /area/ flags the AD area as wrongEmirate", dubaiArea.wrongEmirate === true);
  const adArea = await get(`/area/${AREA}?emirate=abu-dhabi&propertiesLimit=200`);
  check("AD area served with its property", adArea.community?.slug === AREA && slugsIn(adArea.properties).includes(PROP));
  check("Dubai area not served under abu-dhabi", (await get("/area/dubai-marina?emirate=abu-dhabi")).wrongEmirate === true);
  const dubaiList = await get("/area/communities/");
  check("Dubai area list excludes the AD area", !slugsIn(dubaiList.communities, "community_slug").includes(AREA));
  const adList = await get("/area/communities/?emirate=abu-dhabi");
  const adListSlugs = own(slugsIn(adList.communities, "community_slug"));
  check("AD area list = only the AD area (no Strapi/Dubai leakage)", adListSlugs.length === 1 && adListSlugs[0] === AREA, JSON.stringify(adListSlugs));

  // Landing pages
  const offplan = await get("/off-plan-projects-for-sale-in-dubai/?page=1");
  check("Dubai off-plan landing unchanged (same total pages, AD absent)", offplan.totalPages === offplanBefore.totalPages && !offplan.properties.some((p) => p.slug === PROP));
  const adOffplan = await get("/off-plan-projects-for-sale-in-abu-dhabi/?page=1");
  const adOffplanOwn = (adOffplan.properties || []).filter((p) => !isOtherTestRow(p.slug));
  check("AD off-plan landing lists the AD property with an /abu-dhabi/ URL", adOffplanOwn.length === 1 && adOffplanOwn[0].url === `https://www.xrealty.ae/abu-dhabi/property/${PROP}/`, JSON.stringify(slugsIn(adOffplan.properties)));
  const adApts = await get("/apartments-for-sale-in-abu-dhabi/?page=1");
  check("AD apartments landing lists it", adApts.properties?.some((p) => p.slug === PROP));
  const adVillas = await get("/villas-for-sale-in-abu-dhabi/?page=1");
  check("AD villas landing is empty (property is an apartment)", own(slugsIn(adVillas.properties)).length === 0);
  check("AD landing never gets Dubai Strapi copy", (adOffplan.content?.data || []).length === 0);
  const dApts = await get("/apartments-for-sale-in-dubai/?page=1");
  check("Dubai apartments landing excludes AD property", !dApts.properties.some((p) => p.slug === PROP));

  // Developer
  const devDubai = await get(`/label/${DEV}?page=1&limit=200`);
  check("developer page (Dubai) excludes AD property", !slugsIn(devDubai.developerProperties).includes(PROP));
  check("developer emirates = Dubai + Abu Dhabi", JSON.stringify(devDubai.emirates) === '["Dubai","Abu Dhabi"]', JSON.stringify(devDubai.emirates));
  const devAD = await get(`/label/${DEV}?emirate=abu-dhabi&page=1&limit=200`);
  check("developer page (AD) = only the AD property", JSON.stringify(own(slugsIn(devAD.developerProperties))) === JSON.stringify([PROP]));
  check("developer AD communities = only the AD area", JSON.stringify(own(slugsIn(devAD.developerCommunities, "slug"))) === JSON.stringify([AREA]));
  const devs = await get("/admin/developers");
  check("developer list (no filter) unchanged count", devs.data.length === 12);
  const devsAD = await get("/admin/developers?emirate=abu-dhabi");
  // A developer whose live AD projects are all other zz-test rows is test data too.
  const liveAD = await Property.find({ show_property: true, emirate: "Abu Dhabi" }).select("developer_name_slug property_name_slug").lean();
  const testOnlyDevs = new Set(liveAD.map((p) => p.developer_name_slug).filter((d) => d !== DEV && liveAD.filter((p) => p.developer_name_slug === d).every((p) => isOtherTestRow(p.property_name_slug))));
  check("developer list ?emirate=abu-dhabi = emaar only", JSON.stringify(devsAD.data.map((d) => d.developer_slug).filter((d) => !testOnlyDevs.has(d))) === JSON.stringify([DEV]), JSON.stringify(devsAD.data.map((d) => d.developer_slug)));
  const devsDubai = await get("/admin/developers?emirate=dubai");
  check("developer list ?emirate=dubai keeps all 12", devsDubai.data.length === 12);

  // Search, filters, homepage
  const s1 = await post("/property-search", { page: 1, limit: 500 });
  check("search excludes AD property by default", !slugsIn(s1.data || s1.properties).includes(PROP));
  const s2 = await post("/property-search", { page: 1, limit: 500, emirate: "abu-dhabi" });
  check("search with emirate=abu-dhabi finds only it", JSON.stringify(own(slugsIn(s2.data || s2.properties))) === JSON.stringify([PROP]));
  const f = await get("/user/search-filters");
  check("search filters exclude AD community", !f.data.communities.some((c) => c.slug === AREA));
  const home = await get("/");
  check("homepage featured excludes AD property (it is featured)", !JSON.stringify(home).includes(PROP));

  // Sitemaps
  await generateSitemap();
  const main = (await Sitemap.findOne(Sitemap.MAIN).lean()).content;
  const ad = (await Sitemap.findOne(Sitemap.ABU_DHABI).lean()).content;
  check("main sitemap has no AD URLs", !main.includes("zz-test") && !main.includes("xrealty.ae/abu-dhabi/"));
  const adLocs = [...ad.matchAll(/<loc>([^<]+)/g)].map((m) => m[1].replace("https://www.xrealty.ae", ""));
  check("AD sitemap lists hub, areas list, developers list, area, property and live landings", ["/abu-dhabi/", "/abu-dhabi/areas/", "/abu-dhabi/developers/", `/abu-dhabi/areas/${AREA}/`, `/abu-dhabi/property/${PROP}/`, "/off-plan-projects-for-sale-in-abu-dhabi/", "/apartments-for-sale-in-abu-dhabi/"].every((u) => adLocs.includes(u)) && !adLocs.includes("/villas-for-sale-in-abu-dhabi/"), JSON.stringify(adLocs));
  check("emaar (both emirates) stays in main sitemap, not AD", main.includes(`/developer/${DEV}/`) && !adLocs.includes(`/developer/${DEV}/`));
  check("main sitemap URL count unchanged (910)", (main.match(/<loc>/g) || []).length === 910, String((main.match(/<loc>/g) || []).length));
  const served = await (await fetch(API + "/admin/sitemap-abu-dhabi")).text();
  check("/admin/sitemap-abu-dhabi serves it", served.includes(`/abu-dhabi/property/${PROP}/`));

  // Moving the area to Dubai moves its property
  const area = await Community.findOne({ slug: AREA });
  area.emirate = "Dubai"; await area.save();
  check("changing area emirate updates its properties", (await Property.findOne({ property_name_slug: PROP }).lean()).emirate === "Dubai");

  await cleanup();
  await generateSitemap();
  const restored = (await Sitemap.findOne(Sitemap.ABU_DHABI).lean()).content;
  // Empty again, unless other zz-test rows are in the dev db: then only their
  // URLs and the section pages they fill may remain.
  const otherTestRows =
    (await Property.countDocuments({ property_name_slug: /^zz-test-/, emirate: "Abu Dhabi" })) +
    (await Community.countDocuments({ slug: /^zz-test-/, emirate: "Abu Dhabi" }));
  const sectionPages = new Set(["/abu-dhabi/", "/abu-dhabi/areas/", "/abu-dhabi/developers/", "/off-plan-projects-for-sale-in-abu-dhabi/", "/apartments-for-sale-in-abu-dhabi/", "/villas-for-sale-in-abu-dhabi/"]);
  const restoredLocs = [...restored.matchAll(/<loc>([^<]+)/g)].map((m) => m[1].replace("https://www.xrealty.ae", ""));
  check(
    "cleanup: AD sitemap empty again (apart from other zz-test rows)",
    otherTestRows === 0
      ? restoredLocs.length === 0
      : restoredLocs.every((u) => sectionPages.has(u) || u.includes("/zz-test-") || [...testOnlyDevs].some((d) => u === `/developer/${d}/`)),
    JSON.stringify(restoredLocs)
  );
  await mongoose.disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); await cleanup().catch(() => {}); process.exit(1); });
