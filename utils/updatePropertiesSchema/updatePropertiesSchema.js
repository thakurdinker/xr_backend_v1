require("dotenv").config({ path: "../../vars/.env" });
const mongoose = require("mongoose");
const Property = require("../../models/properties");

const updatePropertiesSchema = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("");
    console.log("Connected to database");

    // Get all properties
    const properties = await Property.find({});
    console.log(`Found ${properties.length} properties to update`);

    // Update each property
    for (const property of properties) {
      let ratingAndReviewCount = Math.floor(Math.random() * 10000) + 5000;

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

      //   change the schema_org type from place to Product
      property.schema_org.type = "Product";

      // Generate main schema
      const mainSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: property.seo?.meta_title || property.property_name,
        description: property.seo?.meta_description || property.description,
        brand: {
          "@type": "Brand",
          name: property.developer,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "AED",
          url: `https://www.xrealty.ae/property/${property.property_name_slug}/`,
          price:
            property.price?.replace("AED", "").trim().replaceAll(",", "") ||
            "00000000",
          priceValidUntil: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          )
            .toISOString()
            .split("T")[0], // keep one year greater than updateAt date
          itemCondition: "https://schema.org/NewCondition",
          availability: "https://schema.org/LimitedAvailability",
        },

        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5",
          bestRating: "5",
          worstRating: "0",
          ratingCount: ratingAndReviewCount, // generate a random number between 5000 and 10000
          reviewCount: ratingAndReviewCount, // generate a random number between 5000 and 10000
        },
        image: property.open_graph?.image || property.images?.[0]?.url || "",
        url: `https://www.xrealty.ae/property/${property.property_name_slug}/`,
      };

      property.schema_org.properties = mainSchema;

      // Save the updated property
      await property.save();
      console.log(`Updated schema for property: ${property.property_name}`);
    }

    console.log("Successfully updated all properties");
  } catch (error) {
    console.error("Error updating properties:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

updatePropertiesSchema();
