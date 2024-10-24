const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../vars/.env") });

const mongoose = require("mongoose");
const Content = require("../../models/content");

const DB_URL = process.env.DB_URL;

// Array of sample content data
const slug = [
  "iit-delhi-abu-dhabi",
  "rent-in-dubai",
  "renew-indian-passports",
  "selling-property-in-dubai",
  "national-university-of-dubai",
  "jp-morgan",
  "dubai-metro",
  "property-market",
  "buying-properties-in-dubai",
  "emaar-properties-H1-2024-financial-results",
  "al-maktoum-airport",
  "property-investors-in-dubai",
  "dubai-real-estate",
  "real-estate-news",
  "emaar-awards",
  "ras-al-khaimah-2",
  "purchasing-property-in-dubai",
  "life-in-dubai",
  "xperience-realty",
  "dubai-real-estate-bubble",
  "dubai-tourism-and-population-growth",
  "protech-revolution-in-dubai-real-estate",
  "dubai-real-estate-transformation",
  "dubai-real-estate-market-forecast",
  "one-million-plan",
  "ras-al-khaimah",
  "dubai-tenants-to-consider-homeownership",
  "foreign-exchange-and-currency-considerations-in-dubai-real-estate-investment",
  "mastering-finance-at-difc-your-next-business-move",
  "dubai-real-estate-forecast-2024",
  "rents-in-dubai-high-demand-areas",
  "affordable-housing-in-dubai",
  "emaar-top-brokers-2023-q3",
  "affordable-freehold-areas-in-dubai",
  "mortgage-process-in-dubai",
  "new-mega-projects-in-dubai",
  "creek-project-faces-redesign",
  "coping-with-property-handover-delays-in-dubai",
  "rak-real-estate",
  "nikki-beach-in-ras-al-khaimah",
  "future-proof-investments",
  "dubai-property-prices",
  "investment-in-dubai-real-estate-opportunities",
  "sail-gp-racing",
  "un-climate-summit",
  "2024-trends-in-dubai-real-estate",
  "dubai-watch-week",
  "buy-property-in-dubai-proptube",
  "best-residential-areas-in-dubai",
  "ejari-registration",
  "top-notch-infrastructure-fuels-economic-growth",
  "real-estate-investment-with-insurance",
  "gcc-visa",
  "real-estate-growth-with-free-zones-in-dubai",
  "why-indo-canadians-people-buy-property-in-dubai",
  "plot-in-dubai-real-estate",
  "dubai-renters-renew-contracts-despite-increased-rents",
  "best-mid-range-real-estate-investment-areas-in-dubai",
  "dubai-real-estate-after-covid",
  "invest-in-dubai-real-estate",
  "top-buyer-nationalities-in-dubai-real-estate",
  "purchase-property-in-dubai",
  "investors-visa-in-dubai",
  "dubai-property-laws",
  "dubai-real-estate-a-bubble",
  "off-plan-property-market",
  "dubai-real-estate-agent",
  "dubai-creek-tower",
  "dubai-real-estate-brokers",
  "dubais-population-growth-and-real-estate-evolution",
  "palm-jebel-ali",
  "dubai-stock-market",
  "residential-property-market",
  "al-maktoum-international-airport",
  "dubai-real-estate-market",
  "trends-in-the-dubai-real-estate-market",
];

const connectToDB = async () => {
  mongoose.connect(DB_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error: "));
  db.once("open", () => {
    console.log("Database connected");
  });
};

const seedContent = async () => {
  try {
    await Content.updateMany({ category: "article" }, { category: "Blog" });
  } catch (error) {
    console.error("Error seeding the database", error);
  }
};

connectToDB().then(() => seedContent().then(() => mongoose.connection.close()));
