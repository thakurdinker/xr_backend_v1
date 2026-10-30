// Regression test for moving an area (Community) to another emirate.
// Property slugs are unique only within an emirate, so a move must be refused
// when it would give two properties the same URL (XRISE-AI/xr_client#93,
// finding 1).
//
// No database: Mongoose buffering is off, every model call the code makes is
// stubbed, and an unstubbed write throws instead of reaching a server.
//
// Run: node --test test/
const { test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const Community = require("../models/community");
const Property = require("../models/properties");
const { updateCommunity } = require("../controller/communityController");

const AREA_ID = new mongoose.Types.ObjectId();

// ── In-memory stand-in for the properties collection ──────────────
let properties = [];

// Matches the filter shapes the area-move code sends; anything else fails
// loudly so the stub cannot silently drift from the real queries.
const matchesValue = (value, cond) => {
  if (cond === null || typeof cond !== "object" || cond instanceof RegExp) {
    return String(value) === String(cond);
  }
  return Object.entries(cond).every(([op, arg]) => {
    switch (op) {
      case "$regex":
        return new RegExp(arg, cond.$options || "").test(value ?? "");
      case "$options":
        return true;
      case "$in":
        return arg.some((a) => String(a) === String(value));
      case "$nin":
        return !arg.some((a) => String(a) === String(value));
      case "$ne":
        return String(value) !== String(arg);
      default:
        throw new Error(`stub: unsupported operator ${op}`);
    }
  });
};
const matches = (doc, filter) =>
  Object.entries(filter).every(([field, cond]) =>
    matchesValue(doc[field], cond)
  );

let writes;

beforeEach(() => {
  writes = { community: [], properties: [] };
  mock.method(Property, "find", async (filter) =>
    properties.filter((p) => matches(p, filter)).map((p) => ({ ...p }))
  );
  mock.method(Property, "updateMany", async (filter, update) => {
    writes.properties.push({ filter, update });
    return { acknowledged: true };
  });
  mock.method(Community.collection, "updateOne", async (where, update) => {
    writes.community.push({ where, update });
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  });
});

afterEach(() => mock.restoreAll());

// A stored area, loaded the way findById loads it (init hooks run).
const loadArea = (fields) => {
  const area = Community.hydrate({ _id: AREA_ID, __v: 0, ...fields });
  mock.method(Community, "findById", async () => area);
  return area;
};

// catchAsync does not return the handler's promise, so wait for the response
// (or for an error passed to next) instead.
const callUpdate = (body) =>
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
    updateCommunity({ params: { id: String(AREA_ID) }, body }, res, reject);
  });

const property = (slug, communitySlug, emirate) => ({
  _id: new mongoose.Types.ObjectId(),
  property_name_slug: slug,
  community_name_slug: communitySlug,
  ...(emirate ? { emirate } : {}),
});

// ── (a) A conflicting move is rejected and nothing is written ─────
test("rejects a move that duplicates a slug in the destination", async () => {
  properties = [
    property("shared-project", "saadiyat", "Abu Dhabi"),
    property("saadiyat-only", "saadiyat", "Abu Dhabi"),
    property("shared-project", "jvc", "Dubai"),
  ];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  const body = await callUpdate({ emirate: "Dubai" });

  assert.equal(body.success, false);
  assert.equal(body.isUpdated, false);
  assert.equal(typeof body.message, "string");
  assert.match(body.message, /shared-project/);
  assert.doesNotMatch(body.message, /saadiyat-only/);
  assert.equal(writes.community.length, 0, "area must not be saved");
  assert.equal(writes.properties.length, 0, "properties must not move");
});

test("treats a legacy property with no emirate as Dubai", async () => {
  properties = [
    property("shared-project", "saadiyat", "Abu Dhabi"),
    property("shared-project", "downtown"), // written before the field existed
  ];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  const body = await callUpdate({ emirate: "Dubai" });

  assert.equal(body.success, false);
  assert.match(body.message, /shared-project/);
  assert.equal(writes.community.length + writes.properties.length, 0);
});

