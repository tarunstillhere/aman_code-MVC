const { valid } = require("joi");
const {userSchema} = require("./schemaValidation.js");
const ExpressError = require("./ExpressError.js");
const User = require("./models/listen.js");


module.exports.validateUser = (req,res,next) => {
    console.log("Request is coming");
    let {error} = userSchema.validate(req.body.user);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        console.log(errMsg);
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }
};

// {
//     "user[username]": "achang",
//     "user[email]": "achang@example.com",
//     "user[password]": "Sqvph7Kn",
//     "user[countryCode]": "+91",
//     "user[phoneNumber]": "9489096147",
//     "user[gender]": "Female",
//     "user[dob]": "1956-04-17",
//     "user[address]": "4759 William Haven Apt. 194\nWest Corey, TX 43780",
//     "user[language]": "Occitan",
//     "user[status]": "Both"
//   }