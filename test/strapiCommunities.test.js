// Strapi community relations and emirate lookup. Network calls are stubbed.
const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const Community = require("../models/community");
const Property = require("../models/properties");
const {
  fetchStrapiCommunities,
  fetchStrapiCommunityEmirate,
  mergeCommunities,
} = require("../utils/strapiCommunities");

afterEach(() => mock.restoreAll());

const response = (data) => ({ ok: true, json: async () => ({ data }) });

test("fetchStrapiCommunities requests the populated emirate relation", async () => {
  let requested;
  mock.method(globalThis, "fetch", async (url) => {
    requested = String(url);
    return response([{ community_name: "Yas Island", community_slug: "yas-island", emirate: { name: "Abu Dhabi" } }]);
  });
  const rows = await fetchStrapiCommunities();
  assert.match(requested, /\/api\/communities-contents\?/);
  assert.match(requested, /populate\[emirate\]\[fields\]\[0\]=name/);
  assert.equal(rows[0].emirate.name, "Abu Dhabi");
});

test("mergeCommunities maps a Strapi relation to the supported emirate", () => {
  const merged = mergeCommunities([], [
    { documentId: "yas-doc", community_name: "Yas Island", community_slug: "yas-island", emirate: { name: "Abu Dhabi" } },
    { documentId: "other-doc", community_name: "Untaged", community_slug: "untagged", emirate: null },
  ]);
  assert.deepEqual(merged.map(({ name, slug, emirate }) => ({ name, slug, emirate })), [
    { name: "Untaged", slug: "untagged", emirate: null },
    { name: "Yas Island", slug: "yas-island", emirate: "Abu Dhabi" },
  ]);
});

test("fetchStrapiCommunityEmirate filters by exact community slug", async () => {
  let requested;
  mock.method(globalThis, "fetch", async (url) => {
    requested = String(url);
    return response([{ emirate: { name: "Abu Dhabi" } }]);
  });
  assert.equal(await fetchStrapiCommunityEmirate("YAS-Island"), "Abu Dhabi");
  assert.match(requested, /filters\[community_slug\]\[\$eq\]=yas-island/);
});

const query = (value) => ({ select() { return this; }, lean() { return Promise.resolve(value); } });
test("Property emirate resolution prefers Mongo, then Strapi", async () => {
  mock.method(Community, "findOne", () => query({ emirate: "Dubai" }));
  mock.method(globalThis, "fetch", async () => response([{ emirate: { name: "Abu Dhabi" } }]));
  assert.equal(await Property.emirateForCommunity("yas-island"), "Dubai");
  mock.restoreAll();
  mock.method(Community, "findOne", () => query(null));
  mock.method(globalThis, "fetch", async () => response([{ emirate: { name: "Abu Dhabi" } }]));
  assert.equal(await Property.emirateForCommunity("yas-island"), "Abu Dhabi");
});

test("Property emirate resolution rejects a Strapi-only area Strapi can't tag", async () => {
  // Strapi answers, but has no emirate for the area (untagged, or the slug
  // doesn't exist there) — this must fail loud, not default to Dubai.
  mock.method(Community, "findOne", () => query(null));
  mock.method(globalThis, "fetch", async () => response([]));
  await assert.rejects(
    Property.emirateForCommunity("untagged-area"),
    /Cannot determine emirate/
  );
});

test("Property emirate resolution falls back to Dubai when Strapi is unreachable", async () => {
  // A network failure is not the same as "Strapi says untagged": today's
  // outage must not block saving in an area that worked before this Strapi
  // lookup existed (e.g. an untagged legacy Dubai area with no Mongo record).
  mock.method(Community, "findOne", () => query(null));
  mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  assert.equal(
    await Property.emirateForCommunity("dubai-hills-estate"),
    "Dubai"
  );
});
