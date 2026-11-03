/**
 * Create the unique index on live property slugs per emirate (issue #163).
 *
 *   node scripts/createPropertySlugIndex.js                  dry run against TEST_DB_URL
 *   node scripts/createPropertySlugIndex.js --apply          create on TEST_DB_URL
 *   node scripts/createPropertySlugIndex.js --live           dry run against DB_URL (production)
 *   node scripts/createPropertySlugIndex.js --live --apply   create on production
 *
 * Run it only after scripts/backfillEmirate.js has been applied to the same
 * database. The index spec and the checks are in utils/propertySlugIndex.js.
 *
 * - Refuses when a live property has no emirate (run the backfill first).
 * - Refuses when two live properties share a slug in one emirate.
 * - Reports hidden duplicates; they do not block the partial index.
 * - Does nothing when the index already exists.
 *
 * Only ever creates this one index; touches no document and deletes nothing.
 * Exits non-zero when it refuses. Reads vars/.env relative to this file (not
 * the working directory), and prints the target database before doing anything.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../vars/.env") });
const mongoose = require("mongoose");
const {
  PROPERTY_SLUG_INDEX,
  checkPropertySlugIndex,
  createPropertySlugIndex,
} = require("../utils/propertySlugIndex");

const APPLY = process.argv.includes("--apply");
const LIVE = process.argv.includes("--live");
const url = LIVE ? process.env.DB_URL : process.env.TEST_DB_URL;
if (!url) {
  console.error(`${LIVE ? "DB_URL" : "TEST_DB_URL"} is not set in vars/.env`);
  process.exit(1);
}

(async () => {
  await mongoose.connect(url);
  const db = mongoose.connection.db;
  console.log(
    `Target database: ${db.databaseName} (${LIVE ? "LIVE" : "test"}) — ${
      APPLY ? "APPLYING CHANGES" : "dry run, nothing will be written"
    }`
  );
  console.log(
    `Index: ${PROPERTY_SLUG_INDEX.name} ${JSON.stringify(
      PROPERTY_SLUG_INDEX.key
    )}, unique, partial ${JSON.stringify(
      PROPERTY_SLUG_INDEX.partialFilterExpression
    )}`
  );

  const properties = db.collection("properties");
  const { report, created } = APPLY
    ? await createPropertySlugIndex(properties)
    : { report: await checkPropertySlugIndex(properties), created: false };

  if (report.existing) {
    console.log(
      report.existingMatches
        ? "The index already exists. Nothing to do."
        : `An index with this name exists with a different spec: ${JSON.stringify(
            report.existing
          )}`
    );
  } else {
    console.log(
      `Live properties without an emirate: ${report.liveWithoutEmirate.length}`
    );
    for (const id of report.liveWithoutEmirate) console.log(`  ${id}`);
    console.log(
      `Live duplicate slugs per emirate: ${report.liveDuplicates.length}`
    );
    for (const d of report.liveDuplicates) {
      console.log(`  ${d.emirate}|${d.slug}: ${d.ids.join(", ")}`);
    }
    console.log(
      `Hidden duplicate slugs per emirate (do not block the index): ${report.hiddenDuplicates.length}`
    );
    for (const d of report.hiddenDuplicates) {
      console.log(
        `  ${d.emirate}|${d.slug}: ${d.ids.join(", ")} (${d.live} live)`
      );
    }
  }

  if (report.blockers.length) {
    console.log("REFUSED:");
    for (const b of report.blockers) console.log(`  ${b}`);
    process.exitCode = 1;
  } else if (created) {
    console.log(`Created index ${PROPERTY_SLUG_INDEX.name}.`);
  } else if (!report.existing) {
    console.log("All checks pass. Run again with --apply to create the index.");
  }

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
