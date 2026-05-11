/**
 * Migration script: Convert gallery1 and gallery2 from [String] to [{ url, alt }]
 *
 * This script finds all properties where gallery1 or gallery2 contain plain strings
 * and converts them to { url: "<string>", alt: "" } objects.
 *
 * Usage:
 *   node scripts/migrateGalleryToObjects.js
 *
 * Make sure MONGODB_URI is set in your .env or environment variables.
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not found in environment variables.");
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const collection = db.collection("properties");

  // Find all properties that have gallery1 or gallery2 with at least one string element
  const cursor = collection.find({
    $or: [
      { "gallery1.0": { $type: "string" } },
      { "gallery2.0": { $type: "string" } },
    ],
  });

  let updatedCount = 0;
  let totalChecked = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    totalChecked++;

    const updates = {};

    if (doc.gallery1 && doc.gallery1.length > 0 && typeof doc.gallery1[0] === "string") {
      updates.gallery1 = doc.gallery1.map((url) => ({ url, alt: "" }));
    }

    if (doc.gallery2 && doc.gallery2.length > 0 && typeof doc.gallery2[0] === "string") {
      updates.gallery2 = doc.gallery2.map((url) => ({ url, alt: "" }));
    }

    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ _id: doc._id }, { $set: updates });
      updatedCount++;
      console.log(`  Migrated: ${doc.property_name || doc._id}`);
    }
  }

  console.log(`\nDone. Checked ${totalChecked} properties, migrated ${updatedCount}.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
