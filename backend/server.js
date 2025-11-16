const express = require('express'); 
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
require('dotenv').config();

require('./config/passport.config'); 

const authRoutes = require('./routes/auth.routes');
const cvRoutes = require('./routes/cv.routes'); 
const publicRoutes = require('./routes/public.routes');
const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes'); 
const notificationRoutes = require('./routes/notification.routes'); 

const app = express();
const port = process.env.PORT || 5000;

// 🔥 FIX PRE-FLIGHT (QUAN TRỌNG)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://resumebuilder1111.netlify.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// CORS CHUẨN
app.use(cors({
  origin: "https://resumebuilder1111.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(passport.initialize());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Đã kết nối thành công tới MongoDB!"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

app.use('/api/auth', authRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(port, () => {
  console.log(`🚀 Backend server đang chạy tại http://localhost:${port}`);
});
