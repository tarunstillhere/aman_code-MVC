const { object, string, required, boolean } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcrypt');

const receiverSchema = new Schema({
    username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
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


receiverSchema.plugin(passportLocalMongoose);

// Compare Passwords

receiverSchema.methods.comparePassword = function (candidatePassword, cb) {
  console.log('Candidate Password:', candidatePassword); // Debugging line
  console.log('Hashed Password:', this.password); // Debugging line

  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

// Set Password
receiverSchema.methods.setPassword = function(password, callback = () => {}) {
  const self = this; // Save the context
  bcrypt.genSalt(8, function(err, salt) {
      if (err) return callback(err);
      
      bcrypt.hash(password, salt, function(err, hash) {
          if (err) return callback(err);
          
          self.password = hash;
          callback(null);
      });
  });
};



const Receiver = mongoose.model("Receiver", receiverSchema);

module.exports = Receiver;