const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newPropertySchema = new Schema(
  {
    property_name: String,
    property_name_slug: String,
    description: String,
    price: String,
    developer: String,
    developer_name_slug: String,
    type: [{ _id: false, name: String, bedrooms: String }], // e.g., "townhouse", "semi-detached home"
    location: {
      _id: false,
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        _id: false,
        lat: String,
        lng: String,
      },
    },
    features: {
      _id: false,
      // bedrooms: String,
      bathrooms: String,
      area: String, // in square feet or meters
      year_built: String,
    },
    images: [
      {
        _id: false,
        heading: String,
        url: String,
        alt: String,
        description: String, // optional
      },
    ],
    gallery_title_1: String,
    gallery_title_2: String,
    gallery_description_1: String,
    gallery_description_2: String,
    gallery1: [String],
    gallery2: [String],
    status: [String], // e.g., "for sale", "latest", "off-plan"
    community_name: String,
    community_name_slug: String,
    community_features: {
      _id: false,
      project_overview: String,
      nearby_facilities: [String], // e.g., ["hospital", "school"]
      transportation: [String], // e.g., ["Al Maktoum Intl' Airport", "District 2020"]
    },
    show_property: Boolean, // true or false
    featured: Boolean, // true or false
    section_1: {
      _id: false,
      heading: String,
      title: String,
      description: String,
      image: String,
    },

    about_project: {
      _id: false,
      heading: String,
      title: String,
      description: String,
    },

    amenities: {
      _id: false,
      description: String,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    faqs: [
      {
        _id: false,
        question: { type: String },
        answer: { type: String },
      },
    ],
    // SEO fields
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "" }, // Example schema.org type
      properties: { type: Object }, // Additional properties for schema.org
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
      type: { type: String, default: "" },
    },
    order: { type: Number, required: true, unique: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const Property = mongoose.model("Property", newPropertySchema);

module.exports = Property;
