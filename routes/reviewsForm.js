const express = require('express');
const { submitReviewsForm } = require('../controller/reviewsFormController');

const router = express.Router();

router.post('/review', submitReviewsForm);

module.exports = router;
