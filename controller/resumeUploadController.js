// const Resume = require("../models/resume");
const Contact = require("../models/submitForm");
const catchAsync = require("../utils/seedDB/catchAsync");

module.exports.uploadResume = catchAsync(async (req, res) => {
  const { originalname, path: filePath } = req.file;

  const contact = new Contact({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    resumeUrl: req?.file?.path,
    original_fileName: req?.file?.originalname,
    resume_fileName: req?.file?.filename,
  });
  //   const resume = new Resume({
  //     originalname,
  //     path: filePath,
  //     user: req.user._id,
  //   });
  //   await resume.save();

  await contact.save();
  //   console.log(req.file);
  res
    .status(201)
    .json({ message: "Resume uploaded successfully", id: contact._id });
});
