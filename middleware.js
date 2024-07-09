const { valid } = require("joi");
const {callerSchema} = require("./schemaValidation");
const {receiverSchema} = require("./schemaValidation");
const ExpressError = require("./ExpressError.js");


module.exports.validateCaller = (req, res, next) => {
    const { error } = callerSchema.validate(req.body.caller);
    if (error) {
        req.flash('error', error.details[0].message);
        return res.redirect('back');
    }
    next();
};

module.exports.validateReceiver = (req, res, next) => {
    const { error } = receiverSchema.validate(req.body.receiver);
    if (error) {
        req.flash('error', error.details[0].message);
        return res.redirect('back');
    }
    next();
};

// module.exports.helper = (req,res,next) => {
//     req.body.caller.imgURL = req.file.path;
//     next();
// };

