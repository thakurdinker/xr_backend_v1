/**
 * Backfill the `emirate` field (Abu Dhabi expansion, Phase 0).
 *
 *   node scripts/backfillEmirate.js                  dry run against TEST_DB_URL
 *   node scripts/backfillEmirate.js --apply          write to TEST_DB_URL
 *   node scripts/backfillEmirate.js --live           dry run against DB_URL (production)
 *   node scripts/backfillEmirate.js --live --apply   write to production
 *
 * - Every community without an emirate is set to Dubai.
 * - Every property gets its community's emirate (Dubai when the community has
 *   no Mongo record, e.g. Strapi-only areas).
 * - Reports duplicate property slugs per emirate and properties whose
 *   community has no Mongo record, for review before applying.
 *
 * Only ever $sets `emirate`; touches no other field and deletes nothing.
 * Reads vars/.env relative to this file (not the working directory), and
 * prints the target database before doing anything.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../vars/.env") });
const mongoose = require("mongoose");
const { DUBAI, emirateOf } = require("../utils/emirate");

const APPLY = process.argv.includes("--apply");
const LIVE = process.argv.includes("--live");
const url = LIVE ? process.env.DB_URL : process.env.TEST_DB_URL;
if (!url) {
  console.error(`${LIVE ? "DB_URL" : "TEST_DB_URL"} is not set in vars/.env`);
  process.exit(1);
}

const normalise = (s) => (s || "").trim().toLowerCase();

(async () => {
  await mongoose.connect(url);
  const db = mongoose.connection.db;
  console.log(
    `Target database: ${db.databaseName} (${LIVE ? "LIVE" : "test"}) — ${
      APPLY ? "APPLYING CHANGES" : "dry run, nothing will be written"
    }`
  );

  const communities = db.collection("communities");
  const properties = db.collection("properties");

  // 1. Communities without an emirate → Dubai.
  const missing = await communities.countDocuments({ emirate: { $exists: false } });
  console.log(`Communities without an emirate: ${missing} → ${DUBAI}`);
  if (APPLY && missing) {
    await communities.updateMany(
      { emirate: { $exists: false } },
      { $set: { emirate: DUBAI } }
    );
  }

  // 2. Properties inherit their community's emirate.
  const emirateBySlug = new Map(
    (await communities.find({}, { projection: { slug: 1, emirate: 1 } }).toArray())
      .map((c) => [normalise(c.slug), emirateOf(c)])
  );
  const all = await properties
    .find({}, { projection: { property_name_slug: 1, community_name_slug: 1, emirate: 1, show_property: 1 } })
    .toArray();

  const updates = [];
  const orphans = new Map();
  for (const p of all) {
    const key = normalise(p.community_name_slug);
    if (!emirateBySlug.has(key)) orphans.set(key, (orphans.get(key) || 0) + 1);
    const emirate = emirateBySlug.get(key) || DUBAI;
    if (p.emirate !== emirate) {
      updates.push({ updateOne: { filter: { _id: p._id }, update: { $set: { emirate } } } });
    }
  }
  console.log(`Properties to update: ${updates.length} of ${all.length}`);
  if (APPLY && updates.length) await properties.bulkWrite(updates, { ordered: false });

  // 3. Review items.
  if (orphans.size) {
    console.log("Properties whose community has no Mongo record (treated as Dubai):");
    for (const [slug, n] of orphans) console.log(`  ${slug || "(empty)"}: ${n}`);
  }
  const seen = new Map();
  for (const p of all) {
    const key = `${emirateBySlug.get(normalise(p.community_name_slug)) || DUBAI}|${normalise(p.property_name_slug)}`;
    seen.set(key, [...(seen.get(key) || []), p]);
  }
  for (const [key, list] of seen) {
    if (list.length > 1) {
      console.log(
        `Duplicate property slug ${key}: ${list
          .map((p) => `${p._id}${p.show_property ? " (live)" : " (hidden)"}`)
          .join(", ")}`
      );
    }
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
