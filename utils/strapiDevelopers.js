// Developers are added in Strapi; the admin panel's developer pages were removed
// (admin panel e754c04). The Mongo Developer collection still holds the records
// created before that, and properties link to a developer by slug
// (Property.developer_name_slug). These helpers let Strapi-only developers be
// listed and linked like the Mongo ones.

const { parseEmirate } = require("./emirate");

const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL || "https://admin-v1.xrealty.ae";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";
const TIMEOUT_MS = 5000;
const PAGE_SIZE = 100;

async function strapiGet(query) {
  const headers = { "Content-Type": "application/json" };
  if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  const res = await fetch(`${STRAPI_BASE_URL}/api/developers?${query}`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Strapi developers → ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

function strapiEmiratesOf(developer) {
  return (developer?.emirates ?? [])
    .map((relation) => parseEmirate(relation?.name))
    .filter(Boolean);
}

/**
 * Every published Strapi developer as { documentId, developer_name,
 * developer_slug, emirates }. Throws when Strapi can't be reached; callers decide how
 * to degrade.
 */
async function fetchStrapiDevelopers() {
  const all = [];
  for (let page = 1; ; page++) {
    const items = await strapiGet(
      "fields[0]=developer_name&fields[1]=developer_slug" +
        "&populate[emirates][fields][0]=name" +
        `&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
    );
    all.push(...items);
    if (items.length < PAGE_SIZE) return all;
  }
}

/** Whether Strapi has a published developer with exactly this slug. */
async function strapiDeveloperExists(slug) {
  const items = await strapiGet(
    `filters[developer_slug][$eq]=${encodeURIComponent(slug)}` +
      "&fields[0]=developer_slug&pagination[pageSize]=1"
  );
  return items.length > 0;
}

/**
 * Mongo developers first, unchanged and in their order, then Strapi developers
 * that have no Mongo record, by name. A Mongo record wins on a shared slug:
 * existing properties, the navbar and the admin dropdowns use its name.
 * Strapi-only entries carry `id` (the admin dropdowns key on it) and
 * `source: "strapi"`.
 */
function mergeDevelopers(mongoDevelopers, strapiDevelopers) {
  const known = new Set(mongoDevelopers.map((d) => d.developer_slug));
  const strapiOnly = [];
  for (const d of strapiDevelopers) {
    if (!d.developer_slug || !d.developer_name || known.has(d.developer_slug)) {
      continue;
    }
    known.add(d.developer_slug);
    const strapiEmirates = strapiEmiratesOf(d);
    strapiOnly.push({
      id: d.documentId,
      developer_name: d.developer_name,
      developer_slug: d.developer_slug,
      ...(strapiEmirates.length ? { strapiEmirates } : {}),
      source: "strapi",
    });
  }
  strapiOnly.sort((a, b) => a.developer_name.localeCompare(b.developer_name));
  return [...mongoDevelopers, ...strapiOnly];
}

module.exports = {
  fetchStrapiDevelopers,
  strapiEmiratesOf,
  strapiDeveloperExists,
  mergeDevelopers,
};
