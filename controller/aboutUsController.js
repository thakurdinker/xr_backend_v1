const Agent = require("../models/agent");
const shuffle = require("../utils/shuffleArray");

module.exports.getAboutUs = async (req, res) => {
  //   Xperience Stars
  const agents = shuffle(
    await Agent.find({ hidden: false })
      .select("_id name name_slug phone languages profile_picture specialties")
      .limit(10)
  );

  res.status(200).json({ success: true, agents, message: "DONE" });
};
