const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

app.use(cors({
    origin: [
        "https://career-ai-2026.web.app"
    ], 
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;

// FORCING 0.0.0.0 ensures the frontend can connect via 127.0.0.1 or localhost
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NEURAL SERVER ACTIVE AT PORT: ${PORT}`);
});