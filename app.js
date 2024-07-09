const express = require("express");
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require("path");
const bodyParser = require("body-parser");
const Caller = require("./models/caller.js");
const Receiver = require("./models/receiver.js");
const User = require('./models/user');
const OTP = require("./models/otp.js");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
// const multer = require("multer");
// const { storage } = require("./cloudConfig.js");  // Image Purpose
// const upload = multer({ storage });
const transporter = require('./emailConfig');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { callerSchema, receiverSchema } = require("./schemaValidation");

let MONGO_URL = "mongodb://127.0.0.1:27017/testing";

main()
    .then(() => {
        console.log("Connected to DB");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const { validateCaller, validateReceiver } = require("./middleware.js");

// Add moment.js for handling time
const moment = require("moment");

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
// Passport strategy for authentication
passport.use(new LocalStrategy(
    LocalStrategy._verify = async (username, password, done) => {
        try {
          const user = await User.findOne({ username });
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          if (!user.validPassword(password)) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
  ));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    let user = await Caller.findById(id) || await Receiver.findById(id);
    done(null, user);
});

let temp = {};


const storeData = (req,res,next) => {
   temp = req.body;
    next();
}
  
  // Set up connect-flash
app.use(flash());


// Index Route
app.get("/listen/index", async (req, res) => {
    res.render("index.ejs");
});

// SignUp as a Caller
app.get("/listen/index/callerForm", (req, res) => {
    res.render("caller.ejs");
});

// SingUp as a Receiver
app.get("/listen/index/receiverForm", (req, res) => {
    res.render("receiver.ejs");
});

// Login Route
app.get("/listen/index/Login", (req, res) => {
    res.render("Login.ejs", { message: req.flash('error') });
});

// Authentication of Username and Password as Caller or Receiver
app.post("/listen/index/Login", passport.authenticate("local", {
    failureRedirect: "/listen/index/Login",
    failureFlash: true,
}), (req, res) => {
    console.log('User authenticated:', req.user);
    res.redirect("/home");
});

app.use((err, req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Verify Caller Email

app.get("/listen/index/verifyEmailCaller", (req, res) => {
    res.render("verifyEmailCaller.ejs", { email: req.session.email }); 
});

// Verify Receiver Email

app.get("/listen/index/verifyEmailReceiver", (req, res) => {
    res.render("verifyEmailReceiver.ejs", { email: req.session.email }); 
});

// Submit Caller
app.post('/listen/index/submitCall', validateCaller, async (req, res) => {
    let newCaller = new Caller(req.body.caller);
    console.log(newCaller);

    try {
        // Send OTP
        const otp = uuidv4().split('-')[0]; // Generate a simple OTP
        await OTP.create({ email: req.body.caller.email, otp });

        const mailOptions = {
            from: 'tarunchauhan01221@gmail.com',
            to: req.body.caller.email,
            subject: 'Email Verification Code',
            text: `Your verification code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send("Error sending email: " + error.message);
            }

            console.log("Email sent:", info.response);
            req.session.email = req.body.caller.email;
            req.session.tempCaller = req.body.caller; // Store caller data in session
            return res.redirect("/listen/index/verifyEmailCaller");
        });

        console.log("Registered successfully");
    } catch (error) {
        console.error("Error saving caller:", error);
        res.status(500).send("Error saving caller: " + error.message);
    }
});


// Verify Caller Email
app.post("/listen/index/verifyEmailCaller", async (req, res) => {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });

    if (otpRecord && moment().isBefore(moment(otpRecord.createdAt).add(5, 'minutes'))) {
        // OTP is valid and not expired
        await OTP.deleteOne({ email, otp }); // Remove the used OTP
        let user = req.session.tempCaller; // Retrieve caller data from session
        req.session.tempCaller = null; // Clear the session variable
        if (user && user.password) {
            let registeredCaller = await Caller.register(user, user.password);
            res.send("Email verified successfully!");
        } else {
            res.status(500).send("Caller data is missing or incomplete.");
        }
    } else {
        // OTP is invalid or expired
        res.status(400).send("Invalid or expired OTP");
    }
});


// Submit Receiver
app.post('/listen/index/submitRec', validateReceiver, async (req, res) => {
    let newReceiver = new Receiver(req.body.receiver);

    try {
        // Send OTP
        const otp = uuidv4().split('-')[0]; // Generate a simple OTP
        await OTP.create({ email: req.body.receiver.email, otp });

        const mailOptions = {
            from: 'tarunchauhan01221@gmail.com',
            to: req.body.receiver.email,
            subject: 'Email Verification Code',
            text: `Your verification code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send("Error sending email: " + error.message);
            }

            console.log("Email sent:", info.response);
            req.session.email = req.body.receiver.email;
            req.session.tempReceiver = req.body.receiver; // Store receiver data in session
            return res.redirect("/listen/index/verifyEmailReceiver");
        });

        console.log("Registered successfully");
    } catch (error) {
        console.error("Error saving receiver:", error);
        res.status(500).send("Error saving receiver: " + error.message);
    }
});

// Verify Receiver Email
app.post("/listen/index/verifyEmailReceiver", async (req, res) => {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });

    if (otpRecord && moment().isBefore(moment(otpRecord.createdAt).add(5, 'minutes'))) {
        // OTP is valid and not expired
        await OTP.deleteOne({ email, otp }); // Remove the used OTP
        let user = req.session.tempReceiver; // Retrieve receiver data from session
        req.session.tempReceiver = null; // Clear the session variable
        if (user && user.password) {
            let registeredReceiver = await Receiver.register(user, user.password);
            res.send("Email verified successfully!");
        } else {
            res.status(500).send("Receiver data is missing or incomplete.");
        }
    } else {
        // OTP is invalid or expired
        res.status(400).send("Invalid or expired OTP");
    }
});


