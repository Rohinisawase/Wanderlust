const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");

// CREATE booking
router.post("/listings/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { fromDate, toDate } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  const conflict = await Booking.findOne({
    listing: id,
    $or: [
      { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }
    ]
  });

  if (conflict) {
    req.flash("error", "Those dates are already booked.");
    return res.redirect(`/listings/${id}`);
  }

  const days = (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24);
  if (days <= 0) {
    req.flash("error", "Invalid date range.");
    return res.redirect(`/listings/${id}`);
  }

  const total = days * listing.price;

  const booking = new Booking({
    listing,
    user: req.user._id,
    fromDate,
    toDate,
    total
  });

  await booking.save();

  req.flash("success", "Booking confirmed!");
  res.redirect("/bookings");
});

// VIEW user’s bookings
router.get("/bookings", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate("listing");
  res.render("listings/bookings", { bookings });
});

// DELETE a booking
router.delete("/bookings/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/bookings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You are not authorized to cancel this booking.");
    return res.redirect("/bookings");
  }

  await Booking.findByIdAndDelete(id);
  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/bookings");
});

module.exports = router;
