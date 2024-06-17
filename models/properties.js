const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newPropertySchema = new Schema(
  {
    property_name: String,
    property_name_slug: String,
    description: String,
    price: String,
    type: [String], // e.g., "townhouse", "semi-detached home"
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        lat: String,
        lng: String,
      },
    },
    features: {
      bedrooms: String,
      bathrooms: String,
      area: String, // in square feet or meters
      year_built: String,
      amenities: [String], // e.g., ["kids' play area", "skate park"]
    },
    images: [
      {
        url: String,
        description: String, // optional
      },
    ],
    gallery: [
      {
        url: String,
        description: String, // optional
      },
    ],
    status: [String], // e.g., "available", "sold", "pending"
    community_name: String,
    community_name_slug: String,
    community_features: {
      project_overview: String,
      nearby_facilities: [String], // e.g., ["hospital", "school"]
      transportation: [String], // e.g., ["Al Maktoum Intl' Airport", "District 2020"]
    },
    starting_price: String,
    show_property: Boolean, // true or false
    featured: Boolean, // true or false
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Property = mongoose.model("Property", newPropertySchema);

module.exports = Property;
