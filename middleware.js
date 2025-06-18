const Listing = require("./models/listing");
const Review = require("./models/review");
const Booking = require("./models/booking"); // ✅ Added
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to create a listing!");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currUser._id)) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.validateListing = (req, res, next) => {
  console.log("Received Data for Validation:", req.body);
  const { error } = listingSchema.validate(req.body);
  if (error) {
    console.error("Validation Error:", error.details);
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    console.log("Validation Passed!");
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(errMsg, 400);
  } else {
    next();
  }
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(res.locals.currUser._id)) {
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// ✅ NEW: Only allow users who booked the listing to review
module.exports.hasBookedListing = async (req, res, next) => {
  const listingId = req.params.id;
  const userId = req.user._id;

  // Ensure user has a booking for this listing
  const booking = await Booking.findOne({
    listing: listingId,
    user: userId,
  });

  if (!booking) {
    req.flash("error", "You can only review listings you have booked.");
    return res.redirect(`/listings/${listingId}`);
  }

  // Optional: Prevent duplicate reviews by same user
  const existingReview = await Review.findOne({
    listing: listingId,
    author: userId,
  });

  if (existingReview) {
    req.flash("error", "You have already reviewed this listing.");
    return res.redirect(`/listings/${listingId}`);
  }

  next();
};
