// Areas are authored in Strapi (communities-contents), which also carries the
// `emirate` relation saying which emirate each area belongs to. Mongo still
// holds the older Community records, which carry their own `emirate` string.
// These helpers let Strapi-only areas be listed in the admin dropdowns
// alongside the Mongo ones, with their emirate. Mirrors utils/strapiDevelopers.js.

const { parseEmirate } = require("./emirate");

const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL || "https://admin-v1.xrealty.ae";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";
const TIMEOUT_MS = 5000;
const PAGE_SIZE = 100;

// Asked for on every read: the two scalars the dropdowns need, plus the name
// of the emirate relation. `emirate` is a relation, so it needs populate —
// listing it under `fields` returns nothing.
const FIELDS =
  "fields[0]=community_name&fields[1]=community_slug" +
  "&populate[emirate][fields][0]=name" +
  "&populate[hero_image]=true&populate[seo]=true";

const normaliseSlug = (slug) => String(slug || "").trim().toLowerCase();

async function strapiGet(query) {
  const headers = { "Content-Type": "application/json" };
  if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
  const res = await fetch(
    `${STRAPI_BASE_URL}/api/communities-contents?${query}`,
    { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }
  );
  if (!res.ok) throw new Error(`Strapi communities → ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

/**
 * The emirate a Strapi area is tagged with, as one of EMIRATES, or null when
 * it is untagged — or tagged with an emirate this codebase doesn't model.
 * Untagged is deliberately null and never Dubai: an untagged Abu Dhabi area
 * guessed as Dubai files its properties under the wrong emirate silently.
 */
function emirateOfStrapiArea(area) {
  const name = area?.emirate?.name;
  return name ? parseEmirate(name) : null;
}

/**
 * Every published Strapi area as { documentId, community_name,
 * community_slug, emirate }. Throws when Strapi can't be reached; callers
 * decide how to degrade.
 */
async function fetchStrapiCommunities() {
  const all = [];
  for (let page = 1; ; page++) {
    const items = await strapiGet(
      `${FIELDS}&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`
    );
    all.push(...items);
    if (items.length < PAGE_SIZE) return all;
  }
}

/**
 * The emirate Strapi holds for one area slug, or null when Strapi has no such
 * area or hasn't tagged it. Throws when Strapi can't be reached.
 */
async function fetchStrapiCommunityEmirate(slug) {
  const clean = normaliseSlug(slug);
  if (!clean) return null;
  const items = await strapiGet(
    `filters[community_slug][$eq]=${encodeURIComponent(clean)}` +
      `&${FIELDS}&pagination[pageSize]=1`
  );
  return items.length ? emirateOfStrapiArea(items[0]) : null;
}

/**
 * Mongo areas first, unchanged and in their order, then Strapi areas that have
 * no Mongo record, by name.
 *
 * A Mongo record wins outright on a shared slug — deliberately. `name` is the
 * value stored on every Property (`community_name`) and is what the admin
 * dropdown matches on, and the two stores disagree about it for 10 of the 11
 * shared areas ("Dubailand" vs "Dubailand Area Guide"). Letting Strapi's name
 * win would blank the dropdown for existing properties and rewrite their
 * stored community name on the next save.
 *
 * A Strapi-only entry carries the emirate Strapi has tagged it with, or null
 * when it is untagged. Callers must not silently treat null as Dubai.
 */
function mergeCommunities(mongoCommunities, strapiCommunities) {
  const known = new Set(
    mongoCommunities.map((c) => normaliseSlug(c.slug))
  );
  const strapiOnly = [];
  for (const c of strapiCommunities) {
    const slug = normaliseSlug(c.community_slug);
    if (!slug || !c.community_name || known.has(slug)) continue;
    known.add(slug);
    strapiOnly.push({
      id: c.documentId,
      name: String(c.community_name).trim(),
      slug,
      emirate: emirateOfStrapiArea(c),
      source: "strapi",
    });
  }
  strapiOnly.sort((a, b) => a.name.localeCompare(b.name));
  return [...mongoCommunities, ...strapiOnly];
}

module.exports = {
  fetchStrapiCommunities,
  fetchStrapiCommunityEmirate,
  emirateOfStrapiArea,
  mergeCommunities,
  normaliseSlug,
};
