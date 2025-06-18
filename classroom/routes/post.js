const express = require("express");
const router = express.Router();
//POST
//Index
app.get("/",(req,res)=>{
    res.send("GET for posts");
});

//Show
app.get("/:id",(req,res)=>{
    res.send("GET for post Id");
});
//POST
app.post("/",(req,res)=>{
    res.send("POST for posts");
});
//DELETE
app.delete("/:id",(req,res)=>{
    res.send("DELETE for post id");
});
module.exports = router;
