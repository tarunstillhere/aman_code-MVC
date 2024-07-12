const { name } = require("ejs");
const Joi = require("joi");

module.exports.userSchema = Joi.object({
    user : Joi.object({
        username : Joi.string().required().min(3).max(30),
        email: Joi.string()
        .email({ minDomainSegments: 2}),
        password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{4,}$'))
        .required(),
        countryCode : Joi.string() //.pattern(/^\+?[1-9]\d{0,2}$/)
        .required(),
        phoneNumber: Joi.string().pattern(/^\d{10,15}$/).required(), //.pattern(/^\+?[1-9]\d{0,2}(?:\s?\d){1,14}$/)
        gender: Joi.string().valid('Male', 'Female', 'Others').required(),
        dob: Joi.date().max('1-1-2011').iso(),
        address : Joi.string(),
        language : Joi.string().required(),
        // status : Joi.string().required()
    }).required()
    
});