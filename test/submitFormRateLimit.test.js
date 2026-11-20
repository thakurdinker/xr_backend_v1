// Rate limits on the lead-form routes (routes/submitForm.js).
//
//  - /brochure-download is limited to 5 requests per 10 minutes per IP, and the
//    429 is JSON ({ error }) because the brochure popup reads `error` from the
//    response body to show it to the visitor.
//  - It has its own bucket: using up the brochure limit must not block /contact,
//    and using up /contact must not block brochure downloads.
//
// No database, no network: the real router is mounted on a throwaway express app
// with the controllers stubbed, so only the middleware is under test.
//
// Run: node --test test/
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");

const controllerPath = require.resolve("../controller/submitFormController");
const ok = (_req, res) => res.status(200).json({ ok: true });

let server;
let base;

before(async () => {
  // Stub the controller before the router requires it.
  require.cache[controllerPath] = {
    id: controllerPath,
    filename: controllerPath,
    loaded: true,
    exports: {
      submitContactForm: ok,
      submitContactFormCareer: ok,
      submitLandingPageForm: ok,
      brochureDownloadSubmission: ok,
      marketReportSubmission: ok,
      newsletterSubmission: ok,
    },
  };
  const router = require(path.join(__dirname, "../routes/submitForm.js"));
  const app = express();
  app.use(express.json());
  app.use("/", router);
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  delete require.cache[controllerPath];
});

const post = (route) =>
  fetch(base + route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

test("/brochure-download allows 5 requests, then answers 429 with JSON", async () => {
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await post("/brochure-download")).status);
  assert.deepEqual(statuses, [200, 200, 200, 200, 200]);

  const blocked = await post("/brochure-download");
  assert.equal(blocked.status, 429);
  assert.match(blocked.headers.get("content-type"), /application\/json/);
  assert.deepEqual(await blocked.json(), {
    error: "Too many requests, please try again in 10 minutes.",
  });
});

test("the brochure limit does not use up the /contact limit", async () => {
  // The brochure bucket is already exhausted by the previous test.
  assert.equal((await post("/brochure-download")).status, 429);
  assert.equal((await post("/contact")).status, 200);
});

test("the /contact limit is separate from the brochure limit, and still 5", async () => {
  const statuses = [];
  for (let i = 0; i < 5; i++) statuses.push((await post("/contact")).status);
  // 1 contact request was already used in the previous test, so 4 more fit.
  assert.deepEqual(statuses, [200, 200, 200, 200, 429]);
});

test("/contact keeps its plain-text 429 message", async () => {
  const blocked = await post("/contact");
  assert.equal(blocked.status, 429);
  assert.equal(await blocked.text(), "Too many requests, please try again in 10 minutes.");
});

test("/market-report is not limited by this change", async () => {
  const statuses = [];
  for (let i = 0; i < 8; i++) statuses.push((await post("/market-report")).status);
  assert.deepEqual(statuses, Array(8).fill(200));
});
