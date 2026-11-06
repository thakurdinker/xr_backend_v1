// Demo Abu Dhabi data in the DEV db: clones of a real Dubai area + property,
// labelled (TEST).  node seed-ad-demo.js        -> create
//                   node seed-ad-demo.js --rm   -> remove
process.env.MAIN_FRONTEND_URL = "http://127.0.0.1:9";
const path = require("path");
const BE = path.resolve(__dirname, "../..");
require(path.join(BE, "node_modules/dotenv")).config({ path: path.join(BE, "vars/.env") });
const mongoose = require(path.join(BE, "node_modules/mongoose"));
const Community = require(path.join(BE, "models/community"));
const Property = require(path.join(BE, "models/properties"));
const { generateSitemap } = require(path.join(BE, "utils/generateSitemap/generateSitemap"));

const url = process.env.TEST_DB_URL;
if ((url.split("/").pop() || "").split("?")[0] !== "xrealty_website_dev_backend") throw new Error("REFUSING: not dev db");
const AREA = "zz-test-saadiyat-island";
const PROP = "zz-test-saadiyat-residences";

(async () => {
  await mongoose.connect(url);
  await Property.deleteMany({ property_name_slug: PROP });
  await Community.deleteMany({ slug: AREA });
  if (!process.argv.includes("--rm")) {
    const srcArea = await Community.findOne({ slug: "dubai-marina" }).lean();
    const { _id, createdAt, updatedAt, __v, ...areaFields } = srcArea;
    await new Community({
      ...areaFields, name: "Saadiyat Island (TEST)", slug: AREA, emirate: "Abu Dhabi",
      description: "TEST DATA — demo Abu Dhabi area cloned from Dubai Marina for the Phase 0 preview.",
      schema_org: undefined, seo: { meta_title: "", meta_description: "" },
    }).save();

    const srcProp = await Property.findOne({ property_name_slug: "the-yards-plaza-by-beyond", show_property: true }).lean();
    const { _id: pid, createdAt: c2, updatedAt: u2, __v: v2, ...propFields } = srcProp;
    const maxOrder = (await Property.findOne().sort({ order: -1 }).select("order").lean())?.order || 0;
    await new Property({
      ...propFields, property_name: "Saadiyat Residences (TEST)", property_name_slug: PROP,
      community_name: "Saadiyat Island (TEST)", community_name_slug: AREA,
      featured: false, show_slideShow: false, order: maxOrder + 1000,
      seo: { ...(propFields.seo || {}), meta_title: "", meta_description: "" }, schema_org: undefined,
    }).save();
  }
  await generateSitemap();
  await mongoose.disconnect();
  console.log(process.argv.includes("--rm") ? "demo data removed" : `created /abu-dhabi/areas/${AREA}/ and /abu-dhabi/property/${PROP}/`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
