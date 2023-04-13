const express = require('express');

const reviewController = require('../controllers/reviewController');
const router = express.Router();

router.post('/give_review', reviewController.giveReview);
router.get('/get_reviews_by_reviewer', reviewController.getAllReviewsByReviewer);
router.get('/get_review_id_by_reviewee_email_and_reviewer_id', reviewController.getReviewIdByRevieweeEmailAndReviewerId);
router.post('/update_review', reviewController.updateReview);
router.post('/delete_review', reviewController.deleteReview);

module.exports = router;
