const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const reviewController = require("../controllers/reviews.js");

const {
  validateReview,
  isLoggedIn,
  isReviewAuthor,
  hasBookedListing, // ✅ Import this
} = require("../middleware.js");

// POST: Create a review (only if the user has booked the listing)
router.post(
  "/",
  isLoggedIn,
  hasBookedListing, // ✅ Check booking before review
  validateReview,
  wrapAsync(reviewController.createReview)
);

// DELETE: Remove a review
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.destroyReview)
);

module.exports = router;
