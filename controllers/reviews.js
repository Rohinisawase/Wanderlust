const Review = require("../models/review");
const Listing = require("../models/listing");

module.exports.createReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/listings");
    }

    const { rating, comment } = req.body.review;
    if (!rating || !comment) {
      req.flash("error", "All fields are required.");
      return res.redirect(`/listings/${id}`);
    }

    // Optional: Check if the user has booked the listing before allowing review
    // const hasBooked = await Booking.exists({ user: req.user._id, listing: id });
    // if (!hasBooked) {
    //   req.flash("error", "You can only review a listing after booking it.");
    //   return res.redirect(`/listings/${id}`);
    // }

    const review = new Review({ rating, comment });
    review.author = req.user._id;

    listing.reviews.push(review);
    await review.save();
    await listing.save();

    req.flash("success", "Review added!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};

module.exports.destroyReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};
