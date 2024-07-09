const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Property = require("../../models/properties");

const DB_URL = process.env.DB_URL;

const { faker } = require("@faker-js/faker");

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

const unsplashImages = [
  "https://picsum.photos/1920/1080",
  "https://picsum.photos/1920/1080",
  "https://picsum.photos/1920/1080",
  "https://picsum.photos/1920/1080",
  "https://picsum.photos/1920/1080",
];

const createProperty = () => {
  return {
    property_name: faker.commerce.productName(),
    property_name_slug: faker.helpers.slugify(faker.commerce.productName()),
    description: faker.lorem.paragraph(),
    price: faker.commerce.price(),
    developer: faker.company.name(),
    developer_name_slug: faker.helpers.slugify(faker.company.name()),
    type: [
      faker.helpers.arrayElement([
        "townhouse",
        "semi-detached home",
        "apartment",
        "villa",
      ]),
    ],
    location: {
      address: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      country: faker.address.country(),
      coordinates: {
        lat: faker.address.latitude(),
        lng: faker.address.longitude(),
      },
    },
    features: {
      bedrooms: faker.datatype.number({ min: 1, max: 5 }).toString(),
      bathrooms: faker.datatype.number({ min: 1, max: 3 }).toString(),
      area: faker.datatype.number({ min: 500, max: 5000 }).toString(),
      year_built: faker.date.past(20).getFullYear().toString(),
    },
    images: [
      {
        heading: faker.lorem.words(),
        url: faker.helpers.arrayElement(unsplashImages),
        description: faker.lorem.sentence(),
      },
    ],
    gallery: [
      {
        url: faker.helpers.arrayElement(unsplashImages),
        title1: faker.lorem.words(),
        title2: faker.lorem.words(),
        description1: faker.lorem.sentence(),
        description2: faker.lorem.sentence(),
      },
    ],
    status: [faker.helpers.arrayElement(["for sale", "latest", "off-plan"])],
    community_name: faker.address.city(),
    community_name_slug: faker.helpers.slugify(faker.address.city()),
    community_features: {
      project_overview: faker.lorem.paragraph(),
      nearby_facilities: [
        faker.helpers.arrayElement(["hospital", "school", "mall", "park"]),
      ],
      transportation: [
        faker.helpers.arrayElement([
          "Al Maktoum Intl' Airport",
          "District 2020",
          "Metro Station",
        ]),
      ],
    },
    show_property: faker.datatype.boolean(),
    featured: faker.datatype.boolean(),
    section_1: {
      heading: faker.lorem.words(),
      title: faker.lorem.words(),
      description: faker.lorem.paragraph(),
    },
    about_project: {
      heading: faker.lorem.words(),
      title: faker.lorem.words(),
      description: faker.lorem.paragraph(),
    },
    amenities: {
      description: faker.lorem.paragraph(),
      icons: {
        icon_url: faker.helpers.arrayElement(unsplashImages),
        icon_text: faker.lorem.words(),
      },
    },
    faqs: [
      {
        question: faker.lorem.sentence(),
        answer: faker.lorem.paragraph(),
      },
    ],
    meta_title: faker.lorem.words(),
    meta_description: faker.lorem.sentence(),
    keywords: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
    schema_org: {
      type: "Article",
      properties: {
        additionalType: "Property",
      },
    },
    open_graph: {
      title: faker.lorem.words(),
      description: faker.lorem.sentence(),
      image: faker.helpers.arrayElement(unsplashImages),
      type: "article",
    },
  };
};

// Repeat the above object 19 times with different values
// for (let i = 2; i <= 20; i++) {
//   properties.push({
//     property_name: `Sample Property ${i}`,
//     property_name_slug: `sample-property-${i}`,
//     description: `This is a sample description for property ${i}`,
//     price: `${1000000 + i * 10000}`,
//     developer: `Developer ${i}`,
//     developer_name_slug: `developer-${i}`,
//     type: i % 3 === 0 ? ["semi-detached home"] : ["townhouse"],
//     location: {
//       address: `123 Sample Street ${i}`,
//       city: "Sample City",
//       state: "Sample State",
//       country: "Sample Country",
//       coordinates: {
//         lat: `${25.276987 + i * 0.01}`,
//         lng: `${55.296249 + i * 0.01}`,
//       },
//     },
//     features: {
//       bedrooms: `${2 + (i % 3)}`,
//       bathrooms: `${1 + (i % 2)}`,
//       area: `${1500 + i * 50} sq ft`,
//       year_built: `${2020 + (i % 5)}`,
//       amenities: ["kids' play area", "skate park"],
//     },
//     images: [
//       { url: `https://example.com/image${i}.jpg`, description: `Image ${i}` },
//     ],
//     gallery: [
//       {
//         url: `https://example.com/gallery${i}.jpg`,
//         description: `Gallery ${i}`,
//       },
//     ],
//     status: i % 2 === 0 ? ["for sale"] : ["off-plan"],
//     community_name: `Sample Community ${i}`,
//     community_name_slug: `sample-community-${i}`,
//     community_features: {
//       project_overview: `This is a sample project overview for community ${i}`,
//       nearby_facilities: ["hospital", "school"],
//       transportation: ["Al Maktoum Intl' Airport", "District 2020"],
//     },
//     show_property: i % 2 === 0,
//     featured: i % 3 === 0,
//   });
// }
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
    for (let i = 0; i < 20; i++) {
      const property = createProperty();
      await Property.create(property);
    }
    // await Property.insertMany(properties);
    console.log("Properties seeded successfully");
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() =>
  seedProperties().then(() => mongoose.connection.close())
);
