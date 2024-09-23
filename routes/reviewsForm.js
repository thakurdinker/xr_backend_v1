const express = require('express');
const { submitReviewsForm, getReviews } = require('../controller/reviewsFormController');

const router = express.Router();

router.post("/reviews", submitReviewsForm);

module.exports = router;
