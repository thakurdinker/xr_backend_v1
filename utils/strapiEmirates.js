// The emirate list is authored in Strapi (the `emirate` collection, which the
// developer records relate to). The admin panel has no Strapi credentials and
// its bundle is public, so it reads the list through this backend instead of
// calling Strapi directly. Mirrors utils/strapiDevelopers.js.

const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL || "https://admin-v1.xrealty.ae";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || "";
const TIMEOUT_MS = 5000;

/**
 * Every published Strapi emirate as { name, slug }. Throws when Strapi can't
 * be reached; callers decide how to degrade.
 */
async function fetchStrapiEmirates() {
  const headers = { "Content-Type": "application/json" };
  if (STRAPI_API_TOKEN) headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;

  const res = await fetch(
    `${STRAPI_BASE_URL}/api/emirates?fields[0]=name&fields[1]=slug` +
      "&pagination[pageSize]=100",
    { headers, signal: AbortSignal.timeout(TIMEOUT_MS) }
  );
  if (!res.ok) throw new Error(`Strapi emirates → ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}

module.exports = { fetchStrapiEmirates };
