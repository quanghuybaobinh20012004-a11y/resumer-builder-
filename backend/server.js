// File: server.js
const express = require('express'); // ĐÃ KHẮC PHỤC: express import
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
require('dotenv').config();

// --- Import cấu hình Passport ---
require('./config/passport.config'); 

// --- Import các route ---
const authRoutes = require('./routes/auth.routes');
const cvRoutes = require('./routes/cv.routes'); // ĐÃ KHẮC PHỤC: cvRoutes import
const publicRoutes = require('./routes/public.routes');
const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes'); 
const notificationRoutes = require('./routes/notification.routes'); 

const app = express();
const port = process.env.PORT || 5000;

// --- CORS ---
app.use(cors({
  origin: 'http://localhost:5173', // frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// --- Body parser ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Khởi tạo Passport ---
app.use(passport.initialize());

// --- Kết nối MongoDB ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Đã kết nối thành công tới MongoDB!"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

// --- Dùng các route (Đảm bảo tất cả các biến đã được require ở trên) ---
app.use('/api/auth', authRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Chạy server ---
app.listen(port, () => {
  console.log(`🚀 Backend server đang chạy tại http://localhost:${port}`);
});