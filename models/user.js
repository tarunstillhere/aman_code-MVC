const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
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

userSchema.plugin(passportLocalMongoose);

// Hash the password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
      return next();
  }
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (err) {
      next(err);
  }
});


// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set Password
userSchema.methods.setPassword = function(password, callback = () => {}) {
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

const User = mongoose.model('User', userSchema);

module.exports = User;