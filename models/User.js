const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  role: { type: String, enum: ['candidate', 'recruiter'], default: 'candidate' },
  onboarded: { type: Boolean, default: false }, // CRITICAL FLAG
  profile: {
    name: String,
    college: String,
    educationLevel: String, 
    specialization: String,
    skills: [String],
    experience: String,
    resumeText: String, // Storing extracted text for AI Analysis
  },
  skillTestScore: { type: Number, default: 0 },
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);