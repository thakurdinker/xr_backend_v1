const mongoose = require("mongoose");
const {
  EMIRATES,
  DEFAULT_EMIRATE,
  emirateFilter,
} = require("../utils/emirate");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String },
    slug: { type: String, unique: true }, // SEO-friendly URL
    description: { type: String }, // Detailed description
    location: {
      _id: false,
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      coordinates: {
        _id: false,
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    amenities: {
      _id: false,
      description: String,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    images: [
      {
        _id: false,
        url: { type: String },
        alt: { type: String },
        heading: { type: String },
        description: { type: String },
      },
    ],
    faqs: [
      {
        _id: false,
        question: { type: String },
        answer: { type: String },
      },
    ],
    seo: {
      _id: false,
      meta_title: { type: String },
      meta_description: { type: String },
      meta_canonical_url: { type: String },
      keywords: [{ type: String }],
    },
    schema_org: {
      _id: false,
      type: { type: String, default: "Place" },
      properties: { type: Object },
    },
    open_graph: {
      _id: false,
      title: { type: String },
      description: { type: String },
      image: { type: String },
    },
    order: Number,
    developer: String,
    developer_name_slug: String,
    // Which emirate this area belongs to. Properties inherit it (see the
    // pre-save hook in models/properties.js). Missing on legacy rows = Dubai.
    emirate: { type: String, enum: EMIRATES, default: DEFAULT_EMIRATE },
    // SEO-controlled: keep this area page out of search indexes.
    noindex: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Function to modify the Cloudinary URL
function modifyCloudinaryUrl(url) {
  // Define the part where you want to insert the transformation parameters
  const insertionPoint = "/upload/";
  const transformation = "w_1280,f_auto,q_auto/";

  // Check if the URL contains the insertion point
  if (url && url.includes(insertionPoint)) {
    // Find the position to insert the transformation
    const index = url.indexOf(insertionPoint) + insertionPoint.length;

    // Insert the transformation at the correct position
    return url.slice(0, index) + transformation + url.slice(index);
  }
  // Return the original URL if insertion point is not found
  return url;
}

// // Add a post hook to modify image URLs in various fields
// communitySchema.post("find", function (docs) {
//   docs.forEach((doc) => {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URL in `schema_org.properties.image` if it exists
//     if (
//       doc.schema_org &&
//       doc.schema_org.properties &&
//       doc.schema_org.properties.image
//     ) {
//       doc.schema_org.properties.image = modifyCloudinaryUrl(
//         doc.schema_org.properties.image
//       );
//     }

//     // Modify URL in `open_graph.image` if it exists
//     if (doc.open_graph && doc.open_graph.image) {
//       doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
//     }
//   });
// });

// // Add a post hook to modify image URLs for a single document
// communitySchema.post("findOne", function (doc) {
//   if (doc) {
//     // Modify URLs in the `images` array
//     if (doc.images && doc.images.length > 0) {
//       doc.images.forEach((image) => {
//         image.url = modifyCloudinaryUrl(image.url);
//       });
//     }

//     // Modify URL in `schema_org.properties.image` if it exists
//     if (
//       doc.schema_org &&
//       doc.schema_org.properties &&
//       doc.schema_org.properties.image
//     ) {
//       doc.schema_org.properties.image = modifyCloudinaryUrl(
//         doc.schema_org.properties.image
//       );
//     }

//     // Modify URL in `open_graph.image` if it exists
//     if (doc.open_graph && doc.open_graph.image) {
//       doc.open_graph.image = modifyCloudinaryUrl(doc.open_graph.image);
//     }
//   }
// });

// The clash check and the move both select an area's properties with this
// case-insensitive, whitespace-tolerant match on community_name_slug.
const areaPropertiesFilter = (areaSlug) => {
  const slug = areaSlug.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    community_name_slug: { $regex: `^\\s*${slug}\\s*$`, $options: "i" },
  };
};

/**
 * Property slugs are unique only within an emirate (see findSlugClash in
 * controller/propertiesController.js). Moving an area takes its properties to
 * the destination emirate, so any of their slugs already used there would give
 * two properties the same URL. Returns those slugs, sorted (empty = safe move).
 */
communitySchema.statics.findAreaMoveClashes = async function (
  areaSlug,
  emirate
) {
  if (!areaSlug || !areaSlug.trim()) return [];
  const Property = mongoose.model("Property");
  const own = await Property.find(
    areaPropertiesFilter(areaSlug),
    "_id property_name_slug",
    { lean: true }
  );
  const ownSlugs = [
    ...new Set(own.map((p) => p.property_name_slug).filter(Boolean)),
  ];
  if (!ownSlugs.length) return [];
  const clashes = await Property.find(
    {
      property_name_slug: { $in: ownSlugs },
      ...emirateFilter(emirate),
      _id: { $nin: own.map((p) => p._id) },
    },
    "property_name_slug",
    { lean: true }
  );
  return [...new Set(clashes.map((p) => p.property_name_slug))].sort();
};

// One message for the admin panel response and the model guard below.
communitySchema.statics.areaMoveClashMessage = (emirate, slugs) =>
  `Cannot move this area to ${emirate}: these project slugs already exist ` +
  `there: ${slugs.join(", ")}. Change those slugs first.`;

// At save time the slug may already hold a new value, but the properties still
// point at the slug the area was loaded with. Remember that one.
communitySchema.post("init", function () {
  this.$locals.loadedSlug = this.slug;
});

// Moving an area to another emirate moves its properties with it. Refuse the
// save when that move would duplicate a property URL, so neither the area nor
// its properties change.
communitySchema.pre("save", async function () {
  this.$locals.emirateChanged = !this.isNew && this.isModified("emirate");
  if (!this.$locals.emirateChanged) return;
  const Community = this.constructor;
  const clashes = await Community.findAreaMoveClashes(
    this.$locals.loadedSlug ?? this.slug,
    this.emirate
  );
  if (clashes.length) {
    throw new Error(Community.areaMoveClashMessage(this.emirate, clashes));
  }
});

communitySchema.post("save", async function (doc) {
  const areaSlug = doc.$locals.loadedSlug ?? doc.slug;
  doc.$locals.loadedSlug = doc.slug; // later saves of this doc start from here
  if (!doc.$locals.emirateChanged || !areaSlug || !areaSlug.trim()) return;
  await mongoose
    .model("Property")
    .updateMany(areaPropertiesFilter(areaSlug), {
      $set: { emirate: doc.emirate },
    });
});

const Community = mongoose.model("Community", communitySchema);

module.exports = Community;
