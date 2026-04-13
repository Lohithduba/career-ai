const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/save-test-score', async (req, res) => {
    try {
        const { uid, score } = req.body;
        const user = await User.findOneAndUpdate(
            { uid },
            { skillTestScore: score },
            { new: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /api/user/profile/:id
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/update-profile', async (req, res) => {
    try {
        const { uid, profile } = req.body;
        
        const user = await User.findOneAndUpdate(
            { uid },
            { $set: { profile: profile } },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;