const express = require('express');

const ratingController = require('../controllers/ratingController');
const router = express.Router();

router.post('/give_rating', ratingController.giveRating);
router.get('/get_ratings_by_reviewer', ratingController.getAllRatingsbyReviewer);
router.get('/get_rating_id_by_reviewee_email_and_reviewer_id', ratingController.getRatingIdByRevieweeEmailAndReviewerId);
router.post('/update_rating', ratingController.updateRating);
router.post('/delete_rating', ratingController.deleteRating);

module.exports = router;
