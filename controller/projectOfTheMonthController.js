// controller/projectOfTheMonthController.js

const Project = require("../models/ProjectOfTheMonthModel"); // Assuming you have a Project model

// Controller to create or update the project of the month
exports.saveProjectOfTheMonth = async (req, res) => {
  try {
    const { videoUrl, images, projectName, description, amenities, headings } =
      req.body;

    // Check if a project of the month already exists
    let project = await Project.findOne({});

    if (project) {
      // Update the existing project
      project.videoUrl = videoUrl;
      project.images = images;
      project.projectName = projectName;
      project.description = description;
      project.amenities = amenities;
      project.headings = headings;
      await project.save();
    } else {
      // Create a new project
      project = new Project({
        videoUrl,
        images,
        projectName,
        description,
        amenities,
        headings,
      });
      await project.save();
    }

    res
      .status(201)
      .json({
        success: true,
        message: "Project of the Month saved successfully",
        project,
      });
  } catch (error) {
    console.error("Error saving project of the month:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while saving the project of the month",
      });
  }
};

// Controller to get the project of the month
exports.getProjectOfTheMonth = async (req, res) => {
  try {
    const project = await Project.findOne({});
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project of the Month not found" });
    }
    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error("Error fetching project of the month:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while fetching the project of the month",
      });
  }
};
