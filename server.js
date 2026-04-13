const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

// --- CRITICAL CORS FIX ---
const allowedOrigins = [
  "https://careerai-version1.web.app",
  "https://careerai-version1.firebaseapp.com",
  "http://localhost:5173" 
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com")) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Blockage: Origin not allowed'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

app.get('/', (req, res) => res.send('🚀 Career AI API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Production Server active on port ${PORT}`);
});