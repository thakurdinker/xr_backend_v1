const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newhomePageVideoSchema = new Schema({
  mainVideo: {
    url: {
      type: String,
      required: true,
    },
    agent: {
      type: mongoose.Types.ObjectId,
      ref: "Agent",
    },
  },
  videos: [
    {
      url: {
        type: String,
        required: true,
      },
      agent: {
        type: mongoose.Types.ObjectId,
        ref: "Agent",
      },
    },
  ],
});

const HomePageVideos = mongoose.model("HomePageVideos", newhomePageVideoSchema);

module.exports = HomePageVideos;
