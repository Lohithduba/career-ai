const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  location: { type: String, default: "Remote" },
  salary: { type: String },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aiScore: Number,
    appliedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);