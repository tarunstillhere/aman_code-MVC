const { valid } = require("joi");
const {userSchema} = require("./schemaValidation");
const ExpressError = require("./ExpressError.js");
const User = require("./models/user.js");


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

// // Middleware to check if user already exists
// module.exports.checkUserExists = async (req, res, next) => {
//     try {
//         const { email, username } = req.body.caller || req.body.receiver;
//         const user = await User.findOne({ $or: [{ email }, { username }] });

//         if (user) {
//             req.flash('error', 'Username or email is already taken. Please choose a different one.');
//             return res.redirect('back'); // Redirect back to the registration form
//         }

//         next();
//     } catch (err) {
//         next(err);
//     }
// }