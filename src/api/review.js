const express = require("express");

const reviewController = require("../controllers/reviewController");
const router = express.Router();

router.post("/give_review", reviewController.giveReview);
router.get(
  "/get_reviews_by_reviewer",
  reviewController.getAllReviewsByReviewer
);
router.post(
  "/get_review_by_reviewee_email_and_reviewer_id",
  reviewController.getReviewByRevieweeEmailAndReviewerId
);

router.get(
  "/get_reviews_and_ratings_by_reviewer",
  reviewController.getAllReviewsAndRatingByReviewer
);

router.get(
  "/get_reviews_and_ratings_of_reviewee",
  reviewController.getAllReviewsAndRatingOfReviewee
);
router.get(
  "/get_review_and_rating_by_reviewer_id_and_reviewee_email",
  reviewController.getReviewAndRatingByReviewerIdAndRevieweeEmail
);

router.post("/update_review", reviewController.updateReview);
router.post("/delete_review", reviewController.deleteReview);
router.get(
  "/get_reviews_of_reviewee",
  reviewController.getAllReviewsOfReveiwee
);

module.exports = router;
// teacher revieww 30123777d98a91cd18b7aac96a8d13985bf36c24e8c5886df3eb929b011ff15f270f73e4ad1914c02fd3cb5834f5a96a4270dc85cd9b3a7ab6350aa631f7c286a5cedc55d3df4adab067269f225da340cff4bbfaecb51336d0129593cf407d772abc9f14e33cdf39abdcdc03e7d1ab360e30da8a4a7f135dbf49ffbf660c48c3137a8e084c7c6fc5d31b32ece769ed7b2544cbc80aacf9be72759f19863f30d769bbc68318822d30f22f61bfa6ef0877c2a9928680744e9de51effc41cb04eb6fb11ce5afc6f421a6c288811ee3655656c1f2c9a771d44dec091450b3c605609aec4f49fa8112fff7db858231407b0cb3178dad45322f47f91249906f45bcdf9
// the revieww 2250da25f739d24e0d74b905a813156f8373b010118a309c44a8cffbac296439725351d2efcb741598e284b16f5b1f362b6b02aae088b69e1cbd6f1593d4a86cd0a928309b13a1727fe60d157d8faed7f1a24033c967ee92612ed8c1b7e10e99a9bf4b6b160942e3ee5b15d6833712c80068bbbb044e0688f19f1813c931c7c9125d68056cb0a3ff35f75e5f0b6eb9a3a720226219fc6755aedb0974bc411a20ecaa50afece232fb49d2442952c7fe2c6e635f82e3031995c2ae401a755f63f8d0d67ae96a1aa7b847e8f10392f7117d96e19078f403f2bbc9c38dd4427817691f830c133bd3c996c0b17d4d4a8365e501f0040d4a191a3457360e2dd258bcf7
//me reviewr 22391f34a5c4e4b2d9ce2682c0d8d27044e2362f115d3d0c3036479f6eb42625537f5aa060e90859f92ad5a7bb65f4cee753578a47ae25289bf83c8978ec653ba9c64da379ccb05c12187f80366bcf80eb3543c7958b198d4bda5a4ccfc6522356bea2864790c9aae16d23959ec13a3405875ddc211ea573769494a9b4388184666cb71b332426e4d25e4e28b741dbcb73ce853707c4abf33ad00107e997e84ecd4f33108b58bc69dea8a61429e552756fc8bda7471372a7a158076dd74cf7cc24550faced3e4cc05d023b2e2ad4c385e80959959d7b683c3557e553d1dbb9067e5ab2476878ce82fc3cb9e6604feaec9ee1f5a72f15d1a200db18786a6ef431
// chandu 377a67d00fb526afa888dc18624a55e1d7ed712da45f770b603a5a65f2ca9ff42e91104572e71352b38b3d64e2e3d098e23c48602cd34688ac69939558968882d288b459e8116405a469b6504fa984e10561ce715e10e87767787294c2bbb6ec00942f060ac46d62b2cfba0ee1ee182a8a0cdf556aafcd2e5256a594ca4b056d0d909e26f715ea429502ceb0375f62d1bfa5410d33921de3f05a633f508dac8ad05ece4387c2d0678552e3dc189ed6a2c065cf3267312707c96560965ae378843c364dd742bd5682f4f15c3f2855e82f5fc59d294402edcf9acce216d79a03ff8e8324d303d2294760cca2062b1c17b7f8e5cdd11c9a581485ae269bd51da224
