// Frontend Abu Dhabi routing test: local Next (:3100) + local backend + DEV db.
// Inserts zz-test-* docs via the real models, checks pages, then deletes them.
//
// Pages are cached by Next (ISR), so the test refreshes each path through the
// site's /api/revalidate before it fetches it. Start Next with
// REVALIDATE_SECRET=<any value> and run this script with the same value in
// FE_REVALIDATE_SECRET.
process.env.MAIN_FRONTEND_URL = "http://127.0.0.1:9";
const path = require("path");
const BE = path.resolve(__dirname, "../..");
require(path.join(BE, "node_modules/dotenv")).config({ path: path.join(BE, "vars/.env") });
const mongoose = require(path.join(BE, "node_modules/mongoose"));
const Community = require(path.join(BE, "models/community"));
const Property = require(path.join(BE, "models/properties"));
const { generateSitemap } = require(path.join(BE, "utils/generateSitemap/generateSitemap"));

const FE = "http://localhost:3100";
const url = process.env.TEST_DB_URL;
if ((url.split("/").pop() || "").split("?")[0] !== "xrealty_website_dev_backend") throw new Error("REFUSING: not dev db");
const AREA = "zz-test-saadiyat", PROP = "zz-test-ad-project";
let pass = 0, fail = 0;
const check = (n, ok, x = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${x ? "  — " + x : ""}`); };
const SECRET = process.env.FE_REVALIDATE_SECRET;
if (!SECRET) throw new Error("Set FE_REVALIDATE_SECRET to the REVALIDATE_SECRET the local Next server runs with (see the header comment)");
const revalidate = async (p) => {
  const r = await fetch(FE + "/api/revalidate/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: SECRET, path: p }) });
  if (!r.ok) throw new Error(`revalidate ${p} failed: ${r.status} ${await r.text()}`);
};
const page = async (p) => { await revalidate(p); const r = await fetch(FE + p, { redirect: "manual" }); return { status: r.status, html: await r.text() }; };
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
const cleanup = async () => { await Property.deleteMany({ property_name_slug: PROP }); await Community.deleteMany({ slug: AREA }); };

(async () => {
  await mongoose.connect(url);
  await cleanup();
  await new Community({ name: "ZZ Test Saadiyat", slug: AREA, emirate: "Abu Dhabi", description: "Test area" }).save();
  const maxOrder = (await Property.findOne().sort({ order: -1 }).select("order").lean())?.order || 0;
  await new Property({ property_name: "ZZ Test AD Project", property_name_slug: PROP, community_name: "ZZ Test Saadiyat",
    community_name_slug: AREA, developer: "Emaar", developer_name_slug: "emaar-properties", show_property: true,
    price: "AED 2,000,000", type: [{ name: "apartments", bedrooms: "1" }], order: maxOrder + 1000 }).save();
  await generateSitemap();

  const ap = await page(`/abu-dhabi/property/${PROP}/`);
  check("AD property page renders", ap.status === 200, String(ap.status));
  check("AD property canonical", canonical(ap.html)?.endsWith(`/abu-dhabi/property/${PROP}/`), canonical(ap.html));
  const bc = ld(ap.html).find((j) => j["@type"] === "BreadcrumbList");
  check("AD property breadcrumb Home > Abu Dhabi > Area > Project",
    JSON.stringify(bc?.itemListElement.map((i) => i.name)) === JSON.stringify(["Home", "Abu Dhabi", "ZZ Test Saadiyat", "ZZ Test AD Project"]),
    JSON.stringify(bc?.itemListElement.map((i) => [i.name, i.item])));
  const listing = ld(ap.html).find((j) => j["@type"] === "RealEstateListing");
  check("AD property schema url (SITE_URL is localhost in .env.local)", listing?.url?.endsWith(`/abu-dhabi/property/${PROP}/`), JSON.stringify(listing?.url));
  check("AD property not at Dubai URL (404)", (await page(`/property/${PROP}/`)).status === 404);
  check("Dubai property not at AD URL (404)", (await page("/abu-dhabi/property/the-yards-plaza-by-beyond/")).status === 404);

  const aa = await page(`/abu-dhabi/areas/${AREA}/`);
  check("AD area page renders", aa.status === 200, String(aa.status));
  check("AD area canonical", canonical(aa.html)?.endsWith(`/abu-dhabi/areas/${AREA}/`), canonical(aa.html));
  check("AD area links its property under /abu-dhabi/property/", aa.html.includes(`href="/abu-dhabi/property/${PROP}/"`));
  const abc = ld(aa.html).find((j) => j["@type"] === "BreadcrumbList");
  check("AD area breadcrumb Home > Abu Dhabi > Areas > Area",
    JSON.stringify(abc?.itemListElement.map((i) => i.name)) === JSON.stringify(["Home", "Abu Dhabi", "Areas", "Zz Test Saadiyat"]), JSON.stringify(abc?.itemListElement.map((i) => [i.name, i.item])));
  check("AD area title says Abu Dhabi", /Properties in Abu Dhabi/.test(aa.html));
  check("AD area not at Dubai URL (404)", (await page(`/area/${AREA}/`)).status === 404);
  check("Dubai area not at AD URL (404)", (await page("/abu-dhabi/areas/dubai-marina/")).status === 404);
  check("Strapi-only Dubai area not at AD URL (404)", (await page("/abu-dhabi/areas/dubai-hills-estate/")).status === 404);

  const dev = await page("/developer/emaar-properties/");
  check("developer page lists the AD project in its Abu Dhabi section", dev.html.includes('id="abu-dhabi-properties"') && dev.html.includes(`href="/abu-dhabi/property/${PROP}/"`));
  check("developer page never links the AD project at its Dubai URL", !dev.html.includes(`href="/property/${PROP}/"`));
  const landing = await page("/off-plan-projects-for-sale-in-abu-dhabi/");
  check("AD off-plan landing renders and links /abu-dhabi/property/", landing.status === 200 && landing.html.includes(`/abu-dhabi/property/${PROP}/`), String(landing.status));
  const dl = await page("/off-plan-projects-for-sale-in-dubai/");
  check("Dubai off-plan landing does not include the AD project", dl.status === 200 && !dl.html.includes(PROP));
  const sm = await page("/sitemap-abu-dhabi.xml");
  check("/sitemap-abu-dhabi.xml lists AD URLs", sm.status === 200 && sm.html.includes(`/abu-dhabi/property/${PROP}/`) && sm.html.includes(`/abu-dhabi/areas/${AREA}/`));
  const main = await page("/sitemap.xml");
  check("/sitemap.xml has no AD URLs", main.status === 200 && !main.html.includes("zz-test"));

  await cleanup();
  await generateSitemap();
  await mongoose.disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); await cleanup().catch(() => {}); process.exit(1); });
