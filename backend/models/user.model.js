const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
    trim: true, 
  },
  password: {
    type: String,
    required: true, 
  },

  fullName: {
    type: String,
  },
  avatar: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },

  googleId: {
    type: String,
  },
  linkedinId: {
    type: String,
  },
  
  resetPasswordToken: { 
    type: String, 
  },
  resetPasswordExpires: { 
    type: Date, 
  },

}, {
  timestamps: true, 
});

const User = mongoose.model('User', userSchema);

module.exports = User;