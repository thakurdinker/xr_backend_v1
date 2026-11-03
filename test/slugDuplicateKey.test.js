// The unique slug index (issue #163) refuses a write that the code checks
// missed. The admin handlers must turn that duplicate-key error (E11000) into
// their usual slug message, and keep today's handling for other duplicate keys
// such as `order`. Also covers the index script's checks.
//
// No database: every model call the code makes is stubbed. The real-MongoDB
// version of these cases is in test/integration/ (opt-in).
//
// Run: node --test test/
const { test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const Community = require("../models/community");
const Property = require("../models/properties");
const {
  createProperty,
  updateProperty,
} = require("../controller/propertiesController");
const { updateCommunity } = require("../controller/communityController");
const {
  PROPERTY_SLUG_INDEX,
  isSlugDuplicateKey,
  checkPropertySlugIndex,
  createPropertySlugIndex,
} = require("../utils/propertySlugIndex");

const SLUG_CLASH_MESSAGE =
  "A property with this slug already exists in this emirate. Choose a different slug.";

// The errors the driver returns for the two unique indexes on properties.
const duplicateKey = (keyValue) =>
  Object.assign(
    new Error(
      `E11000 duplicate key error collection: test.properties dup key: ${JSON.stringify(keyValue)}`
    ),
    {
      code: 11000,
      keyPattern: Object.fromEntries(Object.keys(keyValue).map((k) => [k, 1])),
      keyValue,
    }
  );
const slugDuplicate = () =>
  duplicateKey({ emirate: "Dubai", property_name_slug: "jvc-heights" });
const orderDuplicate = () => duplicateKey({ order: 7 });

// A thenable stand-in for a Mongoose query (findOne().select().lean()).
const query = (value) => ({
  select() {
    return this;
  },
  lean() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

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

beforeEach(() => {
  // findSlugClash and the order lookup both find nothing: the code check
  // passes, as it does when a concurrent write lands after it.
  mock.method(Property, "emirateForCommunity", async () => "Dubai");
  mock.method(Property, "findOne", () => query(null));
});

afterEach(() => mock.restoreAll());

test("isSlugDuplicateKey matches only the slug index", () => {
  assert.equal(isSlugDuplicateKey(slugDuplicate()), true);
  assert.equal(isSlugDuplicateKey(orderDuplicate()), false);
  assert.equal(
    isSlugDuplicateKey(duplicateKey({ slug: "saadiyat" })), // community slug
    false
  );
  assert.equal(isSlugDuplicateKey(new Error("other")), false);
  assert.equal(isSlugDuplicateKey(undefined), false);
});

// ── createProperty / updateProperty ───────────────────────────────
const propertyBody = {
  property_name: "JVC Heights",
  property_name_slug: "jvc-heights",
  community_name_slug: "jvc",
  order: 7,
};

test("createProperty: a slug duplicate key returns the slug message", async () => {
  mock.method(Property.prototype, "save", async () => {
    throw slugDuplicate();
  });
  const body = await call(createProperty, { body: { ...propertyBody } });
  assert.deepEqual(body, {
    success: false,
    isCreated: false,
    message: SLUG_CLASH_MESSAGE,
  });
});

test("createProperty: an order duplicate key keeps the raw message", async () => {
  const error = orderDuplicate();
  mock.method(Property.prototype, "save", async () => {
    throw error;
  });
  const body = await call(createProperty, { body: { ...propertyBody } });
  assert.equal(body.success, false);
  assert.equal(body.message, error.message);
});

const loadProperty = () => {
  const property = Property.hydrate({
    _id: new mongoose.Types.ObjectId(),
    __v: 0,
    ...propertyBody,
    property_name_slug: "old-slug",
  });
  mock.method(Property, "findById", async () => property);
  return property;
};

test("updateProperty: a slug duplicate key returns the slug message", async () => {
  const property = loadProperty();
  mock.method(Property.prototype, "save", async () => {
    throw slugDuplicate();
  });
  const body = await call(updateProperty, {
    params: { id: String(property._id) },
    body: { property_name_slug: "jvc-heights", order: 7 },
  });
  assert.deepEqual(body, {
    success: false,
    isUpdated: false,
    message: SLUG_CLASH_MESSAGE,
  });
});

test("updateProperty: an order duplicate key keeps the raw message", async () => {
  const property = loadProperty();
  const error = orderDuplicate();
  mock.method(Property.prototype, "save", async () => {
    throw error;
  });
  const body = await call(updateProperty, {
    params: { id: String(property._id) },
    body: { property_name_slug: "jvc-heights", order: 7 },
  });
  assert.equal(body.success, false);
  assert.equal(body.message, error.message);
});

// ── updateCommunity ───────────────────────────────────────────────
test("updateCommunity: a slug duplicate key from the move names emirate and slug", async () => {
  const area = Community.hydrate({
    _id: new mongoose.Types.ObjectId(),
    __v: 0,
    slug: "saadiyat",
    emirate: "Abu Dhabi",
  });
  mock.method(Community, "findById", async () => area);
  mock.method(Property, "find", async () => []); // the checks see no clash
  mock.method(Community.collection, "updateOne", async () => ({
    acknowledged: true,
    matchedCount: 1,
    modifiedCount: 1,
  }));
  // A concurrent write took the slug: the move hits the unique index.
  mock.method(Property, "updateMany", async () => {
    throw slugDuplicate();
  });
  let transactions = 0;
  mock.method(mongoose.connection, "transaction", async (fn) => {
    transactions += 1;
    return fn(null);
  });

  const body = await call(updateCommunity, {
    params: { id: String(area._id) },
    body: { emirate: "Dubai" },
  });

  assert.equal(transactions, 1);
  assert.deepEqual(body, {
    success: false,
    isUpdated: false,
    message: Community.areaMoveClashMessage("Dubai", ["jvc-heights"]),
  });
});

// ── checkPropertySlugIndex / createPropertySlugIndex ──────────────
// A fake collection that returns canned server results. The aggregation
// pipeline itself runs against MongoDB in test/integration/.
const fakeCollection = ({ indexes = [], liveWithoutEmirate = [], groups = [] }) => {
  const calls = { createIndex: [] };
  return {
    calls,
    indexes: async () => indexes,
    find: () => ({ toArray: async () => liveWithoutEmirate.map((_id) => ({ _id })) }),
    aggregate: () => ({ toArray: async () => groups }),
    createIndex: async (key, options) => {
      calls.createIndex.push({ key, options });
      return options.name;
    },
  };
};
const group = (emirate, slug, ids, live) => ({
  _id: { emirate, slug },
  ids,
  live,
});

test("index check: hidden duplicates are reported but do not block", async () => {
  const collection = fakeCollection({
    groups: [
      group("Dubai", "the-heights", ["a", "b"], 0),
      group("Dubai", "one-live", ["c", "d"], 1),
    ],
  });
  const { report, created } = await createPropertySlugIndex(collection);
  assert.deepEqual(report.blockers, []);
  assert.deepEqual(
    report.hiddenDuplicates.map((d) => [d.slug, d.live]),
    [
      ["the-heights", 0],
      ["one-live", 1],
    ]
  );
  assert.equal(created, true);
  assert.deepEqual(collection.calls.createIndex, [
    {
      key: PROPERTY_SLUG_INDEX.key,
      options: {
        name: PROPERTY_SLUG_INDEX.name,
        unique: true,
        partialFilterExpression: PROPERTY_SLUG_INDEX.partialFilterExpression,
      },
    },
  ]);
});

test("index check: refuses on a live duplicate", async () => {
  const collection = fakeCollection({
    groups: [group("Dubai", "jvc-heights", ["a", "b"], 2)],
  });
  const { report, created } = await createPropertySlugIndex(collection);
  assert.equal(created, false);
  assert.equal(report.liveDuplicates.length, 1);
  assert.equal(report.blockers.length, 1);
  assert.equal(collection.calls.createIndex.length, 0);
});

test("index check: refuses on a live property without an emirate", async () => {
  const collection = fakeCollection({ liveWithoutEmirate: ["a"] });
  const { report, created } = await createPropertySlugIndex(collection);
  assert.equal(created, false);
  assert.match(report.blockers[0], /backfillEmirate/);
  assert.equal(collection.calls.createIndex.length, 0);
});

test("index check: an existing index is a no-op; a different spec refuses", async () => {
  const same = fakeCollection({
    indexes: [
      {
        name: PROPERTY_SLUG_INDEX.name,
        key: PROPERTY_SLUG_INDEX.key,
        unique: true,
        partialFilterExpression: PROPERTY_SLUG_INDEX.partialFilterExpression,
      },
    ],
  });
  const first = await createPropertySlugIndex(same);
  assert.equal(first.created, false);
  assert.equal(first.report.existingMatches, true);
  assert.deepEqual(first.report.blockers, []);
  assert.equal(same.calls.createIndex.length, 0);

  const different = fakeCollection({
    indexes: [
      { name: PROPERTY_SLUG_INDEX.name, key: PROPERTY_SLUG_INDEX.key, unique: true },
    ],
  });
  const second = await checkPropertySlugIndex(different);
  assert.equal(second.existingMatches, false);
  assert.equal(second.blockers.length, 1);
});
