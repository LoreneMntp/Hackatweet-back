const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    password: String,
    token: String,
});

const Users = mongoose.model("users", userSchema);

module.exports = Users;
