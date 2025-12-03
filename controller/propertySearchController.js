const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");

module.exports = catchAsync(async (req, res) => {
    const { propertyType, bedroom, priceRange, community } = req.body;


    // 1. Parse Price Range
    let minPrice = 0;
    let maxPrice = Infinity;

    if (priceRange) {
        const parts = priceRange.split("-").map((p) => p.trim().toUpperCase());
        if (parts.length === 2) {
            const parseValue = (val) => {
                if (val.includes("M")) return parseFloat(val.replace("M", "")) * 1000000;
                if (val.includes("K")) return parseFloat(val.replace("K", "")) * 1000;
                return parseFloat(val);
            };
            minPrice = parseValue(parts[0]);
            maxPrice = parseValue(parts[1]);
        }
    }

    // 2. Parse Bedroom
    let bedroomRegex = null;
    if (bedroom) {
        // Extract the number from "1 Bedroom" -> "1"
        const match = bedroom.match(/(\d+)/);
        if (match) {
            // Create regex to match the number as a whole word to avoid partial matches (e.g. "1" in "10")
            // The database has strings like "1, 2 & 3" or "Studio"
            // We want to check if the target number exists in that string.
            // \b is word boundary.
            bedroomRegex = new RegExp(`\\b${match[1]}\\b`, 'i');
        } else if (bedroom.toLowerCase().includes("studio")) {
            bedroomRegex = /studio/i;
        }
    }

    // 3. Build Aggregation Pipeline
    const pipeline = [];

    // Stage 1: Filter by Community (Case-insensitive)
    if (community) {
        pipeline.push({
            $match: {
                community_name: { $regex: `^${community}$`, $options: "i" },
            },
        });
    }

    // Stage 2: Filter by Property Type (Case-insensitive)
    // The 'type' field is an array of objects. We want to find docs where AT LEAST ONE element matches.
    // Using contains match (no anchors) to handle variations like "Apartment" matching "apartments" or "duplex-apartments"
    if (propertyType) {
        pipeline.push({
            $match: {
                "type.name": { $regex: propertyType, $options: "i" }
            }
        });
    }

    // Stage 3: Filter by Bedroom
    // We need to match if ANY of the type objects have the matching bedroom AND matching property type (if provided)
    // However, the user request implies a general search.
    // If propertyType is provided, we should ideally check that the SAME type entry has the bedroom.
    // But for now, a simple match on the array is a good starting point given the schema structure.
    if (bedroomRegex) {
        pipeline.push({
            $match: {
                "type.bedrooms": { $regex: bedroomRegex.source, $options: bedroomRegex.flags }
            }
        });
    }

    // Stage 4: Price Filtering (only if priceRange is provided)
    if (priceRange) {
        // Convert "AED 2,530,000" to number
        pipeline.push({
            $addFields: {
                numericPrice: {
                    $convert: {
                        input: {
                            $reduce: {
                                input: { $split: [{ $replaceAll: { input: { $replaceAll: { input: "$price", find: "AED", replacement: "" } }, find: ",", replacement: "" } }, " "] },
                                initialValue: "",
                                in: { $concat: ["$$value", "$$this"] }
                            }
                        },
                        to: "double",
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        });

        // Filter by numeric price
        pipeline.push({
            $match: {
                numericPrice: { $gte: minPrice, $lte: maxPrice }
            }
        });

        // Exclude the temporary numericPrice field from result
        pipeline.push({
            $project: {
                numericPrice: 0
            }
        });
    }



    const properties = await Property.aggregate(pipeline);

    return res.json({ success: true, count: properties.length, data: properties });
});