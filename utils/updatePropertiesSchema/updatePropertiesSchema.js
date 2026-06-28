require("dotenv").config({ path: "../../vars/.env" });
const mongoose = require("mongoose");
const Property = require("../../models/properties");

/**
 * Backfills the FAQ schema (faqs_schema) for properties that have FAQs.
 *
 * NOTE: this script no longer generates the RealEstateListing markup
 * (schema_org). That schema is now generated on the frontend (xr_client) from
 * each property's live fields — the single source of truth — so generating it
 * here would only write a duplicate/minimal copy (drift-prone priceValidUntil)
 * that the site no longer reads. Only the FAQ schema is touched.
 */

const updatePropertiesSchema = async () => {
  const DB_URL =
    process.env.ENV === "development"
      ? process.env.TEST_DB_URL
      : process.env.DB_URL;

  if (!DB_URL) {
    console.error("No DB_URL found in env — check vars/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to database");

    const properties = await Property.find({});
    console.log(`Found ${properties.length} properties to update`);

    let updated = 0;
    let skipped = 0;

    for (const property of properties) {
      try {
        // RealEstateListing (schema_org) is intentionally NOT generated here —
        // it's produced on the frontend (xr_client) from the property's live
        // fields. Only the FAQ schema is refreshed; properties without FAQs are
        // left untouched.
        if (!property.faqs || property.faqs.length === 0) {
          skipped++;
          continue;
        }

        property.faqs_schema.properties = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: property.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        };

        await property.save();
        updated++;
        console.log(
          `[${updated}/${properties.length}] FAQ schema updated: ${property.property_name}`
        );
      } catch (err) {
        skipped++;
        console.error(
          `Skipped "${property.property_name}": ${err.message}`
        );
      }
    }

    console.log(
      `\nDone — ${updated} updated, ${skipped} skipped out of ${properties.length}`
    );
  } catch (error) {
    console.error("Error updating properties:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

updatePropertiesSchema();
