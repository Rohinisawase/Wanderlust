const Listing = require('../models/listing');
const Booking = require("../models/booking"); // Make sure this is imported at the top


module.exports.index = async (req, res) => {
  let allListings = await Listing.find({}).populate("reviews");

  // Calculate average rating for each listing
  allListings = allListings.map(listing => {
    const ratings = listing.reviews.map(r => r.rating);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length) : 0;
    return {
      ...listing.toObject(),  // toObject so we can add properties
      avgRating: avg.toFixed(1)
    };
  });

  res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

module.exports.createListing = async (req, res, next) => {
  try {
    const listing = new Listing(req.body.listing);
    listing.owner = req.user._id;
    listing.image = req.file ? {
      url: req.file.path,
      filename: req.file.filename
    } : { url: "https://via.placeholder.com/300", filename: "default" };
    await listing.save();
    req.flash("success", "New Listing created!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    next(err);
  }
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({
      path: "reviews",
      populate: { path: "author" }
    });

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // Calculate average rating
  const ratings = listing.reviews.map(r => r.rating);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : null;

  // Check if the logged-in user has booked this listing
  let hasBooked = false;
  if (req.isAuthenticated()) {
    const booking = await Booking.findOne({
      listing: id,
      user: req.user._id
    });
    if (booking) {
      hasBooked = true;
    }
  }

  res.render("listings/show", {
    listing,
    avgRating,
    currUser: req.user,
    hasBooked
  });
};

module.exports.renderEditForm = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  res.render("listings/edit", {
    listing,
    originalImageUrl: listing.image.url.replace("/upload", "/upload/h_300,w_250")
  });
};

module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
    await listing.save();
  }
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyListing = async (req, res) => {
  await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};

module.exports.filterByCategory = async (req, res) => {
  const { category } = req.params;
  let listings = await Listing.find({ category }).populate("reviews");

  listings = listings.map(listing => {
    const ratings = listing.reviews.map(r => r.rating);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length) : 0;
    return {
      ...listing.toObject(),
      avgRating: avg.toFixed(1)
    };
  });

  res.render("listings/index", { allListings: listings });
};

module.exports.searchListings = async (req, res) => {
  const { q, minPrice, maxPrice, minRating, availableFrom, sort } = req.query;
  let query = {};
  if (q) query.$or = ["title", "location", "category"].map(f => ({ [f]: new RegExp(q, 'i') }));
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (minRating) query.rating = { $gte: Number(minRating) };
  if (availableFrom) query.availableFrom = { $lte: new Date(availableFrom) };

  let listingsQuery = Listing.find(query).populate("reviews");
  const sortOptions = {
    newest: { createdAt: -1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
    ratingHigh: { rating: -1 }
  };
  if (sort && sortOptions[sort]) listingsQuery = listingsQuery.sort(sortOptions[sort]);

  let listings = await listingsQuery;
  listings = listings.map(listing => {
    const ratings = listing.reviews.map(r => r.rating);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b) / ratings.length) : 0;
    return {
      ...listing.toObject(),
      avgRating: avg.toFixed(1)
    };
  });

  res.render("listings/index", { allListings: listings, searchQuery: q || "" });
};
