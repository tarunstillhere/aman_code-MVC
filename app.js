const express = require("express");
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require("path");
const bodyParser = require("body-parser");
const User = require("./models/listen.js"); // Assuming User is the model for callers and receivers
const OTP = require("./models/otp.js");
const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const transporter = require('./emailConfig.js');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { userSchema } = require("./schemaValidation.js");
const { validateUser } = require("./middleware.js");

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
app.use(express.json());

// Add moment.js for handling time
const moment = require("moment");

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() +  24 * 60 * 60 * 1000,
        maxAge:  24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};
 
app.use(session(sessionOptions));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            console.log(`Attempting to authenticate user: ${username}`);
            const user = await User.findOne({ username });
            console.log("user is : ",user);
            if (!user) {
                console.log('User not found');
                return done(null, false, { message: 'Incorrect username.' });
            }
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log("isValidPassword is : ", isValidPassword);
            console.log("user.password is : ",user.password);
            if (!isValidPassword) {
                console.log('Invalid password');
                return done(null, false, { message: 'Incorrect password.' });
            }
            console.log('User authenticated successfully');
            return done(null, user);
        } catch (err) {
            console.error('Error during authentication', err);
            return done(err);
        }
    }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    let user = await User.findById(id);
    if (user) {
        done(null, user);
    } else {
        done(new Error('User not found'), null);
    }
});

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Index Route
app.get("/listen/index", async (req, res) => {
    res.render("index.ejs");
});

// SignUp Route
app.get("/listen/index/register", (req, res) => {
    console.log("Req is coming !");
    res.render("user.ejs");
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
    req.flash('success', 'You have successfully logged in');
    res.redirect("/home");
});


// Get Verify Email
app.get("/listen/index/verifyEmail", (req, res) => {
    res.render("verifyEmail.ejs", { email: req.session.email });
});

// Submit Register Form
app.post("/listen/index/submit",validateUser, async (req, res) => {
    console.log("Request is coming");
    let newUser = new User(req.body.user);
    console.log(newUser);

    try {
        const otp = uuidv4().split('-')[0];
        await OTP.create({ email: req.body.user.email, otp });

        const mailOptions = {
            from: 'tarunchauhan01221@gmail.com',
            to: req.body.user.email,
            subject: 'Email Verification Code',
            text: `Your verification code is ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send("Error sending email: " + error.message);
            }

            console.log("Email sent:", info.response);
            req.session.email = req.body.user.email;
            req.session.tempUser = req.body.user;
            return res.redirect("/listen/index/verifyEmail");
        });
    
        console.log("Registered successfully");
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send("Error saving user: " + error.message);
    }
});

// Post Verify Email
app.post("/listen/index/verifyEmail", async (req, res) => {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp });

    if (otpRecord && moment().isBefore(moment(otpRecord.createdAt).add(5, 'minutes'))) {
        await OTP.deleteOne({ email, otp });
        let user = req.session.tempUser;
        req.session.tempUser = null;
        if (user && user.password) {
            let registeredUser = new User(user);
            registeredUser.password = await bcrypt.hash(user.password, 12);
            await registeredUser.save();
            req.flash('success', 'User registered successfully');
            return res.redirect("/home");
        } else {
            return res.status(400).send("Invalid session data");
        }
    } else {
        req.flash('error', 'Invalid or expired OTP');
        return res.redirect("/listen/index/verifyEmail");
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
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).send("No account with that email found.");
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
        } else {
            res.status(200).send('Recovery email sent');
        }
    });
});

// Route to render the password reset form
app.get('/reset/:token', async (req, res) => {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        return res.status(400).send("Password reset token is invalid or has expired.");
    }

    res.render('resetPassword.ejs', { token: req.params.token });
});

// Route to handle the password reset form submission
app.post('/reset/:token', async (req, res) => {
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        return res.status(400).send("Password reset token is invalid or has expired.");
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).send("Passwords do not match.");
    }

    user.setPassword(req.body.password, async (err) => {
        if (err) {
            console.error('Error setting password:', err);
            return res.status(500).send('Error setting password: ' + err.message);
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

       // Server-side
        res.redirect('/listen/index/Login?message=Success! Your password has been changed.');

    });
});

app.get("/", (req,res) => {
    res.send("Welcome to Listen.com ! Please go to the route /listen/index");
});

app.get("/home", (req,res) => {
    res.send("Welcome to Listen.com !");
});

app.get("/listen", (req,res) => {
    res.send("Landing Page soon...! PLEASE go to the route 'listen/index'");
});

app.listen(8080, () => {
    console.log("app is listening to port 8080");
});

app.use((err,req,res,next)=> {
    let {statusCode = 500, message= "Something Went Wrong !"} = err;
    res.status(statusCode).render("error.ejs", {message});
});
