const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { isLoggedIn } = require("../middleware");

router.get("/favorites", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");
  res.render("listings/favorites", { favorites: user.favorites });
});

module.exports = router;
