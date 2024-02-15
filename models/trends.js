const mongoose = require("mongoose");

const trendsSchema = mongoose.Schema({
    name: String,
    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "tweets" }],
});

const Trends = mongoose.model("trends", trendsSchema);

module.exports = Trends;
