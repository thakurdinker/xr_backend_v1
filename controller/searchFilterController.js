const catchAsync = require("../utils/seedDB/catchAsync");
const Property = require("../models/properties");
const propertyTypes = require("../configs/property-types.json");
const { parseEmirate, emirateFilter } = require("../utils/emirate");

module.exports = catchAsync(async (req, res) => {
    // Community options for one emirate: Dubai unless ?emirate=abu-dhabi.
    const emirate = parseEmirate(req.query.emirate);
    if (!emirate) {
        return res.status(400).json({ success: false, message: "Invalid emirate" });
    }
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
                ...emirateFilter(emirate),
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
