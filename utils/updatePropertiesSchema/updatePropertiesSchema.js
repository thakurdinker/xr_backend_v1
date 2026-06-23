require("dotenv").config({ path: "../../vars/.env" });
const mongoose = require("mongoose");
const Property = require("../../models/properties");

/**
 * Clean a price string into a plain numeric value.
 * Handles formats like "AED 1,234,567", " 1,234,567", "1234567", etc.
 */
function cleanPrice(raw) {
  if (!raw) return "0";
  const cleaned = raw
    .replace(/AED/gi, "")
    .replace(/,/g, "")
    .trim();
  return cleaned || "0";
}

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
        // Generate FAQs schema if property has FAQs
        if (property.faqs && property.faqs.length > 0) {
          const faqsSchema = {
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
          property.faqs_schema.properties = faqsSchema;
        }

        // Set the schema_org type
        property.schema_org.type = "RealEstateListing";

        const propertyUrl = `https://www.xrealty.ae/property/${property.property_name_slug}/`;

        // Generate main schema using RealEstateListing
        const rawName = property.seo?.meta_title || property.property_name || "";
        const name = rawName.includes("| Xperience Realty")
          ? rawName
          : `${rawName} | Xperience Realty`;

        const mainSchema = {
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name,
          description:
            property.seo?.meta_description || property.description,
          url: propertyUrl,
          image:
            property.open_graph?.image || property.images?.[0]?.url || "",
          offers: {
            "@type": "Offer",
            priceCurrency: "AED",
            price: cleanPrice(property.price),
            url: propertyUrl,
            priceValidUntil: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            )
              .toISOString()
              .split("T")[0],
            availability: "https://schema.org/LimitedAvailability",
          },
        };

        property.schema_org.properties = mainSchema;

        await property.save();
        updated++;
        console.log(
          `[${updated}/${properties.length}] Updated: ${property.property_name}`
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
