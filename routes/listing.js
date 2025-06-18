const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require('../models/listing.js');
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });
const User = require("../models/user");

// ✅ Static routes FIRST
router.get("/new", isLoggedIn, listingController.renderNewForm);
router.get("/search", wrapAsync(listingController.searchListings));
router.get("/categories/:category", wrapAsync(listingController.filterByCategory));

// ✅ Listing index + create
router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );

// ✅ Dynamic ID routes LAST
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    upload.single('listing[image]'),
    isLoggedIn,
    isOwner,
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );
  // ❤️ Toggle favorite listing
router.post("/:id/favorite", isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  const index = user.favorites.indexOf(id);
  if (index > -1) {
    // Already favorited → remove
    user.favorites.splice(index, 1);
    req.flash("success", "Removed from favorites.");
  } else {
    // Not favorited → add
    user.favorites.push(id);
    req.flash("success", "Added to favorites.");
  }

  await user.save();
  res.redirect("back");
}));

module.exports = router;
