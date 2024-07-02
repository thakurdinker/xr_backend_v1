const express = require("express");
const catchAsync = require("../utils/seedDB/catchAsync");
const Agent = require("../models/agent");
const shuffle = require("../utils/shuffleArray");

const router = express.Router({ mergeParams: true });

router.route("/:agentSlug").get(
  catchAsync(async (req, res) => {
    const { agentSlug } = req.params;
    const agent = await Agent.findOne({ name_slug: agentSlug });

    if (!agent) {
      return res.status(200).json({
        success: true,
        agent: null,
        moreOfTheTeam: null,
        message: "DONE",
      });
    }

    const moreOfTheTeam = shuffle(
      await Agent.find({ _id: { $ne: agent._id } })
    ).slice(0, 9);

    return res.status(200).json({
      success: true,
      agent,
      moreOfTheTeam,
      message: "DONE",
    });
  })
);

module.exports = router;
