// Lead-form validation (schemaValidation/submitForm.js) and the Postmark
// senders those forms trigger.
//
//  - /contact must not accept a lead with no email and no phone, and every
//    phone must look like a phone (dial code + digits, 7-15 digits).
//  - /career_contact must accept what the careers form really sends: "" for
//    whatever was left blank (including ipAddress when geolocation fails).
//  - A failed Postmark send must be logged, not left as an unhandled rejection
//    (which kills the Node process).
//
// No database, no network: Joi is pure and the Postmark client is stubbed.
//
// Run: node --test test/
const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  submitFormValidation,
  submitContactFormValidation,
  submitBrochureDownloadFormValidation,
  submitMarketReportFormValidation,
} = require("../schemaValidation/submitForm");

const message = (result) => result.error?.details[0].message;

// ── /contact ─────────────────────────────────────────────────────────

test("/contact rejects a lead with no email and no phone", () => {
  for (const body of [
    {},
    { email: "", phone: "" },
    { firstname: "A", message: "hi" },
    { phone: "   " },
  ]) {
    assert.equal(
      message(submitFormValidation.validate(body)),
      "Please provide an email or phone number",
      JSON.stringify(body)
    );
  }
});

test("/contact accepts email only, phone only, or both", () => {
  assert.equal(submitFormValidation.validate({ email: "a@b.com" }).error, undefined);
  assert.equal(
    submitFormValidation.validate({ email: "a@b.com", phone: "" }).error,
    undefined
  );
  assert.equal(
    submitFormValidation.validate({ email: "", phone: "971501234567" }).error,
    undefined
  );
  assert.equal(
    submitFormValidation.validate({ email: "a@b.com", phone: "971501234567" }).error,
    undefined
  );
});

test("/contact keeps storing an absent phone as an empty string", () => {
  const { value } = submitFormValidation.validate({ email: "a@b.com" });
  assert.equal(value.phone, "");
});

test("phone must be 7-15 digits with an optional leading +", () => {
  const ok = ["1234567", "123456789012345", "+971501234567", " 971501234567 "];
  const bad = ["abcdef", "9711", "1234567890123456", "050 123 4567", "+971 50 123 4567"];
  for (const phone of ok) {
    assert.equal(
      submitFormValidation.validate({ email: "a@b.com", phone }).error,
      undefined,
      phone
    );
  }
  for (const phone of bad) {
    assert.equal(
      message(submitFormValidation.validate({ email: "a@b.com", phone })),
      "phone must be a valid phone number",
      phone
    );
  }
  assert.equal(
    submitFormValidation.validate({ phone: " 971501234567 " }).value.phone,
    "971501234567",
    "phone is trimmed"
  );
});

test("the documented example payload still validates", () => {
  const { error } = submitFormValidation.validate({
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
    phone: "+9710000000",
    message: "I want more info",
    pageUrl: "https://www.xrealty.ae",
    ipAddress: "127.0.0.1",
  });
  assert.equal(error, undefined);
});

// ── brochure / market report: phone optional, but checked when given ──

test("brochure and market-report check a phone only when one is given", () => {
  const brochure = { projectBrochure: "d1", projectName: "P" };
  const report = { marketReport: "m1", reportName: "R" };
  for (const [schema, base] of [
    [submitBrochureDownloadFormValidation, brochure],
    [submitMarketReportFormValidation, report],
  ]) {
    assert.equal(schema.validate({ ...base }).error, undefined);
    assert.equal(schema.validate({ ...base, phone: "" }).error, undefined);
    assert.equal(schema.validate({ ...base, phone: "971501234567" }).error, undefined);
    assert.equal(
      message(schema.validate({ ...base, phone: "abc" })),
      "phone must be a valid phone number"
    );
  }
});

// ── /career_contact ──────────────────────────────────────────────────

const career = {
  formId: "f1",
  firstname: "A",
  lastname: "B",
  message: "hi",
  pageUrl: "http://x/careers/",
  ipAddress: "1.1.1.1",
};

test("/career_contact accepts email only or phone only (blank arrives as \"\")", () => {
  assert.equal(
    submitContactFormValidation.validate({ ...career, email: "a@b.com", phone: "" }).error,
    undefined
  );
  assert.equal(
    submitContactFormValidation.validate({ ...career, email: "", phone: "971501234567" }).error,
    undefined
  );
});

test("/career_contact accepts a blank ipAddress or pageUrl", () => {
  const body = { ...career, email: "a@b.com", phone: "971501234567" };
  assert.equal(submitContactFormValidation.validate({ ...body, ipAddress: "" }).error, undefined);
  assert.equal(submitContactFormValidation.validate({ ...body, pageUrl: "" }).error, undefined);
});

test("/career_contact still needs an email or a phone, and a sane phone", () => {
  assert.equal(
    message(submitContactFormValidation.validate({ ...career, email: "", phone: "" })),
    "Please provide an email or phone number"
  );
  assert.equal(
    message(submitContactFormValidation.validate({ ...career })),
    "Please provide an email or phone number"
  );
  assert.equal(
    message(submitContactFormValidation.validate({ ...career, email: "a@b.com", phone: "abc" })),
    "phone must be a valid phone number"
  );
});

// ── Postmark: a failed send must not crash the process ───────────────

test("a failed Postmark send is logged, not an unhandled rejection", async (t) => {
  // The senders build their Postmark client when first required, from these two
  // tokens. Without them (no local vars/.env, e.g. CI) construction throws.
  process.env.POSTMARK_CONTACT_FORM_SERVER_TOKEN ||=
    "00000000-0000-0000-0000-000000000000";
  process.env.POSTMARK_TOKEN ||= "00000000-0000-0000-0000-000000000000";
  const postmark = require("postmark");
  t.mock.method(postmark.ServerClient.prototype, "sendEmail", async () => {
    throw new Error("Request does not contain a valid Server token.");
  });
  const logged = [];
  t.mock.method(console, "log", (...args) => logged.push(args));

  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason);
  process.on("unhandledRejection", onUnhandled);
  t.after(() => process.off("unhandledRejection", onUnhandled));

  const {
    sendLeadSubmitEmail,
    sendCareerSubmitEmail,
    sendNewsletterSubmitEmail,
  } = require("../utils/postmark/sendLeadSubmitEmail");
  const { sendOpenHouseRsvpEmail } = require("../utils/postmark/sendOpenHouseRsvpEmail");
  const { sendResetEmail } = require("../utils/postmark/postmarkConfig");

  sendLeadSubmitEmail({ firstname: "A", email: "a@b.com" });
  sendCareerSubmitEmail({ firstname: "A", email: "a@b.com" });
  sendNewsletterSubmitEmail("a@b.com");
  sendOpenHouseRsvpEmail({ name: "A", email: "a@b.com", preferredDate: "x" });
  sendResetEmail({ email: "a@b.com", content: "reset" });

  // unhandledRejection is raised after the microtask queue drains.
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.deepEqual(unhandled, [], "no send may leave a rejection unhandled");
  assert.ok(logged.length > 0, "the failure is logged instead");
});