test("the model guard refuses a conflicting save from any path", async () => {
  properties = [
    property("shared-project", "saadiyat", "Abu Dhabi"),
    property("shared-project", "jvc", "Dubai"),
  ];
  const area = loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  area.slug = "saadiyat-island"; // the guard still checks the loaded slug
  area.emirate = "Dubai";
  await assert.rejects(area.save(), /shared-project/);
  assert.equal(writes.community.length, 0, "area must not be saved");
  assert.equal(writes.properties.length, 0, "properties must not move");
});

test("a request that changes slug and emirate is checked on the old slug", async () => {
  properties = [
    property("shared-project", "saadiyat", "Abu Dhabi"),
    property("shared-project", "jvc", "Dubai"),
  ];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });
  mock.method(Community, "exists", async () => null); // new slug is free

  const body = await callUpdate({
    slug: "saadiyat-island",
    emirate: "Dubai",
  });

  assert.equal(body.success, false);
  assert.match(body.message, /shared-project/);
  assert.equal(writes.community.length + writes.properties.length, 0);
});

// ── (b) A move with no clash still moves the properties ───────────
test("moves the area's properties when no slug clashes", async () => {
  properties = [
    property("saadiyat-grove", " Saadiyat ", "Abu Dhabi"), // drifted slug
    property("saadiyat-lagoons", "saadiyat", "Abu Dhabi"),
  ];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  const body = await callUpdate({ emirate: "Dubai" });

  assert.equal(body.success, true, body.message);
  assert.equal(body.isUpdated, true);
  assert.equal(writes.community.length, 1);
  assert.equal(writes.community[0].update.$set.emirate, "Dubai");
  assert.equal(writes.properties.length, 1);
  const { filter, update } = writes.properties[0];
  assert.deepEqual(update, { $set: { emirate: "Dubai" } });
  // The move filter selects exactly the area's properties.
  assert.deepEqual(
    properties.filter((p) => matches(p, filter)).map((p) => p.property_name_slug),
    ["saadiyat-grove", "saadiyat-lagoons"]
  );
});

test("a slug and emirate change moves the properties on the old slug", async () => {
  properties = [property("saadiyat-grove", "saadiyat", "Abu Dhabi")];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });
  mock.method(Community, "exists", async () => null); // new slug is free

  const body = await callUpdate({
    slug: "saadiyat-island",
    emirate: "Dubai",
  });

  assert.equal(body.success, true, body.message);
  assert.equal(writes.properties.length, 1);
  const { filter } = writes.properties[0];
  assert.ok(matches({ community_name_slug: "saadiyat" }, filter));
  assert.ok(!matches({ community_name_slug: "saadiyat-island" }, filter));
});

// ── (c) Other areas in the destination do not block a clean move ──
test("passes when the destination has other areas but no shared slug", async () => {
  properties = [
    property("saadiyat-grove", "saadiyat", "Abu Dhabi"),
    property("jvc-heights", "jvc", "Dubai"),
    property("downtown-views", "downtown"), // legacy Dubai
    property("yas-acres", "yas-island", "Abu Dhabi"),
  ];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  const body = await callUpdate({ emirate: "Dubai" });

  assert.equal(body.success, true, body.message);
  assert.equal(writes.community.length, 1);
  assert.equal(writes.properties.length, 1);
  assert.deepEqual(writes.properties[0].update, {
    $set: { emirate: "Dubai" },
  });
});

test("an edit that keeps the emirate runs no clash check and moves nothing", async () => {
  properties = [property("shared-project", "saadiyat", "Abu Dhabi")];
  loadArea({ slug: "saadiyat", emirate: "Abu Dhabi" });

  const body = await callUpdate({ name: "Saadiyat Island" });

  assert.equal(body.success, true, body.message);
  assert.equal(Property.find.mock.callCount(), 0);
  assert.equal(writes.community.length, 1);
  assert.equal(writes.properties.length, 0);
});
