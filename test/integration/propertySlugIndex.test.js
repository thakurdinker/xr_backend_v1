// Real-MongoDB tests for the unique property slug index and the area-move
// transaction (issue #163). They run the real models and admin handlers.
//
// Opt-in: `npm test` skips this file unless MONGOD_URL is set. MONGOD_URL must
// point at a LOCAL single-node replica set (transactions need one). The test
// drops and recreates its own database, xr_slug_index_it, on that server.
//
// Start a throwaway server (any free port; macOS mongod cannot --fork):
//   mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27391 --dbpath <empty dir>
//   then run replSetInitiate once, for example with mongosh:
//   mongosh --port 27391 --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27391"}]})'
// Run:
//   MONGOD_URL='mongodb://127.0.0.1:27391/?replicaSet=rs0' node --test test/integration/
const { describe, test, before, after, beforeEach, afterEach, mock } =
  require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Community = require("../../models/community");
const Property = require("../../models/properties");
const { updateCommunity } = require("../../controller/communityController");
const {
  createProperty,
} = require("../../controller/propertiesController");
const {
  PROPERTY_SLUG_INDEX,
  checkPropertySlugIndex,
  createPropertySlugIndex,
} = require("../../utils/propertySlugIndex");

const MONGOD_URL = process.env.MONGOD_URL;
const DB_NAME = "xr_slug_index_it";
const LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/;
const skip = !MONGOD_URL
  ? "set MONGOD_URL to a local replica set to run"
  : !LOCAL.test(MONGOD_URL)
  ? "MONGOD_URL must be a local server (127.0.0.1 or localhost)"
  : false;

const SLUG_CLASH_MESSAGE =
  "A property with this slug already exists in this emirate. Choose a different slug.";

// catchAsync does not return the handler's promise, so wait for the response.
const call = (handler, req) =>
  new Promise((resolve, reject) => {
    const res = {
      status() {
        return this;
      },
      json(payload) {
        resolve(payload);
        return this;
      },
    };
    handler(req, res, reject);
  });

let other; // a second connection: a concurrent writer outside the transaction
let nextOrder = 1;

// Raw inserts: no hooks, so each row is stored exactly as written here.
const insertArea = async (slug, emirate) =>
  (await Community.collection.insertOne({ slug, name: slug, emirate }))
    .insertedId;
const propertyRow = (slug, area, emirate, live = true) => ({
  property_name: slug,
  property_name_slug: slug,
  community_name_slug: area,
  ...(emirate ? { emirate } : {}),
  show_property: live,
  order: nextOrder++,
});
const insertProperty = (...args) =>
  Property.collection.insertOne(propertyRow(...args));

const emirates = async (filter) =>
  (await Property.find(filter, "property_name_slug emirate", { lean: true }))
    .map((p) => `${p.property_name_slug}:${p.emirate}`)
    .sort();
const areaEmirate = async (id) =>
  (await Community.findById(id, "emirate", { lean: true })).emirate;
const dropSlugIndex = () =>
  Property.collection.dropIndex(PROPERTY_SLUG_INDEX.name).catch(() => {});

