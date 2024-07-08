const { object, string, required, boolean } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcrypt');

const callerSchema = new Schema({
    username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  countryCode : {
    type : String,
    required : true
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  // imgURL: {
  //   type: String,
  //   required: true,  // We are commenting IMAGE UPLOAD Option for testing...
  // },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  language: [String],
}); 


callerSchema.plugin(passportLocalMongoose);

// callerSchema.methods.comparePassword = function(candidatePassword, callback) {
//   // console.log("Candidate Password: ", candidatePassword);
//   // console.log("Stored Password: ", this.password);
//   bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
//       if (err) return callback(err);
//       callback(null, isMatch);
//   });
// };

callerSchema.methods.comparePassword = function(candidatePassword, callback) {
  console.log("Candidate Password: ", candidatePassword);
  console.log("Stored Password: ", this.password);

  if (!candidatePassword || !this.password) {
      return callback(new Error("data and hash arguments required"));
  }

  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return callback(err);
      callback(null, isMatch);
  });
};

const Caller = mongoose.model("Caller", callerSchema);

module.exports = Caller;