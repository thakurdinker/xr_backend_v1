/**
 * The database rule behind "a property slug is unique within its emirate"
 * (issue #163).
 *
 * The code checks (findSlugClash in controller/propertiesController.js and
 * Community.findAreaMoveClashes in models/community.js) run before the write,
 * so two concurrent requests can both pass them. This unique index closes that
 * gap: the second write fails with a duplicate-key error (E11000).
 *
 * The index is partial: it covers only live properties (show_property: true),
 * because only they own a public URL (routes/propertyPage.js). Hidden
 * duplicates do not block it.
 *
 * The index is NOT declared in the Property schema. Mongoose autoIndex would
 * build it at the next boot, before the emirate backfill. A missing emirate
 * and "Dubai" are different index keys, so the index needs the backfill first.
 * scripts/createPropertySlugIndex.js creates it as a planned step.
 */
const { isDeepStrictEqual } = require("util");

const PROPERTY_SLUG_INDEX = {
  name: "uniq_live_property_slug_per_emirate",
  key: { emirate: 1, property_name_slug: 1 },
  partialFilterExpression: {
    show_property: true,
    emirate: { $type: "string" },
    property_name_slug: { $type: "string" },
  },
};

// The duplicate-key error a write gets from this index. Duplicate keys on
// other unique indexes (for example `order`) return false.
const isSlugDuplicateKey = (error) =>
  error?.code === 11000 && Boolean(error.keyPattern?.property_name_slug);

const sameSpec = (index) =>
  index.unique === true &&
  isDeepStrictEqual(index.key, PROPERTY_SLUG_INDEX.key) &&
  isDeepStrictEqual(
    index.partialFilterExpression,
    PROPERTY_SLUG_INDEX.partialFilterExpression
  );

const listIndexes = async (collection) => {
  try {
    return await collection.indexes();
  } catch (err) {
    if (err?.code === 26) return []; // NamespaceNotFound: no collection yet
    throw err;
  }
};

/**
 * Read-only check of the properties collection before the index build.
 * Returns:
 *   existing            the index with our name, or null
 *   existingMatches     true when that index has the expected spec
 *   liveWithoutEmirate  ids of live properties with no emirate string
 *   liveDuplicates      [{ emirate, slug, ids }] with 2+ live properties
 *   hiddenDuplicates    [{ emirate, slug, ids, live }] with 2+ properties but
 *                       at most one live (they do not block the index)
 *   blockers            the reasons to refuse (empty = safe to create)
 *
 * Slugs compare exactly (no trim, no lowercase), as the index and the public
 * route do.
 */
async function checkPropertySlugIndex(collection) {
  const existing =
    (await listIndexes(collection)).find(
      (i) => i.name === PROPERTY_SLUG_INDEX.name
    ) || null;
  const report = {
    existing,
    existingMatches: existing ? sameSpec(existing) : false,
    liveWithoutEmirate: [],
    liveDuplicates: [],
    hiddenDuplicates: [],
    blockers: [],
  };
  if (existing) {
    if (!report.existingMatches) {
      report.blockers.push(
        `An index named ${PROPERTY_SLUG_INDEX.name} exists with a different spec. Review it by hand.`
      );
    }
    return report; // already created: nothing else to check
  }

  report.liveWithoutEmirate = (
    await collection
      .find(
        { show_property: true, emirate: { $not: { $type: "string" } } },
        { projection: { _id: 1 } }
      )
      .toArray()
  ).map((p) => p._id);
  if (report.liveWithoutEmirate.length) {
    report.blockers.push(
      `${report.liveWithoutEmirate.length} live properties have no emirate. Run scripts/backfillEmirate.js first.`
    );
  }

  const groups = await collection
    .aggregate([
      {
        $match: {
          emirate: { $type: "string" },
          property_name_slug: { $type: "string" },
        },
      },
      {
        $group: {
          _id: { emirate: "$emirate", slug: "$property_name_slug" },
          ids: { $push: "$_id" },
          live: { $sum: { $cond: [{ $eq: ["$show_property", true] }, 1, 0] } },
        },
      },
      { $match: { "ids.1": { $exists: true } } },
      { $sort: { "_id.emirate": 1, "_id.slug": 1 } },
    ])
    .toArray();
  for (const g of groups) {
    const row = { emirate: g._id.emirate, slug: g._id.slug, ids: g.ids };
    if (g.live > 1) report.liveDuplicates.push(row);
    else report.hiddenDuplicates.push({ ...row, live: g.live });
  }
  if (report.liveDuplicates.length) {
    report.blockers.push(
      `${report.liveDuplicates.length} slugs are used by more than one live property in one emirate. Resolve them with the SEO team first.`
    );
  }
  return report;
}

/**
 * Runs the check, then creates the index when nothing blocks it. Never changes
 * documents. Returns { report, created } (created = false on a refusal and
 * when the index already exists).
 */
async function createPropertySlugIndex(collection) {
  const report = await checkPropertySlugIndex(collection);
  if (report.existing || report.blockers.length) {
    return { report, created: false };
  }
  await collection.createIndex(PROPERTY_SLUG_INDEX.key, {
    name: PROPERTY_SLUG_INDEX.name,
    unique: true,
    partialFilterExpression: PROPERTY_SLUG_INDEX.partialFilterExpression,
  });
  return { report, created: true };
}

module.exports = {
  PROPERTY_SLUG_INDEX,
  isSlugDuplicateKey,
  checkPropertySlugIndex,
  createPropertySlugIndex,
};
