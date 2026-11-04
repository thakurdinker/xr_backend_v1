// Strapi-only developers: the merged developer list and the Strapi lookups.
// No network: global fetch is stubbed.
//
// Run: node --test test/
const { test, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  fetchStrapiDevelopers,
  strapiDeveloperExists,
  mergeDevelopers,
} = require("../utils/strapiDevelopers");

afterEach(() => mock.restoreAll());

const mongo = [
  { id: "m1", developer_name: "Emaar Properties", developer_slug: "emaar-properties", order: 1 },
  { id: "m2", developer_name: "Beyond", developer_slug: "beyond-developments", order: 20 },
];

test("mergeDevelopers keeps Mongo records first, unchanged and in order", () => {
  const merged = mergeDevelopers(mongo, [
    { documentId: "s1", developer_name: "Beyond Developments", developer_slug: "beyond-developments" },
    { documentId: "s2", developer_name: "Emaar Properties", developer_slug: "emaar-properties" },
  ]);
  assert.deepEqual(merged, mongo);
});

test("mergeDevelopers appends Strapi-only developers by name", () => {
  const merged = mergeDevelopers(mongo, [
    { documentId: "s3", developer_name: "Modon", developer_slug: "modon" },
    { documentId: "s4", developer_name: "Aldar Properties", developer_slug: "aldar-properties" },
  ]);
  assert.deepEqual(merged.slice(2), [
    { id: "s4", developer_name: "Aldar Properties", developer_slug: "aldar-properties", source: "strapi" },
    { id: "s3", developer_name: "Modon", developer_slug: "modon", source: "strapi" },
  ]);
});

test("mergeDevelopers skips Strapi entries without a slug or name, and duplicates", () => {
  const merged = mergeDevelopers([], [
    { documentId: "a", developer_name: "Aldar", developer_slug: "aldar" },
    { documentId: "b", developer_name: "Aldar again", developer_slug: "aldar" },
    { documentId: "c", developer_name: "", developer_slug: "no-name" },
    { documentId: "d", developer_name: "No slug", developer_slug: null },
  ]);
  assert.deepEqual(merged.map((d) => d.id), ["a"]);
});

const page = (n) =>
  Array.from({ length: n }, (_, i) => ({
    documentId: `d${i}`,
    developer_name: `Dev ${i}`,
    developer_slug: `dev-${i}`,
  }));

const stubFetch = (...bodies) => {
  const urls = [];
  mock.method(globalThis, "fetch", async (url) => {
    urls.push(String(url));
    const body = bodies.shift();
    if (body instanceof Error) throw body;
    if (typeof body === "number") return { ok: false, status: body };
    return { ok: true, json: async () => ({ data: body }) };
  });
  return urls;
};

test("fetchStrapiDevelopers reads every page", async () => {
  const urls = stubFetch(page(100), page(3));
  const all = await fetchStrapiDevelopers();
  assert.equal(all.length, 103);
  assert.match(urls[0], /\/api\/developers\?.*pagination\[page\]=1/);
  assert.match(urls[1], /pagination\[page\]=2/);
});

test("fetchStrapiDevelopers throws when Strapi fails", async () => {
  stubFetch(503);
  await assert.rejects(fetchStrapiDevelopers(), /503/);
});

test("strapiDeveloperExists matches the exact slug", async () => {
  const urls = stubFetch([{ developer_slug: "aldar" }], []);
  assert.equal(await strapiDeveloperExists("aldar"), true);
  assert.equal(await strapiDeveloperExists("Nshama"), false);
  assert.match(urls[0], /filters\[developer_slug\]\[\$eq\]=aldar&/);
  assert.match(urls[1], /\$eq\]=Nshama&/);
});

test("strapiDeveloperExists throws on a network error", async () => {
  stubFetch(new Error("ECONNRESET"));
  await assert.rejects(strapiDeveloperExists("aldar"), /ECONNRESET/);
});
