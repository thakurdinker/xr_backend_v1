// routes/projects.js

const express = require('express');
const router = express.Router();
const projectOfTheMonthController = require('../controller/projectOfTheMonthController');
const { isLoggedIn, isAdmin } = require('../middleware/middleware');

// POST route to create or update the project of the month
router.post('/project-of-the-month', isLoggedIn, isAdmin, projectOfTheMonthController.saveProjectOfTheMonth);

// GET route to retrieve the project of the month
router.get('/project-of-the-month', isLoggedIn, projectOfTheMonthController.getProjectOfTheMonth);

module.exports = router;
