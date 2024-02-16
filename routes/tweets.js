const mongoose = require("mongoose");
const Tweets = require("../models/tweet");
const Users = require("../models/users");
const { checkBody } = require("../modules/checkBody");
var express = require("express");
var router = express.Router();
const Trends = require("../models/trends");

router.post("/addTweet", async function (req, res) {
    if (!checkBody(req.body, ["username", "token", "content"])) {
        return res.json({ result: false, error: "Missing or empty fields" });
    }

    findUserId(req.body.username, req.body.token).then(async (id) => {
        if (!id) {
            return res.json({ result: false, error: "User not found" });
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
            createdAt: Date.now(),
        });

        newTweet.save().then(async (tweet) => {
            for (const trendId of trendIds) {
                await Trends.findByIdAndUpdate(trendId, {
                    $push: { tweets: tweet._id },
                });
            }

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
    });
});

router.post("/removeTweet", function (req, res) {
    if (!checkBody(req.body, ["username", "token", "tweetId"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }

    Tweets.findByIdAndDelete(req.body.tweetId)
        .then((deletedTweet) => {
            return Trends.updateMany(
                { tweets: req.body.tweetId },
                { $pull: { tweets: req.body.tweetId } }
            ).then(() => {
                return Trends.deleteMany({ tweets: { $size: 0 } });
            });
        })
        .then(() => {
            return Tweets.find()
                .populate({
                    path: "tweetedBy",
                    select: "username",
                })
                .populate("likedBy")
                .populate("trends");
        })
        .then((tweets) => {
            res.json({ result: true, tweets: tweets });
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
        });
    });
});

router.get("/getTrends", function (req, res) {
    Trends.find().then((trends) => {
        res.json({ result: true, trends: trends });
    });
});

router.get("/getTweetsByTrend/:trend", function (req, res) {
    let formatedTrend = req.params.trend;
    formatedTrend = "#" + formatedTrend;
    Trends.find({ name: formatedTrend })
        .populate({
            path: "tweets",
            populate: [
                {
                    path: "tweetedBy",
                    select: "username",
                },
                {
                    path: "likedBy",
                    select: "username",
                },
                {
                    path: "trends",
                },
            ],
        })
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
