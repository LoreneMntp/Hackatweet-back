var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

router.post("/signup", (req, res) => {
    if (!checkBody(req.body, ["username", "password", "name"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }

    // Check if the user has not already been registered
    User.findOne({ username: req.body.username }).then((data) => {
        if (data === null) {
            const hash = bcrypt.hashSync(req.body.password, 10);
            const lowerUsername = req.body.username;
            const newUser = new User({
                name: req.body.name,
                username: lowerUsername,
                password: hash,
                token: uid2(32),
            });

            newUser.save().then((newDoc) => {
                res.json({ result: true, token: newDoc.token });
            });
        } else {
            // User already exists in database
            res.json({ result: false, error: "User already exists" });
        }
    });
});

router.post("/signin", (req, res) => {
    if (!checkBody(req.body, ["username", "password"])) {
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }

    User.findOne({ username: req.body.username }).then((data) => {
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
            res.json({
                result: true,
                token: data.token,
                username: data.username,
                name: data.name,
            });
        } else {
            res.json({
                result: false,
                error: "User not found or wrong password",
            });
        }
    });
});

module.exports = router;
