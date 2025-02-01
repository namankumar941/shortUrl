const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");

const shortenRoute = require("./routes/shortenRoute");

const session = require("express-session");

const Authentication = require("./googleAuth/auth");

const app = express();
const port = 8000;

//middleware to initialize passport and creating cookie
app.use(
  //Passport.js relies on session support to maintain user authentication status across requests.
  session({
    secret: "your_secret_key", // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));

// Create an instance of the Authentication class
const auth = new Authentication();

// Set up authentication routes
app.use("/auth", auth.setupRoutes());

// Set up routes
app.use("/api/shorten", shortenRoute);

mongoose
  .connect("mongodb://127.0.0.1:27017/shortUrl")
  .then(() => console.log("mongo db connected"))
  .catch((err) => console.log("mongo connection error", err));

// starting server
app.listen(port, () => console.log("server started"));