// Add a new route for resending OTP
app.post("/resendOtp", async (req, res) => {
    const { email } = req.body;
    try {
        // Check if the OTP was already sent within the last 30 seconds
        const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
        if (recentOtp && moment().isBefore(moment(recentOtp.createdAt).add(30, 'seconds'))) {
            return res.status(400).send("Please wait before requesting another OTP.");
        }

        // Generate and send a new OTP
        const otp = uuidv4().split('-')[0]; // Generate a simple OTP
        await OTP.create({ email, otp });

        const mailOptions = {
            from: 'tarunchauhan01221@gmail.com',
            to: email,
            subject: 'Email Verification Code',
            text: `Your verification code is ${otp}`
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).send("Error sending email: " + error.message);
            }

            res.status(200).send("OTP resent successfully");
        });
    } catch (error) {
        res.status(500).send("Error resending OTP: " + error.message);
    }
});


// Route to render the password reset request form
app.get('/forgotPassword', (req, res) => {
    res.render('forgotPassword.ejs');
});


// Route to handle the password reset request
app.post('/forgotPassword', async (req, res) => {
    const { email } = req.body;
    const user = await Caller.findOne({ email }) || await Receiver.findOne({ email });

    if (!user) {
        req.flash('error', 'No account with that email found.');
        return res.redirect('/forgotPassword');
    }

    // Generate a token
    const token = crypto.randomBytes(20).toString('hex');

    // Set token and expiration on the user model
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send the email
    const mailOptions = {
        from: 'tarunchauhan01221@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
               Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\n
               http://${req.headers.host}/reset/${token}\n\n
               If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (err, response) => {
        if (err) {
            console.error('There was an error: ', err);
            return res.status(500).send('Error sending email: ' + err.message);
        } else {
            req.flash('info', 'An email has been sent to ' + user.email + ' with further instructions.');
            res.redirect('/forgotPassword');
        }
    });
});

// Route to render the password reset form
app.get('/reset/:token', async (req, res) => {
    const user = await Caller.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }) ||
                 await Receiver.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        return res.status(400).send("Password reset token is invalid or has expired.");
    }

    res.render('resetPassword.ejs', { token: req.params.token });
});

// Route to handle the password reset form submission
app.post('/reset/:token', async (req, res) => {
    const user = await Caller.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }) ||
                 await Receiver.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
    }

    if (req.body.password !== req.body.confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('back');
    }

    user.setPassword(req.body.password, async (err) => {
        if (err) {
            console.error('Error setting password:', err);
            return res.status(500).send('Error setting password: ' + err.message);
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        req.flash('success', 'Success! Your password has been changed.');
        res.redirect('/listen/index/Login');
    });
});

app.get("/", (req,res) => {
    res.send("Welcome to Listen.com ! Please go to the route /listen/index");
});

app.get("/home", (req,res) => {
    res.send("Welcome to Listen.com !");
});

// app.get("/wrongPassword", (req, res) => {
//     res.send("Wrong Password");
// });

app.listen(8080, () => {
    console.log("app is listening to port 8080");
});

app.use((err,req,res,next)=> {
    let {statusCode = 500, message= "Something Went Wrong !"} = err;
    res.status(statusCode).render("error.ejs", {message});
    // res.status(statusCode).send(message);
});