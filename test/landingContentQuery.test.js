// Run: node --test test/
//
// Landing pages return the Strapi query they used as `contentQuery`. The
// frontend's draft preview sends that query back to Strapi (as a draft), so it
// must be exactly the query this handler sent. No database and no network:
// axios and the Property model are stubbed.

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const qs = require("qs");
const { default: axios } = require("axios");

const Property = require("../models/properties");
const propertiesController = require("../controller/propertiesController");
const { ABU_DHABI } = require("../utils/emirate");

const STRAPI_URL = "https://admin-v1.xrealty.ae/api/dubai-properties-contents";
const STRAPI_BODY = { data: [{ id: 1, title: "Published copy" }], meta: {} };

const originals = {
  get: axios.get,
  find: Property.find,
  countDocuments: Property.countDocuments,
};

afterEach(() => {
  axios.get = originals.get;
  Property.find = originals.find;
  Property.countDocuments = originals.countDocuments;
});

/** Stubs axios.get and records the URLs it receives. */
function stubStrapi() {
  const urls = [];
  axios.get = async (url) => {
    urls.push(url);
    return { data: STRAPI_BODY };
  };
  return urls;
}

/** Stubs the Mongoose reads so the main path never touches a database. */
function stubProperties() {
  const chain = {
    sort: () => chain,
    limit: () => chain,
    skip: () => chain,
    select: () => chain,
    exec: async () => [],
  };
  Property.find = () => chain;
  Property.countDocuments = async () => 0;
}

/** Calls the handler and resolves with the JSON body it sends. */
function callHandler({ saleType, type, emirate }) {
  return new Promise((resolve, reject) => {
    const req = { params: { saleType, type }, query: {}, emirate };
    const res = {
      status() {
        return this;
      },
      json: resolve,
    };
    propertiesController.getPropertiesBySaleTypeAndType(req, res, reject);
  });
}

/** The query string the handler sent to Strapi. */
function sentQuery(urls) {
  assert.equal(urls.length, 1);
  const [base, query] = urls[0].split("?");
  assert.equal(base, STRAPI_URL);
  return query;
}

test("main path: contentQuery is the query sent to Strapi", async () => {
  const urls = stubStrapi();
  stubProperties();

  const body = await callHandler({ saleType: "for-sale", type: "type-off-plan-projects" });

  assert.equal(body.success, true);
  assert.deepEqual(body.content, STRAPI_BODY);
  assert.equal(
    qs.stringify(body.contentQuery, { encodeValuesOnly: true }),
    sentQuery(urls)
  );
  assert.equal(body.contentQuery.filters.listing_type.slug.$eq, "for-sale");
  assert.equal(body.contentQuery.filters.property_type.slug.$eq, "type-off-plan-projects");
});

test("Abu Dhabi: contentQuery uses the -abu-dhabi property type", async () => {
  const urls = stubStrapi();
  stubProperties();

  const body = await callHandler({
    saleType: "for-sale",
    type: "type-off-plan-projects",
    emirate: ABU_DHABI,
  });

  assert.equal(
    qs.stringify(body.contentQuery, { encodeValuesOnly: true }),
    sentQuery(urls)
  );
  assert.equal(
    body.contentQuery.filters.property_type.slug.$eq,
    "type-off-plan-projects-abu-dhabi"
  );
});

test("early return (no property listing): contentQuery is still returned", async () => {
  const urls = stubStrapi();
  Property.find = () => {
    throw new Error("must not query properties");
  };

  const body = await callHandler({ saleType: "for-rent", type: "type-apartment" });

  assert.deepEqual(body.properties, []);
  assert.deepEqual(body.content, STRAPI_BODY);
  assert.equal(
    qs.stringify(body.contentQuery, { encodeValuesOnly: true }),
    sentQuery(urls)
  );
});
