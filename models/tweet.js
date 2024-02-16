const mongoose = require("mongoose");

const tweetsSchema = mongoose.Schema({
    content: String,
    tweetedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    trends: [{ type: mongoose.Schema.Types.ObjectId, ref: "trends" }],
    createdAt: Date,
});

const Tweets = mongoose.model("tweets", tweetsSchema);

module.exports = Tweets;
