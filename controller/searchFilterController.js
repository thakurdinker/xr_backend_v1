const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");
const propertyTypes = require("../configs/property-types.json");

module.exports = catchAsync(async (req, res) => {
    // Communities for the search dropdown are derived from the PROPERTIES
    // themselves (distinct community_name_slug + its display name), not from the
    // Community/guides collection. This guarantees:
    //   • every option has >= 1 matching property (no dead "0 results" options),
    //   • the returned `slug` is exactly what /property-search matches on,
    //   • the guide-titled entries ("... Guide") never appear.
    // `slug` is the value the client sends; `name` is the human label shown.
    const rows = await Property.aggregate([
        {
            $match: {
                show_property: true,
                community_name_slug: { $nin: [null, ""] },
            },
        },
        {
            $group: {
                _id: "$community_name_slug",
                name: { $first: "$community_name" },
            },
        },
        { $sort: { name: 1 } },
    ]);

    const communities = rows.map((r) => ({
        name: (r.name || "").trim(),
        slug: r._id,
    }));

    // Extract property type names from the JSON file
    const types = propertyTypes.map(type => ({
        name: type.name,
        // name_slug: type.name_slug
    }));

    res.status(200).json({
        success: true,
        data: {
            propertyTypes: types,
            communities: communities
        }
    });
});
