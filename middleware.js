const { valid } = require("joi");
const {userSchema} = require("./schemaValidation");
const ExpressError = require("./ExpressError.js");


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
