const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    url:String,
    filename:  String,
 },
  price: {
    type: Number,
    required: true,
    min: 0,
     // Optional: Ensure price is non-negative
  },
  location: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  reviews: [
    {
      type:Schema.Types.ObjectId,
      ref:"Review",
    },
  ],
  owner:{
    type:Schema.Types.ObjectId,
    ref:"User",
  },
  category: {
    type: String,
    enum: [
      'rooms', 'iconic-cities', 'mountains', 'castles', 'boats', 
      'trending', 'pools', 'farm', 'arctic', 'domes'
    ],
    required: true
  }
  // models/user.js
   
});
listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({_id:{$in:listing.reviews}});
  }
  
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
