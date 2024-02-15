const mongoose = require("mongoose");
const Tweets = require("../models/tweet");
const Users = require("../models/users");
const { checkBody } = require("../modules/checkBody");
var express = require("express");
var router = express.Router();
const Trends = require("../models/trends");

router.post("/addTweet", async function (req, res) {
    if (!checkBody(req.body, ["username", "token", "content"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }

    findUserId(req.body.username, req.body.token).then(async (id) => {
        if (!id) {
            res.json({ result: false, error: "User not found" });
            return;
        }
        const trends = searchTrendFromContent(req.body.content);
        let trendIds = [];

        if (trends) {
            for (const trend of trends) {
                let data = await checkIfTrendExists(trend);
                if (!data) {
                    const newTrend = new Trends({
                        name: trend,
                        tweets: [],
                    });
                    let savedTrend = await newTrend.save();
                    trendIds.push(savedTrend._id);
                } else {
                    trendIds.push(data._id);
                }
            }
        }

        const newTweet = new Tweets({
            content: req.body.content,
            tweetedBy: id,
            likedBy: [],
            trends: trendIds,
        });

        newTweet.save().then((tweet) => {
            res.json({ result: true, tweet: tweet });
        });
    });
});

router.get("/removeTweet/:id", function (req, res) {
    Tweets.findByIdAndDelete(req.params.id).then((tweet) => {
        res.json({ result: true, tweet: tweet });
    });
});

router.get("/getTweets", function (req, res) {
    Tweets.find()
        .populate({
            path: "tweetedBy",
            select: "username",
        })
        .populate("likedBy")
        .populate("trends")
        .then((tweets) => {
            res.json({ result: true, tweets: tweets });
        });
});

router.post("/likeTweet", function (req, res) {
    if (!checkBody(req.body, ["tweetId", "username", "token"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }

    findUserId(req.body.username, req.body.token).then((id) => {
        if (!id) {
            res.json({ result: false, error: "User not found" });
            return;
        }

        Tweets.findById(req.body.tweetId).then((tweet) => {
            if (tweet.likedBy.includes(id)) {
                tweet.likedBy.pull(id);
            } else {
                tweet.likedBy.push(id);
            }

            tweet.save().then((tweet) => {
                res.json({ result: true, tweet: tweet });
            });
        });
    });
});

router.get("/getTrends", function (req, res) {
    Trends.find().then((trends) => {
        res.json({ result: true, trends: trends });
    });
});

router.get("/getTweetsByTrend/:trend", function (req, res) {
    Tweets.find({ trends: { $in: [req.params.trend] } })
        .populate({
            path: "tweetedBy",
            select: "username",
        })
        .populate("likedBy")
        .populate("trends")
        .then((tweets) => {
            res.json({ result: true, tweets: tweets });
        });
});

function checkIfTrendExists(trend) {
    return Trends.findOne({ name: trend });
}

function searchTrendFromContent(content) {
    return content.match(/#\w+/g);
}

function findUserId(username, token) {
    return Users.findOne({ token: token, username: username }).then((user) => {
        return user ? user._id : null;
    });
}

module.exports = router;