describe("property slug index (real MongoDB)", { skip }, () => {
  before(async () => {
    await mongoose.connect(MONGOD_URL, { dbName: DB_NAME });
    await mongoose.connection.dropDatabase();
    // autoIndex builds the schema indexes (order, community slug) here.
    await Promise.all([Community.init(), Property.init()]);
    other = await mongoose
      .createConnection(MONGOD_URL, { dbName: DB_NAME })
      .asPromise();
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await other.close();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([
      Community.collection.deleteMany({}),
      Property.collection.deleteMany({}),
    ]);
    await dropSlugIndex();
  });

  afterEach(() => mock.restoreAll());

  // Abu Dhabi area "saadiyat" with two properties; Dubai area "jvc".
  const seedMove = async () => {
    const saadiyat = await insertArea("saadiyat", "Abu Dhabi");
    await insertArea("jvc", "Dubai");
    await insertProperty("saadiyat-grove", "saadiyat", "Abu Dhabi");
    await insertProperty("shared-project", "saadiyat", "Abu Dhabi");
    await insertProperty("jvc-heights", "jvc", "Dubai");
    return saadiyat;
  };
  const SAADIYAT_UNMOVED = [
    "saadiyat-grove:Abu Dhabi",
    "shared-project:Abu Dhabi",
  ];
  const moveToDubai = (id) =>
    call(updateCommunity, {
      params: { id: String(id) },
      body: { emirate: "Dubai" },
    });

  // ── (a) ──────────────────────────────────────────────────────────
  test("(a) a sequential clash rejects the move and changes nothing", async () => {
    const saadiyat = await seedMove();
    await insertProperty("shared-project", "jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);

    const body = await moveToDubai(saadiyat);

    assert.equal(body.success, false);
    assert.equal(
      body.message,
      Community.areaMoveClashMessage("Dubai", ["shared-project"])
    );
    assert.equal(await areaEmirate(saadiyat), "Abu Dhabi");
    assert.deepEqual(
      await emirates({ community_name_slug: "saadiyat" }),
      SAADIYAT_UNMOVED
    );
  });

  // ── (b) ──────────────────────────────────────────────────────────
  test("(b) a clean move moves exactly the area's properties", async () => {
    const saadiyat = await seedMove();
    await insertArea("yas-island", "Abu Dhabi");
    await insertProperty("yas-acres", "yas-island", "Abu Dhabi");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);

    const body = await moveToDubai(saadiyat);

    assert.equal(body.success, true, body.message);
    assert.equal(await areaEmirate(saadiyat), "Dubai");
    assert.deepEqual(await emirates({}), [
      "jvc-heights:Dubai",
      "saadiyat-grove:Dubai",
      "shared-project:Dubai",
      "yas-acres:Abu Dhabi",
    ]);
  });

  // ── (c) ──────────────────────────────────────────────────────────
  test("(c) a live property inserted during the move rolls the move back", async () => {
    const saadiyat = await seedMove();
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);

    // After the last clash check (pre-save) and before the property move
    // (post-save), a second connection inserts a live Dubai property with one
    // of the area's slugs. This is the window from the #162 review.
    const realUpdateOne = Community.collection.updateOne;
    let areaWrites = 0;
    let inserted = false;
    mock.method(
      Community.collection,
      "updateOne",
      async function (...args) {
        areaWrites += 1;
        if (!inserted) {
          inserted = true;
          await other
            .collection("properties")
            .insertOne(propertyRow("shared-project", "jvc", "Dubai"));
        }
        return realUpdateOne.apply(this, args);
      }
    );

    const started = Date.now();
    const body = await moveToDubai(saadiyat);
    const ms = Date.now() - started;
    console.log(`(c) area write attempts: ${areaWrites}, took ${ms} ms`);

    assert.equal(inserted, true);
    assert.equal(body.success, false);
    assert.equal(
      body.message,
      Community.areaMoveClashMessage("Dubai", ["shared-project"])
    );
    assert.equal(await areaEmirate(saadiyat), "Abu Dhabi");
    assert.deepEqual(
      await emirates({ community_name_slug: "saadiyat" }),
      SAADIYAT_UNMOVED
    );
    assert.ok(ms < 10000, `took ${ms} ms: stuck in transaction retries?`);
  });

  test("(c) a duplicate key in the post-save move rejects save() and aborts the transaction", async () => {
    const saadiyat = await seedMove();
    await insertProperty("shared-project", "jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);
    // Bypass both code checks, so only the index can stop the move. The
    // area's first property ("saadiyat-grove") has no clash: without the
    // transaction, updateMany would move it before it fails on the second.
    mock.method(Community, "findAreaMoveClashes", async () => []);
    let saveError;
    const realTransaction = mongoose.connection.transaction;
    mock.method(mongoose.connection, "transaction", function (fn, options) {
      return realTransaction.call(this, async (session) => {
        try {
          return await fn(session);
        } catch (err) {
          saveError = err;
          throw err;
        }
      }, options);
    });

    const body = await moveToDubai(saadiyat);

    console.log(
      `(c) error from save(): code ${saveError?.code}, keyValue ${JSON.stringify(
        saveError?.keyValue
      )}`
    );
    assert.equal(saveError?.code, 11000);
    assert.deepEqual(saveError.keyPattern, PROPERTY_SLUG_INDEX.key);
    assert.equal(body.success, false);
    assert.equal(
      body.message,
      Community.areaMoveClashMessage("Dubai", ["shared-project"])
    );
    assert.equal(await areaEmirate(saadiyat), "Abu Dhabi");
    assert.deepEqual(
      await emirates({ community_name_slug: "saadiyat" }),
      SAADIYAT_UNMOVED
    );
  });

  test("(c) control: without a transaction the index stops the move halfway", async () => {
    const saadiyat = await seedMove();
    await insertProperty("shared-project", "jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);
    mock.method(Community, "findAreaMoveClashes", async () => []);

    // A save outside a transaction, as before this change.
    const area = await Community.findById(saadiyat);
    area.emirate = "Dubai";
    await assert.rejects(area.save(), { code: 11000 });

    // The area moved and one property moved: the state the transaction
    // prevents.
    assert.equal(await areaEmirate(saadiyat), "Dubai");
    assert.deepEqual(await emirates({ community_name_slug: "saadiyat" }), [
      "saadiyat-grove:Dubai",
      "shared-project:Abu Dhabi",
    ]);
  });

  test("(c) a transaction retry starts again from the stored area", async () => {
    const saadiyat = await seedMove();
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);

    // On the first area write, a second connection edits the same area. The
    // transaction's write then gets a WriteConflict (TransientTransactionError)
    // and transaction() runs the callback again.
    const realUpdateOne = Community.collection.updateOne;
    let areaWrites = 0;
    mock.method(
      Community.collection,
      "updateOne",
      async function (...args) {
        areaWrites += 1;
        if (areaWrites === 1) {
          await other
            .collection("communities")
            .updateOne({ _id: saadiyat }, { $set: { description: "edited" } });
        }
        return realUpdateOne.apply(this, args);
      }
    );

    // A slug change too: the retry must still move the properties on the
    // old slug.
    const body = await call(updateCommunity, {
      params: { id: String(saadiyat) },
      body: { slug: "saadiyat-island", emirate: "Dubai" },
    });

    assert.equal(areaWrites, 2, "expected one retry");
    assert.equal(body.success, true, body.message);
    const area = await Community.findById(saadiyat, null, { lean: true });
    assert.equal(area.slug, "saadiyat-island");
    assert.equal(area.emirate, "Dubai");
    assert.equal(area.description, "edited"); // the retry reloaded the area
    assert.deepEqual(await emirates({ community_name_slug: "saadiyat" }), [
      "saadiyat-grove:Dubai",
      "shared-project:Dubai",
    ]);
  });

  // ── (d) ──────────────────────────────────────────────────────────
  test("(d) two concurrent creates with one slug: exactly one succeeds", async () => {
    await insertArea("jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);

    // Hold each request after its slug check (findSlugClash) until both have
    // checked. Both see a free slug; only the index can stop the second save.
    const realFindOne = Property.findOne;
    let checked = 0;
    let release;
    const bothChecked = new Promise((resolve) => (release = resolve));
    mock.method(Property, "findOne", function (filter, ...rest) {
      const query = realFindOne.call(this, filter, ...rest);
      if (!filter || !("property_name_slug" in filter)) return query;
      return {
        select: (...fields) => ({
          lean: async () => {
            const found = await query.select(...fields).lean();
            if (++checked === 2) release();
            await bothChecked;
            return found;
          },
        }),
      };
    });

    const create = (order) =>
      call(createProperty, {
        body: {
          property_name: "Race Tower",
          property_name_slug: "race-tower",
          community_name_slug: "jvc",
          show_property: true,
          order,
        },
      });
    const results = await Promise.all([create(101), create(102)]);

    assert.equal(checked, 2);
    assert.deepEqual(results.map((r) => r.success).sort(), [false, true]);
    assert.equal(results.find((r) => !r.success).message, SLUG_CLASH_MESSAGE);
    assert.equal(
      await Property.countDocuments({ property_name_slug: "race-tower" }),
      1
    );
  });

  // ── (e) ──────────────────────────────────────────────────────────
  test("(e) a create at a taken order still shifts the others", async () => {
    await insertArea("jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);
    await Property.collection.insertOne({
      ...propertyRow("first", "jvc", "Dubai"),
      order: 500,
    });

    const body = await call(createProperty, {
      body: {
        property_name_slug: "second",
        community_name_slug: "jvc",
        show_property: true,
        order: 500,
      },
    });

    assert.equal(body.success, true, body.message);
    const orders = await Property.find({}, "property_name_slug order", {
      lean: true,
    }).sort({ order: 1 });
    assert.deepEqual(
      orders.map((p) => `${p.property_name_slug}:${p.order}`),
      ["second:500", "first:501"]
    );
  });

  test("(e) a duplicate key on order keeps the raw error message", async () => {
    await insertArea("jvc", "Dubai");
    assert.equal((await createPropertySlugIndex(Property.collection)).created, true);
    await Property.collection.insertOne({
      ...propertyRow("first", "jvc", "Dubai"),
      order: 600,
    });
    // Skip the order shift (as a concurrent create would), so the save hits
    // the `order` unique index.
    const realFindOne = Property.findOne;
    mock.method(Property, "findOne", function (filter, ...rest) {
      if (filter && "order" in filter) return realFindOne.call(this, { _id: null });
      return realFindOne.call(this, filter, ...rest);
    });

    const body = await call(createProperty, {
      body: {
        property_name_slug: "second",
        community_name_slug: "jvc",
        show_property: true,
        order: 600,
      },
    });

    assert.equal(body.success, false);
    assert.match(body.message, /^E11000 duplicate key error.*order/);
    assert.notEqual(body.message, SLUG_CLASH_MESSAGE);
    assert.equal(await Property.countDocuments({}), 1);
  });

  // ── (f) ──────────────────────────────────────────────────────────
  test("(f) the index script: checks, apply, and a second run", async () => {
    const properties = Property.collection;
    await insertProperty("hidden-twin", "jvc", "Dubai", false);
    await insertProperty("hidden-twin", "jvc", "Dubai", false);
    await insertProperty("same-slug", "jvc", "Dubai");
    await insertProperty("same-slug", "saadiyat", "Abu Dhabi"); // other emirate

    // Hidden duplicates are reported only.
    let report = await checkPropertySlugIndex(properties);
    assert.deepEqual(report.blockers, []);
    assert.deepEqual(
      report.hiddenDuplicates.map((d) => [d.emirate, d.slug, d.ids.length]),
      [["Dubai", "hidden-twin", 2]]
    );

    // A live duplicate in one emirate refuses.
    const liveTwin = await insertProperty("same-slug", "downtown", "Dubai");
    let run = await createPropertySlugIndex(properties);
    assert.equal(run.created, false);
    assert.deepEqual(
      run.report.liveDuplicates.map((d) => [d.emirate, d.slug]),
      [["Dubai", "same-slug"]]
    );
    await properties.deleteOne({ _id: liveTwin.insertedId });

    // A live property without an emirate refuses (backfill not run).
    const legacy = await insertProperty("legacy", "jvc", undefined);
    run = await createPropertySlugIndex(properties);
    assert.equal(run.created, false);
    assert.deepEqual(run.report.liveWithoutEmirate, [legacy.insertedId]);
    assert.match(run.report.blockers[0], /backfillEmirate/);
    // A hidden property without an emirate does not.
    await properties.updateOne(
      { _id: legacy.insertedId },
      { $set: { show_property: false } }
    );

    // --apply creates it.
    run = await createPropertySlugIndex(properties);
    assert.equal(run.created, true);
    const index = (await properties.indexes()).find(
      (i) => i.name === PROPERTY_SLUG_INDEX.name
    );
    assert.deepEqual(index.key, PROPERTY_SLUG_INDEX.key);
    assert.equal(index.unique, true);
    assert.deepEqual(
      index.partialFilterExpression,
      PROPERTY_SLUG_INDEX.partialFilterExpression
    );

    // A second run is a no-op.
    run = await createPropertySlugIndex(properties);
    assert.equal(run.created, false);
    assert.equal(run.report.existingMatches, true);
    assert.deepEqual(run.report.blockers, []);

    // The index refuses a live duplicate and allows a hidden one.
    await assert.rejects(insertProperty("same-slug", "downtown", "Dubai"), {
      code: 11000,
    });
    await insertProperty("same-slug", "downtown", "Dubai", false);
  });
});
