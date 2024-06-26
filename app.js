require("dotenv").config();
require("./models/connectdb");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var teweetsRouter = require("./routes/tweets");

var app = express();

const cors = require("cors"); // Installation de Cors

const corsOptions = {
    origin: function (origin, callback) {
        // Remplacee 'allowedOrigins' avec vos différents URLs front pouvant accéder au Backend
        const allowedOrigins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "https://hackatweet-frontend-pink.vercel.app",
        ];
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/tweets", teweetsRouter);

module.exports = app;
