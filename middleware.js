const { valid } = require("joi");
const {userSchema} = require("./schemaValidation.js");
const ExpressError = require("./ExpressError.js");
const User = require("./models/listen.js");

module.exports.validateUser = (req,res,next) => {
    let {error} = userSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
        console.log(errMsg);
    }else {
        next();
    }
};


// module.exports.validateUser = (req,res,next) => {
//     console.log("Request is coming");
//     let {error} = userSchema.validate(req.body.user);
//     if(error) {
//         let errMsg = error.details.map((el) => el.message).join(",");
//         console.log(errMsg);
//         throw new ExpressError(400, errMsg);
//     }else {
//         next();
//     }
// };

// {
//     "username": "${username}",
//     "email": "${email}",
//     "password": "${password}",
//     "countryCode": "${countryCode}",
//     "phoneNumber": "${phoneNumber}",
//     "gender": "${gender}",
//     "dob": "${dob}",
//     "address": "${address}",
//     "language": "${language}",
//     "status": "${status}"
// }
