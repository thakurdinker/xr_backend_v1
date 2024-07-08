const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Property = require("../../models/properties");

const DB_URL = process.env.DB_URL;

// Array of sample property data
const properties = [
  {
    property_name: "Sample Property 1",
    property_name_slug: "sample-property-1",
    description: "This is a sample description for property 1",
    price: "1000000",
    developer: "Developer 1",
    developer_name_slug: "developer-1",
    type: ["townhouse"],
    location: {
      address: "123 Sample Street",
      city: "Sample City",
      state: "Sample State",
      country: "Sample Country",
      coordinates: {
        lat: "25.276987",
        lng: "55.296249",
      },
    },
    features: {
      bedrooms: "3",
      bathrooms: "2",
      area: "1500 sq ft",
      year_built: "2020",
      amenities: ["kids' play area", "skate park"],
    },
    images: [{ url: "https://example.com/image1.jpg", description: "Image 1" }],
    gallery: [
      { url: "https://example.com/gallery1.jpg", description: "Gallery 1" },
    ],
    status: ["for sale", "latest"],
    community_name: "Sample Community 1",
    community_name_slug: "sample-community-1",
    community_features: {
      project_overview: "This is a sample project overview for community 1",
      nearby_facilities: ["hospital", "school"],
      transportation: ["Al Maktoum Intl' Airport", "District 2020"],
    },
    show_property: true,
    featured: false,
  },
  // Add 19 more sample documents here...
];

// Repeat the above object 19 times with different values
for (let i = 2; i <= 20; i++) {
  properties.push({
    property_name: `Sample Property ${i}`,
    property_name_slug: `sample-property-${i}`,
    description: `This is a sample description for property ${i}`,
    price: `${1000000 + i * 10000}`,
    developer: `Developer ${i}`,
    developer_name_slug: `developer-${i}`,
    type: i % 3 === 0 ? ["semi-detached home"] : ["townhouse"],
    location: {
      address: `123 Sample Street ${i}`,
      city: "Sample City",
      state: "Sample State",
      country: "Sample Country",
      coordinates: {
        lat: `${25.276987 + i * 0.01}`,
        lng: `${55.296249 + i * 0.01}`,
      },
    },
    features: {
      bedrooms: `${2 + (i % 3)}`,
      bathrooms: `${1 + (i % 2)}`,
      area: `${1500 + i * 50} sq ft`,
      year_built: `${2020 + (i % 5)}`,
      amenities: ["kids' play area", "skate park"],
    },
    images: [
      { url: `https://example.com/image${i}.jpg`, description: `Image ${i}` },
    ],
    gallery: [
      {
        url: `https://example.com/gallery${i}.jpg`,
        description: `Gallery ${i}`,
      },
    ],
    status: i % 2 === 0 ? ["for sale"] : ["off-plan"],
    community_name: `Sample Community ${i}`,
    community_name_slug: `sample-community-${i}`,
    community_features: {
      project_overview: `This is a sample project overview for community ${i}`,
      nearby_facilities: ["hospital", "school"],
      transportation: ["Al Maktoum Intl' Airport", "District 2020"],
    },
    show_property: i % 2 === 0,
    featured: i % 3 === 0,
  });
}
const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

const seedProperties = async () => {
  try {
    await Property.deleteMany({});
    console.log("Properties deleted Successfully");
    await Property.insertMany(properties);
    console.log("Properties seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedProperties().then(() => mongoose.connection.close())
);
