const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const educationSchema = new Schema({
  school: String,
  degree: String,
  startDate: String,
  endDate: String,
});

const experienceSchema = new Schema({
  company: String,
  position: String,
  startDate: String,
  endDate: String,
  description: String,
});

const projectSchema = new Schema({
  name: String,
  description: String,
  link: String,
});

const cvSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  
  cvName: {
    type: String,
    required: true,
    default: 'CV chưa đặt tên',
  },

  personalInfo: {
    fullName: String,
    position: String, 
    email: String,
    phone: String,
    address: String,
    linkedin: String,
    github: String,
    summary: String,
  },
  
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  skills: [String], 
  certificates: [String],
  activities: [String],

  settings: {
    template: { type: String, default: 'classic' }, // modern, minimalist...
    color: { type: String, default: '#000000' },
    fontFamily: { type: String, default: 'Arial' },
  },

  isPublic: {
    type: Boolean,
    default: false,
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true, 
  },

}, {
  timestamps: true, 
});

const CV = mongoose.model('CV', cvSchema);

module.exports = CV;