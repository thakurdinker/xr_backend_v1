const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const newhomePageVideoSchema = new Schema({
  mainVideo: {
    _id: false,
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    agent: {
      type: mongoose.Types.ObjectId,
      ref: "Agent",
    },
  },
  videos: [
    {
      _id: false,
      url: {
        type: String,
        required: true,
      },
      title: {
        type: String,
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
