const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. Google/Social Sync
exports.syncUser = async (req, res) => {
  try {
    const { uid, email, name, role } = req.body;
    let user = await User.findOne({ uid });

    if (!user) {
      user = new User({
        uid,
        email,
        role: role || 'candidate',
        profile: { name }
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Manual Registration
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      uid: Buffer.from(email).toString('base64'),
      email,
      password: hashedPassword,
      role: role || 'candidate',
      profile: { name }
    });

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Manual Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOnboarding = async (req, res) => {
  try {
    const { uid, college, educationLevel, specialization, skills, resumeText } = req.body;
    
    const user = await User.findOneAndUpdate(
      { uid },
      { 
        onboarded: true,
        profile: { 
          college, 
          educationLevel, 
          specialization, 
          skills, 
          resumeText,
          experience: req.body.experience || 'Fresher'
        }
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};