const mongoose = require("mongoose");

const ProjectOfTheMonthSchema = new mongoose.Schema(
  {
    videoUrl: {
      _id: false,
      type: String,
      required: true,
    },
    projectName: {
      _id: false,
      type: String,
      required: true,
    },
    description: {
      _id: false,
      type: String,
      required: true,
    },
    amenities: {
      _id: false,
      icons: [{ type: mongoose.Types.ObjectId, ref: "Icon" }],
    },
    headings: [
      {
        _id: false,
        heading: String,
        description: String,
      },
    ],
    images: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectOfTheMonth", ProjectOfTheMonthSchema);
