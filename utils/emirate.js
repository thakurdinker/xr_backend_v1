/**
 * Emirate helpers for the Abu Dhabi expansion.
 *
 * An Area (Community) belongs to exactly one emirate; Properties inherit it
 * from their community (denormalised onto Property.emirate by a pre-save hook);
 * a Developer's emirates are derived from its live properties.
 *
 * Every public endpoint defaults to DUBAI when no `emirate` is requested, and
 * the Dubai filter is "anything that is NOT Abu Dhabi" — so records written
 * before the field existed (no `emirate` at all) stay Dubai, and every existing
 * Dubai response is unchanged until Abu Dhabi data is actually added.
 */

const DUBAI = "Dubai";
const ABU_DHABI = "Abu Dhabi";
const EMIRATES = [DUBAI, ABU_DHABI];
const DEFAULT_EMIRATE = DUBAI;

const SITE_URL = "https://www.xrealty.ae";

// URL-safe keys accepted in ?emirate= (and the public folder names).
const EMIRATE_BY_KEY = {
  dubai: DUBAI,
  "abu-dhabi": ABU_DHABI,
};

/**
 * Resolve an `emirate` request value ("dubai" | "abu-dhabi", or the display
 * names). Missing → Dubai. Unknown → null, which callers reject.
 */
function parseEmirate(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_EMIRATE;
  const key = String(value).trim().toLowerCase().replace(/\s+/g, "-");
  return EMIRATE_BY_KEY[key] || null;
}

/** Mongo filter fragment selecting documents of one emirate. */
function emirateFilter(emirate) {
  return emirate === ABU_DHABI
    ? { emirate: ABU_DHABI }
    : { emirate: { $ne: ABU_DHABI } }; // Dubai, or no emirate yet
}

/** The emirate a stored document belongs to (missing → Dubai). */
function emirateOf(doc) {
  return doc?.emirate === ABU_DHABI ? ABU_DHABI : DUBAI;
}

/** Public site path of a property / area page. */
function propertyPath(slug, emirate) {
  return emirate === ABU_DHABI
    ? `/abu-dhabi/property/${slug}/`
    : `/property/${slug}/`;
}

function areaPath(slug, emirate) {
  return emirate === ABU_DHABI
    ? `/abu-dhabi/areas/${slug}/`
    : `/area/${slug}/`;
}

module.exports = {
  DUBAI,
  ABU_DHABI,
  EMIRATES,
  DEFAULT_EMIRATE,
  SITE_URL,
  parseEmirate,
  emirateFilter,
  emirateOf,
  propertyPath,
  areaPath,
};
